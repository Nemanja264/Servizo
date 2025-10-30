import json
from json import JSONDecodeError
from django.http import HttpRequest

def parse_json(request: HttpRequest) -> dict:
    try:
        return json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, JSONDecodeError):
        return None
