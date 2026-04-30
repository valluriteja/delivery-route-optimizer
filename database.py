from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/delivery_optimizer"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class OrderDB(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True)
    customer_name = Column(String)
    pickup_location = Column(String)
    delivery_location = Column(String)
    status = Column(String, default="pending")
    assigned_agent_id = Column(String, nullable=True)
    created_at = Column(String, default=lambda: datetime.now().isoformat())
    delivered_at = Column(String, nullable=True)

class AgentDB(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True)
    name = Column(String)
    current_location = Column(String)
    status = Column(String, default="idle")
    total_deliveries = Column(Integer, default=0)
    last_updated = Column(String, default=lambda: datetime.now().isoformat())

def init_db():
    """Create all tables"""
    Base.metadata.create_all(engine)
    print("✅ Database tables created!")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    init_db()