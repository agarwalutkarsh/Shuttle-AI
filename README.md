ShuttleAI — Technical Documentation
An AI-powered badminton performance analysis system that extracts structured performance metrics from raw match video using multimodal LLMs — without custom computer vision models or labeled training data.

Table of Contents
Project Overview

Tech Stack

System Architecture

Database Schema

API Reference

AI Pipeline

Processing Status System

Known Limitations

Performance Benchmarks

Running Locally

Future Improvements

1. Project Overview
ShuttleAI is a full-stack sports analytics application that allows badminton players to upload match recordings and receive structured AI-generated performance reports.

The core problem it solves: amateur badminton players have no access to the kind of performance analytics that professional players get from dedicated coaching staff. Video analysis tools that exist are either expensive, require manual tagging, or need custom-trained computer vision models with labeled datasets.

ShuttleAI bypasses all of this by using Gemini's native video understanding capability — sending raw match video directly to the model and extracting structured JSON data through carefully designed prompts.

What a report contains
Overall performance score (0–100)

Rally-level data — start/end timestamps, shot count, server, winner, rally type

Serve effectiveness vs receive effectiveness

Win rate by rally length (short / medium / long)

AI-generated insights tagged as strength / weakness / improvement

Prioritised drill recommendations based on identified weaknesses

Scope — v1
Singles matches only

Single player analysis per match (bottom-half of court)

Local video file upload (mp4, mov, avi)

No authentication — single-user deployment

2. Tech Stack
Layer	Technology
Frontend	Next.js 14 (App Router), Tailwind CSS
Backend	FastAPI (Python)
Database	PostgreSQL
ORM	SQLAlchemy
AI Model	Google Gemini 2.5 Flash
AI SDK	google-genai (Python)
Video Processing	FFmpeg via imageio-ffmpeg
Background Tasks	FastAPI BackgroundTasks
Real-time updates	WebSockets (FastAPI native)
Schema Validation	Pydantic v2
3. System Architecture
High-level flow
text
User
  ↓ uploads video + player info
Next.js Frontend
  ↓ POST /api/matches (multipart/form-data)
FastAPI Backend
  ↓ saves video to /storage/videos/
  ↓ creates Player + Match rows → status: uploaded
  ↓ triggers BackgroundTask
  ↓ returns match record immediately (non-blocking)

Background Worker (async, same process)
  ↓ burns timecodes via FFmpeg → status: timecode_processing
  ↓ broadcasts status via WebSocket
  ↓ detects video duration
  ↓ uploads timecoded video to Gemini File API → status: gemini_uploading
  ↓ broadcasts status via WebSocket
  ↓ fetches rally data (chunked) → status: rallies_processing
  ↓ broadcasts status via WebSocket
  ↓ fetches match summary → status: summary_processing
  ↓ broadcasts status via WebSocket
  ↓ fetches insights + drills → status: insights_processing
  ↓ broadcasts status via WebSocket
  ↓ serialises JSON → saves to PostgreSQL tables
  ↓ status: finished (or failed)
  ↓ broadcasts final status via WebSocket
  ↓ deletes Gemini file

Frontend (single global WebSocket open on app mount → ws://localhost:8000/ws)
  ↓ receives broadcast — filters by message.type === "MATCH_STATUS" and message.matchId
  ↓ updates matching match in local state — no re-fetch needed
  ↓ on status: finished → navigates to /matches/:id/report
  ↓ on page refresh → GET /api/matches to restore current state, WebSocket reconnects automatically
Service modules
text
backend/
├── main.py                      entry point, router registration, table creation
├── database.py                  SQLAlchemy engine, SessionLocal, Base
├── models.py                    ORM models for all tables
├── schemas.py                   Pydantic request/response schemas
├── config.py                    environment variable loading
├── routers/
│   ├── players.py               CRUD endpoints for players
│   └── matches.py               match upload, fetch, delete, status
└── services/
    ├── orchestrator.py          coordinates full processing pipeline
    ├── upload.py                Gemini file upload and deletion
    ├── rally_processor.py       rally fetching and DB saving
    ├── summary_processor.py     match summary fetching and DB saving
    ├── insights_processor.py    insights and drills fetching and DB saving
    └── utils.py                 shared helpers — FFmpeg, JSON extraction
Why BackgroundTasks over Celery
FastAPI's built-in BackgroundTasks runs async functions after the HTTP response is sent, within the same process. For a single-user deployment this is sufficient and requires no additional infrastructure (no Redis, no worker processes).

The tradeoff: if the server restarts mid-processing, the task is lost. For v1 this is acceptable — the match status remains at the last completed step and a retry endpoint can re-trigger processing from scratch.

A migration to Celery + Redis would be required for multi-user production deployments where task durability and queue management matter.

Concurrent match processing
Multiple matches can be uploaded while a previous match is still processing. Each upload triggers an independent BackgroundTask with its own database session. Tasks run concurrently and do not interfere with each other.

The practical constraint on the free API tier is Gemini rate limits — two concurrent tasks making Gemini calls simultaneously will exhaust the 5 RPM quota faster and trigger 429 errors. For personal single-user use this is rarely an issue since matches are unlikely to be uploaded simultaneously.

WebSocket real-time status broadcast
Each status transition in the orchestrator broadcasts a message to all connected WebSocket clients using the broadcast manager. This eliminates the need for frontend polling.

The WebSocket endpoint is global and connection is established once on app mount:

text
WS /ws
Message format broadcast on every status change:

json
{
  "type": "MATCH_STATUS",
  "matchId": 15,
  "status": "rallies_processing"
}
Broadcast implementation:

python
manager.broadcast_sync({
    "type": "MATCH_STATUS",
    "matchId": match.id,
    "status": status
})
Frontend connection and handling:

js
useEffect(() => {
  const ws = new WebSocket("ws://localhost:8000/ws");

  ws.onopen = () => {
    console.log("Connected");
  };

  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);

    console.log("WebSocket:", message);

    if (message.type === "MATCH_STATUS") {
      setMatches((prev) =>
        prev.map((match) =>
          match.id === message.matchId
            ? {
                ...match,
                status: message.status,
              }
            : match,
        ),
      );
    }
  };
});
Reconnection on page refresh: When the user refreshes the page, the WebSocket connection closes and reopens on mount. The frontend first calls GET /api/matches to get the current status for all matches, then opens the WebSocket to listen for subsequent changes. This ensures no stale state is shown after a refresh regardless of what happened during the disconnection window.

Concurrent WebSocket connections: Multiple browser tabs all share the same global /ws endpoint. Every connected client receives every broadcast. The frontend filters by matchId so only the relevant UI updates — other tabs showing different matches are unaffected.

4. Database Schema
players
Column	Type	Notes
id	Integer PK	auto increment
name	VARCHAR	not null
created_at	DateTime	server default now()
matches
Column	Type	Notes
id	Integer PK	auto increment
player_id	Integer FK	→ players.id, CASCADE
opponent	VARCHAR	nullable
match_date	Date	nullable
match_type	VARCHAR	default: singles
status	VARCHAR	see status system
video_path	VARCHAR	local file path, nullable
duration_seconds	Integer	nullable, set after FFmpeg
created_at	DateTime	server default now()
processed_at	DateTime	nullable, set on finish
match_summary
Column	Type	Notes
id	Integer PK	
match_id	Integer FK	→ matches.id
overall_score	Integer	nullable
total_rallies	Integer	nullable
shot_accuracy_percent	Integer	nullable
court_coverage_percent	Integer	nullable
match_duration_seconds	Integer	nullable
dominant_shot	VARCHAR	nullable
raw_ai_response	Text	full Gemini JSON, for debugging
rallies
Column	Type	Notes
id	Integer PK	
match_id	Integer FK	→ matches.id
rally_number	Integer	sequential
start_timestamp_seconds	Float	normalised
end_timestamp_seconds	Float	normalised
shot_count	Integer	AI estimated
server	VARCHAR	player / opponent
winner	VARCHAR	player / opponent
rally_type	VARCHAR	short / medium / long
insights
Column	Type	Notes
id	Integer PK	
match_id	Integer FK	→ matches.id
tag	VARCHAR	strength / weakness / improvement
description	Text	AI generated
drills
Column	Type	Notes
id	Integer PK	
match_id	Integer FK	→ matches.id
priority	Integer	1 = most important
name	VARCHAR	drill name
description	Text	specific instructions
Entity relationships
text
players
  └── matches (one-to-many)
        ├── match_summary (one-to-one)
        ├── rallies (one-to-many)
        ├── insights (one-to-many)
        └── drills (one-to-many)
5. API Reference
Players
Method	Endpoint	Description
POST	/api/players/	Create a new player
GET	/api/players/	Get all players
GET	/api/players/{id}	Get player by ID
Matches
Method	Endpoint	Description
POST	/api/matches/	Upload video and create match
GET	/api/matches/	Get all matches
GET	/api/matches/{id}	Get match with full report data
GET	/api/matches/{id}/status	Lightweight status check
GET	/api/matches/player/{player_id}	Get all matches for a player
DELETE	/api/matches/{id}	Delete match
WebSocket
Protocol	Endpoint	Description
WS	/ws	Single global connection for all match status updates
Design — single global connection

A single WebSocket connection is opened at the app level, not per match. The backend broadcasts all status change events through this one channel. The frontend filters incoming messages by matchId and updates only the relevant match in local state.

This means:

One persistent connection handles status updates for all matches simultaneously

If two matches are processing at the same time, both receive their updates through the same socket

No need to open and close connections when navigating between pages

Connection lifecycle:

Frontend opens ws://localhost:8000/ws on app mount

Backend broadcasts a message on every status transition across any match using manager.broadcast_sync()

Frontend receives message, checks message.type === "MATCH_STATUS", filters by message.matchId

Matching entry in local state is updated with the new status — no re-fetch needed

On page refresh — WebSocket reconnects, frontend calls GET /api/matches to restore current state, then listens for subsequent changes via socket

POST /api/matches — request format
text
Content-Type: multipart/form-data

player_id:   integer (required)
opponent:    string  (optional)
match_date:  date    (optional, YYYY-MM-DD)
match_type:  string  (default: singles)
video:       file    (required, mp4/mov/avi)
GET /api/matches/{id} — response shape
json
{
  "id": 15,
  "player_id": 3,
  "opponent": "Rahul S.",
  "match_date": "2024-01-12",
  "match_type": "singles",
  "status": "finished",
  "video_path": "storage/videos/match_15.mp4",
  "duration_seconds": 458,
  "created_at": "2024-01-12T10:30:00",
  "processed_at": "2024-01-12T10:42:00",
  "match_summary": { ... },
  "rallies": [ ... ],
  "insights": [ ... ],
  "drills": [ ... ]
}
6. AI Pipeline
Model
Google Gemini 2.5 Flash — chosen for:

Native video file input (no manual frame extraction required for summary calls)

1M token context window handles long match videos

Free tier available for development and personal use

Strong instruction following for structured JSON output

Video pre-processing — timecode burning
Before sending to Gemini, FFmpeg burns a visible timestamp overlay (HH:MM:SS format) into the video. This serves two purposes:

Helps the model anchor its timestamp estimates to visible frame markers

Reduces timestamp drift on longer videos

The timecoded copy is downscaled to 480p to reduce file size and upload time:

bash
ffmpeg -i input.mp4 \
  -vf "scale=-2:480,drawtext=text='%{pts\:hms}':x=10:y=10:fontsize=24:fontcolor=white" \
  -preset ultrafast \
  output_timecoded.mp4
Three-call strategy
The pipeline makes three separate Gemini API calls per match. This avoids response truncation from trying to return too much data in a single call:

Call 1 — Rally analysis (chunked)
Sent per 7-minute chunk of video. Asks only for rally boundaries, shot count, server, winner. Focused prompt reduces output token count and improves accuracy.

Call 2 — Match summary
Sent on full video. Returns overall score, shot accuracy, court coverage, dominant shot, match duration.

Call 3 — Insights and drills
Sent on full video. Returns tagged insight observations and prioritised drill recommendations.

Chunking strategy
For the rally call, videos longer than 7 minutes are split into 7-minute windows using prompt-level time boundaries (not physical file splitting). The model is instructed to analyse only the specified time range per chunk:

text
Analyse ONLY the portion of the video between 0.0 and 7.0 minutes.
Continue rally numbering from previous chunk.
Results from all chunks are merged into a single rallies array with corrected absolute timestamps by adding the chunk offset.

Prompt design principles
Explicit player identity rule: "player = bottom half of court, opponent = top half"

Single data type per call — no mixing of rally + summary in one prompt

Temperature set to 0 for deterministic output

JSON schema provided inline in the prompt

Strict instruction: "Return ONLY valid JSON, no explanation, no markdown"

Fallback JSON extraction strips markdown code fences before parsing

7. Processing Status System
Each match moves through granular status states that allow the frontend to show meaningful progress and pinpoint exactly where a failure occurred.

Status	Description
uploaded	Video saved to disk, processing not yet started
timecode_processing	FFmpeg burning timestamp overlay
timecode_done	Timecoded video ready
gemini_uploading	Uploading to Gemini File API
gemini_ready	Gemini file processed and ready
rallies_processing	Gemini analysing rally data
rallies_done	Rally data saved to DB
summary_processing	Gemini analysing match summary
summary_done	Summary saved to DB
insights_processing	Gemini generating insights and drills
insights_done	Insights and drills saved to DB
finished	All processing complete
failed	Processing failed — check server logs for step
The Gemini file is uploaded once and shared across all three API calls. It is deleted in a finally block regardless of success or failure to avoid storage accumulation.

8. Known Limitations
Timestamp accuracy
Gemini estimates frame timestamps based on internal frame rate assumptions. Observed drift: up to 53% on a 7:38 video (458s actual vs 700s+ reported). Timestamp normalisation reduces this but introduces proportional approximation error. Exact frame-level timestamps require FFmpeg frame extraction (planned for future versions).

Rally detection accuracy
In POC validation on a 7:38 singles match, approximately 1 in 6 rallies had boundary detection errors — typically a single long rally split into 2–3 shorter false rallies. This occurs when the shuttle becomes partially obscured mid-rally (fast exchanges, poor video quality, motion blur).

Shot count reliability
Shot counts per rally are AI estimates. Observed cases of impossible counts (40 shots in 26 seconds) on full-video analysis. Chunked analysis improves this but shot-level granularity is inherently unreliable without frame-by-frame extraction.

Video quality dependency
Pipeline accuracy degrades significantly with:

Resolution below 480p

Poor or inconsistent lighting

Camera shake or movement

Court partially obstructed

Players appearing very small in frame (wide-angle shots)

Variable frame rate recordings (common on phones)

API quota — free tier
Gemini 2.5 Flash free tier limits:

20 requests per day (RPD)

5 requests per minute (RPM)

A single match analysis consumes 3–5 API calls (depending on chunk count). This limits free tier usage to approximately 4–6 matches per day. Production usage requires a paid API key.

No task durability
BackgroundTasks runs in-process. If the FastAPI server restarts during processing, the task is lost. The match status remains at the last completed step. Manual retry requires re-uploading the video.

No authentication
v1 has no login system. All player and match data is accessible to anyone with the URL. Not suitable for multi-user public deployment without adding authentication.

9. Performance Benchmarks
Measured on a 7 minute 38 second singles match at 720p.

Step	Duration
FFmpeg timecode burn (480p, ultrafast)	~45 seconds
Gemini file upload + processing	~2–3 minutes
Rally analysis (1 chunk)	~2–3 minutes
Match summary analysis	~1–2 minutes
Insights + drills analysis	~1 minute
Database serialisation	< 5 seconds
Total end-to-end	~8–12 minutes
API calls per match: 3 (for a video under 7 minutes), 4+ for longer matches.

10. Running Locally
Prerequisites
Python 3.10+

Node.js 18+

PostgreSQL running locally

Google AI Studio API key — get one free at aistudio.google.com

1. Clone the repository
bash
git clone https://github.com/your-username/shuttleai.git
cd shuttleai
2. Backend setup
bash
cd backend

# create and activate virtual environment
python -m venv venv

# windows
venv\Scripts\activate

# mac / linux
source venv/bin/activate

# install dependencies
pip install -r requirements.txt
Create the .env file inside backend/:

env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/shuttleai
GEMINI_API_KEY=your_google_ai_studio_api_key
Create the PostgreSQL database:

sql
-- run in psql or pgAdmin
CREATE DATABASE shuttleai;
Create the storage folder:

bash
mkdir -p storage/videos
Run the backend:

bash
uvicorn main:app --reload
Backend runs at http://localhost:8000
Swagger docs at http://localhost:8000/docs

3. Frontend setup
bash
cd frontend

# install dependencies
npm install
Create the .env.local file inside frontend/:

env
NEXT_PUBLIC_API_URL=http://localhost:8000
Run the frontend:

bash
npm run dev
Frontend runs at http://localhost:3000

4. Verify everything is working
Open http://localhost:3000

Create a player

Upload a short badminton match video (mp4)

Watch the status update in real time via WebSocket

View the generated report once status reaches finished

Project structure
text
shuttleai/
├── backend/
│   ├── storage/
│   │   └── videos/              video files stored here
│   ├── routers/
│   │   ├── players.py
│   │   └── matches.py
│   ├── services/
│   │   ├── orchestrator.py
│   │   ├── upload.py
│   │   ├── rally_processor.py
│   │   ├── summary_processor.py
│   │   ├── insights_processor.py
│   │   └── utils.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── config.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env                     not committed — create manually
└── frontend/
    ├── app/
    │   ├── page.jsx              /players
    │   ├── players/[id]/
    │   │   └── page.jsx          /players/:id
    │   └── matches/[id]/report/
    │       └── page.jsx          /matches/:id/report
    ├── components/
    │   ├── InsightsList.jsx
    │   ├── InsightCard.jsx
    │   └── RallyBreakdown.jsx
    ├── lib/
    │   └── utils.js              status styles and labels
    ├── .env.local                not committed — create manually
    └── package.json
requirements.txt
text
fastapi
uvicorn
sqlalchemy
psycopg2-binary
google-genai
imageio-ffmpeg
pydantic-settings
python-multipart
alembic
websockets
.gitignore
Make sure your .gitignore includes:

text
# environment variables
backend/.env
frontend/.env.local

# video storage
backend/storage/

# python
__pycache__/
venv/
*.pyc

# node
node_modules/
.next/
Notes
.env and .env.local are gitignored — never commit API keys

storage/videos/ is gitignored — video files are local only

The first run of uvicorn main:app automatically creates all database tables via Base.metadata.create_all

FFmpeg is bundled via imageio-ffmpeg — no separate FFmpeg installation required

11. Future Improvements
Frame-by-frame analysis
Replace full-video rally detection with FFmpeg frame extraction (1 frame per 0.5 seconds) and per-frame Gemini analysis. Each frame returns a state (RALLY / NO_RALLY / OBSCURED), shot type, court zone, and hit-by field. Rally boundaries are reconstructed in Python from state transitions — removing model responsibility for boundary detection entirely.

This enables:

Shots table population (shot type, court zone, outcome per shot)

Court heatmap visualisation

Shot distribution breakdown

Accurate shot counts per rally

Additional features
Match comparison — trend lines for score, win rate, serve effectiveness across matches

Video playback with markers — click a timestamp in an insight and jump to that moment

Doubles support — one-time player tagging on upload, filtered analysis

Retry from failed step — re-trigger processing without re-uploading video

Match notes — user-added observations alongside AI insights

Authentication — NextAuth.js on frontend, JWT middleware on backend

Infrastructure improvements
Celery + Redis for durable background task queue

Cloudflare R2 for video storage

Frame-level caching to avoid reprocessing unchanged segments

Webhook notifications when processing completes

Automated retry logic with exponential backoff for API rate limits
