import math
import time
from google import genai
from config import settings
from services.utils import extract_json
from models import Rally
from sqlalchemy.orm import Session

client = genai.Client(api_key=settings.GEMINI_API_KEY)

RALLY_PROMPT = """
You are an expert badminton performance analyst.
Analyze the attached badminton match.

CRITICAL IDENTITY RULE:
- "player" = player on bottom side of court
- "opponent" = player on top side
If players switch ends, always redefine player as nearest the camera.

Return ONLY valid JSON, no explanation, no markdown.

{
  "rallies": [
    {
      "rally_number": 1,
      "start_timestamp_seconds": 0.0,
      "end_timestamp_seconds": 0.0,
      "shot_count": 0,
      "server": "player",
      "winner": "player",
      "rally_type": "short"
    }
  ]
}
"""

def fetch_rallies(video_file, duration_minutes: float) -> list:
    chunk_size_minutes = 7.0
    total_chunks = math.ceil(duration_minutes / chunk_size_minutes)
    all_rallies = []

    for i in range(total_chunks):
        start_min = i * chunk_size_minutes
        end_min = min((i + 1) * chunk_size_minutes, duration_minutes)

        print(f"Rally chunk {i+1}/{total_chunks} ({start_min:.1f} to {end_min:.1f} min)")

        prompt = f"""
{RALLY_PROMPT}

Analyze ONLY the portion between {start_min:.1f} and {end_min:.1f} minutes.
Continue rally numbering from previous chunk.
Return ONLY JSON.
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[video_file, prompt]
        )

        try:
            chunk = extract_json(response.text)
            rallies = chunk.get("rallies", [])
            all_rallies.extend(rallies)
            print(f"  {len(rallies)} rallies detected")
        except Exception as e:
            print(f"  Chunk {i+1} parse failed: {e}")
            print(f"  Raw: {response.text[:200]}")

        if i < total_chunks - 1:
            time.sleep(15)

    return all_rallies

def save_rallies(match_id: int, rallies: list, db: Session):
    for r in rallies:
        db.add(Rally(
            match_id=match_id,
            rally_number=r.get("rally_number"),
            start_timestamp_seconds=r.get("start_timestamp_seconds"),
            end_timestamp_seconds=r.get("end_timestamp_seconds"),
            shot_count=r.get("shot_count"),
            server=r.get("server"),
            winner=r.get("winner"),
            rally_type=r.get("rally_type")
        ))
    db.commit()
    print(f"Saved {len(rallies)} rallies for match {match_id}")