import * as cdk from 'monocdk';
import * as s3 from 'monocdk/aws-s3';
import * as s3deploy from 'monocdk/aws-s3-deployment';
import * as lambda from 'monocdk/aws-lambda';

import * as apig2 from 'monocdk/aws-apigatewayv2';
import * as apig2_integrations from 'monocdk/aws-apigatewayv2-integrations';
import * as iam from 'monocdk/aws-iam';
import * as logs from 'monocdk/aws-logs';
import * as route53 from 'monocdk/aws-route53';
import * as route53Targets from 'monocdk/aws-route53-targets';

export class PhotomosaicInfraStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        // Cannot use an S3 record alias in region-agnostic stack
        region: 'ap-northeast-1',
      },
    });

    const devhostedZoneAttr = {
      hostedZoneId: "Z05586802LBP65122KD61",
      zoneName: "dev.boonjiashen.com",
    };
    const prodHostedZoneAttr = {
      hostedZoneId: "Z09544292C54AJ4VKFFSY",
      zoneName: "boonjiashen.com",
    };
    const hostedZoneAttr = devhostedZoneAttr;
    // If you need to the hostname from the HostedZone object we need to use
    // `fromHostedZoneAttributes` rather than the simpler methods like `fromHostedZoneId`
    // See https://github.com/aws/aws-cdk/issues/3663
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, "hostedZoned", hostedZoneAttr);

    const siteBucket = new s3.Bucket(this, 'siteBucket', {
      bucketName: 'mosaic.' + hostedZone.zoneName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // deletes bucket even if non-empty
      versioned: true,
      publicReadAccess: true,
      // Also enables static website hosting
      websiteIndexDocument: 'index.html',
    });

    const siteRecord = new route53.ARecord(this, 'siteRecord', {
      zone: hostedZone,
      recordName: 'mosaic',
      target: route53.RecordTarget.fromAlias(
        new route53Targets.BucketWebsiteTarget(siteBucket)
      ),
    });

    new s3deploy.BucketDeployment(this, 'deployStaticPage', {
      sources: [s3deploy.Source.asset('./assets/client')],
      destinationBucket: siteBucket,
      retainOnDelete: false,
    });

    const appFunction = new lambda.DockerImageFunction(this, "app", {
      code: lambda.DockerImageCode.fromImageAsset("./assets/service/processor_lambda"),
      timeout: cdk.Duration.seconds(90),
      memorySize: 10240,
    });
    appFunction.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess")
    )

    const appHttpApi = new apig2.HttpApi(this, "appHttpApi", {
      corsPreflight: {
        // allowMethods and allowOrigins to avoid this browser error during preflight
        // `No 'Access-Control-Allow-Origin' header is present on the requested resource.`
        allowMethods: [apig2.CorsHttpMethod.ANY],
        allowOrigins: ["*"],
        // allowHeaders to avoid this browser error during preflight
        // `Request header field content-type is not allowed by Access-Control-Allow-Headers in preflight response`
        allowHeaders: ['*'],
      }
    });
    appHttpApi.addRoutes({
      path: "/",
      integration: new apig2_integrations.LambdaProxyIntegration({
        handler: appFunction,
      }),
    });

    // HttpApi L2 construct doesn't support logging yet.
    // Instructions on opening escape hatch in:
    // https://github.com/aws/aws-cdk/issues/11100#issuecomment-782213423
    const log = new logs.LogGroup(this, "appHttpApiLogGroup");
    const logFormat = {
      "requestId": "$context.requestId",
      "ip": "$context.identity.sourceIp",
      "requestTime": "$context.requestTime",
      "httpMethod": "$context.httpMethod",
      "routeKey": "$context.routeKey",
      "status": "$context.status",
      "protocol": "$context.protocol",
      "responseLength": "$context.responseLength",
      // Debug info for Lambda integration. See:
      // https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-troubleshooting-lambda.html
      "integration": {
        "error": "$context.integration.error",
        "status": "$context.integration.status",
      },
      "error": {
        "message": "$context.error.message",
        "responseType": "$context.error.responseType",
      }
    };
    (appHttpApi.defaultStage?.node.defaultChild as apig2.CfnStage)
      .accessLogSettings = {
      destinationArn: log.logGroupArn,
      format: JSON.stringify(logFormat),
    };

    new cdk.CfnOutput(this, "siteUrl", {
      value: siteRecord.domainName,
    });

    new cdk.CfnOutput(this, "appHttpApiEndpoint", {
      value: appHttpApi.url!,
    })
  }
}
