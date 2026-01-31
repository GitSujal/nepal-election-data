import streamlit as st
import pandas as pd
from db import query

st.set_page_config(page_title="Candidate Explorer", layout="wide")
st.title("Candidate Explorer")

# --- Sidebar filters ---
election_type = st.sidebar.radio("Election Type", ["FPTP", "Proportional"])

if election_type == "FPTP":
    all_data = query("SELECT * FROM dim_current_candidates")

    states = ["All"] + sorted(all_data["state_name"].dropna().unique().tolist())
    sel_state = st.sidebar.selectbox("State", states)

    filtered = all_data if sel_state == "All" else all_data[all_data["state_name"] == sel_state]

    districts = ["All"] + sorted(filtered["district_name"].dropna().unique().tolist())
    sel_district = st.sidebar.selectbox("District", districts)
    if sel_district != "All":
        filtered = filtered[filtered["district_name"] == sel_district]

    constituencies = ["All"] + sorted(filtered["constituency_name"].dropna().unique().tolist())
    sel_const = st.sidebar.selectbox("Constituency", constituencies)
    if sel_const != "All":
        filtered = filtered[filtered["constituency_name"] == sel_const]

    parties = ["All"] + sorted(filtered["political_party_name"].dropna().unique().tolist())
    sel_party = st.sidebar.selectbox("Party", parties)
    if sel_party != "All":
        filtered = filtered[filtered["political_party_name"] == sel_party]

    genders = ["All"] + sorted(filtered["gender"].dropna().unique().tolist())
    sel_gender = st.sidebar.selectbox("Gender", genders)
    if sel_gender != "All":
        filtered = filtered[filtered["gender"] == sel_gender]

    if "candidate_type" in filtered.columns:
        types = ["All"] + sorted(filtered["candidate_type"].dropna().unique().tolist())
        sel_type = st.sidebar.selectbox("Candidate Type", types)
        if sel_type != "All":
            filtered = filtered[filtered["candidate_type"] == sel_type]

    search = st.text_input("Search by candidate name")
    if search:
        filtered = filtered[filtered["candidate_name"].str.contains(search, case=False, na=False)]

    st.caption(f"Showing {len(filtered)} candidates")

    display_cols = [
        "candidate_name", "political_party_name", "gender", "age", "age_group",
        "state_name", "district_name", "constituency_name",
        "candidate_type", "is_tourist_candidate", "qualification_level",
    ]
    display_cols = [c for c in display_cols if c in filtered.columns]
    st.dataframe(filtered[display_cols], use_container_width=True, hide_index=True)

    # --- Expandable detail ---
    st.subheader("Candidate Detail")
    candidate_names = filtered["candidate_name"].tolist()
    if candidate_names:
        sel_candidate = st.selectbox("Select candidate", candidate_names)
        row = filtered[filtered["candidate_name"] == sel_candidate].iloc[0]
        with st.expander("Full details", expanded=True):
            detail_cols = [c for c in filtered.columns if pd.notna(row[c]) and str(row[c]).strip() != ""]
            for c in detail_cols:
                st.write(f"**{c}:** {row[c]}")

else:
    # Proportional
    all_data = query("SELECT * FROM dim_current_proportional_candidates")

    parties = ["All"] + sorted(all_data["political_party_name"].dropna().unique().tolist())
    sel_party = st.sidebar.selectbox("Party", parties)
    filtered = all_data if sel_party == "All" else all_data[all_data["political_party_name"] == sel_party]

    genders = ["All"] + sorted(filtered["gender"].dropna().unique().tolist())
    sel_gender = st.sidebar.selectbox("Gender", genders)
    if sel_gender != "All":
        filtered = filtered[filtered["gender"] == sel_gender]

    if "inclusive_group" in filtered.columns:
        groups = ["All"] + sorted(filtered["inclusive_group"].dropna().unique().tolist())
        sel_group = st.sidebar.selectbox("Inclusive Group", groups)
        if sel_group != "All":
            filtered = filtered[filtered["inclusive_group"] == sel_group]

    search = st.text_input("Search by candidate name")
    if search:
        filtered = filtered[filtered["full_name"].str.contains(search, case=False, na=False)]

    st.caption(f"Showing {len(filtered)} candidates")

    display_cols = [
        "full_name", "political_party_name", "gender", "inclusive_group",
        "citizenship_district", "backward_area", "disability",
    ]
    display_cols = [c for c in display_cols if c in filtered.columns]
    st.dataframe(filtered[display_cols], use_container_width=True, hide_index=True)

    # --- Expandable detail ---
    st.subheader("Candidate Detail")
    candidate_names = filtered["full_name"].tolist()
    if candidate_names:
        sel_candidate = st.selectbox("Select candidate", candidate_names)
        row = filtered[filtered["full_name"] == sel_candidate].iloc[0]
        with st.expander("Full details", expanded=True):
            detail_cols = [c for c in filtered.columns if pd.notna(row[c]) and str(row[c]).strip() != ""]
            for c in detail_cols:
                st.write(f"**{c}:** {row[c]}")
