import * as cdk from 'monocdk';
import * as s3 from 'monocdk/aws-s3';
import * as s3deploy from 'monocdk/aws-s3-deployment';
import * as lambda from 'monocdk/aws-lambda';

import * as apig2 from 'monocdk/aws-apigatewayv2';
import * as apig2_integrations from 'monocdk/aws-apigatewayv2-integrations';
import * as iam from 'monocdk/aws-iam';
import * as logs from 'monocdk/aws-logs'

export class PhotomosaicInfraStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, "MyBucket", {
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });

    new s3deploy.BucketDeployment(this, 'deployStaticPage', {
      sources: [s3deploy.Source.asset('./assets/client')],
      destinationBucket: siteBucket,
      retainOnDelete: false,
    });

    const appFunction = new lambda.DockerImageFunction(this, "app", {
      code: lambda.DockerImageCode.fromImageAsset("./assets/service/processor_lambda"),
      timeout: cdk.Duration.seconds(90),
      memorySize: 1024,
    });
    appFunction.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess")
    )

    const appHttpApi = new apig2.HttpApi(this, "appHttpApi")
    appHttpApi.addRoutes({
      path: "/",
      integration: new apig2_integrations.LambdaProxyIntegration({
        handler: appFunction,
      }),
    });

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
      "responseLength": "$context.responseLength"
    };
    (appHttpApi.defaultStage?.node.defaultChild as apig2.CfnStage)
      .accessLogSettings = {
      destinationArn: log.logGroupArn,
      format: JSON.stringify(logFormat),
    };

    new cdk.CfnOutput(this, "siteUrl", {
      value: siteBucket.bucketWebsiteUrl,
    });

    new cdk.CfnOutput(this, "appHttpApiEndpoint", {
      value: appHttpApi.url!,
    })
  }
}
