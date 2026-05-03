#!/usr/bin/env python3
"""
Build script: generates website CSV and HF dataset parquet from the
single source of truth at data/results.csv.

Usage:
    python scripts/build_data.py
"""
import csv
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
SOURCE_CSV = os.path.join(ROOT_DIR, "data", "results.csv")
WEBSITE_CSV = os.path.join(ROOT_DIR, "results.csv")
HF_DATASET_DIR = os.path.join(ROOT_DIR, "hf-dataset", "data")
HF_PARQUET = os.path.join(HF_DATASET_DIR, "train-00000-of-00001.parquet")

# === Mappings from source IDs to website display values ===

AGENT_MAP = {
    # source agent → (website agent, agent_normalized, visible_agent_name, agent_version)
    "claude_code": ("claudecode", "claude-code", "Claude_Code", "claude_code_2.1.7"),
    "openai_solo": ("openaimcp", "openai-mcp", "OpenAI_Solo", "openai_sdk_0.7.0"),
    "smolagents_code": ("smolagent", "smolagents", "Smolagent", "smolagents_1.24.0"),
    "tool_calling": ("litellm", "litellm-react", "React", "exgentic_0.1.0"),
    "tool_calling_with_shortlisting": ("litellm-shortlist", "litellm-shortlist", "React_+_Shortlisting", "exgentic_0.1.0_\u00b7_litellm_1.79.1"),
}

MODEL_MAP = {
    # source model → (website model, model_normalized)
    "openai_aws_claude-opus-4-5": ("claude", "claude-opus-4.5"),
    "openai_Azure_gpt-5.2-2025-12-11": ("gpt52", "gpt-5.2"),
    "openai_gcp_gemini-3-pro-preview": ("gemini", "gemini-3-pro"),
    "openai_Azure_DeepSeek-V3.2": ("deepseek", "deepseek-v3.2"),
    "openai_Azure_Kimi-K2.5": ("kimi", "kimi-k2.5"),
}

BENCHMARK_MAP = {
    # source benchmark → website benchmark name
    "appworld_test_normal": "AppWorld",
    "browsecompplus": "BrowseComp+",
    "swebench": "SWE-bench",
    "tau2_airline": "TauBench-Airline",
    "tau2_retail": "TauBench-Retail",
    "tau2_telecom": "TauBench-Telecom",
}


def build_website_csv():
    """Generate results.csv for the website and HF space."""
    with open(SOURCE_CSV) as f:
        source_rows = list(csv.DictReader(f))

    website_header = [
        "agent", "agent_normalized", "visible_agent_name", "agent_version",
        "avg_cost", "avg_steps", "benchmark", "finished_pct",
        "model", "model_normalized", "num_tasks", "score", "total_cost",
    ]

    website_rows = []
    for r in source_rows:
        agent_info = AGENT_MAP.get(r["agent"])
        model_info = MODEL_MAP.get(r["model"])
        benchmark = BENCHMARK_MAP.get(r["benchmark"])

        if not agent_info or not model_info or not benchmark:
            print(f"WARNING: unmapped row: agent={r['agent']}, model={r['model']}, benchmark={r['benchmark']}")
            continue

        # Format numbers: strip trailing zeros, integers as int
        def fmt(v):
            if v == '' or v is None:
                return ''
            try:
                fv = float(v)
                if fv == int(fv) and '.' not in v.rstrip('0'):
                    return str(int(fv))
                return v
            except ValueError:
                return v

        website_rows.append({
            "agent": agent_info[0],
            "agent_normalized": agent_info[1],
            "visible_agent_name": agent_info[2],
            "agent_version": agent_info[3],
            "avg_cost": r["average_agent_cost"],
            "avg_steps": r["average_steps"],
            "benchmark": benchmark,
            "finished_pct": r["percent_finished"],
            "model": model_info[0],
            "model_normalized": model_info[1],
            "num_tasks": str(int(float(r["planned_sessions"]))),
            "score": r["benchmark_score"],
            "total_cost": r["total_agent_cost"],
        })

    with open(WEBSITE_CSV, "w", newline="", encoding="latin-1") as f:
        writer = csv.DictWriter(f, fieldnames=website_header)
        writer.writeheader()
        writer.writerows(website_rows)

    print(f"Generated {WEBSITE_CSV} ({len(website_rows)} rows)")


def build_hf_parquet():
    """Generate parquet for the HF dataset."""
    try:
        import pyarrow as pa
        import pyarrow.parquet as pq
    except ImportError:
        print("WARNING: pyarrow not installed, skipping parquet generation")
        print("  Install with: pip install pyarrow")
        return

    with open(SOURCE_CSV) as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    # Define column types
    int_cols = {"planned_sessions", "successful_sessions", "total_sessions"}
    float_cols = {
        "average_action_count", "average_agent_cost", "average_benchmark_cost",
        "average_invalid_action_count", "average_invalid_action_percent",
        "average_score", "average_steps", "benchmark_score",
        "completed_sessions", "incomplete_sessions", "missing_sessions",
        "percent_error", "percent_finished", "percent_finished_successful",
        "percent_finished_unsuccessful", "percent_successful", "percent_unfinished",
        "total_agent_cost", "total_benchmark_cost", "total_run_cost",
    }

    columns = {}
    for col in fieldnames:
        values = [r[col] for r in rows]
        if col in int_cols:
            columns[col] = pa.array([int(v) if v else 0 for v in values], type=pa.int64())
        elif col in float_cols:
            columns[col] = pa.array([float(v) if v else 0.0 for v in values], type=pa.float64())
        else:
            columns[col] = pa.array([v if v else None for v in values], type=pa.large_string())

    table = pa.table(columns)
    os.makedirs(HF_DATASET_DIR, exist_ok=True)
    pq.write_table(table, HF_PARQUET)
    print(f"Generated {HF_PARQUET} ({len(rows)} rows)")


if __name__ == "__main__":
    build_website_csv()
    build_hf_parquet()
