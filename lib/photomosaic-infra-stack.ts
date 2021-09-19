import * as cdk from 'monocdk';
import * as s3 from 'monocdk/aws-s3';
import * as s3deploy from 'monocdk/aws-s3-deployment';
import * as lambda from 'monocdk/aws-lambda';
import * as lambda_python from 'monocdk/aws-lambda-python';

import * as apig2 from 'monocdk/aws-apigatewayv2';
import * as apig2_integrations from 'monocdk/aws-apigatewayv2-integrations';
import * as iam from 'monocdk/aws-iam';

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

    const appFunction = new lambda_python.PythonFunction(this, "app", {
      runtime: lambda.Runtime.PYTHON_3_9,
      entry: "./assets/service/processor_lambda",
      timeout: cdk.Duration.seconds(10),
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

    new cdk.CfnOutput(this, "siteUrl", {
      value: siteBucket.bucketWebsiteUrl,
    });

    new cdk.CfnOutput(this, "appHttpApiEndpoint", {
      value: appHttpApi.url!,
    })
  }
}
