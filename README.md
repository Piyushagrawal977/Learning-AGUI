# Task Planner Agent

A full-stack **task-planning agent**: you ask for a plan (e.g. “plan learning Python”), and it returns a step-by-step plan. The backend uses **LangGraph** and a locally running LLM (**Qwen 2.5 7B** via Ollama); the frontend streams the response.

**This project is intended for running and trying the agent only** — not for production deployment or extension.

---

## 1. Project Overview

The Task Planner Agent is a conversational app that turns natural-language requests into actionable learning plans. You send a message (e.g. “Help me plan learning React”), and the agent:

1. Decides whether you’re asking for a plan (via a small routing LLM).
2. If yes, runs a task-planner tool that produces a 4-step template (basics → concepts → practice → small project).
3. Streams the result back to the browser.

All inference runs **locally** using Ollama and the **qwen2.5:7b** model; no cloud API keys are required. The project is set up for **running and demo use only**.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Browser (User)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTP (message)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                                           │
│  ┌──────────────────┐    POST /api/agent     ┌─────────────────────────────┐ │
│  │ StreamingChat    │ ──────────────────────► │ API Route (route.ts)         │ │
│  │ (React component)│                        │ Proxies to backend, forwards │ │
│  │                  │ ◄────────────────────── │ response stream             │ │
│  └──────────────────┘    stream (SSE)        └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ POST /agent { message }
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Backend (FastAPI)                                                            │
│  ┌──────────────────┐     stream steps        ┌─────────────────────────────┐ │
│  │ main.py          │ ◄──────────────────── │ agent/graph.py              │ │
│  │ POST /agent      │                        │ LangGraph: planner → tool   │ │
│  │ StreamingResponse│                        │   or planner → END          │ │
│  └──────────────────┘                        └──────────────┬──────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                                              │
                                                              │ LLM calls
                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Ollama (local)                                                               │
│  Model: qwen2.5:7b                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Flow:** User → Frontend (StreamingChat) → Next.js `/api/agent` → Backend `POST /agent` → LangGraph agent (planner + tool) → Ollama (qwen2.5:7b) → stream back to UI.

---

## 3. Tech Stack

| Layer      | Technologies |
|-----------|--------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **Backend**  | Python, FastAPI, Uvicorn |
| **Agent**    | LangGraph, LangChain (ChatOllama), LangChain Community |
| **LLM**      | Qwen 2.5 7B (`qwen2.5:7b`) via **Ollama** (local) |
| **Streaming**| Server-Sent Events (text/event-stream), Fetch ReadableStream |

---

## 4. Features

- **Task planning**: Ask in natural language for a learning plan; receive a structured 4-step plan (basics, concepts, practice, project).
- **Local LLM**: Uses **qwen2.5:7b** running in Ollama on your machine; no cloud API keys.
- **Streaming**: Backend streams agent steps; frontend consumes the stream and displays the response (currently may appear as static rendering; see Future Improvements).
- **Simple routing**: A small planner LLM decides whether to run the plan tool or finish.
- **Single backend endpoint**: `POST /agent` with `{ "message": "user text" }`; response is a stream.

---

## 5. Installation

### Prerequisites

- **Ollama** installed and running, with **qwen2.5:7b** (or the model you configure in the backend).
- **Node.js** and **npm** for the frontend.
- **Python** (see `.python-version` in the repo root) for the backend.

### What you may need to change

- **LLM model**: In `backend/agent/graph.py`, set `model="qwen2.5:7b"` (or your model) and run `ollama pull <model>`.
- **Backend URL/port**: In `frontend/app/api/agent/route.ts`, set `BACKEND_URL` (default `http://127.0.0.1:8001/agent`). Update the same URL in `frontend/app/api/copilotkit/route.ts` if you use that route.
- **Backend port**: Start the backend on the same port as in `BACKEND_URL` (e.g. `8001`).

### Steps

**1. Ollama and model**

```bash
# Install Ollama from https://ollama.com, then:
ollama pull qwen2.5:7b
```

**2. Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

Keep this running. API base: `http://127.0.0.1:8001`.

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:3000`) and use the chat.

---

## 6. Example Usage

After both backend and frontend are running, open the app and try prompts such as:

- **"Plan learning Python"**
- **"I want to learn React, give me a plan"**
- **"Help me plan learning machine learning"**

The agent will route to the task-planner tool and return a 4-step plan (understanding basics, studying concepts, practice exercises, building a small project). For non-plan requests, the planner may respond with a finish action instead.

---

## 7. Future Improvements

- **UI**: Improve the chat interface (layout, typography, responsiveness, accessibility).
- **Streaming UX**: Although the backend streams and the frontend consumes the stream, the response often **appears as a single static block** rather than text appearing incrementally. Future work will focus on making streaming visible in the UI (e.g. chunk-by-chunk or token-by-token rendering) so users see the plan as it is generated.

---

## Project layout (for running)

- **`backend/`**  
  - `main.py` — FastAPI app, `POST /agent`, streams agent output.  
  - `agent/graph.py` — LangGraph workflow and Ollama model config (qwen2.5:7b).  
  - `agent/state.py` — `AgentState` type.  
  - `agent/tools.py` — Task-planner tool (4-step template).  
  - `requirements.txt` — Python dependencies.

- **`frontend/`**  
  - `app/api/agent/route.ts` — Backend URL/port for streaming; proxies and streams response.  
  - `app/api/copilotkit/route.ts` — Optional; same backend URL if you use CopilotKit.  
  - `app/page.tsx` — Uses the streaming chat.  
  - `components/StreamingChat.tsx` — Chat UI that consumes the stream.

- **`.python-version`** — Python version used for the backend.
