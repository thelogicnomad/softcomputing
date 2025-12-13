"""
Optimized FastAPI Backend with CORS for React frontend
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import cv2
import base64
import numpy as np
import asyncio

from .hand_detector import HandDetector
from .fuzzy_controller import FuzzySteeringController
from .game_logic import RacingGame

app = FastAPI(title="Fuzzy Racing Game API")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for fallback HTML UI
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize components
detector = HandDetector(max_hands=2, detection_confidence=0.6)
controller = FuzzySteeringController()
game = RacingGame()


@app.get("/", response_class=HTMLResponse)
async def home():
    """Serve fallback HTML UI"""
    try:
        with open("static/index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except:
        return HTMLResponse("<h1>Fuzzy Racing API</h1><p>Use React frontend at localhost:5173</p>")


@app.get("/health")
async def health():
    return {"status": "ok", "message": "Fuzzy Racing API running"}


@app.post("/start")
async def start():
    game.reset()
    controller.reset()
    detector.reset()
    return {"status": "started"}


@app.post("/reset")
async def reset():
    game.reset()
    controller.reset()
    return {"status": "reset"}


@app.get("/state")
async def get_state():
    return game.get_state()


@app.websocket("/ws/game")
async def game_ws(websocket: WebSocket):
    await websocket.accept()
    
    # Open camera with optimized settings
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 480)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    await asyncio.sleep(0.3)
    
    if not cap.isOpened():
        await websocket.send_json({"error": "Camera not available"})
        return
    
    await websocket.send_json({"status": "connected"})
    
    frame_count = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                await asyncio.sleep(0.01)
                continue
                
            frame = cv2.flip(frame, 1)
            
            # Detect hands
            frame, angle, hands, gesture, conf, openness = detector.detect(frame)
            
            # Compute fuzzy control
            control = controller.compute(angle, hands, gesture)
            
            # Update game
            game_state = game.update(
                control['steering'],
                control['speed'],
                control['nitro']
            )
            
            # Encode frame (every other frame)
            frame_count += 1
            if frame_count % 2 == 0:
                small_frame = cv2.resize(frame, (320, 240))
                _, buffer = cv2.imencode('.jpg', small_frame, 
                                        [cv2.IMWRITE_JPEG_QUALITY, 65])
                frame_b64 = base64.b64encode(buffer).decode('utf-8')
            else:
                frame_b64 = None
            
            # Send response
            response = {
                'frame': frame_b64,
                'angle': float(angle),
                'hands': int(hands),
                'gesture': int(gesture),
                'control': {
                    'steering': float(control['steering']),
                    'speed': float(control['speed']),
                    'nitro': float(control['nitro'])
                },
                'game': game_state
            }
            
            await websocket.send_json(response)
            await asyncio.sleep(0.025)  # ~40 FPS
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        cap.release()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
