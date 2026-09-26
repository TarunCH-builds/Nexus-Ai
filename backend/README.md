# NEXUS AI - FastAPI Backend Service

This directory provides the production FastAPI backend service for NEXUS AI, sharing the exact same SQLite database (`data/nexus.sqlite`) as the Node.js Express service.

## Prerequisites

- Python 3.10+
- SQLite3 (included in standard library)

## Installation

```bash
pip install -r requirements.txt
```

## Running the Server

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## Interactive Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
