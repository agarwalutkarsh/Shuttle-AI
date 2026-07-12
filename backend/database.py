from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "postgresql://postgres:Pl%40net%404757@localhost:5432/badminton_analysis"

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