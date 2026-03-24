import json
import os
import hashlib
import hmac
import time
import psycopg2
from urllib.request import urlopen, Request
from urllib.parse import urlencode

SCHEMA = "t_p56096254_dashboard_creation_p"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def make_jwt(payload, secret):
    import base64
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    signature_input = f"{header}.{body}".encode()
    sig = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), signature_input, hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    return f"{header}.{body}.{sig}"


def verify_jwt(token, secret):
    import base64
    parts = token.split(".")
    if len(parts) != 3:
        return None
    header, body, sig = parts
    expected = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    if not hmac.compare_digest(sig, expected):
        return None
    padding = 4 - len(body) % 4
    if padding != 4:
        body += "=" * padding
    payload = json.loads(base64.urlsafe_b64decode(body))
    if payload.get("exp", 0) < time.time():
        return None
    return payload


def fetch_url(url, data=None):
    if data:
        req = Request(url, data=urlencode(data).encode(), method="POST")
    else:
        req = Request(url)
    with urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def handler(event: dict, context) -> dict:
    """Авторизация через Битрикс24: обмен кода на токен, проверка пользователя, выдача JWT."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    secret_key = os.environ["AUTH_SECRET_KEY"]
    portal_url = os.environ["BITRIX_PORTAL_URL"].rstrip("/")

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "")

        if action == "exchange_code":
            code = body.get("code", "")
            redirect_uri = body.get("redirect_uri", "")
            if not code:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "code required"})}

            token_url = f"{portal_url}/oauth/token/"
            token_resp = fetch_url(token_url, {
                "grant_type": "authorization_code",
                "client_id": os.environ["BITRIX_CLIENT_ID"],
                "client_secret": os.environ["BITRIX_CLIENT_SECRET"],
                "code": code,
                "redirect_uri": redirect_uri,
            })

            if "access_token" not in token_resp:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_code", "details": token_resp})}

            access_token = token_resp["access_token"]

            user_resp = fetch_url(f"{portal_url}/rest/user.current.json?auth={access_token}")
            if "result" not in user_resp:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "cant_get_user"})}

            user = user_resp["result"]
            bitrix_id = int(user["ID"])
            user_name = f"{user.get('LAST_NAME', '')} {user.get('NAME', '')}".strip()

            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"SELECT id, name, role FROM {SCHEMA}.allowed_users WHERE bitrix_id = {bitrix_id}")
            row = cur.fetchone()
            cur.close()
            conn.close()

            if not row:
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({
                    "error": "access_denied",
                    "message": "Вам не предоставлен доступ к системе. Обратитесь к администратору.",
                    "bitrix_id": bitrix_id,
                    "name": user_name,
                })}

            allowed_id, allowed_name, role = row

            exp = int(time.time()) + 86400 * 7
            jwt_token = make_jwt({
                "bitrix_id": bitrix_id,
                "name": allowed_name or user_name,
                "role": role,
                "exp": exp,
            }, secret_key)

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "token": jwt_token,
                "user": {
                    "bitrix_id": bitrix_id,
                    "name": allowed_name or user_name,
                    "role": role,
                },
                "expires_at": exp,
            })}

        elif action == "verify":
            token = body.get("token", "")
            payload = verify_jwt(token, secret_key)
            if not payload:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_token"})}

            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"SELECT id, name, role FROM {SCHEMA}.allowed_users WHERE bitrix_id = {payload['bitrix_id']}")
            row = cur.fetchone()
            cur.close()
            conn.close()

            if not row:
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "access_revoked"})}

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "valid": True,
                "user": {
                    "bitrix_id": payload["bitrix_id"],
                    "name": row[1],
                    "role": row[2],
                },
            })}

        elif action == "get_auth_url":
            redirect_uri = body.get("redirect_uri", "")
            auth_url = (
                f"{portal_url}/oauth/authorize/"
                f"?client_id={os.environ['BITRIX_CLIENT_ID']}"
                f"&response_type=code"
                f"&redirect_uri={redirect_uri}"
            )
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"auth_url": auth_url})}

    if method == "GET":
        params = event.get("queryStringParameters") or {}
        code = params.get("code")
        if code:
            site_url = os.environ.get("SITE_URL", "https://preview--dashboard-creation-project-5.poehali.dev")
            redirect = f"{site_url}/auth/callback?code={code}"
            return {
                "statusCode": 302,
                "headers": {**CORS, "Location": redirect},
                "body": "",
            }

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}