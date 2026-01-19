from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json

app = FastAPI()

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def get():
    return {"message": "Cloud Chat Backend is running!"}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    # Broadcast that a new user has joined
    join_msg = json.dumps({"type": "system", "content": f"{client_id} joined the chat"})
    await manager.broadcast(join_msg)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            # Broadcast the received message to everyone
            broadcast_data = json.dumps({
                "type": "user",
                "user": client_id,
                "content": message_data["content"]
            })
            await manager.broadcast(broadcast_data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        # Broadcast that a user has left
        leave_msg = json.dumps({"type": "system", "content": f"{client_id} left the chat"})
        await manager.broadcast(leave_msg)
