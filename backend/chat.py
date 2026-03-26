import os
from typing import Optional

from litellm import completion
from pydantic import BaseModel

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

GREETING = (
    "Hi! I'm here to help you create a legal document. I support the following:\n\n"
    "• **Mutual NDA** — confidential information sharing\n"
    "• **Cloud Service Agreement** — SaaS/cloud services\n"
    "• **Design Partner Agreement** — early-access design partnership\n"
    "• **Service Level Agreement** — uptime and support targets\n"
    "• **Professional Services Agreement** — consulting/SOW-based services\n"
    "• **Data Processing Agreement** — GDPR-compliant data processing\n"
    "• **Partnership Agreement** — business partnership terms\n"
    "• **Software License Agreement** — on-premise software licensing\n"
    "• **Pilot Agreement** — time-limited product evaluation\n"
    "• **Business Associate Agreement** — HIPAA-compliant BAA\n"
    "• **AI Addendum** — AI/ML services addendum\n\n"
    "What type of document would you like to create, or describe what you need?"
)

# ---------------------------------------------------------------------------
# Document catalog
# ---------------------------------------------------------------------------

DOCUMENT_CATALOG: dict[str, dict] = {
    "Mutual NDA": {
        "description": "Mutual non-disclosure agreement for confidential information sharing",
        "template_file": "Mutual-NDA-coverpage.md",
        "field_descriptions": {
            "purpose": "Purpose of the NDA (e.g. 'evaluating a potential business partnership')",
            "effectiveDate": "Effective date (YYYY-MM-DD)",
            "mndaTerm": "Duration of the MNDA (e.g. '1 year', '2 years', or 'until terminated')",
            "termOfConfidentiality": "How long confidential info is protected (e.g. '2 years' or 'in perpetuity')",
            "governingLaw": "State whose laws govern (e.g. 'Delaware')",
            "jurisdiction": "Courts for disputes (e.g. 'courts in New Castle County, Delaware')",
            "party1Name": "Party 1 full name",
            "party1Title": "Party 1 title",
            "party1Company": "Party 1 company",
            "party1Address": "Party 1 notice address",
            "party2Name": "Party 2 full name",
            "party2Title": "Party 2 title",
            "party2Company": "Party 2 company",
            "party2Address": "Party 2 notice address",
        },
        "template_field_map": {
            "Purpose": "purpose",
            "Effective Date": "effectiveDate",
            "MNDA Term": "mndaTerm",
            "Term of Confidentiality": "termOfConfidentiality",
            "Governing Law": "governingLaw",
            "Jurisdiction": "jurisdiction",
        },
    },
    "Cloud Service Agreement": {
        "description": "SaaS and cloud service agreement between a software provider and customer",
        "template_file": "CSA.md",
        "field_descriptions": {
            "provider": "Provider (vendor) company name",
            "customer": "Customer company name",
            "effectiveDate": "Effective date (YYYY-MM-DD)",
            "subscriptionPeriod": "Subscription period (e.g. '12 months')",
            "generalCapAmount": "General liability cap (e.g. 'fees paid in the prior 12 months')",
            "governingLaw": "Governing state law",
            "chosenCourts": "Courts for disputes",
        },
        "template_field_map": {
            "Provider": "provider",
            "Customer": "customer",
            "Effective Date": "effectiveDate",
            "Subscription Period": "subscriptionPeriod",
            "General Cap Amount": "generalCapAmount",
            "Governing Law": "governingLaw",
            "Chosen Courts": "chosenCourts",
        },
    },
    "Design Partner Agreement": {
        "description": "Early-access design partnership agreement",
        "template_file": "design-partner-agreement.md",
        "field_descriptions": {
            "provider": "Provider company name",
            "partner": "Design partner company name",
            "effectiveDate": "Effective date (YYYY-MM-DD)",
            "term": "Agreement term/duration",
            "program": "Name of the design partner program",
            "fees": "Fees payable (or 'None')",
            "governingLaw": "Governing state law",
            "chosenCourts": "Courts for disputes",
            "noticeAddress": "Notice address for communications",
        },
        "template_field_map": {
            "Provider": "provider",
            "Partner": "partner",
            "Effective Date": "effectiveDate",
            "Term": "term",
            "Program": "program",
            "Fees": "fees",
            "Governing Law": "governingLaw",
            "Chosen Courts": "chosenCourts",
            "Notice Address": "noticeAddress",
        },
    },
    "Service Level Agreement": {
        "description": "SLA specifying uptime targets and support response times",
        "template_file": "sla.md",
        "field_descriptions": {
            "provider": "Provider company name",
            "customer": "Customer company name",
            "targetUptime": "Target uptime percentage (e.g. '99.9%')",
            "targetResponseTime": "Target support response time (e.g. '4 business hours')",
            "supportChannel": "Support channel (e.g. 'email', 'ticketing system')",
            "uptimeCredit": "Credit for uptime SLA breaches (e.g. '10% of monthly fees')",
        },
        "template_field_map": {
            "Provider": "provider",
            "Customer": "customer",
            "Target Uptime": "targetUptime",
            "Target Response Time": "targetResponseTime",
            "Support Channel": "supportChannel",
            "Uptime Credit": "uptimeCredit",
        },
    },
    "Professional Services Agreement": {
        "description": "SOW-based professional/consulting services agreement",
        "template_file": "psa.md",
        "field_descriptions": {
            "provider": "Service provider company name",
            "customer": "Customer company name",
            "effectiveDate": "Effective date (YYYY-MM-DD)",
            "fees": "Fees for the services",
            "paymentPeriod": "Payment period (e.g. '30 days')",
            "generalCapAmount": "General liability cap amount",
            "governingLaw": "Governing state law",
            "chosenCourts": "Courts for disputes",
        },
        "template_field_map": {
            "Provider": "provider",
            "Customer": "customer",
            "Effective Date": "effectiveDate",
            "Fees": "fees",
            "Payment Period": "paymentPeriod",
            "General Cap Amount": "generalCapAmount",
            "Governing Law": "governingLaw",
            "Chosen Courts": "chosenCourts",
        },
    },
    "Data Processing Agreement": {
        "description": "GDPR-compliant DPA between a data controller and processor",
        "template_file": "DPA.md",
        "field_descriptions": {
            "provider": "Data processor (provider) company name",
            "customer": "Data controller (customer) company name",
            "categoriesOfPersonalData": "Categories of personal data processed",
            "categoriesOfDataSubjects": "Categories of data subjects",
            "natureAndPurposeOfProcessing": "Nature and purpose of data processing",
            "durationOfProcessing": "Duration of data processing",
            "governingMemberState": "EU member state whose law governs",
        },
        "template_field_map": {
            "Provider": "provider",
            "Customer": "customer",
            "Categories of Personal Data": "categoriesOfPersonalData",
            "Categories of Data Subjects": "categoriesOfDataSubjects",
            "Nature and Purpose of Processing": "natureAndPurposeOfProcessing",
            "Duration of Processing": "durationOfProcessing",
            "Governing Member State": "governingMemberState",
        },
    },
    "Partnership Agreement": {
        "description": "Business partnership agreement defining obligations and revenue sharing",
        "template_file": "Partnership-Agreement.md",
        "field_descriptions": {
            "provider": "Company (product/service side) name",
            "partner": "Partner company name",
            "effectiveDate": "Effective date (YYYY-MM-DD)",
            "obligations": "Partner's key obligations",
            "paymentSchedule": "Payment schedule and process",
            "territory": "Territory covered by the partnership",
            "endDate": "Agreement end date (YYYY-MM-DD)",
            "governingLaw": "Governing state law",
            "chosenCourts": "Courts for disputes",
        },
        "template_field_map": {
            "Effective Date": "effectiveDate",
            "Obligations": "obligations",
            "Payment Schedule": "paymentSchedule",
            "Territory": "territory",
            "End Date": "endDate",
            "Governing Law": "governingLaw",
            "Chosen Courts": "chosenCourts",
        },
    },
    "Software License Agreement": {
        "description": "On-premise software license agreement",
        "template_file": "Software-License-Agreement.md",
        "field_descriptions": {
            "provider": "Software licensor (provider) company name",
            "customer": "Licensee (customer) company name",
            "effectiveDate": "Effective date (YYYY-MM-DD)",
            "subscriptionPeriod": "License period",
            "permittedUses": "Permitted uses of the software",
            "licenseLimits": "License limits (e.g. '50 users')",
            "generalCapAmount": "General liability cap",
            "governingLaw": "Governing state law",
            "chosenCourts": "Courts for disputes",
        },
        "template_field_map": {
            "Provider": "provider",
            "Customer": "customer",
            "Effective Date": "effectiveDate",
            "Subscription Period": "subscriptionPeriod",
            "Permitted Uses": "permittedUses",
            "License Limits": "licenseLimits",
            "General Cap Amount": "generalCapAmount",
            "Governing Law": "governingLaw",
            "Chosen Courts": "chosenCourts",
        },
    },
    "Pilot Agreement": {
        "description": "Time-limited product evaluation/pilot agreement",
        "template_file": "Pilot-Agreement.md",
        "field_descriptions": {
            "provider": "Provider company name",
            "customer": "Customer company name",
            "effectiveDate": "Effective date (YYYY-MM-DD)",
            "pilotPeriod": "Pilot duration (e.g. '90 days', '3 months')",
            "evaluationPurposes": "Purpose of the product evaluation",
            "generalCapAmount": "General liability cap amount",
            "governingLaw": "Governing state law",
            "chosenCourts": "Courts for disputes",
            "noticeAddress": "Notice address for communications",
        },
        "template_field_map": {
            "Provider": "provider",
            "Customer": "customer",
            "Effective Date": "effectiveDate",
            "Pilot Period": "pilotPeriod",
            "Evaluation Purposes": "evaluationPurposes",
            "General Cap Amount": "generalCapAmount",
            "Governing Law": "governingLaw",
            "Chosen Courts": "chosenCourts",
            "Notice Address": "noticeAddress",
        },
    },
    "Business Associate Agreement": {
        "description": "HIPAA-compliant BAA between a covered entity and business associate",
        "template_file": "BAA.md",
        "field_descriptions": {
            "provider": "Business associate (provider) company name",
            "company": "Covered entity (company) name",
            "limitations": "Limitations on use of PHI",
            "breachNotificationPeriod": "Breach notification period (e.g. '30 days')",
            "baaEffectiveDate": "BAA effective date (YYYY-MM-DD)",
            "agreement": "Name of the underlying services agreement",
        },
        "template_field_map": {
            "Provider": "provider",
            "Company": "company",
            "Limitations": "limitations",
            "Breach Notification Period": "breachNotificationPeriod",
            "BAA Effective Date": "baaEffectiveDate",
            "Agreement": "agreement",
        },
    },
    "AI Addendum": {
        "description": "Addendum governing AI/ML service usage, training data, and model improvement",
        "template_file": "AI-Addendum.md",
        "field_descriptions": {
            "provider": "AI service provider company name",
            "customer": "Customer company name",
            "trainingData": "May customer data be used for training? (Yes / No)",
            "trainingPurposes": "Permitted training purposes (if training allowed)",
            "trainingRestrictions": "Restrictions on training data use",
            "improvementRestrictions": "Restrictions on model improvement",
        },
        "template_field_map": {
            "Provider": "provider",
            "Customer": "customer",
            "Training Data": "trainingData",
            "Training Purposes": "trainingPurposes",
            "Training Restrictions": "trainingRestrictions",
            "Improvement Restrictions": "improvementRestrictions",
        },
    },
}

SUPPORTED_TYPE_LIST = "\n".join(
    f'- "{name}": {info["description"]}' for name, info in DOCUMENT_CATALOG.items()
)

# ---------------------------------------------------------------------------
# Response model
# ---------------------------------------------------------------------------

class DocumentResponse(BaseModel):
    documentType: Optional[str] = None
    fields: dict = {}
    isComplete: bool = False
    assistantMessage: str = ""
    unsupported: bool = False
    suggestedType: Optional[str] = None


# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

_DETECTION_PROMPT = f"""You are a legal document assistant.

Supported document types:
{SUPPORTED_TYPE_LIST}

From the conversation, determine which document type the user wants.
- If supported: set documentType to the exact name from the list and start asking about the first 1-2 required fields.
- If unsupported: set unsupported=true, explain we cannot generate that document, and set suggestedType to the closest supported document.
- If unclear: ask a clarifying question (leave documentType null).

Respond ONLY with valid JSON matching the DocumentResponse schema. Keep assistantMessage conversational and concise."""


def _field_gathering_prompt(doc_type: str, fields: dict) -> str:
    info = DOCUMENT_CATALOG[doc_type]
    remaining = {
        k: v for k, v in info["field_descriptions"].items()
        if not fields.get(k)
    }
    gathered = {k: v for k, v in fields.items() if v}

    gathered_text = "\n".join(f"  {k}: {v}" for k, v in gathered.items()) or "  (none yet)"
    remaining_text = "\n".join(f"  {k}: {v}" for k, v in remaining.items()) or "  (all gathered!)"

    return f"""You are helping create a {doc_type}.

Fields gathered so far:
{gathered_text}

Fields still needed:
{remaining_text}

Ask about 1-2 missing fields at a time in a friendly, conversational way.
When all fields are gathered, set isComplete=true and confirm the document is ready.
Always include ALL previously gathered fields unchanged in the response.
Respond ONLY with valid JSON matching the DocumentResponse schema."""


# ---------------------------------------------------------------------------
# Main function
# ---------------------------------------------------------------------------

def process_message(messages: list[dict], doc_type: Optional[str], current_fields: dict) -> DocumentResponse:
    if doc_type and doc_type in DOCUMENT_CATALOG:
        system = _field_gathering_prompt(doc_type, current_fields)
    else:
        system = _DETECTION_PROMPT

    full_messages = [{"role": "system", "content": system}] + messages

    response = completion(
        model=MODEL,
        messages=full_messages,
        response_format=DocumentResponse,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    raw = response.choices[0].message.content
    result = DocumentResponse.model_validate_json(raw)

    # Merge: preserve existing fields, overlay new non-null values
    merged_fields = {**current_fields}
    for k, v in result.fields.items():
        if v is not None:
            merged_fields[k] = v

    return DocumentResponse(
        documentType=result.documentType or doc_type,
        fields=merged_fields,
        isComplete=result.isComplete,
        assistantMessage=result.assistantMessage,
        unsupported=result.unsupported,
        suggestedType=result.suggestedType,
    )
