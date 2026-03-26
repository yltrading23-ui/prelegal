"""
Unit and integration tests for PreLegal backend API.

Run with:  pytest backend/test_main.py -v
Requires:  pip install pytest httpx fastapi[all]
"""
import os
import tempfile
import pytest

# Point the DB to a temp file so tests don't touch production data
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DB_PATH"] = _tmp.name
os.environ["STATIC_DIR"] = ""  # skip static mount in tests

from fastapi.testclient import TestClient
from database import init_db
from main import app

client = TestClient(app, raise_server_exceptions=True)


@pytest.fixture(autouse=True)
def reset_db():
    """Re-create the schema before every test."""
    import sqlite3
    conn = sqlite3.connect(_tmp.name)
    conn.executescript("DROP TABLE IF EXISTS documents; DROP TABLE IF EXISTS users;")
    conn.commit()
    conn.close()
    init_db()
    yield


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# Auth – signup
# ---------------------------------------------------------------------------

def test_signup_success():
    r = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "secret"})
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "a@example.com"
    assert "id" in body
    assert "auth_token" in r.cookies


def test_signup_duplicate_email():
    client.post("/api/auth/signup", json={"email": "dup@example.com", "password": "pw"})
    r = client.post("/api/auth/signup", json={"email": "dup@example.com", "password": "pw"})
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# Auth – signin
# ---------------------------------------------------------------------------

def test_signin_success():
    client.post("/api/auth/signup", json={"email": "b@example.com", "password": "pass"})
    r = client.post("/api/auth/signin", json={"email": "b@example.com", "password": "pass"})
    assert r.status_code == 200
    assert "auth_token" in r.cookies


def test_signin_wrong_password():
    client.post("/api/auth/signup", json={"email": "c@example.com", "password": "right"})
    r = client.post("/api/auth/signin", json={"email": "c@example.com", "password": "wrong"})
    assert r.status_code == 401


def test_signin_unknown_email():
    r = client.post("/api/auth/signin", json={"email": "nobody@example.com", "password": "pw"})
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Auth – me / signout
# ---------------------------------------------------------------------------

def test_me_authenticated():
    client.post("/api/auth/signup", json={"email": "d@example.com", "password": "pw"})
    r = client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "d@example.com"


def test_me_unauthenticated():
    # Fresh client with no cookies
    from fastapi.testclient import TestClient as TC
    fresh = TC(app)
    r = fresh.get("/api/auth/me")
    assert r.status_code == 401


def test_signout():
    client.post("/api/auth/signup", json={"email": "e@example.com", "password": "pw"})
    r = client.post("/api/auth/signout")
    assert r.status_code == 200
    r2 = client.get("/api/auth/me")
    assert r2.status_code == 401


# ---------------------------------------------------------------------------
# Documents CRUD
# ---------------------------------------------------------------------------

def _auth_client():
    client.post("/api/auth/signup", json={"email": "user@example.com", "password": "pw"})
    return client


def test_create_and_list_document():
    c = _auth_client()
    r = c.post("/api/documents", json={
        "title": "My NDA",
        "document_type": "Mutual NDA",
        "content": "<p>NDA content</p>",
        "fields": {"party1Name": "Alice"},
    })
    assert r.status_code == 201
    doc = r.json()
    assert doc["title"] == "My NDA"
    assert doc["fields"]["party1Name"] == "Alice"

    r2 = c.get("/api/documents")
    assert r2.status_code == 200
    assert len(r2.json()) == 1


def test_get_document():
    c = _auth_client()
    created = c.post("/api/documents", json={
        "title": "Doc", "document_type": "Mutual NDA", "content": "x", "fields": {},
    }).json()
    r = c.get(f"/api/documents/{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]


def test_update_document():
    c = _auth_client()
    created = c.post("/api/documents", json={
        "title": "Old", "document_type": "Mutual NDA", "content": "x", "fields": {},
    }).json()
    r = c.put(f"/api/documents/{created['id']}", json={"title": "New"})
    assert r.status_code == 200
    assert r.json()["title"] == "New"


def test_delete_document():
    c = _auth_client()
    created = c.post("/api/documents", json={
        "title": "Bye", "document_type": "Mutual NDA", "content": "x", "fields": {},
    }).json()
    r = c.delete(f"/api/documents/{created['id']}")
    assert r.status_code == 204
    r2 = c.get(f"/api/documents/{created['id']}")
    assert r2.status_code == 404


def test_document_isolation():
    """User A cannot access User B's documents."""
    from fastapi.testclient import TestClient as TC

    clientA = TC(app)
    clientA.post("/api/auth/signup", json={"email": "userA@example.com", "password": "pw"})
    docA = clientA.post("/api/documents", json={
        "title": "A doc", "document_type": "Mutual NDA", "content": "x", "fields": {},
    }).json()

    clientB = TC(app)
    clientB.post("/api/auth/signup", json={"email": "userB@example.com", "password": "pw"})
    r = clientB.get(f"/api/documents/{docA['id']}")
    assert r.status_code == 404
