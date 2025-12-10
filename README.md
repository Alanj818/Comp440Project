# COMP 440 Database Project

## Tools

React + Flask + Postgres (Railway), and Docker Compose for building and deploying dev/production containers.

## Contributions

Everyone did their fair share 33% each.

## Phase 1 Youtube Video

https://www.youtube.com/watch?v=93qupBR9rTs

## Phase 2 Youtube Video

https://www.youtube.com/watch?v=GGCI3f_TxmY

## How to Run

Requirements:

Frontend
    Python 3.10+

    pip

    Virtual environment (optional but recommended)

Backend
    Node.js 18+

    npm


Running the backend(Python):
    1. cd backend
    2. (windows) python -m venv venv venv\Scripts\activate
    3. pip install -r requirements.txt
    4. Ensure .env exists inside /backend example:
        DB_HOST=...
        DB_NAME=...
        DB_USER=...
        DB_PASSWORD=...
        SECRET_KEY=...
    5. python app.py

Running the frontend(React):
    1. cd frontend
    2. npm install
    3. make sure frontend .env contains:
        REACT_APP_API_URL=http://localhost:5000
    4. npm run start
    5. http://localhost:3000      :   This is where the react app runs



