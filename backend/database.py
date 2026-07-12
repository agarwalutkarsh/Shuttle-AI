from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    print("Database connected")

SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class Base(DeclarativeBase):
    pass
