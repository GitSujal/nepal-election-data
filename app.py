import streamlit as st
import plotly.express as px
from db import query

st.set_page_config(page_title="Nepal Election Dashboard", layout="wide")
st.title("Nepal Election Dashboard 2082")

# --- Sidebar filters (FPTP only) ---
st.sidebar.header("Filters (FPTP)")

states = query("SELECT DISTINCT state_name FROM dim_current_candidates ORDER BY state_name")
selected_state = st.sidebar.selectbox("State", ["All"] + states["state_name"].tolist())

district_sql = "SELECT DISTINCT district_name FROM dim_current_candidates"
if selected_state != "All":
    district_sql += f" WHERE state_name = '{selected_state}'"
district_sql += " ORDER BY district_name"
districts = query(district_sql)
selected_district = st.sidebar.selectbox("District", ["All"] + districts["district_name"].tolist())

const_sql = "SELECT DISTINCT constituency_name FROM dim_current_candidates WHERE 1=1"
if selected_state != "All":
    const_sql += f" AND state_name = '{selected_state}'"
if selected_district != "All":
    const_sql += f" AND district_name = '{selected_district}'"
const_sql += " ORDER BY constituency_name"
constituencies = query(const_sql)
selected_const = st.sidebar.selectbox("Constituency", ["All"] + constituencies["constituency_name"].tolist())

# --- Build WHERE clause ---
where_parts = []
if selected_state != "All":
    where_parts.append(f"state_name = '{selected_state}'")
if selected_district != "All":
    where_parts.append(f"district_name = '{selected_district}'")
if selected_const != "All":
    where_parts.append(f"constituency_name = '{selected_const}'")
where_clause = " AND ".join(where_parts)
where_sql = f"WHERE {where_clause}" if where_clause else ""

# --- Load data ---
fptp = query(f"SELECT * FROM dim_current_candidates {where_sql}")
proportional = query("SELECT * FROM dim_current_proportional_candidates")
parties = query("SELECT * FROM dim_parties")

# --- Top metrics ---
col1, col2, col3, col4 = st.columns(4)
col1.metric("Total Parties", len(parties))
col2.metric("FPTP Candidates", len(fptp))
col3.metric("Proportional Candidates", len(proportional))
col4.metric("Total Candidates", len(fptp) + len(proportional))

st.divider()

# --- Top 15 parties by FPTP candidate count ---
st.subheader("Top 15 Parties by FPTP Candidate Count")
party_counts = fptp["political_party_name"].value_counts().head(15).reset_index()
party_counts.columns = ["Party", "Count"]
fig = px.bar(party_counts, x="Count", y="Party", orientation="h", height=500)
fig.update_layout(yaxis=dict(autorange="reversed"))
st.plotly_chart(fig, use_container_width=True)

# --- Gender distribution side by side ---
st.subheader("Gender Distribution")
col_fptp, col_prop = st.columns(2)

with col_fptp:
    st.caption("FPTP")
    gender_fptp = fptp["gender"].value_counts().reset_index()
    gender_fptp.columns = ["Gender", "Count"]
    fig = px.pie(gender_fptp, names="Gender", values="Count")
    st.plotly_chart(fig, use_container_width=True)

with col_prop:
    st.caption("Proportional")
    gender_prop = proportional["gender"].value_counts().reset_index()
    gender_prop.columns = ["Gender", "Count"]
    fig = px.pie(gender_prop, names="Gender", values="Count")
    st.plotly_chart(fig, use_container_width=True)

# --- Age group distribution (FPTP) ---
st.subheader("Age Group Distribution (FPTP)")
if "age_group" in fptp.columns:
    age_counts = fptp["age_group"].value_counts().sort_index().reset_index()
    age_counts.columns = ["Age Group", "Count"]
    fig = px.bar(age_counts, x="Age Group", y="Count")
    st.plotly_chart(fig, use_container_width=True)

# --- Candidate type breakdown (FPTP) ---
st.subheader("Candidate Type Breakdown (FPTP)")
if "candidate_type" in fptp.columns:
    type_counts = fptp["candidate_type"].value_counts().reset_index()
    type_counts.columns = ["Type", "Count"]
    fig = px.bar(type_counts, x="Type", y="Count")
    st.plotly_chart(fig, use_container_width=True)

# --- Candidates by state (FPTP) ---
st.subheader("Candidates by State (FPTP)")
state_counts = fptp["state_name"].value_counts().reset_index()
state_counts.columns = ["State", "Count"]
fig = px.bar(state_counts, x="State", y="Count")
st.plotly_chart(fig, use_container_width=True)

# --- Inclusive group distribution (Proportional) ---
st.subheader("Inclusive Group Distribution (Proportional)")
if "inclusive_group" in proportional.columns:
    ig_counts = proportional["inclusive_group"].value_counts().reset_index()
    ig_counts.columns = ["Inclusive Group", "Count"]
    fig = px.bar(ig_counts, x="Inclusive Group", y="Count")
    st.plotly_chart(fig, use_container_width=True)
