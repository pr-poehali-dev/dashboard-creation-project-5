import json
import os
import hashlib
import hmac
import time
import psycopg2
import base64

SCHEMA = "t_p56096254_dashboard_creation_p"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def verify_jwt(token, secret):
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


def get_user_from_event(event, secret):
    headers = event.get("headers") or {}
    auth = headers.get("Authorization") or headers.get("authorization") or ""
    auth = auth or headers.get("X-Authorization") or headers.get("x-authorization") or ""
    if auth.startswith("Bearer "):
        token = auth[7:]
    else:
        return None
    return verify_jwt(token, secret)


def handler(event: dict, context) -> dict:
    """Управление списком допущенных пользователей: добавление, редактирование, удаление (только для admin)."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    secret_key = os.environ["AUTH_SECRET_KEY"]
    user = get_user_from_event(event, secret_key)
    if not user:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

    if user.get("role") != "admin":
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "admin_required"})}

    method = event.get("httpMethod", "GET")
    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        cur.execute(f"SELECT id, bitrix_id, name, role, created_at FROM {SCHEMA}.allowed_users ORDER BY created_at ASC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        users = [{"id": r[0], "bitrix_id": r[1], "name": r[2], "role": r[3], "created_at": r[4].isoformat()} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"users": users})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        bitrix_id = int(body.get("bitrix_id", 0))
        name = body.get("name", "").strip()
        role = body.get("role", "viewer")
        if not bitrix_id or not name:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "bitrix_id and name required"})}
        if role not in ("admin", "editor", "viewer"):
            role = "viewer"
        cur.execute(
            f"INSERT INTO {SCHEMA}.allowed_users (bitrix_id, name, role) VALUES ({bitrix_id}, '{name.replace(chr(39), chr(39)*2)}', '{role}') "
            f"ON CONFLICT (bitrix_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role "
            f"RETURNING id, bitrix_id, name, role"
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": {"id": row[0], "bitrix_id": row[1], "name": row[2], "role": row[3]}})}

    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        user_id = int(body.get("id", 0))
        name = body.get("name", "").strip()
        role = body.get("role", "viewer")
        if not user_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
        if role not in ("admin", "editor", "viewer"):
            role = "viewer"
        updates = []
        if name:
            updates.append(f"name = '{name.replace(chr(39), chr(39)*2)}'")
        if role:
            updates.append(f"role = '{role}'")
        if not updates:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "nothing to update"})}
        cur.execute(f"UPDATE {SCHEMA}.allowed_users SET {', '.join(updates)} WHERE id = {user_id} RETURNING id, bitrix_id, name, role")
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "user_not_found"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": {"id": row[0], "bitrix_id": row[1], "name": row[2], "role": row[3]}})}

    if method == "DELETE":
        params = event.get("queryStringParameters") or {}
        user_id = int(params.get("id", 0))
        if not user_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
        cur.execute(f"DELETE FROM {SCHEMA}.allowed_users WHERE id = {user_id}")
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"deleted": True})}

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}
