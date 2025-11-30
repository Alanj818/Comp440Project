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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS follows(
        follower_username VARCHAR(255) NOT NULL REFERENCES auth(username) ON DELETE CASCADE,
        followed_username VARCHAR(255) NOT NULL REFERENCES auth(username) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_username, followed_username)
        );
    """)





#---------------------------------------------------------Helper Functions---------------------------------------------------------------#

def validate_blog_data(subject, description, tags):
    """
    Validates blog creation data
    Returns dict with any validation errors found
    """
    errors = {}
    
    if subject is not None:
        if not subject or not subject.strip():
            errors["subject"] = "Subject is required"
    if description is not None:
        if not description or not description.strip():
            errors["description"] = "Description is required"
    
    if tags is not None:
        if not tags or len(tags) == 0:
            errors["tags"] = "At least one tag is required"
        elif not any(tag.strip() for tag in tags):
            errors["tags"] = "At least one valid tag is required"
    
    return errors


def validate_comment_data(sentiment, description):
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


def check_daily_blog_limit(cursor, username):
    """Checks if user has posted 2 blogs today"""
    cursor.execute("""
        SELECT COUNT(*) FROM blogs 
        WHERE username = %s 
        AND DATE(created_at) = CURRENT_DATE
    """, (username,))
    
    count = cursor.fetchone()[0]
    return count >= 2


def check_daily_comment_limit(cursor, username):
    """Checks if user has made 3 comments today"""
    cursor.execute("""
        SELECT COUNT(*) FROM comments 
        WHERE username = %s 
        AND DATE(created_at) = CURRENT_DATE
    """, (username,))
    
    count = cursor.fetchone()[0]
    return count >= 3


def check_comment_exists(cursor, username, blog_id):
    """Checks if user has already commented on this blog"""
    # SELECT 1 is used instead of an actual result (ex: SELECT *) for the query since its faster for this purpose (just finding out if something is there)
    cursor.execute("""
        SELECT 1 FROM comments 
        WHERE username = %s AND blog_id = %s
    """, (username, blog_id))
    
    return cursor.fetchone() is not None


def get_blog_author(cursor, blog_id):
    """Gets the author username of a blog"""
    cursor.execute("SELECT username FROM blogs WHERE blog_id = %s", (blog_id,))
    result = cursor.fetchone()
    return result[0] if result else None


def check_if_blog_exists(cursor, blog_id):
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

#-----------------------------------------------------Phase 3----------------------------------------------------------------------#

@blog_bp.route("/query1", methods=["POST"])
def query1_same_day_tags():
    """
    Phase 3 - Query 1:
    List users who posted at least two different blogs on the same day,
    one with tagA and one with tagB.
    """
    data = request.get_json(silent=True) or {}

    tag_a = data.get("tagA")
    tag_b = data.get("tagB")

    # Basic validation
    if not tag_a or not tag_b:
        return jsonify({"error": "Both tagA and tagB are required"}), 400

    conn = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()

        sql = """
            SELECT DISTINCT a.username, a.firstname, a.lastname
            FROM blogs b1
            JOIN blogs b2
              ON b1.username = b2.username
             AND b1.blog_id <> b2.blog_id
             AND DATE(b1.created_at) = DATE(b2.created_at)
            JOIN auth a
              ON a.username = b1.username
            WHERE %s = ANY (b1.tags)
              AND %s = ANY (b2.tags);
        """

        cur.execute(sql, (tag_a, tag_b))
        rows = cur.fetchall()

        users = [
            {
                "username": row[0],
                "firstname": row[1],
                "lastname": row[2],
            }
            for row in rows
        ]

        return jsonify({"users": users}), 200

    except Exception as e:
        print("[QUERY1] Error:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            db_pool.putconn(conn)


@blog_bp.route("/query2", methods=["GET"])
def query2_most_blogs_on_date():
    """
    Phase 3 - Query 2:
    List the users who posted the most number of blogs on a specific date.
    If there's a tie, list all tied users.

    Date can be provided as a query parameter ?date=YYYY-MM-DD.
    If not provided, a default hard-coded date is used.
    """
    # Default date
    default_date = "2025-10-10"

    # Optional override from UI: /api/blog/query2?date=2025-11-09
    target_date = request.args.get("date", default_date)

    conn = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()

        sql = """
            WITH counts AS (
                SELECT 
                    username,
                    COUNT(*) AS blog_count
                FROM blogs
                WHERE DATE(created_at) = %s
                GROUP BY username
            ),
            max_count AS (
                SELECT MAX(blog_count) AS max_blog_count
                FROM counts
            )
            SELECT 
                a.username,
                a.firstname,
                a.lastname,
                c.blog_count
            FROM counts c
            JOIN max_count m
              ON c.blog_count = m.max_blog_count
            JOIN auth a
              ON a.username = c.username;
        """

        cur.execute(sql, (target_date,))
        rows = cur.fetchall()

        users = [
            {
                "username": row[0],
                "firstname": row[1],
                "lastname": row[2],
                "blog_count": row[3],
                "date": target_date,
            }
            for row in rows
        ]

        return jsonify({"users": users, "date": target_date}), 200

    except Exception as e:
        print("[QUERY2] Error:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            db_pool.putconn(conn)


@blog_bp.route("/query3", methods=["POST"])
def query3_followed_by_both():
    """
    Phase 3 - Query 3:
    List the users who are followed by both users X and Y.
    X and Y are provided in the request body.
    """
    data = request.get_json(silent=True) or {}

    user_x = data.get("userX")
    user_y = data.get("userY")

    if not user_x or not user_y:
        return jsonify({"error": "Both userX and userY are required"}), 400

    if user_x == user_y:
        return jsonify({"error": "userX and userY must be different users"}), 400

    conn = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()

        sql = """
            WITH common_followed AS (
                SELECT 
                    followed_username
                FROM follows
                WHERE follower_username IN (%s, %s)
                GROUP BY followed_username
                HAVING COUNT(DISTINCT follower_username) = 2
            )
            SELECT 
                a.username,
                a.firstname,
                a.lastname
            FROM common_followed cf
            JOIN auth a
              ON a.username = cf.followed_username;
        """

        cur.execute(sql, (user_x, user_y))
        rows = cur.fetchall()

        users = [
            {
                "username": row[0],
                "firstname": row[1],
                "lastname": row[2],
            }
            for row in rows
        ]

        return jsonify({"users": users, "userX": user_x, "userY": user_y}), 200

    except Exception as e:
        print("[QUERY3] Error:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            db_pool.putconn(conn)

@blog_bp.route("/query4", methods=["GET"])
def query4_users_never_posted():
    """
    Phase 3 - Query 4:
    Display all the users who never posted a blog.
    """
    conn = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()

        sql = """
            SELECT 
                a.username,
                a.firstname,
                a.lastname
            FROM auth a
            LEFT JOIN blogs b
              ON b.username = a.username
            WHERE b.blog_id IS NULL;
        """

        cur.execute(sql)
        rows = cur.fetchall()

        users = [
            {
                "username": row[0],
                "firstname": row[1],
                "lastname": row[2],
            }
            for row in rows
        ]

        return jsonify({"users": users}), 200

    except Exception as e:
        print("[QUERY4] Error:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            db_pool.putconn(conn)

@blog_bp.route("/query5", methods=["POST"])
def query5_user_blogs_all_positive():
    """
    Phase 3 - Query 5:
    List all the blogs of user X such that:
      - The blog has at least one comment
      - All comments are Positive
      - There are Nno Negative comments
    User X is provided in the request body as 'username'.
    """
    data = request.get_json(silent=True) or {}
    username = data.get("username")

    if not username:
        return jsonify({"error": "username is required"}), 400

    conn = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()

        sql = """
            SELECT 
                b.blog_id,
                b.username,
                b.subject,
                b.description,
                b.tags,
                b.created_at
            FROM blogs b
            WHERE b.username = %s
              -- must have at least one comment
              AND EXISTS (
                  SELECT 1
                  FROM comments c
                  WHERE c.blog_id = b.blog_id
              )
              -- must NOT have any negative comments
              AND NOT EXISTS (
                  SELECT 1
                  FROM comments c2
                  WHERE c2.blog_id = b.blog_id
                    AND c2.sentiment = 'Negative'
              );
        """

        cur.execute(sql, (username,))
        rows = cur.fetchall()

        blogs = [
            {
                "blog_id": row[0],
                "username": row[1],
                "subject": row[2],
                "description": row[3],
                "tags": row[4],
                "created_at": row[5].isoformat(),
            }
            for row in rows
        ]

        return jsonify({"username": username, "blogs": blogs}), 200

    except Exception as e:
        print("[QUERY5] Error:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            db_pool.putconn(conn)

@blog_bp.route("/query6", methods=["GET"])
def query6_users_only_negative_comments():
    """
    Phase 3 - Query 6:
    Display all the users who posted some comments,
    but each of them is Negative.
    """
    conn = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()

        sql = """
            WITH negative_only AS (
                SELECT 
                    c.username
                FROM comments c
                GROUP BY c.username
                HAVING 
                    COUNT(*) > 0
                    AND SUM(CASE WHEN c.sentiment = 'Positive' THEN 1 ELSE 0 END) = 0
            )
            SELECT 
                a.username,
                a.firstname,
                a.lastname
            FROM negative_only n
            JOIN auth a
              ON a.username = n.username;
        """

        cur.execute(sql)
        rows = cur.fetchall()

        users = [
            {
                "username": row[0],
                "firstname": row[1],
                "lastname": row[2],
            }
            for row in rows
        ]

        return jsonify({"users": users}), 200

    except Exception as e:
        print("[QUERY6] Error:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            db_pool.putconn(conn)

@blog_bp.route("/query7", methods=["GET"])
def query7_users_no_negative_on_blogs():
    """
    Phase 3 - Query 7:
    Display users who have posted some blogs, and none of their blogs
    have ever received a Negative comment.
    Blogs may have only Positive comments or no comments at all.
    """
    conn = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()

        sql = """
            WITH user_blogs AS (
                SELECT 
                    b.username,
                    COUNT(DISTINCT b.blog_id) AS blog_count,
                    SUM(
                        CASE 
                            WHEN c.sentiment = 'Negative' THEN 1 
                            ELSE 0 
                        END
                    ) AS neg_count
                FROM blogs b
                LEFT JOIN comments c
                  ON c.blog_id = b.blog_id
                GROUP BY b.username
            )
            SELECT 
                a.username,
                a.firstname,
                a.lastname
            FROM user_blogs ub
            JOIN auth a
              ON a.username = ub.username
            WHERE ub.blog_count > 0
              AND ub.neg_count = 0;
        """

        cur.execute(sql)
        rows = cur.fetchall()

        users = [
            {
                "username": row[0],
                "firstname": row[1],
                "lastname": row[2],
            }
            for row in rows
        ]

        return jsonify({"users": users}), 200

    except Exception as e:
        print("[QUERY7] Error:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            db_pool.putconn(conn)


