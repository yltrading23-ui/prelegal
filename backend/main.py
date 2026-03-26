import json
import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv

load_dotenv()  # load .env for non-Docker environments

logger = logging.getLogger(__name__)

from fastapi import Cookie, Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr

from auth import create_token, decode_token, hash_password, verify_password
from chat import DOCUMENT_CATALOG, GREETING, process_message
from render import render_html
from database import get_connection, init_db

STATIC_DIR = os.getenv("STATIC_DIR", "/app/static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="PreLegal API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def get_current_user(auth_token: Optional[str] = Cookie(default=None)):
    if not auth_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(auth_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"id": int(payload["sub"]), "email": payload["email"]}


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


@app.post("/api/auth/signup")
def signup(body: SignupRequest, response: Response):
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (body.email,)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed = hash_password(body.password)
        cursor = conn.execute(
            "INSERT INTO users (email, hashed_password) VALUES (?, ?)",
            (body.email, hashed),
        )
        conn.commit()
        user_id = cursor.lastrowid
    finally:
        conn.close()

    token = create_token(user_id, body.email)
    response.set_cookie(
        "auth_token", token, httponly=True, samesite="lax", max_age=86400
    )
    return {"id": user_id, "email": body.email}


@app.post("/api/auth/signin")
def signin(body: SigninRequest, response: Response):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, hashed_password FROM users WHERE email = ?", (body.email,)
        ).fetchone()
    finally:
        conn.close()

    if not row or not verify_password(body.password, row["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(row["id"], body.email)
    response.set_cookie(
        "auth_token", token, httponly=True, samesite="lax", max_age=86400
    )
    return {"id": row["id"], "email": body.email}


@app.post("/api/auth/signout")
def signout(response: Response):
    response.delete_cookie("auth_token")
    return {"message": "Signed out"}


@app.get("/api/auth/me")
def me(current_user=Depends(get_current_user)):
    return current_user


# ---------------------------------------------------------------------------
# Document routes
# ---------------------------------------------------------------------------

class DocumentCreate(BaseModel):
    title: str
    document_type: str
    content: str
    fields: dict = {}


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    fields: Optional[dict] = None


@app.get("/api/documents")
def list_documents(current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, title, document_type, created_at, updated_at FROM documents WHERE user_id = ? ORDER BY updated_at DESC",
            (current_user["id"],),
        ).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@app.post("/api/documents", status_code=201)
def create_document(body: DocumentCreate, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO documents (user_id, title, document_type, content, fields) VALUES (?, ?, ?, ?, ?)",
            (current_user["id"], body.title, body.document_type, body.content, json.dumps(body.fields)),
        )
        conn.commit()
        doc_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    finally:
        conn.close()
    result = dict(row)
    result["fields"] = json.loads(result["fields"])
    return result


@app.get("/api/documents/{doc_id}")
def get_document(doc_id: int, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM documents WHERE id = ? AND user_id = ?",
            (doc_id, current_user["id"]),
        ).fetchone()
    finally:
        conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    result = dict(row)
    result["fields"] = json.loads(result["fields"])
    return result


@app.put("/api/documents/{doc_id}")
def update_document(doc_id: int, body: DocumentUpdate, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM documents WHERE id = ? AND user_id = ?",
            (doc_id, current_user["id"]),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")

        updates = {}
        if body.title is not None:
            updates["title"] = body.title
        if body.content is not None:
            updates["content"] = body.content
        if body.fields is not None:
            updates["fields"] = json.dumps(body.fields)
        updates["updated_at"] = "CURRENT_TIMESTAMP"

        if updates:
            set_clause = ", ".join(
                f"{k} = {v}" if k == "updated_at" else f"{k} = ?"
                for k, v in updates.items()
            )
            values = [v for k, v in updates.items() if k != "updated_at"]
            values.append(doc_id)
            conn.execute(f"UPDATE documents SET {set_clause} WHERE id = ?", values)
            conn.commit()

        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    finally:
        conn.close()
    result = dict(row)
    result["fields"] = json.loads(result["fields"])
    return result


@app.delete("/api/documents/{doc_id}", status_code=204)
def delete_document(doc_id: int, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id FROM documents WHERE id = ? AND user_id = ?",
            (doc_id, current_user["id"]),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Chat routes
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    documentType: Optional[str] = None
    fields: dict = {}


class PreviewRequest(BaseModel):
    documentType: str
    fields: dict = {}


@app.get("/api/chat/greeting")
def chat_greeting():
    return {"message": GREETING}


@app.post("/api/chat/message")
def chat_message(body: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    try:
        result = process_message(messages, body.documentType, body.fields)
        return {
            "message": result.assistantMessage,
            "documentType": result.documentType,
            "fields": result.fields,
            "isComplete": result.isComplete,
            "unsupported": result.unsupported,
            "suggestedType": result.suggestedType,
        }
    except Exception as e:
        logger.error("Chat error: %s", e, exc_info=True)
        return {
            "message": "I'm having trouble connecting to my AI service right now. Please check that the OPENROUTER_API_KEY is set and try again.",
            "documentType": body.documentType,
            "fields": body.fields,
            "isComplete": False,
            "unsupported": False,
            "suggestedType": None,
        }


@app.post("/api/document/preview")
def document_preview(body: PreviewRequest):
    info = DOCUMENT_CATALOG.get(body.documentType)
    if not info:
        raise HTTPException(status_code=404, detail=f"Unknown document type: {body.documentType}")
    html = render_html(body.documentType, body.fields, info["template_field_map"])
    return {"html": html}


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Serve static Next.js export (must be last)
# ---------------------------------------------------------------------------

if os.path.isdir(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
else:
    @app.get("/")
    def root():
        return {"message": "PreLegal API — frontend not built yet"}
