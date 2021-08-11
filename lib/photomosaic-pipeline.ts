import {Construct, Stack, StackProps} from "@aws-cdk/core";
import * as pipelines from "@aws-cdk/pipelines";
import * as cp from "@aws-cdk/aws-codepipeline";
import * as cpActions from "@aws-cdk/aws-codepipeline-actions";
import {CdkPipeline, SimpleSynthAction} from "@aws-cdk/pipelines";
import { ElasticBeanStalkDeployAction } from "./ElasticBeanstalkDeployAction";

export class PhotomosaicPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const sourceArtifact = new cp.Artifact();
        const cloudAssemblyArtifact = new cp.Artifact();

        // Using CodeStar connections to connect to Github as recommended
        // See: https://github.com/aws/aws-cdk/issues/10632
        const connectionArn = "arn:aws:codestar-connections:ap-northeast-1:691456347435:connection/0945251f-5342-4545-9d42-f3a56eea02d4"
        const codeStarAction = new cpActions.CodeStarConnectionsSourceAction({
            actionName: "Source",
            connectionArn: connectionArn,
            output: sourceArtifact,
            owner: "boonjiashen",
            repo: "heroku_simple_image_processing",
            branch: "master",
        });
        const ebAction = new ElasticBeanStalkDeployAction({
            actionName: "Deploy",
            applicationName: "heroku_simple_image_processing",
            environmentName: "heroku-simple-image-processing",
            input: sourceArtifact,
        });
        const pipeline = new CdkPipeline(this, "PhotomosaicPipeline", {
            cloudAssemblyArtifact: cloudAssemblyArtifact,
            sourceAction: codeStarAction,
            synthAction: ebAction,
            selfMutating: false,
        });
    }
}