from flask import Blueprint, redirect, request, session, url_for, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2 as pg
from .db_conn import connect_db

auth_bp = Blueprint("auth", __name__)

conn = connect_db()
conn.autocommit = True           
cur = conn.cursor()

try:
    dsn = conn.get_dsn_parameters()
    print(
        "[DB] Connected",
        "host=", dsn.get("host"),
        "port=", dsn.get("port"),
        "dbname=", dsn.get("dbname"),
        "user=", dsn.get("user"),
    )
except Exception as _:
    pass


def create_auth_table():
    cur.execute("""
        CREATE TABLE IF NOT EXISTS auth(
            username   varchar(255) PRIMARY KEY,
            password   text         NOT NULL,
            firstName  varchar(255) NOT NULL,
            lastName   varchar(255) NOT NULL,
            email      varchar(255) NOT NULL UNIQUE,
            phone      varchar(255) NOT NULL UNIQUE
        )
    """)

create_auth_table()


def check_if_account_exists(username: str) -> bool:
    cur.execute("SELECT 1 FROM auth WHERE username = %s", (username,))
    return cur.fetchone() is not None


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    username   = data.get("username")
    password   = data.get("password")
    first_name = data.get("firstName")
    last_name  = data.get("lastName")
    email      = data.get("email")
    phone      = data.get("phone")

    if not all([username, password, first_name, last_name, email, phone]):
        return jsonify({"error": "Missing required fields"}), 400

    if check_if_account_exists(username):
        return jsonify({"error": "Username already exists"}), 400

    pw_hash = generate_password_hash(password)
    try:

        cur.execute(
            """
            INSERT INTO auth (username, password, firstName, lastName, email, phone)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING username
            """,
            (username, pw_hash, first_name, last_name, email, phone),
        )
        new_user = cur.fetchone()
        if not new_user:
            return jsonify({"error": "Insert failed"}), 500

        return jsonify({"message": "Registration successful", "username": new_user[0]}), 201
    except pg.Error as e:
        print(f"Database error while registering user: {e}")
        return jsonify({"error": "Database error"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")

    if not all([username, password]):
        return jsonify({"error": "Missing required fields"}), 400

    if not check_if_account_exists(username):
        return jsonify({"error": "Account associated with inputted username does not exist."}), 404

    cur.execute("SELECT password FROM auth WHERE username = %s", (username,))
    row = cur.fetchone()
    pw_hash = row[0] if row else None

    if not pw_hash or not check_password_hash(pw_hash, password):
        return jsonify({"error": "Incorrect Password"}), 401

    session["username"] = username
    return jsonify({"message": "Login Successful!"})


@auth_bp.route("/logout")
def logout():
    session.pop("username", None)
    return jsonify({"message": "Logged out"})


@auth_bp.route("/_debug/count")
def _debug_count():
    cur.execute("SELECT COUNT(*) FROM auth")
    n = cur.fetchone()[0]
    return jsonify({"count": n})
