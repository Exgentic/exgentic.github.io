# Open Agent Leaderboard Data

## Overview
Benchmark evaluation results for general-purpose AI agent systems tested across six diverse real-world tasks. The data powers the [Open Agent Leaderboard](https://huggingface.co/spaces/open-agent-leaderboard/leaderboard).

## License
This dataset is licensed under the **Community Data License Agreement -- Permissive -- Version 2.0 (CDLA-Permissive-2.0)**.

- Full license text: [LICENSE-DATA.txt](./LICENSE-DATA.txt)
- Official license page: https://cdla.dev/permissive-2-0/

## Citation

```bibtex
@inproceedings{bandel2026general,
  title={General Agent Evaluation},
  author={Bandel, Elron and Yehudai, Asaf and Jacovi, Michal and Katz, Yoav and Shmueli-Scheuer, Michal and Choshen, Leshem},
  booktitle={ICLR 2026 Workshop on LLM Agents},
  year={2026},
  url={https://arxiv.org/abs/2602.22953}
}
```

## Data Description

### File: `data/results.csv`
Each row represents one agent-model-benchmark combination.

**Key columns:**
- `agent`, `agent_name`: Agent identifier and display name
- `model`, `model_name`: LLM used
- `benchmark`, `benchmark_name`: Benchmark evaluated
- `benchmark_score`: Primary success rate (0--1)
- `average_agent_cost`: Mean cost per task in USD
- `average_steps`: Mean steps per task
- `planned_sessions`, `successful_sessions`, `total_sessions`: Task counts
- `percent_finished`, `percent_successful`: Completion and success rates

### Benchmarks

| Benchmark | Domain |
|-----------|--------|
| AppWorld | App-based task completion |
| BrowseComp+ | Web research and information retrieval |
| SWE-bench | Software engineering issue resolution |
| TauBench-Airline | Customer service (airline) |
| TauBench-Retail | Customer service (retail) |
| TauBench-Telecom | Technical support (telecom) |

### Agents

| Agent | Framework |
|-------|-----------|
| Claude Code | [claude-code](https://github.com/anthropics/claude-code) |
| OpenAI Solo | [openai-agents-python](https://github.com/openai/openai-agents-python) |
| Smolagent | [smolagents](https://github.com/huggingface/smolagents) |
| React | [litellm](https://github.com/BerriAI/litellm) |
| React + Shortlisting | [litellm](https://github.com/BerriAI/litellm) |

### Models

Claude Opus 4.5, GPT-5.2, Gemini Pro 3.

## Data Collection

Each agent was evaluated using the [Exgentic](https://github.com/Exgentic/exgentic) framework with consistent evaluation protocols, resource limits, success criteria, and cost tracking. Agents were tested as general-purpose systems without benchmark-specific tuning.

See the [paper](https://arxiv.org/abs/2602.22953) for full methodology.

## Contact
- GitHub: https://github.com/Exgentic/open-agent-leaderboard
- Website: https://exgentic.ai

---

**License**: CDLA-Permissive-2.0
