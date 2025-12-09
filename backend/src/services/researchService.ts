import { v4 as uuidv4 } from 'uuid';
import { Plan, RunState, DBEntry } from '../types';
import { NewsAgent } from '../agents/NewsAgent';
import { TechnicalAgent } from '../agents/TechnicalAgent';
import { FundamentalAgent } from '../agents/FundamentalAgent';
import { SynthesizerAgent } from '../agents/SynthesizerAgent';
import { researchGraph } from '../agents/ResearchGraph';

// In-memory DB
const DB: Record<string, DBEntry> = {};

// Initialize Agents
const newsAgent = new NewsAgent();
const technicalAgent = new TechnicalAgent();
const fundamentalAgent = new FundamentalAgent();
const synthesizerAgent = new SynthesizerAgent();

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
        const sector = plan.sectors[0];

        const tickers = sector === "IT"
            ? ["TCS.NS", "INFY.NS", "WIPRO.NS"]
            : ["SUNPHARMA.NS", "CIPLA.NS", "BIOCON.NS"];

        // Initial State
        const initialState = {
            sector,
            tickers,
            news: null,
            technicals: [],
            fundamentals: [],
            report: null,
            logs: [],
            critique_count: 0
        };

        try {
            // Run the Graph
            const finalState = await researchGraph.invoke(initialState);

            // Sync State back to DB
            // We append new logs to existing ones (if any)
            // Note: In a real streaming setup, we'd stream events from the graph.
            // For now, we just dump the final logs.

            // Map graph logs to our LogEntry format if needed, or just push them
            // Our graph logs match the format roughly, let's ensure type safety
            state.logs = (finalState as any).logs;
            state.report = (finalState as any).report;

            // Prepare charts
            if ((finalState as any).technicals) {
                state.charts = (finalState as any).technicals
                    .filter((t: any) => t.history && t.history.length > 0)
                    .map((t: any) => ({ ticker: t.ticker, data: t.history }));
            }

            state.done = true;
        } catch (error: any) {
            console.error("Graph execution failed", error);
            state.logs.push({
                timestamp: new Date().toLocaleTimeString(),
                agent: "System",
                message: `Critical Error: ${error.message}`,
                type: "error"
            });
            state.done = true; // Stop spinning
        }
    },

    getLogs: (planId: string) => {
        if (!DB[planId]) throw new Error("plan_id not found");
        const s = DB[planId].state;
        return { logs: s.logs, done: s.done, charts: s.done ? s.charts : undefined };
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
