import time
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.utils import validate_audio_file, load_and_preprocess_audio
from app.model import detector_instance

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voiceguard.fastapi")

app = FastAPI(
    title="VoiceGuard AI - ML Microservice",
    description="Anti-spoofing and deepfake voice cloning detection engine for SIH26104",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "VoiceGuard ML Engine",
        "model": detector_instance.model_name,
        "device": detector_instance.device
    }

@app.post("/analyze", tags=["Detection"])
async def analyze_audio(file: UploadFile = File(...)):
    start_time = time.time()
    
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audio file uploaded."
        )

    try:
        # Read file bytes
        contents = await file.read()
        file_size = len(contents)
        
        # 1. Validate file format & size limit
        validate_audio_file(file.filename, file_size)

        # 2. Decode and preprocess audio to 16kHz mono float32
        waveform, sr, duration = load_and_preprocess_audio(contents, file.filename)

        # 3. Perform anti-spoofing inference
        result = detector_instance.predict(waveform, sr)

        processing_time_ms = round((time.time() - start_time) * 1000, 1)

        response_payload = {
            "status": "success",
            "filename": file.filename,
            "duration_seconds": duration,
            "risk_score": result["risk_score"],
            "verdict": result["verdict"],
            "risk_label": result["risk_label"],
            "confidence": result["confidence"],
            "model_info": result["model_info"],
            "features_summary": result["features_summary"],
            "processing_time_ms": processing_time_ms
        }
        
        logger.info(f"Analyzed '{file.filename}' ({duration}s): score={result['risk_score']} [{result['risk_label']}] in {processing_time_ms}ms")
        return JSONResponse(status_code=status.HTTP_200_OK, content=response_payload)

    except ValueError as ve:
        logger.warning(f"Validation error for '{file.filename}': {str(ve)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Inference error for '{file.filename}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio analysis failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
