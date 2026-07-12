from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from router import players, match, websocket
import asyncio
from contextlib import asynccontextmanager
from websocket_manager import manager
import time
import threading

# def websocket_test():
#     statuses = [
#         "uploaded",
#         "timecode_processing",
#         "timecode_done",
#         "gemini_uploading",
#         "gemini_ready",
#         "rallies_processing",
#         "rallies_done",
#         "summary_processing",
#         "summary_done",
#         "finished",
#     ]

#     while True:
#         for status in statuses:
#             print("Broadcasting:", status)

#             manager.broadcast_sync({
#                 "type": "MATCH_STATUS",
#                 "matchId": 11,
#                 "status": status,
#             })

#             time.sleep(2)

@asynccontextmanager
async def lifespan(app):
    manager.loop = asyncio.get_running_loop()
    # threading.Thread(
    #     target=websocket_test,
    #     daemon=True,
    # ).start()

    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

print('Creating Table')
Base.metadata.create_all(bind=engine)

app.include_router(players.router)
app.include_router(match.router)
app.include_router(websocket.router)