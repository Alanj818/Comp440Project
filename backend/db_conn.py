import psycopg2 as pg
from psycopg2 import pool
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# Using a pool to keep connection open and handle concurrent connections, also reuses existing connections.
db_pool = pool.ThreadedConnectionPool(
        minconn= 1,
        maxconn= 10,
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        sslmode=os.getenv("DB_SSLMODE", "require")
    )
