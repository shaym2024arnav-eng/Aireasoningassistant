## Aut# AI Reasoning Assistant

A full-stack AI-powered reasoning platform that decomposes complex problems into smaller tasks and generates structured, explainable solutions using a multi-agent architecture.

## Overview

AI Reasoning Assistant breaks down complex, multi-step problems the way a human expert would — by splitting them into smaller pieces, planning an approach, solving each piece, verifying the results, and explaining the reasoning in plain language. Instead of a single model producing a black-box answer, the system routes the problem through five specialized agents, each responsible for one stage of the reasoning process.

## Features

- **Five-Agent Architecture** — Decomposer, Planner, Solver, Verifier, and Explainer agents work together for structured, step-by-step problem solving
- **Explainable Output** — every solution comes with a clear breakdown of how the answer was reached, not just the final result
- **User Authentication** — secure login and registration using JWT
- **Reasoning History** — past problems and solutions are stored per user and can be revisited
- **Full-Stack Architecture** — React frontend communicating with a Node/Express REST API backed by MongoDB

## Tech Stack

**Frontend**
- React.js
- React Router

**Backend**
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication

## Project Structure

```
AIReasoningAssistant/
├── backend/
│   ├── config/          # DB and app configuration
│   ├── controllers/     # Route handler logic
│   ├── middleware/      # Auth and error-handling middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── Services/        # Multi-agent reasoning logic
│   ├── utils/           # Helper functions
│   └── server.js        # App entry point
│
└── frontend/
    └── src/
        ├── pages/        # Dashboard, History, Login, Register, Reasoning
        └── services/     # API calls to backend
```

## How It Works

1. **Decomposer** — breaks the input problem into smaller, manageable sub-problems
2. **Planner** — determines the order and approach for solving each sub-problem
3. **Solver** — works through each sub-problem
4. **Verifier** — checks the solutions for correctness and consistency
5. **Explainer** — compiles the results into a clear, step-by-step explanation for the user

## Getting Started

### Prerequisites
- Node.js and npm
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder with:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

Start the server:
```bash
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```hor

**Arnav Shyam**
[GitHub](https://github.com/shaym2024arnav-eng) · [LinkedIn](https://linkedin.com/in/arnav-shyam-629820296)