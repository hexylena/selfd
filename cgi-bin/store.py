#!/usr/bin/env python3.11
import sys
import cgi
import re
import json
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "selfd-data")
sys.stderr.write(f"SelfD storage Loading. DATA_DIR: {DATA_DIR}\n")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# print(os.environ)
# 'SERVER_SOFTWARE': 'SimpleHTTP/0.6 Python/3.11.6',
# 'SERVER_NAME': 'localhost.localdomain',
# 'GATEWAY_INTERFACE': 'CGI/1.1',
# 'SERVER_PROTOCOL': 'HTTP/1.0',
# 'SERVER_PORT': '8000',
# 'REQUEST_METHOD': 'POST',
# 'PATH_INFO': '',
# 'PATH_TRANSLATED': '/home/user/projects/selfd',
# 'SCRIPT_NAME': '/cgi-bin/store.py',
# 'QUERY_STRING': 'asdf=123',
# 'REMOTE_ADDR': '127.0.0.1',
# 'CONTENT_TYPE': 'application/x-www-form-urlencoded',
# 'CONTENT_LENGTH': '15',
# 'HTTP_ACCEPT': '*/*',
# 'HTTP_USER_AGENT': 'curl/8.0.1',
# 'REMOTE_HOST': '',
# 'HTTP_COOKIE': '',
# 'HTTP_REFERER': ''

form = cgi.FieldStorage()
key = form["key"].value


def answer(contents):
    print("Content-Type: application/json\n")
    print(contents)
    import sys; sys.exit(0)


# Check that it's a uuid
if not re.match(r"^[a-f0-9-]{36}$", key):
    answer('{"error": "invalid key"}')

# They need to supply an action they want to do
method = form["action"].value

sys.stderr.write(f"method: {method}\n")

# Our json data
store = os.path.join(DATA_DIR, key)
if method == "read":
    if os.path.exists(store):
        with open(store, "r") as handle:
            answer(handle.read())
    else:
        answer("{}")
elif method == "write":
    try:
        data = json.loads(form["file"].value.decode("utf-8"))
        with open(store, "wb") as handle:
            handle.write(form["file"].value)
        answer('{"success": true}')
    except Exception as e:  # yes
        answer('{"error": "invalid"}')
else:
    answer("{}")
