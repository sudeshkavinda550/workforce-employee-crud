from flask import Blueprint, jsonify
import psycopg2.extras
from db import get_connection

departments_bp = Blueprint("departments", __name__)


@departments_bp.route("/departments", methods=["GET"])
def get_departments():
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM departments ORDER BY name")
            return jsonify(cur.fetchall())