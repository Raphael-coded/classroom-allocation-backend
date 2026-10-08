from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# We will store everything in a local file named timetable.db
DATABASE_URL = "sqlite:///./timetable.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to safely open/close database sessions in our API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()