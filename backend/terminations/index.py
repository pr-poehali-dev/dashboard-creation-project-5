"""Получение и обновление данных таблицы причин расторжений с поддержкой месяцев."""
import json
import os

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

COLUMNS = [
    "deadline_violations",
    "poor_quality_service",
    "patient_no_contact",
    "patient_died",
    "reregistration",
    "complaint",
    "procedures_not_needed",
    "financial_difficulties",
    "refund_completed",
]

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    import psycopg2

    if method == "GET":
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur = conn.cursor()
        cols_select = ", ".join(COLUMNS)
        cur.execute(
            f"SELECT id, city, month, {cols_select} "
            f"FROM t_p56096254_dashboard_creation_p.terminations ORDER BY id"
        )
        rows = cur.fetchall()
        col_names = ["id", "city", "month"] + COLUMNS
        result = [dict(zip(col_names, row)) for row in rows]
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(result, ensure_ascii=False)}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        rows = body.get("rows", [])
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur = conn.cursor()
        for row in rows:
            cols_set = ", ".join(f"{col} = %s" for col in COLUMNS)
            vals = [int(row.get(col, 0)) for col in COLUMNS]
            vals.append(int(row["id"]))
            cur.execute(
                f"UPDATE t_p56096254_dashboard_creation_p.terminations "
                f"SET {cols_set}, updated_at = NOW() WHERE id = %s",
                vals
            )
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
