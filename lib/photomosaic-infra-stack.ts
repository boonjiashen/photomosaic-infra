import * as cdk from 'monocdk';
import * as s3 from 'monocdk/aws-s3';
import * as s3deploy from 'monocdk/aws-s3-deployment';
import * as lambda from 'monocdk/aws-lambda';
import * as apig from 'monocdk/aws-apigateway';

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

    new apig.LambdaRestApi(this, 'appApi', {
      // Might not be necessary
      // defaultCorsPreflightOptions: {
      //   allowOrigins: apig.Cors.ALL_ORIGINS,
      // },
      handler: new lambda.Function(this, "app", {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: "index.handler",
        code: lambda.Code.fromAsset("./assets/service/processor_lambda"),
      }),
    });

    new cdk.CfnOutput(this, "siteUrl", {
      value: siteBucket.bucketWebsiteUrl,
    });
  }
}
