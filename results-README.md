# Exgentic Leaderboard Data

## Overview
This dataset contains benchmark evaluation results for various AI agent frameworks tested across multiple real-world tasks. The data powers the Exgentic leaderboard, providing transparent performance comparisons for general-purpose AI agents.

## License
This dataset is licensed under the **Community Data License Agreement – Permissive – Version 2.0 (CDLA-Permissive-2.0)**.

- Full license text: [LICENSE-DATA.txt](./LICENSE-DATA.txt)
- Official license page: https://cdla.dev/permissive-2-0/

### What This Means
You are free to:
- ✅ Use, reproduce, and modify the data
- ✅ Create derivative works
- ✅ Distribute and sublicense the data
- ✅ Use for commercial purposes

No attribution is legally required, but we appreciate citations (see below).

## Citation
**[TODO: Update with paper citation when available]**

For now, please cite:
```
Exgentic: Open Leaderboard for General-Purpose AI Agents
https://ibm-research-ai.github.io/exgentic-website/
Accessed: [Date]
```

## Data Description

### File: `results.csv`
Contains 91 evaluation runs across 15 model-agent combinations.

**Columns:**
- `model`: Base language model (e.g., gpt-4o, claude-3.5-sonnet)
- `agent`: Agent framework (e.g., ReAct, Reflexion, OpenHands)
- `benchmark`: Evaluation task (WebArena, AssistantBench, GAIA, OSWorld)
- `task`: Specific task within benchmark
- `success`: Binary success indicator (0 or 1)
- `cost`: Execution cost in USD
- `turns`: Number of interaction turns
- `tokens_input`: Input tokens used
- `tokens_output`: Output tokens generated
- `date`: Evaluation date (YYYY-MM-DD format)

### Benchmarks Included
1. **WebArena**: Web navigation and interaction tasks
2. **AssistantBench**: General assistant capabilities
3. **GAIA**: Question answering and reasoning
4. **OSWorld**: Operating system interaction tasks

### Model-Agent Combinations
15 combinations tested, including:
- GPT-4o with ReAct, Reflexion, OpenHands
- Claude 3.5 Sonnet with ReAct, Reflexion, OpenHands
- Llama 3.1 405B with ReAct, Reflexion, OpenHands
- And more...

## Data Source
- **Website**: https://ibm-research-ai.github.io/exgentic-website/
- **GitHub Repository**: https://github.com/IBM/exgentic
- **Last Updated**: January 29, 2026

## Data Collection Methodology
[TODO: Add methodology details when available]

Each agent was evaluated on standardized benchmark tasks with consistent:
- Evaluation protocols
- Resource limits
- Success criteria
- Cost tracking

## Known Limitations
- Results represent snapshot evaluations at a specific point in time
- Performance may vary with different prompts or configurations
- Costs are approximate and may vary based on API pricing changes
- Some benchmarks have limited task coverage

## Updates and Versioning
This dataset is periodically updated with new results. Check the `date` column for evaluation timestamps and the website for the latest version.

## Contact
For questions, issues, or contributions:
- GitHub Issues: https://github.com/IBM/exgentic/issues
- Website: https://ibm-research-ai.github.io/exgentic-website/

## Acknowledgments
This work builds upon the following benchmark datasets:
- WebArena
- AssistantBench
- GAIA
- OSWorld

We thank the creators of these benchmarks for their contributions to the AI agent evaluation ecosystem.

---

**License**: CDLA-Permissive-2.0  
**Version**: 1.0  
**Date**: January 29, 2026