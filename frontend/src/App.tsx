import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Play, CheckCircle, FileText, RefreshCw, Terminal, Layout, Activity, Sun, Moon, Search, BarChart3, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Plan } from './types';
import StockChart from './StockChart';
import './index.css';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [query, setQuery] = useState("Analyze Indian IT services sector outlook for 2026: demand, GenAI impact, risks");
  const [sector, setSector] = useState("auto");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [charts, setCharts] = useState<{ ticker: string; data: any[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      await axios.post(`${API_URL}/run`, { plan_id: plan.plan_id });
      showToast("Run started");
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
      showToast("Report fetched");
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
      showToast("PDF Exported");
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
    setQuery("Analyze Indian IT services sector outlook for 2026: demand, GenAI impact, risks");
    setSector("auto");
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Deep Research</h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Financial Intelligence</span>
          </div>
        </div>

        <div className="input-group">
          <label>Research Query</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            placeholder="What would you like to research today?"
          />
        </div>

        <div className="input-group">
          <label>Target Sector</label>
          <select value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="auto">Auto-detect</option>
            <option value="it">Technology (IT)</option>
            <option value="pharma">Healthcare & Pharma</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={generatePlan} disabled={loading || isRunning}>
            <Layout size={18} /> Generate Plan
          </button>

          <button className="btn btn-primary" onClick={approvePlan} disabled={!plan || isApproved || loading || isRunning} style={{ opacity: (!plan || isApproved) ? 0.7 : 1 }}>
            <CheckCircle size={18} /> Approve Plan
          </button>

          <button className="btn btn-primary" onClick={runResearch} disabled={!plan || !isApproved || isRunning} style={{ opacity: (!plan || !isApproved || isRunning) ? 0.7 : 1 }}>
            <Play size={18} /> Run Research
          </button>

          <button className="btn btn-primary" onClick={fetchReport} disabled={!plan || isRunning} style={{ opacity: (!plan || isRunning) ? 0.7 : 1 }}>
            <FileText size={18} /> View Report
          </button>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button className="btn btn-secondary" onClick={reset} style={{ width: '100%' }}>
            <RefreshCw size={18} /> Reset Session
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="card">
          <div className="card-header">
            <div className="card-icon"><Terminal size={20} /></div>
            <h2>Research Plan & Logs</h2>
          </div>

          {plan ? (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Plan Structure</h3>
              <pre style={{ background: 'var(--code-bg)', padding: '1rem', borderRadius: '12px', overflowX: 'auto', color: 'var(--code-text)' }}>
                {JSON.stringify(plan, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
              marginBottom: '2rem'
            }}>
              <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No active plan. Start by generating a research plan from the sidebar.</p>
            </div>
          )}

          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Live Execution Logs</h3>
          <div className="logs-container">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="log-entry">
                  <span className="log-time">{new Date().toLocaleTimeString()}</span>
                  <span>{log}</span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem' }}>Waiting for execution...</div>
            )}
          </div>
        </div>

        <div className="card" style={{ overflow: 'visible' }}>
          <div className="card-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="card-icon"><BarChart3 size={20} /></div>
              <h2>Intelligence Report</h2>
            </div>
            {report && (
              <button className="btn btn-secondary" onClick={exportPDF} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <Download size={16} /> Export PDF
              </button>
            )}
          </div>

          <div ref={reportRef} style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px' }}>
            {report ? (
              <>
                <div className="markdown-body">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>

                {charts.length > 0 && (
                  <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Market Performance (1 Year)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                      {charts.map((chart) => (
                        <StockChart key={chart.ticker} ticker={chart.ticker} data={chart.data} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                height: '300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                opacity: 0.6
              }}>
                <FileText size={64} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>Report will appear here after research is complete.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
