from __future__ import annotations
from dataclasses import dataclass
import re


@dataclass(frozen=True)
class S3Uri:
    """Class for handling an S3 URI (e.g., s3://my-bucket/foo, s3://my-bucket)
    """
    bucket: str
    key: str = None

    @staticmethod
    def from_string(s: str) -> S3Uri:
        uri_regex = r"s3://[^\s/]+(/[^\s/]+)*/?"
        if not re.fullmatch(uri_regex, s):
            raise Exception(f"Expected S3 URI {s} to match {uri_regex}")

        # Remove `s3://`
        s = s[5:]

        # Bucket only
        if s.find('/') == -1:
            return S3Uri(bucket=s)

        # Bucket and key 
        bucket, key = s.split(sep="/", maxsplit=1)
        return S3Uri(bucket, key)


if __name__ == "__main__":
    print(S3Uri.from_string("s3://my-bucket"))
    print(S3Uri.from_string("s3://my-bucket/fooo/bar/"))
    print(S3Uri.from_string("s3://my-bucket/fooo/bar/baz"))
    uri = S3Uri.from_string("s3://jiashenb-691456347435-ap-northeast-1/images/900pxl_me.jpeg")
    print(f"{uri.bucket}, {uri.key}")
