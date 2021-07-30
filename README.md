The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Deployment

1. Checkout this package and the photomosaic app under the same directory, like:
    ```
    IdeaProjects
    ├── heroku_simple_image_processing
    ├── photomosaic-infra
    ```
1. `cd` to this package
1. Run:
    ```bash
    cdk bootstrap  # because this package produces assets that go into the bootstrap S3 bucket
    cdk deploy
    ```
1. Go to the URL of the Elasticbean stalk app, in the EB console.
1. Verify that the webapp is running.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
