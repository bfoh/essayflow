from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv
import uuid
import json
import os
import redis
from datetime import datetime
from typing import Optional

# Load environment variables from .env file
load_dotenv()

from app.schemas import (
    JobStatus, 
    TaskStatusResponse, 
    FileUploadResponse,
    JobCreateRequest,
    HumanizationSettings
)
from app.tasks import process_document

# Initialize FastAPI app
app = FastAPI(
    title="EssayFlow AI API",
    description="AI-powered academic essay generation service",
    version="1.0.0"
)

# Redis client
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# File size limit middleware (10MB max)
class FileSizeLimitMiddleware(BaseHTTPMiddleware):
    MAX_SIZE = 10 * 1024 * 1024  # 10MB in bytes
    
    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and "upload" in request.url.path:
            content_length = request.headers.get("content-length")
            if content_length:
                if int(content_length) > self.MAX_SIZE:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"File size exceeds maximum limit of 10MB"
                        }
                    )
        return await call_next(request)


app.add_middleware(FileSizeLimitMiddleware)


# Upload directory
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/essayflow/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "healthy", "service": "EssayFlow AI API"}


@app.get("/api/health")
async def health_check():
    """Detailed health check endpoint."""
    redis_status = "healthy"
    try:
        redis_client.ping()
    except Exception:
        redis_status = "unhealthy"
    
    return {
        "status": "healthy",
        "redis": redis_status,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    student_name: Optional[str] = None,
    course_name: Optional[str] = None,
    humanization_intensity: float = 0.5,
    additional_prompt: Optional[str] = None
):
    """
    Upload a document (PDF or DOCX) to start the essay generation process.
    
    - **file**: The assignment document (PDF or DOCX, max 10MB)
    - **student_name**: Optional student name for PDF header
    - **course_name**: Optional course name for PDF header
    - **humanization_intensity**: Intensity of humanization (0.0-1.0)
    - **additional_prompt**: Optional additional instructions or context
    """
    # Validate file type
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    allowed_extensions = [".pdf", ".docx"]
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Only PDF and DOCX files are allowed."
        )
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}{file_ext}")
    
    try:
        contents = await file.read()
        
        # Double-check file size
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="File size exceeds maximum limit of 10MB"
            )
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        file_size = len(contents)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Create job record in Redis
    job_data = {
        "job_id": job_id,
        "status": JobStatus.PENDING.value,
        "progress": 0,
        "message": "Job created, waiting to start...",
        "filename": file.filename,
        "file_path": file_path,
        "file_type": file_ext[1:],  # Remove the dot
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "student_name": student_name,
        "course_name": course_name,
        "additional_prompt": additional_prompt,
        "humanization_settings": HumanizationSettings(
            intensity=humanization_intensity
        ).model_dump(),
        "download_url": None,
        "error": None
    }
    
    redis_client.set(f"job:{job_id}", json.dumps(job_data), ex=86400)  # 24 hour expiry
    
    # Start processing task
    process_document.delay(job_id, file_path, file_ext[1:])
    
    return FileUploadResponse(
        job_id=job_id,
        message="File uploaded successfully. Processing started.",
        filename=file.filename,
        file_size=file_size
    )


@app.get("/api/task/{job_id}", response_model=TaskStatusResponse)
async def get_task_status(job_id: str):
    """
    Get the current status of a job.
    
    Use this endpoint to poll for job progress.
    """
    job_data = redis_client.get(f"job:{job_id}")
    
    if not job_data:
        raise HTTPException(
            status_code=404,
            detail=f"Job with ID '{job_id}' not found"
        )
    
    job = json.loads(job_data)
    
    return TaskStatusResponse(
        job_id=job["job_id"],
        status=JobStatus(job["status"]),
        progress=job["progress"],
        message=job.get("message"),
        created_at=datetime.fromisoformat(job["created_at"]),
        updated_at=datetime.fromisoformat(job["updated_at"]),
        download_url=job.get("download_url"),
        error=job.get("error")
    )


@app.get("/api/download/{job_id}")
async def download_essay(job_id: str, format: str = "pdf"):
    """
    Download the generated essay in PDF or DOCX format.
    
    - **job_id**: The job ID from upload
    - **format**: Output format, either 'pdf' or 'docx' (default: pdf)
    """
    job_data = redis_client.get(f"job:{job_id}")
    
    if not job_data:
        raise HTTPException(
            status_code=404,
            detail=f"Job with ID '{job_id}' not found"
        )
    
    job = json.loads(job_data)
    
    if job["status"] != JobStatus.COMPLETED.value:
        raise HTTPException(
            status_code=400,
            detail=f"Essay is not ready yet. Current status: {job['status']}"
        )
    
    # Determine file path based on format
    format = format.lower()
    if format == "docx":
        file_path = os.path.join(UPLOAD_DIR, f"{job_id}_output.docx")
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        extension = "docx"
    else:
        file_path = os.path.join(UPLOAD_DIR, f"{job_id}_output.pdf")
        media_type = "application/pdf"
        extension = "pdf"
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"{extension.upper()} file not found"
        )
    
    # Get original filename without extension
    original_name = os.path.splitext(job.get("filename", "essay"))[0]
    output_filename = f"{original_name}_essay.{extension}"
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=output_filename
    )


@app.get("/api/essay/{job_id}/content")
async def get_essay_content(job_id: str):
    """
    Get the generated essay content in JSON format.
    
    Useful for displaying in the split-screen editor.
    """
    job_data = redis_client.get(f"job:{job_id}")
    
    if not job_data:
        raise HTTPException(
            status_code=404,
            detail=f"Job with ID '{job_id}' not found"
        )
    
    job = json.loads(job_data)
    
    # Try to get humanized version first, then draft
    essay_data = redis_client.get(f"job:{job_id}:humanized")
    if not essay_data:
        essay_data = redis_client.get(f"job:{job_id}:draft")
    
    if not essay_data:
        raise HTTPException(
            status_code=400,
            detail="Essay content not available yet"
        )
    
    essay = json.loads(essay_data.decode("utf-8") if isinstance(essay_data, bytes) else essay_data)
    
    # Also include original extracted content
    original_content = redis_client.get(f"job:{job_id}:content")
    original_text = ""
    if original_content:
        original_text = original_content.decode("utf-8") if isinstance(original_content, bytes) else original_content
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "essay": essay,
        "original_content": original_text
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
