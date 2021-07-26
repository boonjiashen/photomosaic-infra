import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3'
import * as elasticbeanstalk from '@aws-cdk/aws-elasticbeanstalk'

export class PhotomosaicInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new s3.Bucket(this, "MyBucket", {});
    const mosaicApp = new elasticbeanstalk.CfnApplication(this, "mosaicApp", {});
  }
}
