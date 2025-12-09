
import streamlit as st
from research_backend import make_plan, approve, run, get_logs, get_report

st.set_page_config(page_title="Financial Deep Research — Demo", page_icon="🧭", layout="wide")
st.title("Financial Deep Research — Demo")
st.caption("Plan → Approve → Run → Report (IT & Pharma)")

with st.sidebar:
    st.header("New Query")
    query = st.text_area("Your research query", value="Analyze Indian IT services sector outlook for 2026: demand, GenAI impact, risks", height=120)
    sector = st.selectbox("Sector", options=["auto","it","pharma"], index=0)
    if st.button("1) Generate Plan", use_container_width=True):
        plan = make_plan(query, sector)
        st.session_state["plan_id"] = plan.plan_id
        st.session_state["plan"] = plan
        st.toast(f"Plan created: {plan.plan_id}")
    if st.button("2) Approve Plan", disabled=("plan_id" not in st.session_state), use_container_width=True):
        approve(st.session_state["plan_id"], focus="deal wins + pricing pressure")
        st.toast("Plan approved")
    if st.button("3) Run Research", disabled=("plan_id" not in st.session_state), use_container_width=True):
        run(st.session_state["plan_id"])
        st.toast("Run started & completed")
    if st.button("4) Get Report", disabled=("plan_id" not in st.session_state), use_container_width=True):
        st.session_state["report"] = get_report(st.session_state["plan_id"])
        st.toast("Report fetched")
    if st.button("Reset", use_container_width=True):
        st.session_state.clear()
        st.rerun()

col1, col2 = st.columns(2)

with col1:
    st.subheader("Plan (JSON)")
    plan = st.session_state.get("plan")
    if plan:
        st.code(plan.__dict__, language="json")
    else:
        st.info("No plan yet. Use the sidebar to create one.")

    st.subheader("Run Logs")
    if "plan_id" in st.session_state:
        logs = get_logs(st.session_state["plan_id"])
        st.code("\n".join(logs["logs"]) or "—", language="bash")
    else:
        st.info("Run a plan to view logs.")

with col2:
    st.subheader("Report (Markdown)")
    st.markdown(st.session_state.get("report", "> No report yet. Click **Get Report**."))

st.markdown("---")
st.markdown("**Setup:** `pip install -r requirements.txt` then `streamlit run app.py`.") 
# **Optional:** Set `TAVILY_API_KEY` for live web search; otherwise uses mock sources.")
