import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
  Play, CheckCircle, FileText, RefreshCw, Terminal, Activity, Sun, Moon,
  Search, BarChart3, Download, Newspaper, TrendingUp, PieChart, Brain,
  Zap, Sparkles
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Plan } from './types';
import StockChart from './StockChart';
import './index.css';

const API_URL = 'http://localhost:3001/api';

// Agent definitions with professional finance colors
const AGENTS = [
  { id: 'news', name: 'News Agent', icon: Newspaper, color: '#3d7cc9', description: 'Market Headlines' },
  { id: 'technical', name: 'Technical Agent', icon: TrendingUp, color: '#2d9d78', description: 'Price Analysis' },
  { id: 'fundamental', name: 'Fundamental Agent', icon: PieChart, color: '#d4a853', description: 'Valuation Metrics' },
  { id: 'synthesizer', name: 'Synthesizer', icon: Brain, color: '#0d7377', description: 'Report Generation' },
];

// Progress steps
const STEPS = [
  { id: 'plan', label: 'Generate', icon: Sparkles },
  { id: 'approve', label: 'Approve', icon: CheckCircle },
  { id: 'run', label: 'Execute', icon: Zap },
  { id: 'report', label: 'Report', icon: FileText },
];

function App() {
  const [query, setQuery] = useState("Analyze Indian IT services sector outlook for 2026: demand, GenAI impact, risks");
  const [sector, setSector] = useState("auto");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [charts, setCharts] = useState<{ ticker: string; data: any[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const reportRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Track active agents from logs
  useEffect(() => {
    if (logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      const agentName = lastLog.agent?.toLowerCase() || '';

      if (agentName.includes('news')) setActiveAgents(['news']);
      else if (agentName.includes('technical') || agentName.includes('fundamental'))
        setActiveAgents(['technical', 'fundamental']);
      else if (agentName.includes('synth')) setActiveAgents(['synthesizer']);
      else if (agentName.includes('critic')) setActiveAgents(['synthesizer']);
    }
  }, [logs]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const generatePlan = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/plan`, { query, sector });
      setPlan(res.data);
      setIsApproved(false);
      setLogs([]);
      setReport(null);
      setCharts([]);
      setActiveAgents([]);
      setCurrentStep(1);
      showToast(`Plan created: ${res.data.plan_id}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  const approvePlan = async () => {
    if (!plan) return;
    try {
      setLoading(true);
      await axios.post(`${API_URL}/approve`, { plan_id: plan.plan_id, focus: "deal wins + pricing pressure" });
      setIsApproved(true);
      setCurrentStep(2);
      showToast("Plan approved");
    } catch (err) {
      console.error(err);
      showToast("Failed to approve plan");
    } finally {
      setLoading(false);
    }
  };

  const runResearch = async () => {
    if (!plan) return;
    try {
      setIsRunning(true);
      setCurrentStep(3);
      await axios.post(`${API_URL}/run`, { plan_id: plan.plan_id });
      showToast("Research started");
    } catch (err) {
      console.error(err);
      showToast("Failed to start run");
      setIsRunning(false);
    }
  };

  // Poll logs
  useEffect(() => {
    let interval: any;
    if (isRunning && plan) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/logs/${plan.plan_id}`);
          setLogs(res.data.logs);
          if (res.data.done) {
            setIsRunning(false);
            setCurrentStep(4);
            setActiveAgents([]);
            showToast("Research completed");
            if (res.data.charts) {
              setCharts(res.data.charts);
            }
            fetchReport();
          }
        } catch (err) {
          console.error(err);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, plan]);

  const fetchReport = async () => {
    if (!plan) return;
    try {
      const res = await axios.get(`${API_URL}/report/${plan.plan_id}`);
      setReport(res.data.report);
      setCurrentStep(4);
      showToast("Report ready");
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch report");
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`research-report-${plan?.plan_id}.pdf`);
      showToast("PDF exported");
    } catch (err) {
      console.error("PDF export failed", err);
      showToast("Failed to export PDF");
    }
  };

  const reset = () => {
    setPlan(null);
    setLogs([]);
    setReport(null);
    setCharts([]);
    setIsApproved(false);
    setIsRunning(false);
    setActiveAgents([]);
    setCurrentStep(0);
    setQuery("Analyze Indian IT services sector outlook for 2026: demand, GenAI impact, risks");
    setSector("auto");
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return '#c24a4a';
      case 'success': return '#2d9d78';
      case 'thought': return '#d4a853';
      default: return '#3d7cc9';
    }
  };

  const getProgressWidth = () => {
    if (currentStep === 0) return '0%';
    if (currentStep === 1) return '25%';
    if (currentStep === 2) return '50%';
    if (currentStep === 3) return '75%';
    return '100%';
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={22} />
          </div>
          <div className="brand-text">
            <h1>Deep Research</h1>
            <span>Financial Intelligence Platform</span>
          </div>
        </div>

        <div className="input-group">
          <label>Research Query</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            placeholder="Enter your research question..."
          />
        </div>

        <div className="input-group">
          <label>Target Sector</label>
          <select value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="auto">Auto-detect</option>
            <option value="it">Technology (IT)</option>
            <option value="pharma">Healthcare & Pharma</option>
            <option value="finance">Finance & Banking</option>
            <option value="energy">Energy & Utilities</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
          <button className="btn btn-primary" onClick={generatePlan} disabled={loading || isRunning}>
            {loading ? <div className="spinner" /> : <Sparkles size={16} />}
            Generate Plan
          </button>

          <button
            className="btn btn-primary"
            onClick={approvePlan}
            disabled={!plan || isApproved || loading || isRunning}
          >
            <CheckCircle size={16} />
            Approve Plan
            {isApproved && <span style={{ marginLeft: 'auto', opacity: 0.7 }}>✓</span>}
          </button>

          <button
            className="btn btn-success"
            onClick={runResearch}
            disabled={!plan || !isApproved || isRunning}
          >
            {isRunning ? (
              <>
                <div className="spinner" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} />
                Run Research
              </>
            )}
          </button>

          <button
            className="btn btn-secondary"
            onClick={fetchReport}
            disabled={!plan || isRunning}
          >
            <FileText size={16} />
            View Report
          </button>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={reset} style={{ width: '100%' }}>
            <RefreshCw size={16} />
            Reset Session
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* Agent Status Bar */}
        <div className="agent-status-bar">
          {AGENTS.map((agent) => (
            <div
              key={agent.id}
              className={`agent-card ${activeAgents.includes(agent.id) ? 'active' : ''}`}
              style={{ '--agent-color': agent.color } as React.CSSProperties}
            >
              <div className="agent-icon">
                <agent.icon size={20} />
              </div>
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-status">
                  <span
                    className={`status-dot ${activeAgents.includes(agent.id) ? 'active' : ''}`}
                  />
                  {activeAgents.includes(agent.id) ? 'Running...' : agent.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className="progress-line">
            <div
              className="progress-line-fill"
              style={{ width: getProgressWidth() }}
            />
          </div>
          {STEPS.map((step, index) => (
            <div key={step.id} className="progress-step">
              <div
                className={`step-circle ${currentStep > index + 1 ? 'completed' :
                    currentStep === index + 1 ? 'active' : ''
                  }`}
              >
                {currentStep > index + 1 ? (
                  <CheckCircle size={18} />
                ) : (
                  <step.icon size={18} />
                )}
              </div>
              <span
                className={`step-label ${currentStep > index + 1 ? 'completed' :
                    currentStep === index + 1 ? 'active' : ''
                  }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Plan & Logs Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon"><Terminal size={18} /></div>
              <h2>Research Plan & Logs</h2>
              {isRunning && (
                <div className="running-indicator" style={{ marginLeft: 'auto' }}>
                  <div className="running-dots">
                    <span /><span /><span />
                  </div>
                  Processing
                </div>
              )}
            </div>

            {plan ? (
              <div className="plan-display" style={{ marginBottom: '1.25rem' }}>
                <div className="plan-header">
                  <span className="plan-badge">Active Plan</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    ID: {plan.plan_id}
                  </span>
                </div>
                <pre className="plan-content">
                  {JSON.stringify(plan, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="empty-state" style={{ marginBottom: '1.25rem' }}>
                <div className="empty-state-icon">
                  <Search size={28} />
                </div>
                <h3>No Active Plan</h3>
                <p>Enter your research query and generate a plan to get started.</p>
              </div>
            )}

            <h3 style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 600
            }}>
              <Activity size={12} />
              Execution Logs
            </h3>
            <div className="logs-container">
              {logs.length > 0 ? (
                logs.map((log: any, i) => (
                  <div
                    key={i}
                    className={`log-entry ${log.type}`}
                    style={{ '--log-color': getLogColor(log.type) } as React.CSSProperties}
                  >
                    <div className="log-header">
                      <span className="log-agent">
                        <span className="log-agent-dot" />
                        {log.agent}
                      </span>
                      <span className="log-time">{log.timestamp}</span>
                    </div>
                    <div className="log-message">{log.message}</div>
                  </div>
                ))
              ) : (
                <div style={{
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  Waiting for execution...
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Report Card */}
          <div className="card report-section">
            <div className="card-header">
              <div className="card-icon"><BarChart3 size={18} /></div>
              <h2>Intelligence Report</h2>
              {report && (
                <button
                  className="btn btn-secondary"
                  onClick={exportPDF}
                  style={{ marginLeft: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                >
                  <Download size={14} />
                  Export PDF
                </button>
              )}
            </div>

            <div ref={reportRef} className="report-content">
              {report ? (
                <>
                  <div className="markdown-body">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>

                  {charts.length > 0 && (
                    <div className="charts-section">
                      <div className="charts-header">
                        <TrendingUp size={18} style={{ color: 'var(--primary-color)' }} />
                        <h3>Market Performance (1 Year)</h3>
                      </div>
                      <div className="charts-grid">
                        {charts.map((chart) => (
                          <StockChart key={chart.ticker} ticker={chart.ticker} data={chart.data} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state" style={{ height: '100%', minHeight: '260px' }}>
                  <div className="empty-state-icon">
                    <FileText size={28} />
                  </div>
                  <h3>Report Pending</h3>
                  <p>Your intelligence report will appear here after research completes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
