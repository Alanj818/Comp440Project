from flask import Blueprint, redirect, request, session, url_for, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2 as pg
from db_conn import db_pool


#----------------------------------------Blueprint Init and DB Connection--------------------------------------------------------------------#



#Flask uses "Blueprints" for modularity, 
# Blueprints are a set of operations that are registered to an application (app.py) and then used
auth_bp = Blueprint("auth", __name__)



# conn will serve as our connection to the DB pool initialized in db_conn
try:

    conn = db_pool.getconn()     
    conn.autocommit = True    
    cur = conn.cursor()

except Exception as e:
    print(f"Error creating cursor: {e}")


# Checks if the database connection was successful, as well as correct using Data Source Name parameters
# If any error or anything comes up, it will continue still and not crash
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


# Creates the table for authentication, does not create it if it already exists in the database
# Gets called at app start up
def create_auth_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS auth(
            username   varchar(255) PRIMARY KEY,
            password   text         NOT NULL,
            firstName  varchar(255) NOT NULL,
            lastName   varchar(255) NOT NULL,
            email      varchar(255) NOT NULL UNIQUE,
            phone      varchar(255) NOT NULL UNIQUE
        )
    """)





#Checks if the account already exists in the database
#All parameters are optional
def check_if_account_exists(username: str = None, email: str = None, phone: str = None) -> bool:

    
    #Checks if the inputted username, email, or phone number already exists
    #Returns dict with which fields are already registered

    #SELECT 1 is used instead of an actual result (ex: SELECT *) 
    #for the query since its faster for this purpose (just finding out if something is there)


    conflicts = {}
    
    cur.execute("SELECT 1 FROM auth WHERE username = %s", (username,))  
    if cur.fetchone():
        conflicts["username"] = "Account with inputted username already exists"
    
    cur.execute("SELECT 1 FROM auth WHERE email = %s", (email,))
    if cur.fetchone():
        conflicts["email"] = "Account with inputted email already exists"
    
    cur.execute("SELECT 1 FROM auth WHERE phone = %s", (phone,))
    if cur.fetchone():
        conflicts["phone"] = "Account with inputted phone number already exists"
    
    
    return conflicts




#-------------------------------------------Register-----------------------------------------------------------------------------------------#


@auth_bp.route("/register", methods=["POST"])
def register():

    # data will get POST data from the frontend, and will parse it despite mimetype (force=True)
    # All values that were entered into the form are parsed from json and saved to a variable
    data = request.get_json(force=True)
    username   = data.get("username")
    password   = data.get("password")
    first_name = data.get("firstName")
    last_name  = data.get("lastName")
    email      = data.get("email")
    phone      = data.get("phone")
    

    # if statment checks if all the required fields were entered, returning an error if and HTTP 400 code if fields were not complete
    if not all([username, password, first_name, last_name, email, phone]):
        return jsonify({"error": "Missing required fields"}), 400

    # Initialize conflicts here so that it can return each conflict to the frontend
    conflicts = check_if_account_exists(username,email,phone)
    if conflicts:
        return({"error": list(conflicts.values())})

    pw_hash = generate_password_hash(password)


    # Tries to insert values into auth table, outputs username as a result of DDL 
    try:

        cur.execute(
            """
            INSERT INTO auth (username, password, firstName, lastName, email, phone)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING username
            """,
            (username, pw_hash, first_name, last_name, email, phone),
        )

        # new_user fetches the returned username
        new_user = cur.fetchone()


        # if new_user has no value, return error and HTTP 500
        if not new_user:
            return jsonify({"error": "Insert failed"}), 500

        return jsonify({"message": "Registration successful", "username": new_user[0]}), 201

    
    # If any error occurs while inserting values into DB return an error and print what the error is to the console. 
    # Insert is atomic so no need to tell DB to rollback, it is either all or none
    except pg.Error as e:
        print(f"Database error while registering user: {e}")
        return jsonify({"error": "Database error"}), 500


#-----------------------------------------------------Login/Logout/Debug----------------------------------------------------------------------#

@auth_bp.route("/login", methods=["POST"])
def login():

    
    # data will get POST data from the frontend, and will parse it despite mimetype (force=True)
    # All values that were entered into the form are parsed from json and saved to a variable
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")


    # if statement checks if all the required fields were entered, returning an error if and HTTP 400 code if fields were not complete
    if not all([username, password]):
        return jsonify({"error": "Missing required fields"}), 400


    
    conflicts = check_if_account_exists(username)
    if not conflicts:
        return jsonify({"error": "Account associated with inputted username does not exist."}), 404

    # Fetches hashed password stored in database 
    cur.execute("SELECT password FROM auth WHERE username = %s", (username,))
    row = cur.fetchone()


    # if statement gives pw_hash the 'None' value if there is nothing in the fetched row which prevents it from crashing if there is row has no value at all
    pw_hash = row[0] if row else None


    if not pw_hash or not check_password_hash(pw_hash, password):
        return jsonify({"error": "Incorrect Password"}), 401
    

    # stores username in user session, persists across requests
    session["username"] = username
    return jsonify({"message": "Login Successful!"})


@auth_bp.route("/logout")
def logout():

    # pops username from user session
    session.pop("username", None)
    return jsonify({"message": "Logged out"})


@auth_bp.route("/_debug/count")
def _debug_count():

    # Fetches number of rows (users) in auth and returns the number, for admin use
    cur.execute("SELECT COUNT(*) FROM auth")
    n = cur.fetchone()[0]
    return jsonify({"count": n})
