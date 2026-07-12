from sqlalchemy import Integer, Column, String, Boolean, ForeignKey, DateTime, Date, Text, Table, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    matches = relationship("Match", back_populates="player")

class Match(Base):
    __tablename__ = "matches"
    id= Column(Integer, primary_key=True, index=True)
    player_id= Column(Integer, ForeignKey("players.id"), nullable=False)
    opponent = Column(String, nullable=True)
    match_date = Column(Date, nullable=True)
    match_type = Column(String, nullable=False, default="singles")
    status = Column(String, nullable=False)
    video_path=Column(String, nullable=False)
    duration_seconds=Column(Integer, nullable=True)
    created_at=Column(DateTime, server_default=func.now(), nullable=False)
    processed_at=Column(DateTime, nullable=True)

    player = relationship("Player", back_populates="matches")
    match_summary = relationship("MatchSummary", back_populates="match", uselist=False)
    rallies= relationship("Rally", back_populates="match")
    insights= relationship("Insight", back_populates="match")
    drills= relationship("Drill", back_populates="match")

class MatchSummary(Base):
    __tablename__ = "match_summary"
    id=Column(Integer, primary_key=True, index=True)
    match_id=Column(Integer, ForeignKey("matches.id"), nullable=False)
    overall_score=Column(Integer, nullable=True)
    total_rallies=Column(Integer, nullable=True)
    shot_accuracy_percent=Column(Integer, nullable=True)
    court_coverage_percent=Column(Integer, nullable=True)
    match_duration_seconds=Column(Integer, nullable=True)
    dominant_shot=Column(String, nullable=True)
    raw_ai_response = Column(Text, nullable=True)

    match= relationship("Match", back_populates='match_summary')

class Rally(Base):
    __tablename__ = "rallies"
    id=Column(Integer, primary_key=True, index=True)
    match_id=Column(Integer, ForeignKey("matches.id"), nullable=False)
    rally_number=Column(Integer, nullable=False)
    start_timestamp_seconds=Column(Float, nullable=True)
    end_timestamp_seconds=Column(Float, nullable=True)
    shot_count=Column(Integer, nullable=True)
    server=Column(String, nullable=True)
    winner=Column(String, nullable=True)
    rally_type=Column(String, nullable=True)
    raw_ai_response = Column(Text, nullable=True)

    match=relationship("Match", back_populates="rallies")

class Insight(Base):
    __tablename__ = "insights"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    tag = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    match = relationship("Match", back_populates="insights")

class Drill(Base):
    __tablename__ = "drills"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    priority = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    match = relationship("Match", back_populates="drills")