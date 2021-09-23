from __future__ import annotations
import boto3
import base64
from dataclasses import dataclass
import io
from PIL import Image
import numpy as np
import Mosaicker
import pprint
from enum import Enum, auto


class HttpVerb(Enum):
    """Enumerates several HTTP verbs
    """
    GET = auto()
    OPTIONS = auto()
    POST = auto()

    @staticmethod
    def of(verb: str) -> HttpVerb:
        "Case-insensitive match of verb"
        return next(x for x in HttpVerb if x.name.lower() == verb.lower())


CONTENT_TYPE = "image/jpeg"
FORMAT = "JPEG"
max_dim = 100  # max dimension of both height and width of output image
               # overly large input images will be shrunk
mosaicker = Mosaicker.AppMosaicker(
        'static/data_batch_1',
        max_dim=max_dim,
        )


def get_http_verb(event, default=HttpVerb.GET) -> HttpVerb:
    """Get the HTTP verb of a HttpApi event

    See https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html#http-api-develop-integrations-lambda.proxy-format
    """
    verb = event.get("requestContext", {}).get("http", {}).get("method", default.name)

    return HttpVerb.of(verb)


def handler(event: dict, context):
    print(event)
    verb = get_http_verb(event)
    print(f"http verb = {verb}")

    if verb == HttpVerb.POST:
        img_bytes = base64.b64decode(event.get("body", ""))
        input_im = bytes2img(img_bytes)
    else:
        input_im = get_default_image()
    output_im = mosaicker.compute_mosaick(input_im)
    body = base64.b64encode(img2bytes(output_im))

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": CONTENT_TYPE,
            # To enable CORS
            "Access-Control-Allow-Origin": "*",
        },
        "body": body,
        # See https://stackoverflow.com/a/50670252
        "isBase64Encoded": True,
    }


def read_image_from_s3(bucket: str, key: str):
    """Load image file from s3.

    See: https://stackoverflow.com/a/56341457
    """
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket)
    object = bucket.Object(key)
    response = object.get()
    file_stream = response['Body']
    im = np.array(Image.open(file_stream))

    return im


def img2bytes(image) -> bytes:
    """Converts a numpy image to bytes

    See https://github.com/aws-samples/handling-binary-data-using-api-gateway-http-apis-blog/blob/2c744ddd6e3d9a46f4799b6f1cfe42af8d229a05/sam-code/img_api/app.py#L61
    """
    byte_stream = io.BytesIO()
    Image.fromarray(image).save(byte_stream, format=FORMAT)
    bytes = byte_stream.getvalue()
    byte_stream.close()

    return bytes


def bytes2img(img_bytes: bytes):
    """Converts bytes into a numpy image

    Use the Python base64 module to convert to base64 string to bytes
    """
    img_buffer = io.BytesIO(img_bytes)
    image = np.array(Image.open(img_buffer))
    img_buffer.close()

    return image


def get_default_image():
    bucket_str = "jiashenb-691456347435-ap-northeast-1"
    key_str = "images/900pxl_me.jpeg"

    return read_image_from_s3(bucket_str, key_str)


def main():

    img = get_default_image()
    print(base64.b64encode(img2bytes(img))[:10])


if __name__ == "__main__":
    main()
