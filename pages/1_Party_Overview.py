import streamlit as st
import plotly.express as px
from db import query

st.set_page_config(page_title="Party Overview", layout="wide")
st.title("Party Overview")

parties = query("SELECT * FROM dim_parties ORDER BY current_party_name")
party_names = parties["current_party_name"].tolist()

selected_party = st.sidebar.selectbox("Select Party", party_names)

# --- Party detail card ---
party_row = parties[parties["current_party_name"] == selected_party].iloc[0]
prev_names = party_row.get("previous_names")

fptp = query(
    "SELECT * FROM dim_fptp_candidates WHERE political_party_name = $1",
    [selected_party],
)
proportional = query(
    "SELECT * FROM dim_current_proportional_candidates WHERE political_party_name = $1",
    [selected_party],
)

col1, col2, col3 = st.columns(3)
col1.metric("FPTP Candidates", len(fptp))
col2.metric("Proportional Candidates", len(proportional))
col3.metric("Total", len(fptp) + len(proportional))

if prev_names is not None and (isinstance(prev_names, list) and len(prev_names) > 0 or hasattr(prev_names, 'size') and prev_names.size > 0):
    names = list(prev_names) if not isinstance(prev_names, list) else prev_names
    st.info(f"**Previous names:** {', '.join(str(n) for n in names)}")

st.divider()

# --- Gender split ---
col_a, col_b = st.columns(2)

with col_a:
    st.subheader("Gender Split (FPTP)")
    if len(fptp) > 0:
        g = fptp["gender"].value_counts().reset_index()
        g.columns = ["Gender", "Count"]
        fig = px.pie(g, names="Gender", values="Count")
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.caption("No FPTP candidates")

with col_b:
    st.subheader("Gender Split (Proportional)")
    if len(proportional) > 0:
        g = proportional["gender"].value_counts().reset_index()
        g.columns = ["Gender", "Count"]
        fig = px.pie(g, names="Gender", values="Count")
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.caption("No proportional candidates")

# --- Age group (FPTP) ---
if len(fptp) > 0 and "age_group" in fptp.columns:
    st.subheader("Age Group Distribution (FPTP)")
    age = fptp["age_group"].value_counts().sort_index().reset_index()
    age.columns = ["Age Group", "Count"]
    fig = px.bar(age, x="Age Group", y="Count")
    st.plotly_chart(fig, use_container_width=True)

# --- Candidate type (FPTP) ---
if len(fptp) > 0 and "candidate_type" in fptp.columns:
    st.subheader("Candidate Type Breakdown (FPTP)")
    ct = fptp["candidate_type"].value_counts().reset_index()
    ct.columns = ["Type", "Count"]
    fig = px.bar(ct, x="Type", y="Count")
    st.plotly_chart(fig, use_container_width=True)

# --- Tourist candidates ---
if len(fptp) > 0 and "is_tourist_candidate" in fptp.columns:
    tourist_count = fptp["is_tourist_candidate"].sum()
    st.metric("Tourist Candidates (FPTP)", int(tourist_count))

# --- Constituencies contested ---
if len(fptp) > 0:
    st.subheader("Constituencies Contested (FPTP)")
    const_df = fptp[["state_name", "district_name", "constituency_name"]].drop_duplicates().sort_values(
        ["state_name", "district_name", "constituency_name"]
    )
    st.dataframe(const_df, use_container_width=True, hide_index=True)

# --- Inclusive group (Proportional) ---
if len(proportional) > 0 and "inclusive_group" in proportional.columns:
    st.subheader("Inclusive Group Distribution (Proportional)")
    ig = proportional["inclusive_group"].value_counts().reset_index()
    ig.columns = ["Inclusive Group", "Count"]
    fig = px.bar(ig, x="Inclusive Group", y="Count")
    st.plotly_chart(fig, use_container_width=True)
