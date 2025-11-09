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

    from auth import auth_bp, create_auth_table  
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from blog import blog_bp, create_blog_tables
    app.register_blueprint(blog_bp, url_prefix="/api/blog")

    from db_conn import db_pool
    
    conn = None
    try:
        # Get fresh connection from pool for table creation
        conn = db_pool.getconn()
        conn.autocommit = True
        cur = conn.cursor()
        
        # Create auth table
        create_auth_table(cur)
        
        # Create blog tables (blogs, comments)
        create_blog_tables(cur)
        
        print("[APP] All tables created successfully")
        
    except Exception as e:
        print(f"[APP] Error creating tables: {e}")
        
    finally:
        # Always return connection to pool
        if conn:
            db_pool.putconn(conn)

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)