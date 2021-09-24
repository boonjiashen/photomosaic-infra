from __future__ import annotations
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
