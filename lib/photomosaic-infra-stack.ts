import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3'
import * as elasticbeanstalk from '@aws-cdk/aws-elasticbeanstalk'

// Reference:
// https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/elasticbeanstalk/elasticbeanstalk-environment/index.ts
export class PhotomosaicInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new s3.Bucket(this, "MyBucket", {});
    const mosaicAppName = "MosaicApp";
    const mosaicApp = new elasticbeanstalk.CfnApplication(this, "mosaicApp", {
      applicationName: mosaicAppName,
    });

    // Taken from
    // https://medium.com/@joshmustill/complete-node-js-aws-elastic-beanstalk-application-packaging-through-cdk-in-typescript-e91b7ffe4928
    const mosaicEnv = new elasticbeanstalk.CfnEnvironment(this, "mosaicEnv", {
      applicationName: mosaicAppName,
      optionSettings: [
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'IamInstanceProfile',
          // This role seems to be the default role
          // See https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts-roles-instance.html
          // Without this option setting, deployment fails with:
          // Environment failed to launch as it entered Terminated state
          // Environment must have instance profile associated with it.
          value: 'aws-elasticbeanstalk-ec2-role',
        },
      ].concat(this.getOptionsToAutoUpdatePlatform()),
      solutionStackName: "64bit Amazon Linux 2 v3.3.3 running Python 3.8",
    });

    mosaicEnv.addDependsOn(mosaicApp)
  }

  /**
   * Reference:
   * https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/command-options-general.html#command-options-general-elasticbeanstalkmanagedactions
   */
  private getOptionsToAutoUpdatePlatform() {
    return [
      {
        namespace: 'aws:elasticbeanstalk:managedactions',
        optionName: 'ManagedActionsEnabled',
        value: 'true',
      },
      {
        namespace: 'aws:elasticbeanstalk:managedactions',
        optionName: 'PreferredStartTime',
        value: 'Sun:00:00',
      },
      {
        namespace: 'aws:elasticbeanstalk:managedactions',
        optionName: 'ServiceRoleForManagedUpdates',
        value: 'AWSServiceRoleForElasticBeanstalkManagedUpdates',
      },
      {
        namespace: 'aws:elasticbeanstalk:managedactions:platformupdate',
        optionName: 'UpdateLevel',
        value: 'minor',
      },
    ];
  }
}
