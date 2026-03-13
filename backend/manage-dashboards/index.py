import json
import os
import psycopg2

SCHEMA = "t_p56096254_dashboard_creation_p"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """CRUD для дашбордов: список, создание с данными, обновление, удаление."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    dash_id = params.get("id")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "GET":
            if dash_id:
                cur.execute(
                    f"SELECT id, title, slug, api_url, columns, created_at FROM {SCHEMA}.dashboards WHERE id = %s",
                    (dash_id,),
                )
                row = cur.fetchone()
                if not row:
                    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
                return {
                    "statusCode": 200,
                    "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps(_row_to_dict(row)),
                }
            else:
                cur.execute(
                    f"SELECT id, title, slug, api_url, columns, created_at FROM {SCHEMA}.dashboards ORDER BY id"
                )
                rows = cur.fetchall()
                return {
                    "statusCode": 200,
                    "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps([_row_to_dict(r) for r in rows]),
                }

        body = json.loads(event.get("body") or "{}")

        if method == "POST":
            title = body["title"]
            slug = body["slug"]
            api_url = body.get("api_url", "")
            columns = body.get("columns", [])
            initial_rows = body.get("rows", [])

            cur.execute(
                f"INSERT INTO {SCHEMA}.dashboards (title, slug, api_url, columns) VALUES (%s, %s, %s, %s) RETURNING id, title, slug, api_url, columns, created_at",
                (title, slug, api_url, json.dumps(columns)),
            )
            row = cur.fetchone()
            new_id = row[0]

            col_keys = [c["key"] for c in columns]
            for r in initial_rows:
                city = r.get("city", "")
                if not city.strip():
                    continue
                data = {k: int(r.get(k, 0)) for k in col_keys}
                cur.execute(
                    f"INSERT INTO {SCHEMA}.dashboard_rows (dashboard_id, city, data) VALUES (%s, %s, %s)",
                    (new_id, city, json.dumps(data)),
                )

            conn.commit()
            return {
                "statusCode": 201,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(_row_to_dict(row)),
            }

        if method == "PUT":
            title = body.get("title")
            slug = body.get("slug")
            api_url = body.get("api_url")
            columns = body.get("columns")
            cur.execute(
                f"""UPDATE {SCHEMA}.dashboards
                    SET title = COALESCE(%s, title),
                        slug = COALESCE(%s, slug),
                        api_url = COALESCE(%s, api_url),
                        columns = COALESCE(%s, columns)
                    WHERE id = %s
                    RETURNING id, title, slug, api_url, columns, created_at""",
                (title, slug, api_url, json.dumps(columns) if columns is not None else None, dash_id),
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
            return {
                "statusCode": 200,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(_row_to_dict(row)),
            }

        if method == "DELETE":
            cur.execute(f"DELETE FROM {SCHEMA}.dashboard_rows WHERE dashboard_id = %s", (dash_id,))
            cur.execute(f"DELETE FROM {SCHEMA}.dashboards WHERE id = %s RETURNING id", (dash_id,))
            row = cur.fetchone()
            conn.commit()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"deleted": dash_id})}

    finally:
        cur.close()
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}


def _row_to_dict(row):
    return {
        "id": row[0],
        "title": row[1],
        "slug": row[2],
        "api_url": row[3],
        "columns": row[4] if isinstance(row[4], list) else json.loads(row[4]),
        "created_at": str(row[5]),
    }
