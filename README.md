## What

(Under construction) A webapp to do image processing on an uploaded image.

## Deployment

1. `cdk deploy`
1. Visit siteUrl given in stack output

Or using curl:

```bash
FILENAME=$( gmktemp --suffix .jpeg )  \
&& curl -XPOST https://owtyai55r3.execute-api.ap-northeast-1.amazonaws.com/ --data-binary @"${HOME}/Documents/100pxl_dice.png" --output ${FILENAME}  \
&& open ${FILENAME}
```

## Local development

```bash
docker build -t photomosaicinfra assets/service/processor_lambda/  \
&& docker run -d -p 8080:8080  \
--env AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)  \
--env AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)  \
--env AWS_DEFAULT_REGION=$(aws configure get region)  \
photomosaicinfra  \
&& sleep 1  \
&& FILENAME=$( gmktemp --suffix .jpeg )  \
&& curl -XPOST http://localhost:8080/2015-03-31/functions/function/invocations -d '{}' | jq -r '.body' | base64 --decode > ${FILENAME}  \
&& open ${FILENAME}
```


## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
