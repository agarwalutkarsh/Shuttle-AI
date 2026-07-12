from fastapi import APIRouter, HTTPException, Depends, status, Form, File, UploadFile, BackgroundTasks
from models import Match, Player
from schema import MatchCreate, MatchResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
from datetime import datetime, date
import os
import shutil
from services.orchestrator import run_processor

router = APIRouter(
    prefix="/match",
    tags=['match']
)

STORAGE_DIR = "storage/videos"

@router.post("/", response_model=MatchResponse)
def create_match(
    background_tasks: BackgroundTasks,
    player_id: int = Form(...),
    opponent: Optional[str] = Form(None),
    match_date: Optional[date] = Form(None),
    match_type: str = Form("singles"),
    video: UploadFile = File(...),
    db: Session=Depends(get_db)
    ):
    # match_obj = Match(**match.model_dump())
    # print(match)
    # print(match_obj.match_type)

    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    allowed_types = ["video/mp4", "video/quicktime", "video/x-msvideo"]
    if video.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only video files are allowed")
    
    os.makedirs(STORAGE_DIR, exist_ok=True)
    
    
    temp_filename = f"temp_{video.filename}"
    temp_path = os.path.join(STORAGE_DIR, temp_filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    new_match = Match(
        player_id=player_id,
        opponent=opponent,
        match_date=match_date,
        match_type=match_type,
        status="uploaded",
        video_path=temp_path
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)

            # save video file using match id in filename
    file_extension = os.path.splitext(video.filename)[1]
    filename = f"match_{new_match.id}{file_extension}"
    file_path = os.path.join(STORAGE_DIR, filename).replace("\\", "/")

    os.rename(temp_path, file_path)
    new_match.video_path = file_path
    db.commit()
    db.refresh(new_match)

    background_tasks.add_task(run_processor, match_id=new_match.id)
    
    return new_match

@router.get("/", response_model=List[MatchResponse])
def get_all_matches(db: Session=Depends(get_db)):
    all_matches = db.query(Match).all()
    if not all_matches:
        raise HTTPException(status_code=404, detail="No Matches found")
    return all_matches


@router.delete("/{id}")
def delete_match(id:int, db:Session=Depends(get_db)):
    match = db.query(Match).filter(id == Match.id).first()
    if not match:
        raise HTTPException(status_code=404)
    db.delete(match)
    db.commit()
    return f"Deleted Successfully with match id {id}"


@router.get("/{id}", response_model=MatchResponse)
def get_match_by_id(id:int, db:Session=Depends(get_db)):
    match = db.query(Match).options(
        joinedload(Match.match_summary),
        joinedload(Match.rallies),
        joinedload(Match.insights),
        joinedload(Match.drills)
    ).filter(Match.id == id).first()
    if not match:
        raise HTTPException(status_code=404)
    return match


@router.get("/player/{player_id}")
def get_matches_by_player_id(player_id:int, db:Session=Depends(get_db)):
    matches = db.query(Match).options(
        joinedload(Match.match_summary),
        joinedload(Match.rallies),
        joinedload(Match.insights),
        joinedload(Match.drills)
    ).filter(Match.player_id == player_id).all()
    if not matches:
        raise HTTPException(status_code=404, detail="No matches found for this player")
    return matches