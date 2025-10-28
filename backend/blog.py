from flask import Blueprint, redirect, request, session, url_for, jsonify
from db_conn import db_pool


blog_bp = Blueprint('blog', __name__)

conn = db_pool
cur = conn.cursor()

def create_blog_table():
    cur.execute("""
        CREATE TABLE IF NOT EXISTS blog(
                blog_id BIGSERIAL PRIMARY KEY,
                username varchar(255) FOREIGN KEY REFERENCES auth(username),
                subject text NOT NULL UNIQUE,
                description text NOT NULL,
                tags text[] NOT NULL,
                datetime TIMESTAMP WITH TIMEZONE NOT NULL
                )

                """)

@blog_bp.route('/create-post', methods = ['POST'])
def create_blog_post():
    if not session['username']:
        return jsonify({"error": "Please log in first before attempting to post"})
    

