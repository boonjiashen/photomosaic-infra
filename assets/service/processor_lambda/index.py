from __future__ import annotations
import boto3
import base64
from dataclasses import dataclass

s3 = boto3.client('s3')


def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "image/jpeg",
            # To enable CORS
            "Access-Control-Allow-Origin": "*",
        },
        "body": base64.b64encode(get_image()),
        # See https://stackoverflow.com/a/50670252
        "isBase64Encoded": True,
    }

def get_image():
    bucket = "jiashenb-691456347435-ap-northeast-1"
    key = "images/61fF0Qt14VL._AC_SL1000_.jpg"
    
    # See https://stackoverflow.com/a/42737249
    return s3.get_object(Bucket=bucket, Key=key)['Body'].read()

def main():
    print(base64.b64encode(get_image()))

if __name__ == "__main__":
    main()
