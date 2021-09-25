#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'monocdk';
import { InfraStack } from '../lib/infra-stack';

const app = new cdk.App();

const commonStackProps: cdk.StackProps = {
  env: {
    // Cannot use an S3 record alias in region-agnostic stack
    region: 'ap-northeast-1',
  },
}

new InfraStack(app, 'devo', {
  hostedZoneAttr: {
    hostedZoneId: "Z05586802LBP65122KD61",
    zoneName: "dev.boonjiashen.com",
  },
  stackName: 'photomosaicDevo',
  ...commonStackProps,
});

new InfraStack(app, 'prod', {
  hostedZoneAttr: {
    hostedZoneId: "Z09544292C54AJ4VKFFSY",
    zoneName: "boonjiashen.com",
  },
  stackName: 'photomosaicProd',
  ...commonStackProps,
});
