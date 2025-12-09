export interface Plan {
    plan_id: string;
    sectors: string[];
    subquestions: string[];
    sources: string[];
    depth: string;
    expected_output: string;
}

export interface LogEntry {
    timestamp: string;
    agent: string;
    message: string;
    type: 'info' | 'thought' | 'error' | 'success';
}

export interface RunState {
    approved: boolean;
    logs: LogEntry[];
    done: boolean;
    report: string | null;
    focus: string | null;
    charts?: { ticker: string; data: { date: string; price: number }[] }[];
}

export interface DBEntry {
    query: string;
    plan: Plan;
    state: RunState;
}
