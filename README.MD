# Smart Reasoning Assistant

A full-stack multi-agent reasoning app. Six LLM agents (GPT-OSS 120B via Groq) route, decompose, plan, solve, verify and explain any question. If the **Verifier** rejects the Solver's answer, the Solver retries using the Verifier's feedback until the answer passes or the revision limit is reached.

**Live demo:** _coming soon_

## Why it's different from a single LLM call

A single prompt gives one unchecked answer. This app splits the work across specialised agents and adds a self-correction loop: a separate Verifier re-does the calculation or fact-check, and a failed check sends the issues back to the Solver. Every answer is saved with its verification status, confidence score, number of revisions, and per-agent timings.

## How it works

```
question
   │
   ▼
Router ──► Wikipedia lookup (only if the Router says it helps)
   │
   ▼
Decomposer ──► Planner ──► Solver ◄─────────────┐
                              │                 │ issues sent back
                              ▼                 │ (max 2 revisions)
                           Verifier ── fail ────┘
                              │ pass
                              ▼
                          Explainer ──► saved to MongoDB
```

| Agent | Job | Returns |
|---|---|---|
| **Router** | Classifies the question (factual, analytical, planning, project, general) and decides whether an encyclopedia lookup would help | `route`, `needsKnowledge`, `searchQuery` |
| **Decomposer** | Breaks the question into 2–6 sub-problems specific to it | `subProblems[]` |
| **Planner** | Turns the sub-problems into an ordered plan | `steps[]` |
| **Solver** | Works through the plan, shows its working and gives a final answer. On a retry, fixes every issue the Verifier listed | `working`, `answer` |
| **Verifier** | Independently re-checks calculations and facts (against the Wikipedia source when used), plus completeness and consistency | `passed`, `issues[]`, `confidence` |
| **Explainer** | Writes a clear explanation that starts with the answer, and flags anything still unverified | `explanation` |

Each agent asks the model for JSON, and its reply is parsed defensively (handles markdown fences and stray text) and validated before use, so a malformed reply can't crash the pipeline or reach the database.

## Features

- **Six LLM agents** with a **Verifier-driven self-correction loop**
- **Pluggable LLM provider**: Groq (default, free), OpenAI or Claude, switched with one `.env` variable
- **Wikipedia grounding** for factual questions, chosen by the Router
- **Result page** with the short answer highlighted, a Verified / Not verified badge with confidence and revision count, and a per-agent timing timeline
- **Dashboard** with total sessions, verification rate and average response time
- **JWT authentication** with per-user reasoning history (view and delete)
- Automatic logout when the login token expires

## Tech stack

- **Frontend:** React 19, React Router, Axios, Vite
- **Backend:** Node.js, Express 5, MongoDB (Mongoose), JWT, bcrypt
- **AI:** Groq API (`openai/gpt-oss-120b`), Wikipedia API

## Project structure

```
backend/
  agents/                 one file per agent: prompt + output validation
  services/
    llmClient.js          LLM client: provider switch, JSON parsing, retries, timeout
    reasoningPipeline.js  runs the agents in order + verify/retry loop + timing
    wikipediaService.js   knowledge retrieval
  utils/normalize.js      cleans up loosely-shaped LLM output
  controllers/  routes/  middleware/  models/  config/
  server.js
frontend/
  src/pages/              Login, Register, Dashboard, Reasoning, History, Agents
  src/components/         layout, sidebar, protected route
  src/config.js           API base URL from VITE_API_URL
  vercel.json             SPA routing for Vercel
```

## API

All `/api/reasoning` routes need an `Authorization: Bearer <token>` header.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in, returns a JWT |
| POST | `/api/reasoning/create` | `{ "problem": "..." }` (max 2000 characters). Runs the pipeline and saves the result |
| GET | `/api/reasoning/history` | Your past sessions |
| GET | `/api/reasoning/stats` | Total sessions, verification rate, average response time |
| DELETE | `/api/reasoning/:id` | Delete one of your sessions |

## Running locally

**Prerequisites:** Node.js 20+, MongoDB (local or Atlas), and a free Groq API key from [console.groq.com/keys](https://console.groq.com/keys).

### Backend

```bash
cd backend
npm install
```

Create `backend/.env` (see `backend/.env.example`):

```
MONGO_URI=mongodb://127.0.0.1:27017/smart_reasoning
JWT_SECRET=any_long_random_string
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
PORT=5000
```

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Open http://localhost:5173, register, and ask a question.

### Switching the LLM provider

| Provider | `.env` |
|---|---|
| Groq (default, free) | `LLM_PROVIDER=groq` and `GROQ_API_KEY=...` |
| OpenAI | `LLM_PROVIDER=openai` and `OPENAI_API_KEY=...` |
| Claude | `LLM_PROVIDER=claude` and `ANTHROPIC_API_KEY=...` |

An optional `GROQ_MODEL`, `OPENAI_MODEL` or `CLAUDE_MODEL` overrides the default model.

## Example

> I bought a phone for ₹24,000 and sold it at a 15% loss. With that money I bought a tablet and sold it at a 20% profit. Overall profit or loss?

- **Router:** analytical
- **Solver:** 24,000 × 0.85 = 20,400 → 20,400 × 1.20 = 24,480
- **Answer:** profit of ₹480
- **Verifier:** Verified (a common wrong answer, "5% profit", is the kind of mistake the Verifier is there to catch and send back)

## Roadmap

- [ ] Rate limiting and input hardening
- [ ] Jest + Supertest tests with a mocked LLM, GitHub Actions CI
- [ ] Accuracy evaluation: pipeline vs a single LLM call on known-answer problems
- [ ] Deploy: Render (API), Vercel (frontend), MongoDB Atlas

## Author

**Arnav Shyam** · [GitHub](https://github.com/shaym2024arnav-eng) · [LinkedIn](https://linkedin.com/in/arnav-shyam-629820296)