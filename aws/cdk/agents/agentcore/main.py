import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import boto3

MODEL_ID = os.environ.get("AGENTCORE_MODEL_ID", "amazon.nova-lite-v1:0")
REGION = os.environ.get("AWS_REGION", "us-east-2")

bedrock = boto3.client("bedrock-runtime", region_name=REGION)

SYSTEM_PROMPT = (
    "You are a helpful customer support assistant for a demo e-commerce store. "
    "Answer briefly and clearly."
)


def parse_json_body(raw: bytes) -> dict:
    if not raw:
        return {}
    try:
        return json.loads(raw.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}


class AgentHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def do_GET(self):
        if self.path == "/ping":
            self._json_response(200, {"status": "Healthy"})
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/ping":
            self._json_response(200, {"status": "Healthy"})
            return

        if self.path != "/invocations":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b""
        body = parse_json_body(raw)
        prompt = body.get("prompt", "Hello")

        response = bedrock.converse(
            modelId=MODEL_ID,
            system=[{"text": SYSTEM_PROMPT}],
            messages=[{"role": "user", "content": [{"text": prompt}]}],
        )
        text = response["output"]["message"]["content"][0]["text"]
        self._json_response(200, {"result": text})

    def _json_response(self, status: int, payload: dict):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 8080), AgentHandler)
    server.serve_forever()
