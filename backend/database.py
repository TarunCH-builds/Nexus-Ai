"""
NEXUS AI - Python SQLite Database Driver
Connects directly to ./data/nexus.sqlite for unified data consistency between FastAPI and Node.
"""

import os
import json
import sqlite3
from typing import List, Optional, Dict, Any

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
DB_PATH = os.path.join(DB_DIR, "nexus.sqlite")

def get_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class NexusDatabasePy:
    @staticmethod
    def get_documents() -> List[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            rows = cursor.execute("SELECT * FROM documents ORDER BY createdAt DESC").fetchall()
            results = []
            for r in rows:
                results.append({
                    "id": r["id"],
                    "title": r["title"],
                    "fileName": r["fileName"],
                    "fileSize": r["fileSize"],
                    "mimeType": r["mimeType"],
                    "createdAt": r["createdAt"],
                    "chunkCount": r["chunkCount"],
                    "summary": r["summary"],
                    "extractedConcepts": json.loads(r["extractedConcepts"]) if r["extractedConcepts"] else [],
                })
            return results

    @staticmethod
    def get_tasks(status: Optional[str] = None) -> List[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            if status and status != "all":
                rows = cursor.execute("SELECT * FROM tasks WHERE status = ? ORDER BY createdAt DESC", (status,)).fetchall()
            else:
                rows = cursor.execute("SELECT * FROM tasks ORDER BY createdAt DESC").fetchall()
            results = []
            for r in rows:
                results.append({
                    "id": r["id"],
                    "title": r["title"],
                    "description": r["description"],
                    "status": r["status"],
                    "priority": r["priority"],
                    "createdAt": r["createdAt"],
                    "completedAt": r["completedAt"],
                    "source": r["source"],
                    "sourceTitle": r["sourceTitle"],
                    "estimatedMinutes": r["estimatedMinutes"],
                    "command": r["command"],
                })
            return results

    @staticmethod
    def get_memory_items(category: Optional[str] = None) -> List[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            if category and category != "all":
                rows = cursor.execute("SELECT * FROM memory_items WHERE category = ? ORDER BY createdAt DESC", (category,)).fetchall()
            else:
                rows = cursor.execute("SELECT * FROM memory_items ORDER BY createdAt DESC").fetchall()
            results = []
            for r in rows:
                results.append({
                    "id": r["id"],
                    "category": r["category"],
                    "title": r["title"],
                    "content": r["content"],
                    "tags": json.loads(r["tags"]) if r["tags"] else [],
                    "createdAt": r["createdAt"],
                    "privacyLevel": r["privacyLevel"],
                })
            return results

    @staticmethod
    def get_meetings() -> List[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            rows = cursor.execute("SELECT * FROM meetings ORDER BY date DESC").fetchall()
            results = []
            for r in rows:
                results.append({
                    "id": r["id"],
                    "title": r["title"],
                    "date": r["date"],
                    "durationSeconds": r["durationSeconds"],
                    "participants": json.loads(r["participants"]) if r["participants"] else [],
                    "summary": r["summary"],
                    "actionItems": json.loads(r["actionItems"]) if r["actionItems"] else [],
                    "keyDecisions": json.loads(r["keyDecisions"]) if r["keyDecisions"] else [],
                    "transcript": r["transcript"],
                })
            return results

    @staticmethod
    def get_privacy_audits(limit: int = 50) -> List[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            rows = cursor.execute("SELECT * FROM privacy_audits ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
            results = []
            for r in rows:
                results.append({
                    "id": r["id"],
                    "timestamp": r["timestamp"],
                    "action": r["action"],
                    "destination": r["destination"],
                    "dataSummary": r["dataSummary"],
                    "privacyScore": r["privacyScore"],
                    "userApproved": bool(r["userApproved"]),
                })
            return results

    @staticmethod
    def get_stats() -> Dict[str, int]:
        with get_connection() as conn:
            cursor = conn.cursor()
            doc_c = cursor.execute("SELECT count(*) FROM documents").fetchone()[0]
            task_c = cursor.execute("SELECT count(*) FROM tasks").fetchone()[0]
            mem_c = cursor.execute("SELECT count(*) FROM memory_items").fetchone()[0]
            meet_c = cursor.execute("SELECT count(*) FROM meetings").fetchone()[0]
            return {
                "documentCount": doc_c,
                "taskCount": task_c,
                "memoryItemCount": mem_c,
                "meetingCount": meet_c,
            }
