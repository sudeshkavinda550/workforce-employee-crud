import psycopg2
from config import DB_CONFIG

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