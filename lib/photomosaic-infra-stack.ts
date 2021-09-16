import * as cdk from 'monocdk';
import * as s3 from 'monocdk/aws-s3'

export class PhotomosaicInfraStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, "MyBucket", {});
  }
}
