from flask import Blueprint, redirect, request, session, url_for, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2 as pg
from db_conn import connect_db

auth_bp = Blueprint("auth", __name__, url_prefix ="/auth")

conn = connect_db()
cur = conn.cursor()


def create_auth_table():


    cur.execute('CREATE TABLE IF NOT EXISTS auth( username varchar(255) primary key, password text not null, firstName varchar(255) not null, lastName varchar(255) not null, email varchar(255) not null unique, phone varchar(255) not null unique)')
    conn.commit()

def check_if_account_exists(u):
    username = u
    cur.execute('SELECT username from auth where username = %s', (username,))
    if cur.fetchone():
        return True
    else:
        return False
    

    
@auth_bp.route("register", methods = ["POST"])
def register():


    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    email = data.get("email")
    phone = data.get("phone")

    if check_if_account_exists(username):
        return jsonify({"error": "Username already exists"}), 400
    else:
        hash_salt_pass = generate_password_hash(password)
        try:
            cur.execute("INSERT INTO auth VALUES(%s, %s, %s, %s, %s, %s)", (username, hash_salt_pass, first_name, last_name, email, phone))
            conn.commit
            return redirect(session.get("next") or "/")
        except pg.Error as e:
            print(f"Database error while checking username: {e}")
            return False

@auth_bp.route("login", methods = ["POST"])
def login():

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not check_if_account_exists(username):
        return jsonify({"error": "Account associated with inputted username does not exist."}), 404
   
    
    cur.execute("SELECT password FROM auth WHERE username = %s", (username,))
    pw_hash = cur.fetchone()[0]
    if not check_password_hash(pwhash=pw_hash, password= password):
        return jsonify({"error": "Incorrect Password"}), 401

    session["username"] = username
    return jsonify({"message": "Login Successful!"})


@auth_bp("logout")
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))