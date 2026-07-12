import time
from google import genai
from config import settings
from services.utils import extract_json
from models import Insight, Drill
from sqlalchemy.orm import Session

client = genai.Client(api_key=settings.GEMINI_API_KEY)

INSIGHTS_PROMPT = """
You are an expert badminton performance analyst.
Analyze this full badminton singles match video.
The player to analyze is on the BOTTOM half of the court.

Return ONLY valid JSON, no explanation, no markdown.

{
  "insights": [
    {
      "tag": <"strength" or "weakness" or "improvement">,
      "description": <string, specific observation>
    }
  ],
  "drills": [
    {
      "priority": <integer, 1 is most important>,
      "name": <string>,
      "description": <string>
    }
  ]
}
"""

def fetch_insights_and_drills(video_file) -> dict:
    print("Fetching insights and drills...")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[video_file, INSIGHTS_PROMPT]
    )
    return extract_json(response.text)

def save_insights(match_id: int, insights: list, db: Session):
    for ins in insights:
        db.add(Insight(
            match_id=match_id,
            tag=ins.get("tag"),
            description=ins.get("description")
        ))
    db.commit()
    print(f"Saved {len(insights)} insights for match {match_id}")

def save_drills(match_id: int, drills: list, db: Session):
    for d in drills:
        db.add(Drill(
            match_id=match_id,
            priority=d.get("priority"),
            name=d.get("name"),
            description=d.get("description")
        ))
    db.commit()
    print(f"Saved {len(drills)} drills for match {match_id}")