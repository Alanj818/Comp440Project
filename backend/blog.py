from flask import Blueprint, request, session, jsonify
from db_conn import db_pool
import psycopg2 as pg


#----------------------------------------Blueprint Init--------------------------------------------------------------------#




blog_bp = Blueprint('blog', __name__)


# Creates the blogs and comments tables, does not create them if they already exist in the database
# Gets called at app start up
def create_blog_tables(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blogs(
            blog_id      BIGSERIAL PRIMARY KEY,
            username     VARCHAR(255) NOT NULL REFERENCES auth(username) ON DELETE CASCADE,
            subject      TEXT NOT NULL,
            description  TEXT NOT NULL,
            tags         TEXT[] NOT NULL,
            created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS comments(
            comment_id   BIGSERIAL PRIMARY KEY,
            blog_id      BIGINT NOT NULL REFERENCES blogs(blog_id) ON DELETE CASCADE,
            username     VARCHAR(255) NOT NULL REFERENCES auth(username) ON DELETE CASCADE,
            sentiment    VARCHAR(20) NOT NULL CHECK (sentiment IN ('Positive', 'Negative')),
            description  TEXT NOT NULL,
            created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_blogs_username ON blogs(username);
        CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at);
        CREATE INDEX IF NOT EXISTS idx_blogs_tags ON blogs USING GIN(tags);
        CREATE INDEX IF NOT EXISTS idx_comments_blog_id ON comments(blog_id);
        CREATE INDEX IF NOT EXISTS idx_comments_username ON comments(username);
        CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
    """)




# All parameters are optional
def validate_blog_data(subject: str = None, description: str = None, tags: list = None):
    """
    Validates blog creation data
    Returns dict with any validation errors found
    """
    errors = {}
    
    if subject is not None:
        if not subject or not subject.strip():
            errors["subject"] = "Subject is required"
        elif len(subject) > 200:
            errors["subject"] = "Subject must be less than 200 characters"
    
    if description is not None:
        if not description or not description.strip():
            errors["description"] = "Description is required"
    
    if tags is not None:
        if not tags or len(tags) == 0:
            errors["tags"] = "At least one tag is required"
        elif not any(tag.strip() for tag in tags):
            errors["tags"] = "At least one valid tag is required"
    
    return errors


# All parameters are optional
def validate_comment_data(sentiment: str = None, description: str = None):
    """
    Validates comment data
    Returns dict with any validation errors found
    """
    errors = {}
    
    if sentiment is not None:
        if not sentiment or not sentiment.strip():
            errors["sentiment"] = "Sentiment is required"
        elif sentiment not in ['Positive', 'Negative']:
            errors["sentiment"] = "Sentiment must be either 'Positive' or 'Negative'"
    
    if description is not None:
        if not description or not description.strip():
            errors["description"] = "Comment description is required"
    
    return errors


def check_daily_blog_limit(cursor, username: str):
    """Checks if user has posted 2 blogs today"""
    cursor.execute("""
        SELECT COUNT(*) FROM blogs 
        WHERE username = %s 
        AND DATE(created_at) = CURRENT_DATE
    """, (username,))
    
    count = cursor.fetchone()[0]
    return count >= 2


def check_daily_comment_limit(cursor, username: str):
    """Checks if user has made 3 comments today"""
    cursor.execute("""
        SELECT COUNT(*) FROM comments 
        WHERE username = %s 
        AND DATE(created_at) = CURRENT_DATE
    """, (username,))
    
    count = cursor.fetchone()[0]
    return count >= 3


def check_comment_exists(cursor, username: str, blog_id: int):
    """Checks if user has already commented on this blog"""
    # SELECT 1 is used instead of an actual result (ex: SELECT *) for the query since its faster for this purpose (just finding out if something is there)
    cursor.execute("""
        SELECT 1 FROM comments 
        WHERE username = %s AND blog_id = %s
    """, (username, blog_id))
    
    return cursor.fetchone() is not None


def get_blog_author(cursor, blog_id: int):
    """Gets the author username of a blog"""
    cursor.execute("SELECT username FROM blogs WHERE blog_id = %s", (blog_id,))
    result = cursor.fetchone()
    return result[0] if result else None


def check_if_blog_exists(cursor, blog_id: int):
    """Checks if a blog exists"""
    
    cursor.execute("SELECT 1 FROM blogs WHERE blog_id = %s", (blog_id,))
    return cursor.fetchone() is not None


#-------------------------------------------Create Blog-----------------------------------------------------------------------------------------#


@blog_bp.route('/create', methods=['POST'])
def create_blog():
    conn = None
    
    username = session.get('username')
    if not username:
        return jsonify({"error": "Please log in first before attempting to post"}), 401
    
    # Data will get POST data from the frontend, and will parse it despite mimetype (force=True)
    # All values that were entered into the form are parsed from json and saved to a variable
    data = request.get_json(force=True)
    subject = data.get('subject')
    description = data.get('description')
    tags_input = data.get('tags')
    
    # Process tags - convert comma-separated string or list to array
    if isinstance(tags_input, str):
        tags = [tag.strip() for tag in tags_input.split(',') if tag.strip()]
    elif isinstance(tags_input, list):
        tags = [str(tag).strip() for tag in tags_input if str(tag).strip()]
    else:
        tags = None
    
    # Initialize validation errors here so that it can return each error to the frontend
    validation_errors = validate_blog_data(subject, description, tags)
    if validation_errors:
        return jsonify({"error": list(validation_errors.values())}), 400
    
    try:
        conn = db_pool.getconn()
        conn.autocommit = True
        cur = conn.cursor()
        
        if check_daily_blog_limit(cur, username):
            return jsonify({"error": "You can only post 2 blogs per day"}), 429
        
        # Tries to insert values into blogs table, outputs blog_id and created_at as a result of DDL
        cur.execute("""
            INSERT INTO blogs (username, subject, description, tags)
            VALUES (%s, %s, %s, %s)
            RETURNING blog_id, created_at
        """, (username, subject.strip(), description.strip(), tags))
        
        result = cur.fetchone()
        
        # If result has no value, return error and HTTP 500
        if not result:
            return jsonify({"error": "Failed to create blog"}), 500
        
        blog_id, created_at = result
        
        return jsonify({
            "message": "Blog created successfully",
            "blog_id": blog_id,
            "created_at": created_at.isoformat()
        }), 201
        
    finally:
        if conn:
            db_pool.putconn(conn)


#-----------------------------------------------------Search/View/Comment----------------------------------------------------------------------#

@blog_bp.route('/search', methods=['GET', 'POST'])
def search_blogs():
    conn = None
    
    # Support both GET and POST
    if request.method == 'POST':
        data = request.get_json(force=True)
        tag = data.get('tag', '').strip()
    else:
        tag = request.args.get('tag', '').strip()
    
    if not tag:
        return jsonify({"error": "Tag parameter is required"}), 400
    
    try:
        conn = db_pool.getconn()
        conn.autocommit = True
        cur = conn.cursor()
        
        # Search for blogs containing the tag (case-insensitive)
        cur.execute("""
            SELECT 
                blog_id,
                username,
                subject,
                description,
                tags,
                created_at
            FROM blogs
            WHERE %s = ANY(tags) OR EXISTS (
                SELECT 1 FROM unnest(tags) AS t 
                WHERE LOWER(t) LIKE LOWER(%s)
            )
            ORDER BY created_at DESC
        """, (tag, f'%{tag}%'))
        
        results = cur.fetchall()
        
        blogs = []
        for row in results:
            blogs.append({
                "blog_id": row[0],
                "username": row[1],
                "subject": row[2],
                "description": row[3],
                "tags": row[4],
                "created_at": row[5].isoformat()
            })
        
        return jsonify({
            "tag": tag,
            "count": len(blogs),
            "blogs": blogs
        }), 200
        
    finally:
        if conn:
            db_pool.putconn(conn)


@blog_bp.route('/<int:blog_id>', methods=['GET'])
def get_blog(blog_id):
    conn = None
    
    try:
        conn = db_pool.getconn()
        conn.autocommit = True
        cur = conn.cursor()
        
        if not check_if_blog_exists(cur, blog_id):
            return jsonify({"error": "Blog not found"}), 404
        
        # Fetches blog details
        cur.execute("""
            SELECT 
                blog_id,
                username,
                subject,
                description,
                tags,
                created_at
            FROM blogs
            WHERE blog_id = %s
        """, (blog_id,))
        
        blog_row = cur.fetchone()
        
        if not blog_row:
            return jsonify({"error": "Blog not found"}), 404
        
        # Fetches comments for this blog
        cur.execute("""
            SELECT 
                comment_id,
                username,
                sentiment,
                description,
                created_at
            FROM comments
            WHERE blog_id = %s
            ORDER BY created_at DESC
        """, (blog_id,))
        
        comment_rows = cur.fetchall()
        
        # Format response
        blog = {
            "blog_id": blog_row[0],
            "username": blog_row[1],
            "subject": blog_row[2],
            "description": blog_row[3],
            "tags": blog_row[4],
            "created_at": blog_row[5].isoformat(),
            "comments": []
        }
        
        for comment in comment_rows:
            blog["comments"].append({
                "comment_id": comment[0],
                "username": comment[1],
                "sentiment": comment[2],
                "description": comment[3],
                "created_at": comment[4].isoformat()
            })
        
        return jsonify(blog), 200
        
    finally:
        if conn:
            db_pool.putconn(conn)


@blog_bp.route('/<int:blog_id>/comment', methods=['POST'])
def add_comment(blog_id):
    conn = None
    
    username = session.get('username')
    if not username:
        return jsonify({"error": "Please log in to comment"}), 401
    
    # Data will get POST data from the frontend, and will parse it despite mimetype (force=True)
    data = request.get_json(force=True)
    sentiment = data.get('sentiment')
    description = data.get('description')
    
    # Initialize validation errors here so that it can return each error to the frontend
    validation_errors = validate_comment_data(sentiment, description)
    if validation_errors:
        return jsonify({"error": list(validation_errors.values())}), 400
    
    try:
        conn = db_pool.getconn()
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if blog exists and get author
        blog_author = get_blog_author(cur, blog_id)
        if not blog_author:
            return jsonify({"error": "Blog not found"}), 404
        
        if blog_author == username:
            return jsonify({"error": "You cannot comment on your own blog"}), 403
        
        if check_comment_exists(cur, username, blog_id):
            return jsonify({"error": "You can only comment once per blog"}), 409
        
        if check_daily_comment_limit(cur, username):
            return jsonify({"error": "You can only make 3 comments per day"}), 429
        
        # Tries to insert values into comments table, outputs comment_id and created_at as a result of DDL
        cur.execute("""
            INSERT INTO comments (blog_id, username, sentiment, description)
            VALUES (%s, %s, %s, %s)
            RETURNING comment_id, created_at
        """, (blog_id, username, sentiment.strip(), description.strip()))
        
        result = cur.fetchone()
        
        # If result has no value, return error and HTTP 500
        if not result:
            return jsonify({"error": "Failed to create comment"}), 500
        
        comment_id, created_at = result
        
        return jsonify({
            "message": "Comment added successfully",
            "comment_id": comment_id,
            "created_at": created_at.isoformat()
        }), 201
        
    finally:
        if conn:
            db_pool.putconn(conn)


@blog_bp.route('/my-blogs', methods=['GET'])
def get_my_blogs():
    conn = None
    
    username = session.get('username')
    if not username:
        return jsonify({"error": "Please log in first"}), 401
    
    try:
        conn = db_pool.getconn()
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                blog_id,
                subject,
                description,
                tags,
                created_at
            FROM blogs
            WHERE username = %s
            ORDER BY created_at DESC
        """, (username,))
        
        results = cur.fetchall()
        
        blogs = []
        for row in results:
            blogs.append({
                "blog_id": row[0],
                "subject": row[1],
                "description": row[2],
                "tags": row[3],
                "created_at": row[4].isoformat()
            })
        
        return jsonify({"blogs": blogs}), 200
        
    finally:
        if conn:
            db_pool.putconn(conn)


@blog_bp.route('/recent', methods=['GET'])
def get_recent_blogs():
    conn = None
    
    limit = request.args.get('limit', 10, type=int)
    limit = min(limit, 50)
    
    try:
        conn = db_pool.getconn()
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                blog_id,
                username,
                subject,
                description,
                tags,
                created_at
            FROM blogs
            ORDER BY created_at DESC
            LIMIT %s
        """, (limit,))
        
        results = cur.fetchall()
        
        blogs = []
        for row in results:
            blogs.append({
                "blog_id": row[0],
                "username": row[1],
                "subject": row[2],
                "description": row[3],
                "tags": row[4],
                "created_at": row[5].isoformat()
            })
        
        return jsonify({"blogs": blogs}), 200
        
    finally:
        if conn:
            db_pool.putconn(conn)


@blog_bp.route('/_debug/stats', methods=['GET'])
def _debug_stats():
    conn = None
    
    try:
        conn = db_pool.getconn()
        conn.autocommit = True
        cur = conn.cursor()
        
        # Fetches number of blogs and comments, for admin use
        cur.execute("SELECT COUNT(*) FROM blogs")
        total_blogs = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM comments")
        total_comments = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM blogs WHERE DATE(created_at) = CURRENT_DATE")
        blogs_today = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM comments WHERE DATE(created_at) = CURRENT_DATE")
        comments_today = cur.fetchone()[0]
        
        return jsonify({
            "total_blogs": total_blogs,
            "total_comments": total_comments,
            "blogs_today": blogs_today,
            "comments_today": comments_today
        }), 200
        
    finally:
        if conn:
            db_pool.putconn(conn)