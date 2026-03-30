"""CRUD для дополнительных таблиц дашборда: список, создание, обновление, удаление, данные."""
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
    """CRUD для дополнительных таблиц: создание, список, редактирование, удаление и работа с данными."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    dashboard_id = params.get("dashboard_id")
    table_id = params.get("table_id")
    action = params.get("action", "tables")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == "data":
            return _handle_data(method, params, event, cur, conn, table_id)

        if method == "GET":
            if table_id:
                cur.execute(
                    f"SELECT id, dashboard_id, title, slug, columns, created_at FROM {SCHEMA}.extra_tables WHERE id = %s",
                    (int(table_id),),
                )
                row = cur.fetchone()
                if not row:
                    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
                return {
                    "statusCode": 200,
                    "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps(_table_to_dict(row)),
                }
            elif dashboard_id:
                cur.execute(
                    f"SELECT id, dashboard_id, title, slug, columns, created_at FROM {SCHEMA}.extra_tables WHERE dashboard_id = %s ORDER BY id",
                    (int(dashboard_id),),
                )
                rows = cur.fetchall()
                return {
                    "statusCode": 200,
                    "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps([_table_to_dict(r) for r in rows]),
                }
            else:
                return {
                    "statusCode": 400,
                    "headers": CORS,
                    "body": json.dumps({"error": "dashboard_id or table_id required"}),
                }

        body = json.loads(event.get("body") or "{}")

        if method == "POST":
            if not dashboard_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "dashboard_id required"})}

            title = body["title"]
            slug = body["slug"]
            columns = body.get("columns", [])

            cur.execute(
                f"INSERT INTO {SCHEMA}.extra_tables (dashboard_id, title, slug, columns) VALUES (%s, %s, %s, %s) RETURNING id, dashboard_id, title, slug, columns, created_at",
                (int(dashboard_id), title, slug, json.dumps(columns)),
            )
            row = cur.fetchone()
            new_id = row[0]

            initial_rows = body.get("rows", [])
            col_keys = [c["key"] for c in columns]
            for r in initial_rows:
                data = {}
                for k in col_keys:
                    val = r.get(k, "")
                    data[k] = val
                cur.execute(
                    f"INSERT INTO {SCHEMA}.extra_table_rows (extra_table_id, city, data) VALUES (%s, %s, %s)",
                    (new_id, "", json.dumps(data, ensure_ascii=False)),
                )

            conn.commit()
            return {
                "statusCode": 201,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(_table_to_dict(row)),
            }

        if method == "PUT":
            if not table_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "table_id required"})}

            title = body.get("title")
            slug = body.get("slug")
            columns = body.get("columns")

            cur.execute(
                f"""UPDATE {SCHEMA}.extra_tables
                    SET title = COALESCE(%s, title),
                        slug = COALESCE(%s, slug),
                        columns = COALESCE(%s, columns)
                    WHERE id = %s
                    RETURNING id, dashboard_id, title, slug, columns, created_at""",
                (title, slug, json.dumps(columns) if columns is not None else None, int(table_id)),
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
            return {
                "statusCode": 200,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps(_table_to_dict(row)),
            }

        if method == "DELETE":
            if not table_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "table_id required"})}

            cur.execute(f"SELECT id FROM {SCHEMA}.extra_tables WHERE id = %s", (int(table_id),))
            if not cur.fetchone():
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}

            cur.execute(f"DELETE FROM {SCHEMA}.extra_table_rows WHERE extra_table_id = %s", (int(table_id),))
            cur.execute(f"DELETE FROM {SCHEMA}.extra_tables WHERE id = %s", (int(table_id),))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"deleted": table_id})}

    finally:
        cur.close()
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}


def _handle_data(method, params, event, cur, conn, table_id):
    if not table_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "table_id required"})}

    cur.execute(
        f"SELECT id, columns FROM {SCHEMA}.extra_tables WHERE id = %s",
        (int(table_id),),
    )
    tbl = cur.fetchone()
    if not tbl:
        return {
            "statusCode": 404,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Extra table not found"}),
        }

    columns = tbl[1] if isinstance(tbl[1], list) else json.loads(tbl[1])
    col_keys = [c["key"] for c in columns]

    if method == "GET":
        cur.execute(
            f"SELECT id, data FROM {SCHEMA}.extra_table_rows WHERE extra_table_id = %s ORDER BY id",
            (int(table_id),),
        )
        rows = cur.fetchall()
        result = []
        for r in rows:
            row_data = r[1] if isinstance(r[1], dict) else json.loads(r[1])
            item = {"id": r[0]}
            for k in col_keys:
                item[k] = row_data.get(k, "")
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
            data = {}
            for k in col_keys:
                val = row.get(k, "")
                data[k] = val
            if row_id:
                cur.execute(
                    f"UPDATE {SCHEMA}.extra_table_rows SET data = %s, updated_at = NOW() WHERE id = %s AND extra_table_id = %s",
                    (json.dumps(data, ensure_ascii=False), int(row_id), int(table_id)),
                )
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.extra_table_rows (extra_table_id, city, data) VALUES (%s, %s, %s)",
                    (int(table_id), "", json.dumps(data, ensure_ascii=False)),
                )
        conn.commit()
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True}),
        }

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}


def _table_to_dict(row):
    return {
        "id": row[0],
        "dashboard_id": row[1],
        "title": row[2],
        "slug": row[3],
        "columns": row[4] if isinstance(row[4], list) else json.loads(row[4]),
        "created_at": str(row[5]),
    }