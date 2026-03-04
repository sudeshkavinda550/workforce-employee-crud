from flask import Flask
from flask_cors import CORS
from db import init_db
from blueprints.employees import employees_bp
from blueprints.departments import departments_bp
from blueprints.stats import stats_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(employees_bp, url_prefix="/api")
app.register_blueprint(departments_bp, url_prefix="/api")
app.register_blueprint(stats_bp, url_prefix="/api")

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)