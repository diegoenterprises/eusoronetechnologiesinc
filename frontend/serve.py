#!/usr/bin/env python3
import os
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

try:
    import jwt
except ImportError:
    import subprocess
    subprocess.run(["pip3", "install", "PyJWT"], check=True)
    import jwt

JWT_SECRET = "eusotrip-dev-secret-key"
COOKIE_NAME = "eusotrip_session"
MASTER_PASSWORD = "Vision2026!"
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist", "public")

TEST_USERS = {
    "diego": {"id": "admin-diego", "email": "diego@eusotrip.com", "role": "SUPER_ADMIN", "name": "Diego"},
    "diego@eusotrip.com": {"id": "admin-diego", "email": "diego@eusotrip.com", "role": "SUPER_ADMIN", "name": "Diego"},
    "admin@eusotrip.com": {"id": "admin-1", "email": "admin@eusotrip.com", "role": "ADMIN", "name": "Test Admin"},
    "shipper@eusotrip.com": {"id": "shipper-1", "email": "shipper@eusotrip.com", "role": "SHIPPER", "name": "Test Shipper"},
    "carrier@eusotrip.com": {"id": "carrier-1", "email": "carrier@eusotrip.com", "role": "CARRIER", "name": "Test Carrier"},
    "broker@eusotrip.com": {"id": "broker-1", "email": "broker@eusotrip.com", "role": "BROKER", "name": "Test Broker"},
    "driver@eusotrip.com": {"id": "driver-1", "email": "driver@eusotrip.com", "role": "DRIVER", "name": "Test Driver"},
}

class CombinedHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def _send_json(self, data, status=200, extra_headers=None, is_batch=False):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        response = [data] if is_batch else data
        self.wfile.write(json.dumps(response).encode())

    def _get_cookies(self):
        cookies = {}
        for item in self.headers.get("Cookie", "").split(";"):
            if "=" in item:
                k, v = item.strip().split("=", 1)
                cookies[k] = v
        return cookies

    def do_GET(self):
        path = urlparse(self.path).path
        query = urlparse(self.path).query
        is_batch = "batch=1" in query
        
        if path == "/api/trpc/auth.me":
            token = self._get_cookies().get(COOKIE_NAME)
            if not token:
                return self._send_json({"result": {"data": {"json": None}}}, is_batch=is_batch)
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                user = {"id": payload["userId"], "email": payload["email"], "role": payload["role"], "name": payload["name"]}
                self._send_json({"result": {"data": {"json": user}}}, is_batch=is_batch)
            except:
                self._send_json({"result": {"data": {"json": None}}}, is_batch=is_batch)
        elif path.startswith("/api/trpc/loads"):
            self._send_json({"result": {"data": {"json": []}}}, is_batch=is_batch)
        elif path.startswith("/api/trpc/payments"):
            self._send_json({"result": {"data": {"json": []}}}, is_batch=is_batch)
        elif path.startswith("/api/"):
            self._send_json({"result": {"data": {"json": {}}}}, is_batch=is_batch)
        else:
            file_path = os.path.join(STATIC_DIR, path.lstrip("/"))
            if os.path.isfile(file_path):
                super().do_GET()
            else:
                self.path = "/index.html"
                super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        query = urlparse(self.path).query
        is_batch = "batch=1" in query
        
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode() if content_length else "{}"
        
        try:
            data = json.loads(body) if body else {}
        except:
            data = {}
        
        if "0" in data:
            json_data = data.get("0", {}).get("json", {})
            is_batch = True
        else:
            json_data = data.get("json", {})

        if path == "/api/trpc/auth.login":
            email = (json_data.get("email") or "").lower()
            password = json_data.get("password")
            
            user = TEST_USERS.get(email)
            if not user or password != MASTER_PASSWORD:
                return self._send_json({"error": {"message": "Invalid credentials"}}, 400, is_batch=is_batch)
            
            token = jwt.encode({"userId": user["id"], "email": user["email"], "role": user["role"], "name": user["name"], "exp": int(time.time()) + 7*24*60*60}, JWT_SECRET, algorithm="HS256")
            
            self._send_json(
                {"result": {"data": {"json": {"success": True, "user": user}}}},
                extra_headers={"Set-Cookie": f"{COOKIE_NAME}={token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax"},
                is_batch=is_batch
            )
        
        elif path == "/api/trpc/auth.logout":
            self._send_json(
                {"result": {"data": {"json": {"success": True}}}},
                extra_headers={"Set-Cookie": f"{COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0"},
                is_batch=is_batch
            )
        
        else:
            self._send_json({"result": {"data": {"json": {}}}}, is_batch=is_batch)

    def log_message(self, format, *args):
        if "/api/" in args[0]:
            print(f"[API] {args[0]}")

if __name__ == "__main__":
    port = 3000
    server = HTTPServer(("", port), CombinedHandler)
    print("=" * 50)
    print(f"Server running on http://localhost:{port}/")
    print("Login: Diego / Vision2026!")
    print("=" * 50)
    server.serve_forever()
