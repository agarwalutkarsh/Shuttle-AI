from fastapi import APIRouter, HTTPException, FastAPI, Depends, status
from models import Player
from sqlalchemy.orm import Session, joinedload
from schema import PlayerCreate, PlayerResponse
from database import get_db
from typing import List

router = APIRouter(
    prefix="/players",
    tags=["players"]
)

@router.post("/")
def create_player(player: PlayerCreate, db:Session=Depends(get_db)):
    player_obj = Player(**player.model_dump())
    existing = db.query(Player).filter(Player.name == player_obj.name).first()
    if (existing):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail = f"Player Already Exists")
    db.add(player_obj)
    db.commit()
    db.refresh(player_obj)
    return {"message" : "Player Created Successfully", "player":player_obj}

@router.get("/")
def get_all_players(db: Session=Depends(get_db)):
    all_players = db.query(Player).all()

    if not all_players:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = f"players not found")
    return all_players

@router.get("/{id}", response_model=PlayerResponse)
def get_player(id:int, db: Session=Depends(get_db)):
    player = db.query(Player).filter(Player.id == id).first()
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    return player