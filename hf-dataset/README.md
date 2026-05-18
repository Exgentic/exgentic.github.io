---
pretty_name: Open Agent Leaderboard Results
license: cdla-permissive-2.0
tags:
  - benchmark
  - leaderboard
  - agents
  - evaluation
  - ai-agents
  - agent-evaluation
language:
  - en
configs:
- config_name: default
  data_files:
  - split: train
    path: data/train-*
---

# Open Agent Leaderboard Results

Detailed evaluation results for general-purpose AI agents across diverse real-world benchmarks — without domain-specific tuning.

- **Leaderboard**: [open-agent-leaderboard/leaderboard](https://huggingface.co/spaces/open-agent-leaderboard/leaderboard)
- **Website**: [exgentic.ai](https://www.exgentic.ai)
- **Paper**: [arXiv:2602.22953](https://arxiv.org/abs/2602.22953)
- **GitHub**: [Exgentic/exgentic](https://github.com/Exgentic/exgentic)
- **License**: [CDLA-Permissive-2.0](https://cdla.dev/permissive-2-0/)

## Benchmarks

| Benchmark | Task ID | Description |
|-----------|---------|-------------|
| AppWorld | `appworld` | App-based task completion in simulated smartphone environments |
| BrowseComp+ | `browsecomp_plus` | Web browsing and complex information retrieval |
| SWE-bench | `swebench` | Software engineering issue resolution on real GitHub repos |
| TauBench-Airline | `taubench_airline` | Customer service agent evaluation (airline domain) |
| TauBench-Retail | `taubench_retail` | Customer service agent evaluation (retail domain) |
| TauBench-Telecom | `taubench_telecom` | Customer service agent evaluation (telecom domain) |

The `overall` score is a weighted average: each TauBench sub-task gets 1/12 weight (1/4 total for TauBench), all others get 1/4 each.

## Agents Evaluated

| Agent | Framework |
|-------|-----------|
| Claude Code | [claude-code](https://github.com/anthropics/claude-code) |
| OpenAI Solo | [openai-agents-python](https://github.com/openai/openai-agents-python) |
| Smolagent | [smolagents](https://github.com/huggingface/smolagents) |
| React | [litellm](https://github.com/BerriAI/litellm) |
| React + Shortlisting | [litellm](https://github.com/BerriAI/litellm) + [exgentic](https://github.com/Exgentic/exgentic) |

## Models

Results are reported for each agent × model combination: **Claude Opus 4.5**, **Gemini 3 Pro**, **GPT-5.2**, **DeepSeek V3.2**, **Kimi K2.5**.

## Submitting new results

This dataset is the source of truth for the Open Agent Leaderboard. To add results for a new model, agent, or benchmark:

1. **Run evaluations** using the [Exgentic framework](https://github.com/Exgentic/exgentic)
2. **Open a PR** on this dataset adding your rows to the parquet file in `data/`

Each row represents one (agent, model, benchmark) combination. Required fields:

| Field | Description |
|-------|-------------|
| `agent` | Agent identifier (e.g., `claude_code`) |
| `agent_name` | Display name (e.g., `Claude Code CLI`) |
| `model` | Model identifier (e.g., `openai_Azure_DeepSeek-V3.2`) |
| `model_name` | Display name (e.g., `openai/azure/DeepSeek-V3.2`) |
| `benchmark` | Benchmark identifier (e.g., `swebench`) |
| `benchmark_name` | Display name (e.g., `SWE-bench`) |
| `benchmark_score` | Primary score (0-1) |
| `planned_sessions` | Number of tasks attempted |
| `total_sessions` | Number of sessions completed |
| `successful_sessions` | Number of sessions that passed |

See the existing data for the full schema and examples.

## Schema

| Column | Type | Description |
|--------|------|-------------|
| `agent` / `agent_name` | string | Agent identifier and display name |
| `model` / `model_name` | string | Model identifier and display name |
| `benchmark` / `benchmark_name` | string | Benchmark identifier and display name |
| `benchmark_score` | float | Primary success rate (0-1) |
| `average_score` | float | Average score across sessions |
| `average_agent_cost` | float | Average cost per task (USD) |
| `average_steps` | float | Average number of agent steps per task |
| `average_action_count` | float | Average number of actions per task |
| `average_invalid_action_count` | float | Average invalid actions per task |
| `percent_successful` | float | Fraction of tasks that succeeded |
| `percent_finished` | float | Fraction of tasks that completed (success or fail) |
| `percent_error` | float | Fraction of tasks that errored |
| `total_agent_cost` | float | Total cost across all tasks (USD) |
| `planned_sessions` / `total_sessions` / `successful_sessions` | int | Session counts |
