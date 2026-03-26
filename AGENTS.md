# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation has a working AI chat interface for all 11 supported legal document types. The AI detects the document type from user intent, gathers fields via Structured Outputs, and populates a live document preview. Unsupported document types are handled gracefully with a suggestion for the closest supported alternative.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
The frontend is statically built (`output: 'export'`) and served by FastAPI from the `/app/static` directory.
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (DEV-5)
- Mutual NDA creator Next.js frontend with live preview and HTML download (form-based, superseded by DEV-7)

### Completed (DEV-6)
- Docker multi-stage build (Node frontend build stage + Python runtime stage)
- FastAPI backend (`backend/`) as a uv project with SQLite (fresh DB each container start)
- Next.js static export (`output: 'export'`) served by FastAPI at localhost:8000
- Auth routes with JWT in HttpOnly cookies, bcrypt password hashing
- Document CRUD with per-user isolation
- Start/stop scripts for Mac, Linux, Windows
- 14 passing unit/integration tests (`backend/test_main.py`)

### Completed (DEV-7)
- AI freeform chat interface replaces the form UI for Mutual NDA creation
- `backend/chat.py`: NDAFields Pydantic model, LiteLLM + Cerebras Structured Outputs, field merging across conversation turns
- Live NDA preview updates as AI extracts fields; Download button appears on completion
- Frontend color scheme: navy header, blue chat bubbles, purple send button
- `python-dotenv` added so OPENROUTER_API_KEY is auto-loaded from `.env` outside Docker
- DB_PATH defaults to `backend/prelegal.db` when not set (supports non-Docker runs)
- 21 passing tests (`backend/test_main.py` + `backend/test_chat.py`)

### Completed (DEV-8)
- `DOCUMENT_CATALOG` in `backend/chat.py`: all 11 document types with field descriptions and template field maps
- `backend/render.py`: renders CommonPaper markdown templates by substituting `<span class="*_link">` placeholders with filled values (navy bold) or amber-highlighted unfilled markers
- AI now detects document type from user intent before gathering fields; gracefully handles unsupported types with a closest-match suggestion
- Dynamic system prompts: detection prompt when no type known; per-type field-gathering prompt once type is established
- New `/api/document/preview` endpoint returns rendered HTML for any supported document type
- Frontend fetches preview from backend for all non-NDA types; Mutual NDA continues to use local renderer
- Header shows a blue doc-type badge once type is detected
- `TEMPLATES_DIR` env var added to docker-compose.yml for Docker deployments
- 28 passing tests (`backend/test_main.py` + `backend/test_chat.py`)

### Completed (DEV-9)
- **Auth gate**: sign in / sign up form (tabbed) shown to unauthenticated users; `/api/auth/me` checked on load with a loading splash to avoid flash of content
- **Header polish**: logged-in user's email shown; Sign Out button clears session and returns to auth form; "Saving…" / "Saved" status indicator appears when auto-saving
- **New Document button**: resets all chat, field, and preview state and re-fetches the greeting
- **Auto-save**: document automatically saved to the user's account via `POST /api/documents` when the AI marks `isComplete`
- **My Documents modal**: lists user's saved documents (title, type, date); View button loads saved HTML into preview iframe; "Back to Live Preview" returns to active session
- 28 passing tests (no new backend tests required; auth/CRUD already covered)

### Current API Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in and receive JWT cookie
- `POST /api/auth/signout` - Clear auth cookie
- `GET /api/auth/me` - Get current user info
- `GET /api/documents` - List user's saved documents (auth required)
- `POST /api/documents` - Save new document (auth required)
- `GET /api/documents/{id}` - Get specific document (auth required)
- `PUT /api/documents/{id}` - Update document (auth required)
- `DELETE /api/documents/{id}` - Delete document (auth required)
- `GET /api/chat/greeting` - Get AI opening message
- `POST /api/chat/message` - Send chat message, receive updated fields + AI reply (all 11 doc types)
- `POST /api/document/preview` - Render document HTML from type + fields
- `GET /api/health` - Health check
