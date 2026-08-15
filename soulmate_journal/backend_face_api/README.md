# Real-time Face Emotion Recognition Backend

This is a Python-based FastAPI + WebSockets backend for high-accuracy, real-time facial expression recognition. It utilizes **DeepFace** (with TensorFlow under the hood) to analyze frames captured by the user's webcam.

## Features

- **FastAPI WebSockets:** High-speed, bidirectional communication.
- **DeepFace Engine:** Analyzes facial expressions with high accuracy (supports classification of happy, sad, angry, fearful, disgusted, surprised, and neutral).
- **Lag Prevention:** Integrates a skip-frame mechanism to ignore incoming frames if the backend is busy processing, preventing backlog and lag.
- **Fail-safe Emulation Mode:** If DeepFace is not installed or crashes, it automatically falls back to OpenCV Haar Cascades for face detection and generates emulated results to keep the system active without crashing.

## Prerequisites

- **Python 3.8 - 3.11** (DeepFace/TensorFlow might face compatibility issues with Python 3.12+).
- A working webcam on the client device.

## Setup Instructions

1. **Navigate to backend folder:**
   ```bash
   cd backend_face_api
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the FastAPI server:**
   ```bash
   python main.py
   # or running via uvicorn directly:
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

   The server will start running at `http://localhost:8000`. The WebSocket endpoint is available at `ws://localhost:8000/ws/face-emotion`.

## API Documentation

Once running, Swagger docs are available at `http://localhost:8000/docs`.
