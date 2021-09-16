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
      sources: [s3deploy.Source.asset('./assets')],
      destinationBucket: siteBucket,
      retainOnDelete: false,
    });

    new apig.LambdaRestApi(this, 'appApi', {
      handler: new lambda.Function(this, "app", {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "widgets.main",
        code: lambda.Code.fromInline("not real code"),
      }),
    });
  }
}
