import asyncio
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections = []
        self.loop = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message):
        dead = []

        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except:
                dead.append(ws)

        for ws in dead:
            self.disconnect(ws)

    def broadcast_sync(self, message):
        if self.loop:
            asyncio.run_coroutine_threadsafe(
                self.broadcast(message),
                self.loop
            )

manager = ConnectionManager()