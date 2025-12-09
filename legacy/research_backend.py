
import time, uuid, os, requests
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from bs4 import BeautifulSoup  
import yfinance as yf

# --------------------
# Config via ENV VARS
# --------------------
# TAVILY_API_KEY: optional (web search). If missing, we fallback to mock links.
TAVILY_KEY = os.getenv("TAVILY_API_KEY")

@dataclass
class Plan:
    plan_id: str
    sectors: List[str]
    subquestions: List[str]
    sources: List[str]
    depth: str = "deep"
    expected_output: str = "sector.md"

@dataclass
class RunState:
    approved: bool = False
    logs: List[str] = field(default_factory=list)
    done: bool = False
    report: Optional[str] = None
    focus: Optional[str] = None

# In‑memory demo DB
DB: Dict[str, Dict] = {}

# --------------------
# Utilities
# --------------------
def search_web(query: str, max_results: int = 5) -> List[dict]:
    """Tavily web search (optional). Returns a list of {title,url}. Fallback to mocks."""
    if not TAVILY_KEY:
        return [
            {"title":"(mock) Industry brief", "url":"https://example.com/brief"},
            {"title":"(mock) Company earnings", "url":"https://example.com/earnings"},
        ]
    r = requests.post(
        "https://api.tavily.com/search",
        json={"api_key": TAVILY_KEY, "query": query, "max_results": max_results}
    )
    r.raise_for_status()
    data = r.json()
    # normalize
    out = []
    for res in data.get("results", []):
        out.append({"title": res.get("title") or "result", "url": res.get("url")})
    return out or [{"title":"No results","url":""}]

def get_kpis(ticker: str) -> dict:
    """Fetch simple KPIs with yfinance. Safe guards to avoid hard crashes."""
    t = yf.Ticker(ticker)
    info = getattr(t, "fast_info", None)
    last_price = getattr(info, "last_price", None) if info else None
    market_cap = getattr(info, "market_cap", None) if info else None
    # price CAGR from history (approx, price not fundamentals)
    cagr = None
    try:
        hist = t.history(period="5y")
        if not hist.empty:
            start = float(hist["Close"].iloc[0]); end = float(hist["Close"].iloc[-1])
            years = max((hist.index[-1] - hist.index[0]).days/365.25, 1)
            cagr = (end/start)**(1/years) - 1
    except Exception:
        pass
    return {"last_price": last_price, "market_cap": market_cap, "price_5y_cagr": cagr}

def classify(query: str, sector_choice: str) -> List[str]:
    q = query.lower()
    if sector_choice and sector_choice != "auto":
        return [sector_choice.upper()]
    sectors = []
    if any(w in q for w in ["it","software","infosys","tcs","wipro","hcl"]):
        sectors.append("IT")
    if any(w in q for w in ["pharma","drug","biosim","biocon","sun","cipla"]):
        sectors.append("PHARMA")
    return sectors or ["IT"]

# --------------------
# Public API (called by Streamlit)
# --------------------
def make_plan(query: str, sector_choice: str = "auto") -> Plan:
    plan_id = str(uuid.uuid4())[:8]
    sectors = classify(query, sector_choice)
    plan = Plan(
        plan_id=plan_id,
        sectors=sectors,
        subquestions=["Market","Players","Trends","Financials","Risks","Outlook"],
        sources=["web_search","annual_reports","finance_api"],
    )
    DB[plan_id] = {"query": query, "plan": plan, "state": RunState()}
    return plan

def approve(plan_id: str, focus: Optional[str] = None) -> None:
    if plan_id not in DB: raise KeyError("plan_id not found")
    st = DB[plan_id]["state"]
    st.approved = True
    st.focus = focus

def run(plan_id: str) -> None:
    if plan_id not in DB: raise KeyError("plan_id not found")
    st: RunState = DB[plan_id]["state"]
    plan: Plan = DB[plan_id]["plan"]
    if not st.approved:
        raise RuntimeError("plan not approved yet")

    st.logs.clear()
    st.done = False
    # 1) Search
    st.logs.append("🔎 Searching latest sector outlook…")
    results = search_web(f"{plan.sectors[0]} sector India outlook 2025 2026", 5)
    time.sleep(0.4)

    # 2) Show sources
    st.logs.append("📄 Reading sources…")
    for r in results:
        st.logs.append(f"Source: {r['title']} | {r['url']}")
        time.sleep(0.15)

    # 3) Pull KPIs
    st.logs.append("📊 Pulling tickers KPIs…")
    tickers = ["TCS.NS","INFY.NS","WIPRO.NS"] if "IT" in plan.sectors else ["SUNPHARMA.NS","CIPLA.NS","BIOCON.NS"]
    rows = []
    for t in tickers:
        k = get_kpis(t)
        rows.append((t, k["last_price"], k["market_cap"], k["price_5y_cagr"]))
        time.sleep(0.2)

    # 4) Compose report
    table = "| Company | Last Price | Market Cap | 5y Price CAGR |\n|---|---:|---:|---:|\n"
    for sym, lp, mc, c in rows:
        c_str = f"{c:.2%}" if isinstance(c, float) else "N/A"
        table += f"| {sym} | {lp} | {mc} | {c_str} |\n"
    sources_md = "\n".join([f"- {r['title']} — {r['url']}" for r in results])

    st.report = f"""# {plan.sectors[0]} Sector — Quick Research Note

## Executive Summary
Auto-generated note based on real-time search and market KPIs. Replace with your sector template later.

## Benchmarks (yfinance)
{table}

## Sources
{sources_md}
"""
    st.logs.append("✅ Research complete")
    st.done = True

def get_logs(plan_id: str) -> dict:
    if plan_id not in DB: raise KeyError("plan_id not found")
    s = DB[plan_id]["state"]
    return {"logs": s.logs, "done": s.done}

def get_report(plan_id: str) -> str:
    if plan_id not in DB: raise KeyError("plan_id not found")
    rep = DB[plan_id]["state"].report
    if not rep: raise RuntimeError("report not ready; run first")
    return rep
