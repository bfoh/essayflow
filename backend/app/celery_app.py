from celery import Celery
import os

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "essayflow",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max per task
    task_soft_time_limit=540,  # Soft limit at 9 minutes
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# Task routes
celery_app.conf.task_routes = {
    "app.tasks.process_document": {"queue": "document_processing"},
    "app.tasks.generate_essay": {"queue": "essay_generation"},
    "app.tasks.humanize_essay": {"queue": "essay_generation"},
    "app.tasks.generate_pdf": {"queue": "pdf_generation"},
}
