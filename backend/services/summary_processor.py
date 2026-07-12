import json
from google import genai
from config import settings
from services.utils import extract_json
from models import MatchSummary
from sqlalchemy.orm import Session

client = genai.Client(api_key=settings.GEMINI_API_KEY)

SUMMARY_PROMPT = """
You are an expert badminton performance analyst.
Analyze this full badminton singles match video.
The player to analyze is on the BOTTOM half of the court.

Return ONLY valid JSON, no explanation, no markdown.

{
  "match_summary": {
    "overall_score": <integer 0-100>,
    "total_rallies": <integer>,
    "shot_accuracy_percent": <integer>,
    "court_coverage_percent": <integer>,
    "dominant_shot": <string>,
    "match_duration_seconds": <integer>
  }
}
"""

def fetch_summary(video_file) -> dict:
    print("Fetching match summary...")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[video_file, SUMMARY_PROMPT]
    )
    data = extract_json(response.text)
    return data.get("match_summary", {})

def save_summary(match_id: int, summary: dict, raw: dict, db: Session):
    match_summary = MatchSummary(
        match_id=match_id,
        overall_score=summary.get("overall_score"),
        total_rallies=summary.get("total_rallies"),
        shot_accuracy_percent=summary.get("shot_accuracy_percent"),
        court_coverage_percent=summary.get("court_coverage_percent"),
        match_duration_seconds=summary.get("match_duration_seconds"),
        dominant_shot=summary.get("dominant_shot"),
        raw_ai_response=json.dumps(raw)
    )
    db.add(match_summary)
    db.commit()
    print(f"Saved summary for match {match_id}")