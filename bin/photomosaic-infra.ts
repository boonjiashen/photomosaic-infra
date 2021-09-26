#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'monocdk';
import { InfraStack } from '../lib/infra-stack';

const app = new cdk.App();

const commonStackProps: cdk.StackProps = {
  env: {
    // Cannot use an S3 record alias in region-agnostic stack
    region: 'us-east-1',
  },
}

new InfraStack(app, 'beta', {
  hostedZoneAttr: {
    hostedZoneId: "Z063915120I77LJYUUWXL",
    zoneName:"dev.boonjiashen.com"
  },
  stackName: 'betaPhotomosaic',
  ...commonStackProps,
});

new InfraStack(app, 'prod', {
  hostedZoneAttr: {
    hostedZoneId: "Z06487043KJ2AQH7M5LXK",
    zoneName: "boonjiashen.com"
  },
  stackName: 'prodPhotomosaic',
  ...commonStackProps,
});
