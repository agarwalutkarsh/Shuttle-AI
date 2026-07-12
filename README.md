<div align="center">

# 🏸 ShuttleAI

**AI-powered badminton performance analysis from raw match video**

*No custom CV models. No manual tagging. Just upload and get your report.*

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=flat&logo=google&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat&logo=python&logoColor=white)

</div>

---

## What is this?

Amateur badminton players have no access to the performance analytics that professional players get from dedicated coaching staff. Existing video analysis tools are expensive, require manual tagging, or need custom-trained computer vision models with labeled datasets.

ShuttleAI bypasses all of this — upload a raw match recording, and Gemini's native video understanding extracts structured performance data directly from the footage.

### What a report contains

- Overall performance score (0–100)
- Rally-level data — timestamps, shot count, server, winner, rally type
- Serve effectiveness vs receive effectiveness
- Win rate by rally length (short / medium / long)
- AI-generated insights tagged as **strength / weakness / improvement**
- Prioritised drill recommendations based on identified weaknesses

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| AI Model | Google Gemini 2.5 Flash |
| AI SDK | google-genai (Python) |
| Video Processing | FFmpeg via imageio-ffmpeg |
| Background Tasks | FastAPI BackgroundTasks |
| Real-time updates | WebSockets (FastAPI native) |
| Schema Validation | Pydantic v2 |

---

## Running locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL running locally
- Google AI Studio API key — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Shuttle-AI.git
cd Shuttle-AI
```

---

### 2. Backend setup

```bash
cd backend

# create and activate virtual environment
python -m venv venv

# windows
venv\Scripts\activate

# mac / linux
source venv/bin/activate

# install dependencies
pip install -r requirements.txt
```

Create the `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/shuttleai
GEMINI_API_KEY=your_google_ai_studio_api_key
```

Create the PostgreSQL database:

```sql
CREATE DATABASE shuttleai;
```

Create the storage folder:

```bash
mkdir -p storage/videos
```

Run the backend:

```bash
uvicorn main:app --reload
```

- Backend → `http://localhost:8000`
- Swagger docs → `http://localhost:8000/docs`

---

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create the `.env.local` file inside `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend:

```bash
npm run dev
```

Frontend → `http://localhost:3000`

---

### 4. Verify everything is working

1. Open `http://localhost:3000`
2. Create a player
3. Upload a badminton match video (mp4)
4. Watch status update in real time via WebSocket
5. View the generated report once status reaches `finished`

---

## Project structure

```
shuttleai/
├── backend/
│   ├── storage/
│   │   └── videos/              video files stored here
│   ├── routers/
│   │   ├── players.py
│   │   └── matches.py
│   ├── services/
│   │   ├── orchestrator.py      coordinates full processing pipeline
│   │   ├── upload.py            Gemini file upload and deletion
│   │   ├── rally_processor.py   rally fetching and DB saving
│   │   ├── summary_processor.py match summary fetching and DB saving
│   │   ├── insights_processor.py insights and drills fetching and DB saving
│   │   └── utils.py             shared helpers — FFmpeg, JSON extraction
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
```

---

## How it works

### Processing pipeline

```
User uploads video
       ↓
FastAPI saves video → creates Match row (status: uploaded)
       ↓
BackgroundTask triggered — HTTP response returned immediately
       ↓
FFmpeg burns timecodes into video copy (status: timecode_processing)
       ↓
Video uploaded to Gemini File API once (status: gemini_uploading)
       ↓
┌─────────────────────────────────────┐
│  3 focused Gemini calls             │
│  ├── Rally analysis (chunked)       │
│  ├── Match summary                  │
│  └── Insights + drills              │
└─────────────────────────────────────┘
       ↓
Results serialised → saved to PostgreSQL
       ↓
status: finished → Gemini file deleted
       ↓
WebSocket broadcasts each status change to frontend in real time
```

### WebSocket — real-time status updates

A single global WebSocket connection (`/ws`) is opened on app mount. Every status transition is broadcast to all connected clients. The frontend filters by `matchId` and updates local state — no polling, no re-fetching.

```js
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.type === "MATCH_STATUS") {
    setMatches((prev) =>
      prev.map((match) =>
        match.id === message.matchId
          ? { ...match, status: message.status }
          : match
      )
    );
  }
};
```

Broadcast message format:
```json
{
  "type": "MATCH_STATUS",
  "matchId": 15,
  "status": "rallies_processing"
}
```

### Status transitions

```
uploaded → timecode_processing → timecode_done
        → gemini_uploading → gemini_ready
        → rallies_processing → rallies_done
        → summary_processing → summary_done
        → insights_processing → insights_done
        → finished
        → failed (any step)
```

### AI pipeline — three-call strategy

Sending everything in one prompt causes response truncation on longer videos. Three focused calls avoids this:

| Call | Sent to | Returns |
|---|---|---|
| 1 — Rallies | Per 7-min chunk | Rally boundaries, shot count, server, winner |
| 2 — Summary | Full video | Overall score, accuracy, coverage, dominant shot |
| 3 — Insights | Full video | Tagged observations + prioritised drills |

The video is uploaded to Gemini once and reused across all three calls, then deleted.

---

## Database schema

```
players
  └── matches (one-to-many)
        ├── match_summary (one-to-one)
        ├── rallies (one-to-many)
        ├── insights (one-to-many)
        └── drills (one-to-many)
```

| Table | Key columns |
|---|---|
| players | id, name, created_at |
| matches | id, player_id, opponent, status, video_path, duration_seconds |
| match_summary | match_id, overall_score, total_rallies, shot_accuracy_percent, dominant_shot, raw_ai_response |
| rallies | match_id, rally_number, start/end_timestamp_seconds, shot_count, server, winner, rally_type |
| insights | match_id, tag (strength/weakness/improvement), description |
| drills | match_id, priority, name, description |

---

## API reference

### Players
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/players/` | Create a new player |
| GET | `/api/players/` | Get all players |
| GET | `/api/players/{id}` | Get player by ID |

### Matches
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/matches/` | Upload video and create match |
| GET | `/api/matches/` | Get all matches |
| GET | `/api/matches/{id}` | Get match with full report |
| GET | `/api/matches/{id}/status` | Lightweight status check |
| GET | `/api/matches/player/{player_id}` | Get all matches for a player |
| DELETE | `/api/matches/{id}` | Delete match |

### WebSocket
| Protocol | Endpoint | Description |
|---|---|---|
| WS | `/ws` | Global real-time status updates |

---

## Performance

Measured on a 7 min 38 sec singles match at 720p.

| Step | Duration |
|---|---|
| FFmpeg timecode burn | ~45 seconds |
| Gemini file upload + processing | ~2–3 minutes |
| Rally analysis | ~2–3 minutes |
| Match summary analysis | ~1–2 minutes |
| Insights + drills | ~1 minute |
| Database serialisation | < 5 seconds |
| **Total** | **~8–12 minutes** |

API calls per match: 3 (under 7 min video), 4+ for longer matches.

---

## Known limitations

| Limitation | Detail |
|---|---|
| Timestamp drift | Gemini estimates timestamps internally — observed up to 53% drift on a 7:38 video. Normalised via scale factor post-processing. |
| Rally detection | ~1 in 6 rallies had boundary errors in testing — usually a long rally split into 2–3 false rallies when shuttle is obscured. |
| Shot counts | AI-estimated. Unreliable at shot-level granularity without frame-by-frame extraction. |
| Video quality | Accuracy degrades below 480p, with camera shake, poor lighting, or obstructed court view. |
| API quota | Free tier: 20 RPD, 5 RPM. A single match uses 3–5 calls — approximately 4–6 matches per day on free tier. |
| Task durability | BackgroundTasks are in-process. A server restart mid-processing loses the task. |
| No auth | Single-user only. No login system in v1. |

---

## Future improvements

- **Frame-by-frame analysis** — FFmpeg extracts 1 frame per 0.5s, each analyzed individually. Enables shots table, court heatmap, and accurate shot counts. Rally boundaries reconstructed in Python from state transitions rather than relying on model estimation.
- **Match comparison** — trend lines for score, win rate, serve effectiveness across matches
- **Video playback with markers** — click an insight timestamp and jump to that moment
- **Doubles support** — one-time player tagging on upload, filtered analysis
- **Retry from failed step** — re-trigger processing without re-uploading video
- **Authentication** — NextAuth.js on frontend, JWT middleware on backend
- **Celery + Redis** — durable task queue for multi-user production deployments
- **Cloudflare R2** — persistent video storage for cloud deployment

---

## Notes

- `.env` and `.env.local` are gitignored — never commit API keys
- `storage/videos/` is gitignored — video files stay local
- First run of `uvicorn main:app` auto-creates all database tables
- FFmpeg is bundled via `imageio-ffmpeg` — no separate installation needed

---

<div align="center">
<sub>Built with FastAPI · Next.js · PostgreSQL · Gemini 2.5 Flash</sub>
</div>
