import * as cdk from 'monocdk';

interface InfraStackProps extends cdk.StackProps {
  hostedZoneAttr: cdk.aws_route53.HostedZoneAttributes
}

export class InfraStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    // If you need to the hostname from the HostedZone object we need to use
    // `fromHostedZoneAttributes` rather than the simpler methods like `fromHostedZoneId`
    // See https://github.com/aws/aws-cdk/issues/3663
    const hostedZone = cdk.aws_route53.HostedZone.fromHostedZoneAttributes(this, "hostedZone", props.hostedZoneAttr);

    const siteDomainPrefix = "mosaic"
    const siteDomainName = `${siteDomainPrefix}.${hostedZone.zoneName}`
    const websiteRootDoc = 'index.html'
    const siteBucket = new cdk.aws_s3.Bucket(this, 'siteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // deletes bucket even if non-empty
      versioned: true,
      publicReadAccess: true,
      // Also enables static website hosting
      websiteIndexDocument: websiteRootDoc,
    });

    new cdk.aws_s3_deployment.BucketDeployment(this, 'deployStaticPage', {
      sources: [cdk.aws_s3_deployment.Source.asset('./assets/client')],
      destinationBucket: siteBucket,
      retainOnDelete: false,
    });

    const siteCertificate = new cdk.aws_certificatemanager.DnsValidatedCertificate(this, 'siteCertificate', {
      domainName: siteDomainName,
      hostedZone,
    });

    const siteDistribution = new cdk.aws_cloudfront.Distribution(this, 'siteDistribution', {
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.S3Origin(siteBucket),
        viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
      },
      certificate: siteCertificate,
      domainNames: [siteDomainName],
      defaultRootObject: websiteRootDoc,
    });

    const siteRecord = new cdk.aws_route53.ARecord(this, 'siteRecord', {
      zone: hostedZone,
      recordName: siteDomainPrefix,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.CloudFrontTarget(siteDistribution),
      ),
    });

    const appFunction = new cdk.aws_lambda.DockerImageFunction(this, "app", {
      code: cdk.aws_lambda.DockerImageCode.fromImageAsset("./assets/service/processor_lambda"),
      timeout: cdk.Duration.seconds(90),
      memorySize: 10240,
      tracing: cdk.aws_lambda.Tracing.ACTIVE,
    });
    appFunction.role?.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess")
    )

    const appHttpApi = new cdk.aws_apigatewayv2.HttpApi(this, "appHttpApi", {
      description: `API for ${props.stackName}`,
      corsPreflight: {
        // allowMethods and allowOrigins to avoid this browser error during preflight
        // `No 'Access-Control-Allow-Origin' header is present on the requested resource.`
        allowMethods: [cdk.aws_apigatewayv2.CorsHttpMethod.ANY],
        allowOrigins: ["*"],
        // allowHeaders to avoid this browser error during preflight
        // `Request header field content-type is not allowed by Access-Control-Allow-Headers in preflight response`
        allowHeaders: ['*'],
      }
    });
    appHttpApi.addRoutes({
      path: "/",
      integration: new cdk.aws_apigatewayv2_integrations.LambdaProxyIntegration({
        handler: appFunction,
      }),
    });

    // HttpApi L2 construct doesn't support logging yet.
    // Instructions on opening escape hatch in:
    // https://github.com/aws/aws-cdk/issues/11100#issuecomment-782213423
    const log = new cdk.aws_logs.LogGroup(this, "appHttpApiLogGroup");
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
    (appHttpApi.defaultStage?.node.defaultChild as cdk.aws_apigatewayv2.CfnStage)
      .accessLogSettings = {
      destinationArn: log.logGroupArn,
      format: JSON.stringify(logFormat),
    };

    new cdk.CfnOutput(this, "siteUrl", {
      value: `https://${siteRecord.domainName}`,
    });

    new cdk.CfnOutput(this, "appHttpApiEndpoint", {
      value: appHttpApi.url!,
    })
  }
}
