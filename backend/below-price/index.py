"""Получение и обновление данных таблицы причин стоимости ниже прайса. v2"""
import json
import os

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

COLUMNS = [
    "barter",
    "charity",
    "vip",
    "couldnt_sell",
    "price_increase",
    "cost_price",
    "employee_discount",
    "approved_coordinator",
    "approved_management",
    "negative_removal",
    "promo",
]

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    import psycopg2
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    if method == "GET":
        cols_select = ", ".join(COLUMNS)
        cur.execute(
            f"SELECT id, city, {cols_select} "
            f"FROM t_p56096254_dashboard_creation_p.below_price ORDER BY id"
        )
        rows = cur.fetchall()
        col_names = ["id", "city"] + COLUMNS
        result = [dict(zip(col_names, row)) for row in rows]
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(result, ensure_ascii=False)}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        rows = body.get("rows", [])
        for row in rows:
            cols_set = ", ".join(f"{col} = %s" for col in COLUMNS)
            vals = [int(row.get(col, 0)) for col in COLUMNS]
            vals.append(int(row["id"]))
            cur.execute(
                f"UPDATE t_p56096254_dashboard_creation_p.below_price "
                f"SET {cols_set}, updated_at = NOW() WHERE id = %s",
                vals
            )
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    cur.close()
    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}