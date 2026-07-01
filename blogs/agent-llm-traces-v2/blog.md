---
title: "What Frontier Agents Actually Do"
subtitle: "10K real agent runs, in one standard format, so anyone can study how agents behave and not just what they scored."
author: Elron Bandel
date: 2026-07-01
reading_time: 8 min
slug: agent-llm-traces-v2
---

AI agents now book our travel, write our code, and answer our customers. Two can finish the same task and look identical on paper — one taking three clean steps, the other opening a file it shouldn't, crashing a service, and recovering by luck. We already know whether they succeed and what they cost. It's time we saw how they get there.

Today we're releasing [Exgentic Agent LLM Traces](https://huggingface.co/datasets/Exgentic/agent-llm-traces-v2): 10K real agent runs, across five leading models and six kinds of task, with every model call preserved in one standard format. It's the part of the run that normally gets thrown away.

> We've always known whether agents succeed or failed. Now we can see how.

## Why this matters

Agents are moving into real work: writing code, handling customer support, doing research, automating tasks across hundreds of apps. Benchmarks are how we study that work before it reaches the people who depend on it — each one a controlled mirror of a real job, a stand-in for the messy thing we actually care about. So the question is never really how an agent scores on the mirror. It is how the agent will behave doing the real thing: what it costs, where it gives up, whether it recovers when something breaks. And almost everything we know about that comes from a single number per run, because that number is usually all anyone keeps.

That leaves a gap. We study *models* on mountains of public data. We study *agents* — the multi-step, tool-using, failing-and-recovering systems people actually deploy — on almost nothing public. The behavior that decides whether an agent is worth shipping lives in the full record of what it did, and that record rarely leaves the lab that produced it.

The gap exists for a concrete reason: producing real agent runs at scale is slow, costly, and fragmented. It means running the strongest available models across many different environments, thousands of times over, and paying for every token they generate. And even once you have the runs, every tool records them in its own shape, so what data exists stays private and mutually incompatible. There has been no large, uniform, public record of what capable agents actually do.

> Model behavior is studied everywhere. Agent behavior is barely studied at all, because the data isn't public.

This release is a piece of that missing record. Real runs, at scale, from frontier models, across the domains agents are deployed in, in one format anyone can load. That combination didn't exist before today.

## What you can do with it

Preserving the full run, not just the verdict, is what makes the data useful. Each of these was previously gated behind running the evaluations yourself:

- **Train and fine-tune agents on real runs.** Long, tool-using runs from strong models are the kind of data that is hard to obtain and expensive to generate.
- **Build tools that evaluate agents, using real failures.** Study where agents actually break instead of on made-up examples.
- **Replay a recorded moment against a new model.** Feed the exact situation an agent faced to a different model and compare, without re-running the whole evaluation.
- **Debug your own agent against a reference set.** Compare its behavior to how the strongest models handle the same kinds of tasks.

## What's in it

The dataset is 10K sessions and 242K model calls, filtered down from a full corpus of 10.5K sessions and 626K calls. Roughly two-thirds of the raw calls were removed on purpose: the scaffolding around the agent under test.

Each session passes through a filter that strips out the supporting machinery — the simulated user, the automatic grader — collapses repeated identical retries, and keeps only the calls the tested model actually made. What remains is the model under test, and nothing the evaluation wrapped around it. The totals for steps, tokens, and cost are recomputed from the calls that survive, so they describe the agent's own footprint and not the machinery around it.

Every call is written in one open, standard format for recording model calls (the [OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/), which a growing part of the ecosystem already emits). A call carries the models used, the full input and output messages, the tools that were available, token usage, why the call stopped, and an error type when it failed. Each row also carries run-level context — which benchmark, which agent design, the score, the cost, the number of steps — so you can slice the data however you need. Because every run speaks the same format, these traces accumulate into something comparable instead of fragmenting into one dialect per tool — the value compounds as more are added.

The coverage spans the range of real agent work — software engineering, deep research, personal-task automation across hundreds of apps, and policy-bound customer service and technical support. The token averages alone show how differently these tasks load a model:

| Domain | Benchmark | Runs | Avg tokens / run |
|--------|-----------|-----:|-----------------:|
| Software engineering | SWE-bench | 2K | 2.1M |
| Deep research | BrowseComp Plus | 1.9K | 1.6M |
| Personal-task automation | AppWorld | 1.5K | 1.7M |
| Technical support | τ²-bench Telecom | 1.8K | 332K |
| Customer service | τ²-bench Retail | 1.8K | 198K |
| Customer service | τ²-bench Airline | 1K | 255K |

Five frontier models are represented in comparable volume — DeepSeek-V3.2 (2.3K runs), Kimi-K2.5 (2.3K), GPT-5.2 (2.1K), Claude Opus 4.5 (1.9K), and Gemini 3 Pro (1.4K) — each run through up to five different agent designs. Because the format is identical across all of them, comparing how two models handled the same task, or how one model's behavior shifts between agent designs, is a filter, not a data-cleaning project.

## What it doesn't cover

The dataset is deliberately narrow in a few ways worth stating plainly. It captures the model's own chat calls, not the non-model actions around them, so an agent's file edits or environment steps show up only through the calls that produced them. The models are specific snapshots evaluated at one point in time, not standing verdicts on any model family. And six benchmarks, however varied, are not the full range of work agents will eventually do. If you need the surrounding scaffolding — the user-simulator turns and grading calls we filtered out — the full corpus below keeps all of it.

## See for yourself

The runs are public and ready to load — one open format, 236 MB, [on Hugging Face](https://huggingface.co/datasets/Exgentic/agent-llm-traces-v2). Whatever you are building agents to do, or worried they might do, you can now start from what they actually did instead of a single line of results. Open a few runs and follow how they get there.

> The how was always there, inside every run. Now anyone can read it.

## Sources

- Exgentic Agent LLM Traces: [huggingface.co/datasets/Exgentic/agent-llm-traces-v2](https://huggingface.co/datasets/Exgentic/agent-llm-traces-v2)
- Full corpus: [huggingface.co/datasets/Exgentic/traces-v2](https://huggingface.co/datasets/Exgentic/traces-v2)
- OpenTelemetry GenAI semantic conventions: [opentelemetry.io](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- Exgentic & Open Agent Leaderboard: [arXiv:2602.22953](https://arxiv.org/abs/2602.22953) · [exgentic.ai](https://www.exgentic.ai)
</content>
