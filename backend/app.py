#---------------------Libraries and packages here---------------------------#

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import psycopg2 as pg
import os
#----------------------------------------------------------------------------#


load_dotenv()

# Initialize allowed array and store all possible hosts for the frontend
allowed = [
    os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

    CORS(
        app,
        resources={r"/api/*": {"origins": allowed}},
        supports_credentials=True,
        methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
        allow_headers=["Content-Type","Authorization"],
        expose_headers=["Content-Type"],
        max_age=600,
    )

    # Importing the auth Blueprint to be registered to the main app
    from auth import auth_bp, create_auth_table  
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # Importing the db_pool to create the auth table the first time the app is ran
    from db_conn import db_pool
    conn = db_pool.getconn()
    cur = conn.cursor()
    create_auth_table(cur)

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
