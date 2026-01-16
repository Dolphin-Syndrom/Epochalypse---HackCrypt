"""
AI Content Detector Backend - Vertex AI
Gunicorn + Flask compatible (old Flask safe)
"""

# -------- ENV --------
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import os
import json
import base64

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# -------- CONFIG --------
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "")
LOCATION = os.getenv("VERTEX_AI_LOCATION", "us-central1")
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")

vertex_initialized = False
model = None


# -------- VERTEX INIT --------
def initialize_vertex():
    global vertex_initialized, model, PROJECT_ID

    if vertex_initialized:
        return

    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel

        if not PROJECT_ID and SERVICE_ACCOUNT_FILE and os.path.exists(SERVICE_ACCOUNT_FILE):
            with open(SERVICE_ACCOUNT_FILE) as f:
                PROJECT_ID = json.load(f).get("project_id", "")

        if not PROJECT_ID:
            raise RuntimeError("GOOGLE_CLOUD_PROJECT not set")

        vertexai.init(project=PROJECT_ID, location=LOCATION)
        model = GenerativeModel("gemini-2.0-flash-001")
        vertex_initialized = True

        print("✅ Vertex AI initialized")
        print("   Project:", PROJECT_ID)
        print("   Location:", LOCATION)

    except Exception as e:
        print("❌ Vertex init failed:", e)


# 🔑 IMPORTANT: init at import (Gunicorn-safe)
initialize_vertex()


# -------- ROUTES --------
@app.route("/health")
def health():
    return jsonify({
        "status": "healthy" if vertex_initialized else "not_ready",
        "project": PROJECT_ID or "not_set",
        "location": LOCATION
    })


@app.route("/analyze", methods=["POST"])
def analyze():
    if not vertex_initialized:
        return jsonify({"error": "Vertex not initialized"}), 500

    try:
        from vertexai.generative_models import Part

        data = request.get_json()
        if not data or "file_data" not in data:
            return jsonify({"error": "file_data missing"}), 400

        media = base64.b64decode(data["file_data"])
        mime = data.get("mime_type", "image/jpeg")
        media_type = "image" if mime.startswith("image/") else "video"

        prompt = f"""
Analyze this {media_type}. Respond ONLY in JSON:
{{
  "verdict": "AI_GENERATED" | "LIKELY_REAL" | "UNCERTAIN",
  "confidence": 0-100,
  "explanation": "text",
  "indicators": ["list"]
}}
"""

        part = Part.from_data(media, mime_type=mime)
        response = model.generate_content([prompt, part])

        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.replace("```json", "").replace("```", "").strip()

        return jsonify({"success": True, "result": json.loads(raw)})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -------- DEV ONLY --------
if __name__ == "__main__":
    print("🚀 Flask DEV server on http://localhost:5500")
    app.run(host="0.0.0.0", port=5500, debug=True)
