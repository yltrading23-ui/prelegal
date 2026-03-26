import os
from typing import Literal, Optional

from litellm import completion
from pydantic import BaseModel

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are a friendly legal assistant helping the user create a Mutual Non-Disclosure Agreement (Mutual NDA) based on Common Paper Standard Terms Version 1.0.

Your job is to:
1. Ask conversational questions to gather all required NDA fields
2. Extract field values from the user's responses and include them in your structured response
3. Ask 1-2 questions at a time — not all at once
4. When a field is unclear, ask a follow-up question
5. When all required fields are gathered, confirm with the user and set isComplete to true

Fields you need to gather:
- purpose: How confidential information may be used (e.g. "Evaluating a potential business partnership")
- effectiveDate: Agreement start date in YYYY-MM-DD format
- mndaTermType: "expires" (fixed duration) or "continuous" (until terminated)
- mndaTermYears: Number of years if mndaTermType is "expires"
- confidentialityType: "years" (fixed period) or "perpetuity"
- confidentialityYears: Number of years if confidentialityType is "years"
- governingLaw: State whose laws govern (e.g. "Delaware")
- jurisdiction: Where disputes are resolved (e.g. "courts in New Castle County, Delaware")
- modifications: Any modifications to standard terms, or null if none
- party1Name, party1Title, party1Company, party1Address: Party 1 details
- party2Name, party2Title, party2Company, party2Address: Party 2 details

In assistantMessage, write only your conversational reply to the user. Do not include field labels or JSON in the message.
Keep responses concise and friendly. Retain previously gathered fields — always include them unchanged in your response."""

GREETING = (
    "Hi! I'm here to help you create a Mutual Non-Disclosure Agreement (Mutual NDA) "
    "based on Common Paper Standard Terms.\n\n"
    "Let's start with the basics — what's the purpose of this NDA? "
    "For example: evaluating a potential partnership, discussing a potential acquisition, etc."
)


class NDAFields(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[Literal["expires", "continuous"]] = None
    mndaTermYears: Optional[str] = None
    confidentialityType: Optional[Literal["years", "perpetuity"]] = None
    confidentialityYears: Optional[str] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None
    party1Name: Optional[str] = None
    party1Title: Optional[str] = None
    party1Company: Optional[str] = None
    party1Address: Optional[str] = None
    party2Name: Optional[str] = None
    party2Title: Optional[str] = None
    party2Company: Optional[str] = None
    party2Address: Optional[str] = None
    isComplete: bool = False
    assistantMessage: str = ""


def process_message(messages: list[dict], current_fields: dict) -> NDAFields:
    gathered = "\n".join(
        f"  {k}: {v}" for k, v in current_fields.items() if v is not None and v != ""
    ) or "  (none gathered yet)"

    system = SYSTEM_PROMPT + f"\n\nFields gathered so far:\n{gathered}"
    full_messages = [{"role": "system", "content": system}] + messages

    response = completion(
        model=MODEL,
        messages=full_messages,
        response_format=NDAFields,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    raw = response.choices[0].message.content
    result = NDAFields.model_validate_json(raw)

    # Preserve existing fields if the model omitted them
    merged = {**current_fields}
    for field, value in result.model_dump(exclude={"assistantMessage", "isComplete"}).items():
        if value is not None:
            merged[field] = value

    return NDAFields(
        **merged,
        isComplete=result.isComplete,
        assistantMessage=result.assistantMessage,
    )
