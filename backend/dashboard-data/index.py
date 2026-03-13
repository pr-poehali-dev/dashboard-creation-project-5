"""Универсальное получение и сохранение данных дашборда по dashboard_id."""
import json
import os
import psycopg2

SCHEMA = "t_p56096254_dashboard_creation_p"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    dashboard_id = params.get("dashboard_id")

    if not dashboard_id:
        return {
            "statusCode": 400,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "dashboard_id required"}),
        }

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    try:
        cur.execute(
            f"SELECT id, columns FROM {SCHEMA}.dashboards WHERE id = %s",
            (int(dashboard_id),),
        )
        dash = cur.fetchone()
        if not dash:
            return {
                "statusCode": 404,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Dashboard not found"}),
            }

        columns = dash[1] if isinstance(dash[1], list) else json.loads(dash[1])
        col_keys = [c["key"] for c in columns]

        if method == "GET":
            cur.execute(
                f"SELECT id, city, data FROM {SCHEMA}.dashboard_rows WHERE dashboard_id = %s ORDER BY id",
                (int(dashboard_id),),
            )
            rows = cur.fetchall()
            result = []
            for r in rows:
                row_data = r[2] if isinstance(r[2], dict) else json.loads(r[2])
                item = {"id": r[0], "city": r[1]}
                for k in col_keys:
                    item[k] = row_data.get(k, 0)
                result.append(item)
            return {
                "statusCode": 200,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(result, ensure_ascii=False),
            }

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            rows = body.get("rows", [])
            for row in rows:
                row_id = row.get("id")
                data = {k: int(row.get(k, 0)) for k in col_keys}
                if row_id:
                    cur.execute(
                        f"UPDATE {SCHEMA}.dashboard_rows SET data = %s, city = %s, updated_at = NOW() WHERE id = %s AND dashboard_id = %s",
                        (json.dumps(data), row.get("city", ""), int(row_id), int(dashboard_id)),
                    )
                else:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.dashboard_rows (dashboard_id, city, data) VALUES (%s, %s, %s)",
                        (int(dashboard_id), row.get("city", ""), json.dumps(data)),
                    )
            conn.commit()
            return {
                "statusCode": 200,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True}),
            }

    finally:
        cur.close()
        conn.close()

    return {
        "statusCode": 405,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"error": "Method not allowed"}),
    }
