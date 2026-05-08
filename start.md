# 1. Start Postgres + Redis
docker compose up -d db redis

# 2. Setup Python env
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 3. Run migrations
alembic revision --autogenerate -m "initial"
alembic upgrade head

# 4. Start server
uvicorn app.main:app --reload --port 8000
