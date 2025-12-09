# Financial Deep Research Agent

A comprehensive intelligent financial platform powered by a **Multi-Agent System**. This application orchestrates specialized agents to perform deep market research, analyze technical and fundamental data, and synthesize actionable investment theses.

## 🚀 Key Features

*   **Multi-Agent Architecture**:
    *   **News Agent**: Scans the web for real-time market news and sentiment (via Tavily).
    *   **Technical Agent**: Analyzes price action and historical performance (via Yahoo Finance).
    *   **Fundamental Agent**: Evaluates key valuation metrics (P/E, Market Cap, EPS).
    *   **Synthesizer Agent**: Combines all insights into a cohesive professional report.
*   **Interactive Analytics**:
    *   Real-time execution logs showing agent activities.
    *   Interactive 1-Year Price History charts.
*   **Premium UI/UX**:
    *   Modern Glassmorphism design.
    *   Light/Dark mode support.
    *   PDF Export functionality for reports.

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express, TypeScript
*   **Frontend**: React, Vite, TypeScript, Recharts, Tailwind-like CSS
*   **Data Sources**: Yahoo Finance, Tavily API

## Setup & Running

### Backend

1.  Navigate to `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  (Optional) Configure environment variables in `.env`:
    *   `TAVILY_API_KEY`: Your Tavily API key for web search.
4.  Start the server:
    ```bash
    npm start
    ```
    The server will run on `http://localhost:3001`.

### Frontend

1.  Navigate to `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or similar).

## Usage Workflow

1.  **Generate Plan**: Enter a research query (e.g., "Outlook for Indian IT Sector") and select a sector.
2.  **Approve Plan**: Review the generated research plan.
3.  **Run Research**: Watch as multiple agents collaborate in real-time to gather and analyze data.
4.  **View Report**: Read the synthesized report, view interactive charts, and export to PDF.
