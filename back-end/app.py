#---------------------Libraries and packages here---------------------------#


"""
flask -> API framework, importing Flask itself, session to save user token, request to handle HTTP request within the webpage itself

requests -> handles HTTP requests for pages outside the webpage

json -> just in case json needs to be serialized/deserialized

psycopg2 -> Postgres database manipulation library

flask_bcrypt -> bcrypt password hashing for flask
"""

from flask import Flask, session, request
import requests, json
import psycopg2 as pg
from flask_bcrypt import Bcrypt

#----------------------------------------------------------------------------#


from .db_init import connect_db



# Initializing app and bcrypt
app = Flask(__name__)
bcrypt = Bcrypt(app)
db = connect_db()


#----------------------------------------------------------------------------#

@app.route('/')
def home():
  return "Flask backend is running"


# Checks if login is valid 
def valid_login(u, p):
    username = u
    password = p
    # if(bcrypt.check_password_hash(password)):
    return True


@app.route("/signup", methods = ['GET', 'POST'])
def signup():
    if request.method == 'POST':
      return "signup POST recerived"
    return "Signup page"







# Login route, methods determines what HTTP functions that this page will use
@app.route("/login", methods = ['GET', 'POST'])
def login():
    if request.method == 'POST':
      return "Login POST received"
    return "Login page"
   

