import time
from datetime import datetime
from sqlalchemy.orm import Session
from models import Match
from database import SessionLocal
from services.utils import get_video_duration, burn_timecodes
from services.upload import upload_video_to_gemini, delete_video_from_gemini
from services.rally_processor import fetch_rallies, save_rallies
from services.summary_processor import fetch_summary, save_summary
from services.insights_processor import fetch_insights_and_drills, save_insights, save_drills
from websocket_manager import manager

def update_status(match: Match, status: str, db: Session):
    match.status = status
    db.commit()
    print(f"Match {match.id} — status: {status}")
    manager.broadcast_sync({
        "type": "MATCH_STATUS",
        "matchId": match.id,
        "status": status
    })

def process_match(match_id: int, db: Session):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        print(f"Match {match_id} not found")
        return

    video_file = None
    
    try:
        # step 1 — burn timecodes
        update_status(match, "timecode_processing", db)
        print(match)
        timecoded_path = match.video_path.replace(".mp4", "_timecoded.mp4")
        burn_timecodes(match.video_path, timecoded_path)
        update_status(match, "timecode_done", db)

        # step 2 — get duration
        duration_seconds = get_video_duration(timecoded_path)
        duration_minutes = duration_seconds / 60
        match.duration_seconds = int(duration_seconds)
        db.commit()

        # step 3 — upload to gemini once
        update_status(match, "gemini_uploading", db)
        video_file = upload_video_to_gemini(timecoded_path)
        update_status(match, "gemini_ready", db)

        # step 4 — rallies
        update_status(match, "rallies_processing", db)
        rallies = fetch_rallies(video_file, duration_minutes)
        save_rallies(match_id, rallies, db)
        update_status(match, "rallies_done", db)

        time.sleep(15)

        # step 5 — summary
        update_status(match, "summary_processing", db)
        summary = fetch_summary(video_file)
        save_summary(match_id, summary, {"match_summary": summary}, db)
        update_status(match, "summary_done", db)

        time.sleep(15)

        # step 6 — insights and drills
        update_status(match, "insights_processing", db)
        insights_data = fetch_insights_and_drills(video_file)
        save_insights(match_id, insights_data.get("insights", []), db)
        save_drills(match_id, insights_data.get("drills", []), db)
        update_status(match, "insights_done", db)

        # step 7 — finished
        match.status = "finished"
        match.processed_at = datetime.utcnow()
        db.commit()
        print(f"Match {match_id} — processing complete")

    except Exception as e:
        match.status = "failed"
        db.commit()
        print(f"Match {match_id} — failed at {match.status}. Error: {str(e)}")

    finally:
        # always delete gemini file whether success or failure
        if video_file:
            delete_video_from_gemini(video_file)

# called by BackgroundTasks — creates its own db session
def run_processor(match_id: int):
    db = SessionLocal()
    try:
        process_match(match_id, db)
    finally:
        db.close()