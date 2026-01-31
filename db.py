import duckdb
import pandas as pd
import streamlit as st


@st.cache_resource
def get_connection():
    return duckdb.connect("election/election.db", read_only=True)


def query(sql: str, params=None) -> pd.DataFrame:
    conn = get_connection()
    if params:
        return conn.execute(sql, params).fetchdf()
    return conn.execute(sql).fetchdf()
