#---------------------Libraries and packages here---------------------------#


"""
flask -> API framework, importing Flask itself, session to save user token, request to handle HTTP request within the webpage itself

requests -> handles HTTP requests for pages outside the webpage

json -> just in case json needs to be serialized/deserialized. Part of Python already

psycopg2 -> Postgres database manipulation library

"""

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
from backend.auth import conn
#----------------------------------------------------------------------------#

# Load backend/.env
load_dotenv()

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

    from .auth import auth_bp   
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
