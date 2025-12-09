# Financial Deep Research (TypeScript/React Version)

This project has been migrated from Python/Streamlit to a TypeScript/Node.js backend and React frontend.

## Structure

- `backend/`: Node.js Express server with TypeScript.
- `frontend/`: React application with Vite and TypeScript.

## Prerequisites

- Node.js (v16 or higher)
- npm

## Setup & Running

### Backend

1. Navigate to `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Configure environment variables in `.env`:
   - `TAVILY_API_KEY`: Your Tavily API key for web search.
4. Start the server:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3001`.

### Frontend

1. Navigate to `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173` (or similar).

## Features

- **Generate Plan**: Create a research plan based on a query and sector.
- **Approve Plan**: Review and approve the plan.
- **Run Research**: Execute the research (web search + financial KPIs).
- **Get Report**: View the generated markdown report.
