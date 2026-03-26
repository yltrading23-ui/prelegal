"""
Tests for chat endpoints.  The LLM is mocked so no real API calls are made.

Run with:  pytest backend/test_chat.py -v
"""
import json
import os
import tempfile
from unittest.mock import MagicMock, patch

import pytest

# Env setup before imports
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DB_PATH"] = _tmp.name
os.environ["STATIC_DIR"] = ""

from fastapi.testclient import TestClient
from chat import GREETING, NDAFields, process_message
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
# GET /api/chat/greeting
# ---------------------------------------------------------------------------

def test_greeting_returns_message():
    r = client.get("/api/chat/greeting")
    assert r.status_code == 200
    body = r.json()
    assert "message" in body
    assert len(body["message"]) > 10
    # Should mention NDA
    assert "NDA" in body["message"] or "nda" in body["message"].lower()


def test_greeting_content_matches_constant():
    r = client.get("/api/chat/greeting")
    assert r.json()["message"] == GREETING


# ---------------------------------------------------------------------------
# POST /api/chat/message — mocked LLM
# ---------------------------------------------------------------------------

def _make_llm_response(fields: dict, message: str, is_complete: bool = False) -> MagicMock:
    """Build a mock litellm completion response returning NDAFields JSON."""
    payload = NDAFields(**fields, assistantMessage=message, isComplete=is_complete)
    mock_response = MagicMock()
    mock_response.choices[0].message.content = payload.model_dump_json()
    return mock_response


@patch("chat.completion")
def test_chat_message_returns_fields(mock_completion):
    mock_completion.return_value = _make_llm_response(
        {"purpose": "Evaluating a partnership"},
        "Great! What is the effective date of this agreement?",
    )
    r = client.post("/api/chat/message", json={
        "messages": [{"role": "user", "content": "We want to explore a partnership."}],
        "fields": {},
    })
    assert r.status_code == 200
    body = r.json()
    assert body["message"] == "Great! What is the effective date of this agreement?"
    assert body["fields"]["purpose"] == "Evaluating a partnership"
    assert body["isComplete"] is False


@patch("chat.completion")
def test_chat_message_preserves_existing_fields(mock_completion):
    """Fields from a previous turn must be retained even if the LLM omits them."""
    mock_completion.return_value = _make_llm_response(
        {"effectiveDate": "2026-01-01"},  # LLM only returns new field
        "Got it! Who are the parties involved?",
    )
    r = client.post("/api/chat/message", json={
        "messages": [
            {"role": "user", "content": "We want to explore a partnership."},
            {"role": "assistant", "content": "What's the effective date?"},
            {"role": "user", "content": "January 1st 2026"},
        ],
        "fields": {"purpose": "Evaluating a partnership"},  # pre-existing
    })
    assert r.status_code == 200
    body = r.json()
    # Both old and new fields should be present
    assert body["fields"]["purpose"] == "Evaluating a partnership"
    assert body["fields"]["effectiveDate"] == "2026-01-01"


@patch("chat.completion")
def test_chat_message_complete(mock_completion):
    all_fields = {
        "purpose": "Evaluating a partnership",
        "effectiveDate": "2026-01-01",
        "mndaTermType": "expires",
        "mndaTermYears": "2",
        "confidentialityType": "years",
        "confidentialityYears": "3",
        "governingLaw": "Delaware",
        "jurisdiction": "courts in New Castle County, Delaware",
        "modifications": None,
        "party1Name": "Alice Smith",
        "party1Title": "CEO",
        "party1Company": "AlphaCorp",
        "party1Address": "alice@alphacorp.com",
        "party2Name": "Bob Jones",
        "party2Title": "CTO",
        "party2Company": "BetaCo",
        "party2Address": "bob@betaco.com",
    }
    mock_completion.return_value = _make_llm_response(
        all_fields,
        "Your Mutual NDA is ready! You can download it now.",
        is_complete=True,
    )
    r = client.post("/api/chat/message", json={
        "messages": [{"role": "user", "content": "That's everything."}],
        "fields": all_fields,
    })
    assert r.status_code == 200
    body = r.json()
    assert body["isComplete"] is True
    assert body["fields"]["party1Name"] == "Alice Smith"


@patch("chat.completion")
def test_chat_message_empty_messages(mock_completion):
    mock_completion.return_value = _make_llm_response(
        {}, "What would you like to do?",
    )
    r = client.post("/api/chat/message", json={"messages": [], "fields": {}})
    assert r.status_code == 200


# ---------------------------------------------------------------------------
# Unit tests for process_message field merging
# ---------------------------------------------------------------------------

@patch("chat.completion")
def test_process_message_merges_fields(mock_completion):
    """process_message should merge new fields with existing ones."""
    mock_completion.return_value = _make_llm_response(
        {"party1Name": "Alice"},
        "Who is Party 2?",
    )
    existing = {"purpose": "Partnership evaluation", "effectiveDate": "2026-03-01"}
    result = process_message(
        [{"role": "user", "content": "Party 1 is Alice."}],
        existing,
    )
    assert result.purpose == "Partnership evaluation"
    assert result.effectiveDate == "2026-03-01"
    assert result.party1Name == "Alice"
    assert result.assistantMessage == "Who is Party 2?"
