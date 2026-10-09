import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Automatically use Supabase URL from environment variables, fallback to local SQLite for testing
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./timetable.db")

# SQLite needs check_same_thread=False; PostgreSQL does not use this
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to safely open/close database sessions in our API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()