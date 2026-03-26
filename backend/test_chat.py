"""
Tests for chat and document preview endpoints.
The LLM is mocked so no real API calls are made.

Run with:  pytest backend/test_chat.py -v
"""
import json
import os
import tempfile
from unittest.mock import MagicMock, patch

import pytest

_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DB_PATH"] = _tmp.name
os.environ["STATIC_DIR"] = ""

from fastapi.testclient import TestClient
from chat import DOCUMENT_CATALOG, GREETING, DocumentResponse, process_message
from database import init_db
from main import app

client = TestClient(app, raise_server_exceptions=True)


@pytest.fixture(autouse=True)
def reset_db():
    import sqlite3
    conn = sqlite3.connect(_tmp.name)
    conn.executescript("DROP TABLE IF EXISTS documents; DROP TABLE IF EXISTS users;")
    conn.commit()
    conn.close()
    init_db()
    yield


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_response(doc_type=None, fields=None, message="Next question?",
                   is_complete=False, unsupported=False, suggested=None) -> MagicMock:
    payload = DocumentResponse(
        documentType=doc_type,
        fields=fields or {},
        assistantMessage=message,
        isComplete=is_complete,
        unsupported=unsupported,
        suggestedType=suggested,
    )
    mock = MagicMock()
    mock.choices[0].message.content = payload.model_dump_json()
    return mock


# ---------------------------------------------------------------------------
# GET /api/chat/greeting
# ---------------------------------------------------------------------------

def test_greeting_returns_message():
    r = client.get("/api/chat/greeting")
    assert r.status_code == 200
    assert "message" in r.json()
    assert len(r.json()["message"]) > 10


def test_greeting_matches_constant():
    assert client.get("/api/chat/greeting").json()["message"] == GREETING


def test_greeting_lists_supported_types():
    msg = client.get("/api/chat/greeting").json()["message"]
    assert "Mutual NDA" in msg
    assert "Pilot Agreement" in msg


# ---------------------------------------------------------------------------
# POST /api/chat/message — document type detection
# ---------------------------------------------------------------------------

@patch("chat.completion")
def test_detects_document_type(mock_completion):
    mock_completion.return_value = _mock_response(
        doc_type="Pilot Agreement",
        message="Great! What is the effective date for this pilot?",
    )
    r = client.post("/api/chat/message", json={
        "messages": [{"role": "user", "content": "I need a pilot agreement"}],
        "documentType": None,
        "fields": {},
    })
    assert r.status_code == 200
    body = r.json()
    assert body["documentType"] == "Pilot Agreement"
    assert body["isComplete"] is False


@patch("chat.completion")
def test_unsupported_document_type(mock_completion):
    mock_completion.return_value = _mock_response(
        unsupported=True,
        suggested="Pilot Agreement",
        message="I can't create an employment contract, but the closest I support is a Pilot Agreement.",
    )
    r = client.post("/api/chat/message", json={
        "messages": [{"role": "user", "content": "I need an employment contract"}],
        "documentType": None,
        "fields": {},
    })
    assert r.status_code == 200
    body = r.json()
    assert body["unsupported"] is True
    assert body["suggestedType"] == "Pilot Agreement"


# ---------------------------------------------------------------------------
# POST /api/chat/message — field gathering
# ---------------------------------------------------------------------------

@patch("chat.completion")
def test_field_gathering_returns_fields(mock_completion):
    mock_completion.return_value = _mock_response(
        doc_type="Pilot Agreement",
        fields={"provider": "Acme Corp", "customer": "Beta Ltd"},
        message="What is the pilot period?",
    )
    r = client.post("/api/chat/message", json={
        "messages": [{"role": "user", "content": "Provider is Acme Corp, customer is Beta Ltd"}],
        "documentType": "Pilot Agreement",
        "fields": {},
    })
    assert r.status_code == 200
    body = r.json()
    assert body["fields"]["provider"] == "Acme Corp"
    assert body["fields"]["customer"] == "Beta Ltd"


@patch("chat.completion")
def test_fields_preserved_across_turns(mock_completion):
    mock_completion.return_value = _mock_response(
        doc_type="Pilot Agreement",
        fields={"pilotPeriod": "90 days"},
        message="What governing law applies?",
    )
    r = client.post("/api/chat/message", json={
        "messages": [{"role": "user", "content": "90 days"}],
        "documentType": "Pilot Agreement",
        "fields": {"provider": "Acme Corp", "customer": "Beta Ltd"},
    })
    body = r.json()
    assert body["fields"]["provider"] == "Acme Corp"   # preserved
    assert body["fields"]["pilotPeriod"] == "90 days"   # new


@patch("chat.completion")
def test_completion_flag(mock_completion):
    full_fields = {
        "provider": "Acme", "customer": "Beta", "effectiveDate": "2026-04-01",
        "pilotPeriod": "90 days", "evaluationPurposes": "Test the product",
        "generalCapAmount": "$50,000", "governingLaw": "Delaware",
        "chosenCourts": "courts in Delaware", "noticeAddress": "legal@acme.com",
    }
    mock_completion.return_value = _mock_response(
        doc_type="Pilot Agreement",
        fields=full_fields,
        message="Your Pilot Agreement is ready to download!",
        is_complete=True,
    )
    r = client.post("/api/chat/message", json={
        "messages": [{"role": "user", "content": "legal@acme.com"}],
        "documentType": "Pilot Agreement",
        "fields": full_fields,
    })
    body = r.json()
    assert body["isComplete"] is True


# ---------------------------------------------------------------------------
# POST /api/document/preview
# ---------------------------------------------------------------------------

def test_preview_unknown_type():
    r = client.post("/api/document/preview", json={
        "documentType": "Fake Agreement",
        "fields": {},
    })
    assert r.status_code == 404


def test_preview_returns_html():
    r = client.post("/api/document/preview", json={
        "documentType": "Pilot Agreement",
        "fields": {"provider": "Acme Corp", "customer": "Beta Ltd"},
    })
    assert r.status_code == 200
    html = r.json()["html"]
    assert "<html" in html
    assert "Acme Corp" in html   # filled value appears
    assert "Pilot Period" in html  # unfilled placeholder appears


def test_preview_all_supported_types():
    """Every document type in the catalog must render without error."""
    from chat import DOCUMENT_CATALOG
    for doc_type in DOCUMENT_CATALOG:
        r = client.post("/api/document/preview", json={"documentType": doc_type, "fields": {}})
        assert r.status_code == 200, f"Preview failed for {doc_type}"
        assert "<html" in r.json()["html"]


# ---------------------------------------------------------------------------
# Unit — process_message field merging
# ---------------------------------------------------------------------------

@patch("chat.completion")
def test_process_message_merges_fields(mock_completion):
    mock_completion.return_value = _mock_response(
        doc_type="Mutual NDA",
        fields={"party1Name": "Alice"},
        message="Who is Party 2?",
    )
    result = process_message(
        [{"role": "user", "content": "Party 1 is Alice."}],
        "Mutual NDA",
        {"purpose": "Evaluating partnership"},
    )
    assert result.fields["purpose"] == "Evaluating partnership"
    assert result.fields["party1Name"] == "Alice"
    assert result.fields["purpose"] == "Evaluating partnership"


# ---------------------------------------------------------------------------
# Catalog sanity checks
# ---------------------------------------------------------------------------

def test_catalog_has_all_expected_types():
    expected = {
        "Mutual NDA", "Cloud Service Agreement", "Design Partner Agreement",
        "Service Level Agreement", "Professional Services Agreement",
        "Data Processing Agreement", "Partnership Agreement",
        "Software License Agreement", "Pilot Agreement",
        "Business Associate Agreement", "AI Addendum",
    }
    assert expected == set(DOCUMENT_CATALOG.keys())


def test_catalog_entries_have_required_keys():
    for name, info in DOCUMENT_CATALOG.items():
        assert "description" in info, name
        assert "template_file" in info, name
        assert "field_descriptions" in info, name
        assert "template_field_map" in info, name
