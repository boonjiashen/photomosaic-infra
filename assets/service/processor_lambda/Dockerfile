# From https://docs.aws.amazon.com/lambda/latest/dg/images-create.html#images-create-from-base
FROM public.ecr.aws/lambda/python:3.9
COPY requirements.txt  .
RUN  pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

WORKDIR ${LAMBDA_TASK_ROOT}
COPY . .
CMD [ "index.handler" ]
