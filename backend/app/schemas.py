from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class JobStatus(str, Enum):
    """Status states for essay generation jobs."""
    PENDING = "pending"
    EXTRACTING = "extracting"
    RESEARCHING = "researching"
    WRITING = "writing"
    HUMANIZING = "humanizing"
    FORMATTING = "formatting"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskStatusResponse(BaseModel):
    """Response schema for task status polling."""
    job_id: str
    status: JobStatus
    progress: int = Field(ge=0, le=100, description="Progress percentage")
    message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    download_url: Optional[str] = None
    error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "abc123",
                "status": "writing",
                "progress": 60,
                "message": "Generating essay draft...",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:32:00Z",
                "download_url": None,
                "error": None
            }
        }


class FileUploadResponse(BaseModel):
    """Response schema for file upload."""
    job_id: str
    message: str
    filename: str
    file_size: int


class EssaySection(BaseModel):
    """Individual section of the essay."""
    title: str
    content: str
    word_count: Optional[int] = None  # Optional as GPT may not always return this


class EssayOutput(BaseModel):
    """Structured LLM output schema for essay generation."""
    title: str
    thesis_statement: str
    introduction: str
    body_sections: List[EssaySection]
    conclusion: str
    references: Optional[List[str]] = None
    total_word_count: Optional[int] = None  # Optional as GPT may not always return this
    academic_level: Optional[str] = Field(default="undergraduate", description="e.g., undergraduate, graduate, doctoral")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "The Impact of AI on Modern Education",
                "thesis_statement": "AI technologies are reshaping education...",
                "introduction": "In recent years...",
                "body_sections": [
                    {
                        "title": "Historical Context",
                        "content": "The evolution of educational technology...",
                        "word_count": 350
                    }
                ],
                "conclusion": "In conclusion...",
                "references": ["Smith, J. (2023). AI in Education..."],
                "total_word_count": 2500,
                "academic_level": "undergraduate"
            }
        }


class HumanizationSettings(BaseModel):
    """Settings for the humanization pass."""
    intensity: float = Field(
        default=0.5, 
        ge=0.0, 
        le=1.0, 
        description="Humanization intensity: 0.0 (low) to 1.0 (aggressive)"
    )
    preserve_citations: bool = True
    vary_sentence_length: bool = True
    add_transitional_phrases: bool = True


class JobCreateRequest(BaseModel):
    """Request schema for creating a new job."""
    humanization_settings: Optional[HumanizationSettings] = None
    student_name: Optional[str] = None
    course_name: Optional[str] = None
    due_date: Optional[str] = None


class ExtractedContent(BaseModel):
    """Schema for extracted document content."""
    text: str
    word_count: int
    detected_rubrics: Optional[List[str]] = None
    detected_requirements: Optional[List[str]] = None
    file_type: str
