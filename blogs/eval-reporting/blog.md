---
title: "Rethinking Agent Evaluation Reporting"
subtitle: "Why pass/fail scores hide what matters most about agent systems."
author: Elron Bandel
date: 2026-03-17
reading_time: 7 min
slug: eval-reporting
---

Two AI agents complete identical tasks. Both succeed according to evaluation scores. Yet one finishes cleanly in seconds while the other crashes twice, requires multiple retries, consumes ten times the cost, and reveals a faulty subagent upon investigation. The evaluation score reveals none of this.

Getting the right answer used to be all that mattered. For agents, it's just the beginning.

## Why traditional metrics fall short

Historical AI evaluation measured single input-output pairs. Modern agents operate differently -- they run sessions involving multiple actions, tool calls, errors, recoveries, and delegations to subagents. A pass/fail score ignores everything occurring within the session.

Token metrics particularly fail agents. They assume evaluation of a single model's internals rather than observing composed systems as black boxes. The measurement framework itself requires rethinking.

> The same score, completely different in production.

## Eight essential evaluation questions

Effective agent evaluation must answer:

1. **What system was evaluated?** Full composition details -- not just model names, but agent architecture, tools, subagents, and versions.
2. **What was the benchmark environment and grader?** The infrastructure that ran and scored the task.
3. **What actions occurred during execution?** Steps, tool calls, retries, delegations.
4. **How did the run conclude?** Clean finish, timeout, crash, or manual stop.
5. **Which component failed -- agent or environment?** Error attribution matters for debugging.
6. **How much interaction occurred?** Steps, retries, cost, time -- the operational footprint.
7. **Under what conditions?** Internet access, memory exposure, reset policies.
8. **Is performance reproducible or inconsistent?** Variance across runs, not just averages.

## The black box / white box distinction

> Observe the session like a black box. Describe the system like a white box.

Evaluation should measure observable outcomes -- time, cost, actions, completion -- while separately reporting internal composition: models, tools, subagents, versions. Mixing these concerns leads to metrics that neither describe the system nor explain its behavior.

## Convergence across nine systems

We surveyed nine major evaluation projects -- HAL, Harbor, Inspect AI, tau2-bench, Exgentic, AppWorld, SWE-bench, and others. The findings reveal consistent gaps.

Identity and outcomes appear across most systems. Critically missing are error attribution, stoppage reasons, and interaction accounting -- the data that distinguishes production success from failure.

## A proposed standard

We propose extending the [Every Eval Ever](https://arxiv.org/abs/2602.22953) standardization framework with a session-result layer capturing:

**System composition:** Agent models, tools, subagents, versions. Benchmark environment and grader specifications.

**Session semantics:** Status, finish signals, stop reasons, error attribution, interaction counts -- excluding misleading token metrics.

**Operating conditions:** Internet access, memory exposure, reset policies, repeated-run seeds.

**Robustness:** Variance metrics, consistency measurements across variants.

## Why now

General-purpose agents now run consistently across multiple benchmarks. This advancement makes inconsistent result reporting a genuine impediment.

> The agent side has unified. The reporting side hasn't caught up.

Without standardization, organizations will develop incompatible private solutions, fragmenting the evaluation ecosystem. The time to agree on shared reporting conventions is before proliferation, not after.

## What's next

A draft proposal outlines concrete schema extensions to Every Eval Ever. We invite benchmark authors, framework builders, and evaluation practitioners to help standardize agent evaluation reporting before incompatible formats take hold.

The [Exgentic framework](https://github.com/Exgentic/exgentic) already implements these reporting principles. The [Open Agent Leaderboard](https://huggingface.co/spaces/open-agent-leaderboard/leaderboard) demonstrates what evaluation looks like when cost, completion rates, and failure modes are reported alongside accuracy.

If you're building or evaluating agents, help us define the standard. [Join the discussion](https://github.com/Exgentic/exgentic/issues).
