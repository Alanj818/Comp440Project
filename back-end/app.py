#---------------------Libraries and packages here---------------------------#


"""
flask -> API framework, importing Flask itself, session to save user token, request to handle HTTP request within the webpage itself

requests -> handles HTTP requests for pages outside the webpage

json -> just in case json needs to be serialized/deserialized. Part of Python already

psycopg2 -> Postgres database manipulation library

"""

from flask import Flask, session, request, redirect
import requests, json
import psycopg2 as pg
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
#----------------------------------------------------------------------------#


from .db_conn import connect_db
from .auth import auth_bp



# Initializing app and bcrypt
app = Flask(__name__)
CORS(app, supports_credentials=True)

app.register_blueprint(auth_bp)

if __name__ == "__main__":
    app.run(debug=True)
