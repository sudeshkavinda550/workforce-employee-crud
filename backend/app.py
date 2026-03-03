from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     os.getenv("DB_PORT", 5432),
    "database": os.getenv("DB_NAME", "employee_db"),
    "user":     os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "Sudesh1020"),
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def init_db():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS departments (
                    id   SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE
                );
                INSERT INTO departments (name)
                VALUES ('Engineering'),('Marketing'),('Sales'),('HR'),('Finance')
                ON CONFLICT DO NOTHING;

                CREATE TABLE IF NOT EXISTS employees (
                    id            SERIAL PRIMARY KEY,
                    name          VARCHAR(150) NOT NULL,
                    email         VARCHAR(150) NOT NULL UNIQUE,
                    phone         VARCHAR(20),
                    department_id INTEGER REFERENCES departments(id),
                    role          VARCHAR(100),
                    salary        NUMERIC(12,2),
                    status        VARCHAR(20) DEFAULT 'Active',
                    hire_date     DATE DEFAULT CURRENT_DATE,
                    created_at    TIMESTAMP DEFAULT NOW(),
                    updated_at    TIMESTAMP DEFAULT NOW()
                );
            """)
        conn.commit()

@app.route("/api/departments", methods=["GET"])
def get_departments():
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM departments ORDER BY name")
            return jsonify(cur.fetchall())

@app.route("/api/employees", methods=["GET"])
def get_employees():
    from flask import request
    search     = request.args.get("search", "")
    department = request.args.get("department", "")
    status     = request.args.get("status", "")
    page       = int(request.args.get("page", 1))
    per_page   = int(request.args.get("per_page", 10))
    offset     = (page - 1) * per_page

    conditions = ["1=1"]
    params     = []

    if search:
        conditions.append("(e.name ILIKE %s OR e.email ILIKE %s OR e.role ILIKE %s)")
        params += [f"%{search}%", f"%{search}%", f"%{search}%"]
    if department:
        conditions.append("d.name = %s")
        params.append(department)
    if status:
        conditions.append("e.status = %s")
        params.append(status)

    where = " AND ".join(conditions)

    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(f"SELECT COUNT(*) AS total FROM employees e LEFT JOIN departments d ON e.department_id = d.id WHERE {where}", params)
            total = cur.fetchone()["total"]

            cur.execute(f"""
                SELECT e.*, d.name AS department_name
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.id
                WHERE {where}
                ORDER BY e.created_at DESC
                LIMIT %s OFFSET %s
            """, params + [per_page, offset])

            return jsonify({
                "employees": cur.fetchall(),
                "total": total,
                "page": page,
                "per_page": per_page,
                "pages": (total + per_page - 1) // per_page,
            })

@app.route("/api/employees/<int:emp_id>", methods=["GET"])
def get_employee(emp_id):
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT e.*, d.name AS department_name
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.id
                WHERE e.id = %s
            """, (emp_id,))
            emp = cur.fetchone()
    if not emp:
        return jsonify({"error": "Employee not found"}), 404
    return jsonify(emp)

@app.route("/api/employees", methods=["POST"])
def create_employee():
    from flask import request
    data = request.get_json()
    if not data.get("name") or not data.get("email"):
        return jsonify({"error": "name and email are required"}), 400

    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            try:
                cur.execute("""
                    INSERT INTO employees (name, email, phone, department_id, role, salary, status, hire_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                """, (
                    data["name"], data["email"], data.get("phone"),
                    data.get("department_id"), data.get("role"),
                    data.get("salary"), data.get("status", "Active"),
                    data.get("hire_date"),
                ))
                emp = cur.fetchone()
                conn.commit()
                return jsonify(emp), 201
            except psycopg2.errors.UniqueViolation:
                return jsonify({"error": "Email already exists"}), 409

@app.route("/api/employees/<int:emp_id>", methods=["PUT"])
def update_employee(emp_id):
    from flask import request
    data = request.get_json()
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id FROM employees WHERE id = %s", (emp_id,))
            if not cur.fetchone():
                return jsonify({"error": "Employee not found"}), 404
            try:
                cur.execute("""
                    UPDATE employees SET
                        name          = COALESCE(%s, name),
                        email         = COALESCE(%s, email),
                        phone         = %s,
                        department_id = %s,
                        role          = %s,
                        salary        = %s,
                        status        = COALESCE(%s, status),
                        hire_date     = %s,
                        updated_at    = NOW()
                    WHERE id = %s
                    RETURNING *
                """, (
                    data.get("name"), data.get("email"), data.get("phone"),
                    data.get("department_id"), data.get("role"),
                    data.get("salary"), data.get("status"),
                    data.get("hire_date"), emp_id,
                ))
                emp = cur.fetchone()
                conn.commit()
                return jsonify(emp)
            except psycopg2.errors.UniqueViolation:
                return jsonify({"error": "Email already exists"}), 409

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)