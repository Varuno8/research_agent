import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import yahooFinance from 'yahoo-finance2';
import { Plan, RunState, DBEntry } from '../types';

const TAVILY_KEY = process.env.TAVILY_API_KEY;

// In-memory DB
const DB: Record<string, DBEntry> = {};

async function searchWeb(query: string, maxResults: number = 5): Promise<{ title: string; url: string }[]> {
    if (!TAVILY_KEY) {
        return [
            { title: "(mock) Industry brief", url: "https://example.com/brief" },
            { title: "(mock) Company earnings", url: "https://example.com/earnings" },
        ];
    }
    try {
        const response = await axios.post("https://api.tavily.com/search", {
            api_key: TAVILY_KEY,
            query: query,
            max_results: maxResults
        });
        const results = response.data.results || [];
        return results.map((res: any) => ({
            title: res.title || "result",
            url: res.url
        }));
    } catch (error) {
        console.error("Tavily search failed", error);
        return [{ title: "No results", url: "" }];
    }
}

async function getKpis(ticker: string): Promise<{ last_price: number | null; market_cap: number | null; price_5y_cagr: number | null }> {
    try {
        const quote = await yahooFinance.quote(ticker) as any;
        const last_price = quote.regularMarketPrice || null;
        const market_cap = quote.marketCap || null;

        let cagr: number | null = null;
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 5);

            const history = await yahooFinance.historical(ticker, {
                period1: startDate,
                period2: endDate,
                interval: '1d'
            }) as any[];

            if (history.length > 0) {
                const startPrice = history[0].close;
                const endPrice = history[history.length - 1].close;
                const years = 5; // Approx
                cagr = Math.pow(endPrice / startPrice, 1 / years) - 1;
            }
        } catch (e) {
            console.error(`Failed to get history for ${ticker}`, e);
        }

        return { last_price, market_cap, price_5y_cagr: cagr };
    } catch (error) {
        console.error(`Failed to get KPIs for ${ticker}`, error);
        return { last_price: null, market_cap: null, price_5y_cagr: null };
    }
}

function classify(query: string, sectorChoice: string): string[] {
    const q = query.toLowerCase();
    if (sectorChoice && sectorChoice !== "auto") {
        return [sectorChoice.toUpperCase()];
    }
    const sectors: string[] = [];
    if (["it", "software", "infosys", "tcs", "wipro", "hcl"].some(w => q.includes(w))) {
        sectors.push("IT");
    }
    if (["pharma", "drug", "biosim", "biocon", "sun", "cipla"].some(w => q.includes(w))) {
        sectors.push("PHARMA");
    }
    return sectors.length > 0 ? sectors : ["IT"];
}

export const researchService = {
    makePlan: (query: string, sectorChoice: string = "auto"): Plan => {
        const planId = uuidv4().slice(0, 8);
        const sectors = classify(query, sectorChoice);
        const plan: Plan = {
            plan_id: planId,
            sectors: sectors,
            subquestions: ["Market", "Players", "Trends", "Financials", "Risks", "Outlook"],
            sources: ["web_search", "annual_reports", "finance_api"],
            depth: "deep",
            expected_output: "sector.md"
        };
        DB[planId] = { query, plan, state: { approved: false, logs: [], done: false, report: null, focus: null } };
        return plan;
    },

    approve: (planId: string, focus: string | null = null): void => {
        if (!DB[planId]) throw new Error("plan_id not found");
        DB[planId].state.approved = true;
        DB[planId].state.focus = focus;
    },

    run: async (planId: string): Promise<void> => {
        if (!DB[planId]) throw new Error("plan_id not found");
        const entry = DB[planId];
        if (!entry.state.approved) throw new Error("plan not approved yet");

        const state = entry.state;
        const plan = entry.plan;

        state.logs = [];
        state.done = false;

        // 1) Search
        state.logs.push("🔎 Searching latest sector outlook…");
        const results = await searchWeb(`${plan.sectors[0]} sector India outlook 2025 2026`, 5);

        // 2) Show sources
        state.logs.push("📄 Reading sources…");
        for (const r of results) {
            state.logs.push(`Source: ${r.title} | ${r.url}`);
        }

        // 3) Pull KPIs
        state.logs.push("📊 Pulling tickers KPIs…");
        const tickers = plan.sectors.includes("IT")
            ? ["TCS.NS", "INFY.NS", "WIPRO.NS"]
            : ["SUNPHARMA.NS", "CIPLA.NS", "BIOCON.NS"];

        const rows: any[] = [];
        for (const t of tickers) {
            const k = await getKpis(t);
            rows.push({ ticker: t, ...k });
        }

        // 4) Compose report
        let table = "| Company | Last Price | Market Cap | 5y Price CAGR |\n|---|---:|---:|---:|\n";
        for (const row of rows) {
            const cStr = row.price_5y_cagr !== null ? `${(row.price_5y_cagr * 100).toFixed(2)}%` : "N/A";
            table += `| ${row.ticker} | ${row.last_price || "N/A"} | ${row.market_cap || "N/A"} | ${cStr} |\n`;
        }

        const sourcesMd = results.map(r => `- ${r.title} — ${r.url}`).join("\n");

        state.report = `# ${plan.sectors[0]} Sector — Quick Research Note

## Executive Summary
Auto-generated note based on real-time search and market KPIs. Replace with your sector template later.

## Benchmarks (yfinance)
${table}

## Sources
${sourcesMd}
`;
        state.logs.push("✅ Research complete");
        state.done = true;
    },

    getLogs: (planId: string) => {
        if (!DB[planId]) throw new Error("plan_id not found");
        return { logs: DB[planId].state.logs, done: DB[planId].state.done };
    },

    getReport: (planId: string) => {
        if (!DB[planId]) throw new Error("plan_id not found");
        const report = DB[planId].state.report;
        if (!report) throw new Error("report not ready; run first");
        return report;
    },

    getPlan: (planId: string) => {
        if (!DB[planId]) throw new Error("plan_id not found");
        return DB[planId].plan;
    }
};
