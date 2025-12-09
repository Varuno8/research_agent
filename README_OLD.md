
# Deep Research (Streamlit) — Demo Ready

Plan → Approve → Run → Report flow with a single Streamlit app. Minimal code; just add API keys and go.

## Tech Stack
- **Streamlit** for the UI and quick demo
- **Python / Pydantic dataclasses** for simple state & models
- **yfinance** for quick market KPIs (last price, market cap, 5y price CAGR)
- **Requests** (+ optional **Tavily API**) for web search
- **BeautifulSoup** included for later HTML parsing of fetched pages

## Install & Run (VS Code / local)
```bash
# 1) Extract the zip
cd deep-research-streamlit-v2

# 2) (Optional) Create a venv
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 3) Install deps
pip install -r requirements.txt

# 4) (Optional) Add your Tavily key for live web search
# macOS/Linux:
export TAVILY_API_KEY=your_key_here
# Windows PowerShell:
$env:TAVILY_API_KEY="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"

# 5) Run
streamlit run app.py
```

Open the printed local URL in your browser.

## How it Works
1. **Generate Plan** → classifies the sector, creates sub-questions & sources
2. **Approve Plan** → simulates stakeholder approval and saves a focus
3. **Run Research** → performs web search (Tavily or mocked) + pulls tickers KPIs via yfinance
4. **Get Report** → renders a short markdown note with a table and source links

## Where to Swap Real APIs (later)
- `research_backend.py > search_web()` → replace Tavily with your preferred search (SerpAPI, Bing, etc.)
- `get_kpis()` → replace yfinance with FMP/AlphaVantage/Bloomberg gateway
- Compose a richer report by adding Jinja2 templates and a proper citations map.

Happy demo! 🚀
