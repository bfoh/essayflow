#!/bin/bash
source venv/bin/activate
celery -A app.celery_app worker --loglevel=info -Q celery,document_processing,essay_generation,pdf_generation --concurrency=2
