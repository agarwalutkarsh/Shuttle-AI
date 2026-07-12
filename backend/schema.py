from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, date

class PlayerCreate(BaseModel): 
    name: str
    created_at: datetime


class MatchCreate(BaseModel): 
    player_id: int
    opponent : Optional[str] = None
    match_date : Optional[date] = None
    match_type : str = "singles"
    # status = str
    # video_path=str
    # duration_seconds=int
    # created_at=datetime
    # processed_at=datetime

class MatchSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    match_id: int
    overall_score: Optional[int]
    total_rallies: Optional[int]
    shot_accuracy_percent: Optional[int]
    court_coverage_percent: Optional[int]
    match_duration_seconds: Optional[int]
    dominant_shot: Optional[str]
    raw_ai_response : Optional[str]

class InsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    match_id: int
    tag: str
    description: str

class RallyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    match_id: int
    rally_number: int
    start_timestamp_seconds: Optional[float]
    end_timestamp_seconds: Optional[float]
    shot_count: Optional[int]
    server: Optional[str]
    winner: Optional[str]
    rally_type: Optional[str]

class DrillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    match_id: int
    priority: int
    name: str
    description: str

class MatchResponse(BaseModel): 
    model_config = ConfigDict(from_attributes=True)


    id: int
    player_id: int
    opponent : Optional[str]
    match_date : Optional[date]
    match_type : str
    status : str
    video_path:Optional[str]
    duration_seconds:Optional[int]
    created_at:datetime
    processed_at:Optional[datetime]
    match_summary:Optional[MatchSummaryResponse] = None
    rallies:List[RallyResponse] = []
    drills:List[DrillResponse] = []
    insights:List[InsightResponse] = []


class PlayerResponse(BaseModel):
    model_config=ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    matches: List[MatchResponse] = []

class MatchReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    match: MatchResponse
    summary: Optional[MatchSummaryResponse] = None
    rallies: List[RallyResponse] = []
    insights: List[InsightResponse] = []
    drills: List[DrillResponse] = []