from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
from prediction import predict_single_video
from groq import Groq

# Initialize Groq client
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    # Fallback/Error handling or development key if absolutely necessary, but preferred from env
    print("Warning: GROQ_API_KEY not found in environment variables.")
    api_key = "dummy_key_for_build" 

client = Groq(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def generate_explanation(prediction: str, score: float) -> str:
    """Generate a user-friendly explanation using Groq LLM."""
    try:
        completion = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system",
                    "content": "You are a deepfake detection expert. Explain the detection result to a non-technical user in 2 simple sentences. Focus on why the video might be real or fake based on the confidence score."
                },
                {
                    "role": "user",
                    "content": f"The model predicted {prediction} with a confidence score of {score:.2f} (0-1 scale). Explain this result."
                }
            ],
            temperature=0.5,
            max_tokens=100
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Groq generation failed: {e}")
        return f"The model detected this as {prediction} with {score:.1%} confidence."

@app.post("/predict/")
async def predict_video(file: UploadFile = File(...)):
    # Save uploaded file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Call prediction logic
    result = predict_single_video(file_path)
    
    # Add explanation
    if "prediction" in result and "score" in result:
        result["explanation"] = generate_explanation(result["prediction"], result["score"])
        
    # Optionally, remove the file after prediction
    os.remove(file_path)
    return JSONResponse(content=result)
