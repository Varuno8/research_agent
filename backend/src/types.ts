export interface Plan {
    plan_id: string;
    sectors: string[];
    subquestions: string[];
    sources: string[];
    depth: string;
    expected_output: string;
}

export interface RunState {
    approved: boolean;
    logs: string[];
    done: boolean;
    report: string | null;
    focus: string | null;
}

export interface DBEntry {
    query: string;
    plan: Plan;
    state: RunState;
}
