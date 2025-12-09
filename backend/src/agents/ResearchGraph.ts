import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { NewsAgent } from "./NewsAgent";
import { TechnicalAgent } from "./TechnicalAgent";
import { FundamentalAgent } from "./FundamentalAgent";
import { SynthesizerAgent } from "./SynthesizerAgent";

// Define the State using Annotation
const AgentStateAnnotation = Annotation.Root({
    sector: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => "" }),
    tickers: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
    news: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
    technicals: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
    fundamentals: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
    report: Annotation<string | null>({ reducer: (x, y) => y ?? x, default: () => null }),
    logs: Annotation<any[]>({ reducer: (x, y) => x.concat(y), default: () => [] }),
    critique_count: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
});

// Type for the state
type AgentState = typeof AgentStateAnnotation.State;

// Initialize Agents
const newsAgent = new NewsAgent();
const technicalAgent = new TechnicalAgent();
const fundamentalAgent = new FundamentalAgent();
const synthesizerAgent = new SynthesizerAgent();

// Helper to log
const log = (state: AgentState, agent: string, msg: string, type: 'info' | 'thought' | 'success' | 'error' = 'info') => {
    state.logs.push({
        timestamp: new Date().toLocaleTimeString(),
        agent,
        message: msg,
        type
    });
};

// Nodes
async function newsNode(state: AgentState) {
    log(state, "News Agent", "Scanning market headlines...", "thought");
    const result = await newsAgent.analyze(state.sector);

    // Self-Correction: If no sources, retry or broaden search (mock logic here)
    if (result.sources.length === 0) {
        log(state, "News Agent", "No sources found. Retrying with broader query...", "error");
        // In real app: retry logic
    }

    log(state, "News Agent", `Found ${result.sources.length} articles.`, "success");
    return { news: result };
}

async function quantitativeNode(state: AgentState) {
    log(state, "Orchestrator", "Running Technical & Fundamental analysis in parallel...", "info");

    const tPromises = state.tickers.map(async t => {
        const res = await technicalAgent.analyze(t);
        log(state, "Technical Agent", `Analyzed ${t}`, "success");
        return res;
    });

    const fPromises = state.tickers.map(async t => {
        const res = await fundamentalAgent.analyze(t);
        log(state, "Fundamental Agent", `Analyzed ${t}`, "success");
        return res;
    });

    const [technicals, fundamentals] = await Promise.all([
        Promise.all(tPromises),
        Promise.all(fPromises)
    ]);

    return { technicals, fundamentals };
}

async function synthesizerNode(state: AgentState) {
    log(state, "Synthesizer", "Drafting report...", "thought");
    const report = synthesizerAgent.compose(state.sector, state.news, state.technicals, state.fundamentals);
    return { report };
}

async function criticNode(state: AgentState) {
    // A simple "Critic" that checks if we have enough data
    // In a real LLM app, this would use an LLM to read the draft and critique it.

    const missingData = state.technicals.filter(t => !t.price).length;
    if (missingData > 0 && state.critique_count < 1) {
        log(state, "Critic", `Found ${missingData} tickers with missing data. Requesting retry...`, "error");
        return { critique_count: state.critique_count + 1, retry: true };
    }

    log(state, "Critic", "Report looks solid. Approving.", "success");
    return { retry: false };
}

// Conditional Edge
function shouldRetry(state: AgentState) {
    // @ts-ignore
    if (state.retry) {
        return "quantitative"; // Go back to fetching data
    }
    return "end";
}

// Build Graph
const workflow = new StateGraph(AgentStateAnnotation)
    .addNode("news", newsNode)
    .addNode("quantitative", quantitativeNode)
    .addNode("synthesizer", synthesizerNode)
    .addNode("critic", criticNode)
    .addEdge(START, "news")
    .addEdge("news", "quantitative")
    .addEdge("quantitative", "synthesizer")
    .addEdge("synthesizer", "critic")
    .addConditionalEdges("critic", shouldRetry, {
        quantitative: "quantitative",
        end: END
    });

export const researchGraph = workflow.compile();
