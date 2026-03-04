from flask import Blueprint, jsonify
import psycopg2.extras
from db import get_connection

stats_bp = Blueprint("stats", __name__)


@stats_bp.route("/stats", methods=["GET"])
def get_stats():
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) AS total FROM employees")
            total = cur.fetchone()["total"]

            cur.execute("SELECT COUNT(*) AS active FROM employees WHERE status = 'Active'")
            active = cur.fetchone()["active"]

            cur.execute("SELECT AVG(salary) AS avg_salary FROM employees WHERE salary IS NOT NULL")
            avg_salary = cur.fetchone()["avg_salary"] or 0

            cur.execute("""
                SELECT d.name, COUNT(e.id) AS count
                FROM departments d
                LEFT JOIN employees e ON e.department_id = d.id
                GROUP BY d.name ORDER BY count DESC
            """)
            by_dept = cur.fetchall()

    return jsonify({
        "total":      total,
        "active":     active,
        "inactive":   total - active,
        "avg_salary": float(avg_salary),
        "by_dept":    by_dept,
    })