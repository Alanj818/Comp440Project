import psycopg2 as pg
import os
from dotenv import load_dotenv

load_dotenv()

def connect_db():
    con = pg.connect(
        dbname = os.getenv('DB_NAME'),
        user = os.getenv('DB_USER'),
        password  = os.getenv('DB_PASS'),
        host = os.getenv('DB_HOST')
    )

    return con
