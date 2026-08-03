---
title: "What Agents Do: A Large Scale Public Dataset of Agent Runs"
subtitle: "10K real agent runs, in one standard format, so anyone can study how agents behave and not just what they scored."
author: ""
date: 2026-07-01
reading_time: 8 min
slug: agent-llm-traces-v2
---

AI agents now book our travel, write our code, and answer our customers. Two can finish the same task and look identical on paper — one taking three clean steps, the other opening a file it shouldn't, crashing a service, and recovering by luck. We already know whether they succeed and what they cost. It's time we saw how they get there.

Today we're releasing [Exgentic Agent LLM Traces](https://huggingface.co/datasets/Exgentic/agent-llm-traces-v2): 10K real agent runs — five leading models, five agent designs, six kinds of task — with every model call preserved in one standard format. It's the part of the run that normally gets thrown away.

> We've always known whether agents succeed. Now the record of how is public.

## Why this matters

Agents are moving into real work: writing code, handling customer support, doing research, automating tasks across hundreds of apps. Benchmarks are how we study that work before it reaches the people who depend on it — each one a controlled mirror of a real job, a stand-in for the messy thing we actually care about. So the question is never really how an agent scores on the mirror. It is how the agent will behave doing the real thing: what it costs, where it gives up, whether it recovers when something breaks. And almost everything we know about that comes from a single number per run, because that number is usually all anyone keeps.

That leaves a gap. We study *models* on mountains of public data. We study *agents* — the multi-step, tool-using, failing-and-recovering systems people actually deploy — on almost nothing public. The behavior that decides whether an agent is worth shipping lives in the full record of what it did, and that record rarely leaves the lab that produced it.

A single trace is the full sequence of what an agent did: every model call, in order — the input it received, the tools it had, what it output, and whether it errored. A score tells you whether an agent succeeded; the sequence tells you how it got there — which tools it chose, how its context grew, where it hesitated or recovered. That's the part of the run that normally gets discarded, and the part that's hardest to study without a large public record of it.

The gap exists for a concrete reason: producing real agent runs at scale is slow, costly, and fragmented. It means running frontier models across many different environments, thousands of times over, and paying for every token they generate. And even once you have the runs, every tool records them in its own shape, so what data exists stays private and mutually incompatible. There has been no large, uniform, public record of what capable agents actually do.

> Model behavior is studied everywhere. Agent behavior is barely studied at all, because the data isn't public.

This release is a piece of that missing record. Real runs, at scale, from frontier models, across the domains agents are deployed in, in one format anyone can load. That combination didn't exist before today.

## What you can do with it

Preserving the full run, not just the verdict, is what makes the data useful. Each of these previously required running the evaluations yourself:

- **Debug your own agent against a reference set.** Compare its behavior to how frontier models handle the same kinds of tasks.
- **Build tools that evaluate agents, using real failures.** Study where agents actually break instead of on made-up examples.
- **Replay a recorded step against a new model.** Each step in a trace captures the full context the model saw — the conversation history, system instructions, tool calls, and tool results — along with what it output. Feed that exact context to a different model to see how it would have acted, without the overhead of deploying and running the agent yourself.
- **Evaluate inference infrastructure under realistic load.** Real agent runs are dependency chains — one call's output shapes the next — not the independent requests standard load tests send. Replay these traces against a live endpoint to measure how a serving configuration behaves under true agentic traffic.
- **Train and fine-tune agents on real runs.** Long, tool-using runs from frontier models are the kind of data that is hard to obtain and expensive to generate.

## What's in it

The dataset is 10K runs and 242K model calls, filtered down from a full corpus of 10.5K runs and 626K calls. Roughly two-thirds of the raw calls were removed on purpose: the scaffolding around the agent under test.

Each run passes through a filter that strips out the supporting machinery — the simulated user, the automatic grader — collapses repeated identical retries, and keeps only the calls the tested model actually made. What remains is the model under test, and nothing the evaluation wrapped around it. The totals for steps, tokens, and cost are recomputed from the calls that survive, so they describe the agent's own footprint and not the machinery around it.

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

*(The token counts above group by benchmark; the model table below groups by model — averages differ because each model ran a different mix of benchmarks.)*

Five frontier models are represented in comparable volume — DeepSeek-V3.2 (2.3K runs), Kimi-K2.5 (2.3K), GPT-5.2 (2.1K), Claude Opus 4.5 (1.9K), and Gemini 3 Pro (1.4K) — each run through up to five different agent designs. Because the format is identical across all of them, the runs line up directly — the same task across models, or one model across agent designs, without any per-tool reconciliation.

## A closer look

These aren't our findings — they're examples of what the traces let you ask.

**What kind of work is this?** Task complexity differs sharply across benchmarks:

| Benchmark | Turns (median / mean / max) | Avg tool calls / run | Responses with >1 tool call (%) | Avg duration (min) |
|-----------|----------------------------:|---------------------:|--------------------------------:|-------------------:|
| SWE-bench | 38 / 46.8 / 259 | 31.7 | 10% | 16 |
| AppWorld | 19 / 32.3 / 300 | 27.8 | 10% | 14 |
| BrowseComp Plus | 13 / 19.7 / 167 | 15.4 | 14% | 15 |
| τ²-bench Telecom | 13 / 16.3 / 198 | 5.9 | 3% | 8 |
| τ²-bench Airline | 10 / 11.4 / 151 | 6.2 | 9% | 5 |
| τ²-bench Retail | 11 / 11.9 / 151 | 5.5 | 6% | 6 |

Turns are the number of model calls in a run. Tool calls are how many tool invocations the model issued in total across those calls. The third column counts the fraction of model calls where the model returned more than one tool call in a single response — batching multiple requests at once rather than one at a time. Duration is the wall-clock time from the first to the last model call in a run.

These four numbers let you see how structurally different the workloads are: SWE-bench and AppWorld runs are long, tool-heavy, and slow; τ²-bench runs are short, light on tools, and fast. The workloads are not interchangeable, and which ones you pull matters for training, evaluation, and infrastructure work.

**How much does it cost?** Token consumption varies as much by model as by task:

| Model | Avg tokens / model call | Avg tokens / run |
|-------|------------------------:|-----------------:|
| Claude Opus 4.5 | 66.8K | 2.4M |
| Gemini 3 Pro | 41.8K | 1.1M |
| DeepSeek-V3.2 | 29.0K | 880K |
| GPT-5.2 | 26.3K | 552K |
| Kimi-K2.5 | 23.1K | 655K |

Token consumption varying as much by model as by task is the kind of signal that matters when estimating replay costs, building token-budget-aware training pipelines, or studying how different models use their context window.

**How does context evolve?** Because agent design determines how the prompt is constructed on each call, it is the primary driver of how context accumulates — not the task type. Prefix retention measures what fraction of messages carry over from one call to the next: 1.0 means a single growing conversation; lower values mean the agent reconstructs the context window more aggressively each time.

| Agent design | Avg turns / run | Prefix retention |
|--------------|----------------:|-----------------:|
| claude_code | 33.0 | 0.90 |
| smolagents_code | 21.3 | 0.87 |
| tool_calling | 22.2 | 0.87 |
| openai_solo | 18.3 | 0.86 |
| tool_calling_with_shortlisting | 50.1 | 0.03 |

Four of the five designs maintain high retention throughout a run — they accumulate a single long conversation. The exception is `tool_calling_with_shortlisting`, which drops to 0.03: it selects a fresh subset of tools for each call, rebuilding the prompt from scratch every time. Despite having the highest average turn count by far, it never builds up a long conversational context. This makes its traces structurally different from the others at the message level — something to check before using them for fine-tuning or prefix caching analysis.

## Inference benchmarking: an ongoing example

One use of this data is already underway. A team working on LLM inference infrastructure is using these traces to benchmark serving configurations under realistic agentic load — the kind of workload that synthetic benchmarks systematically miss.

What makes these runs different from synthetic benchmarks is their structure: real agent runs are dependency chains, where each call's output becomes the next call's input, context accumulates, and KV-cache pressure builds exactly as it does in production. A synthetic load generator can't reproduce that. The replay keeps structure and inputs from the recorded run while regenerating outputs live against the endpoint under test, so downstream calls receive fresh output from upstream — context grows as it would in a real run, and cache behavior reflects what production would produce.

The tool driving this is [inference-perf](https://github.com/kubernetes-sigs/inference-perf), a Kubernetes SIG benchmarking tool that replays OTel traces against a live endpoint. Because the Exgentic traces are already in OTel format, they plug in without conversion. The result is latency, cache hit rates, and cost measured under real agentic load — exactly the signal needed to evaluate whether a serving configuration change is worth shipping.

This is one example of what becomes possible when traces are public and in a standard format. The work is ongoing; we'll share results as they come in.

## What it doesn't cover

The dataset is deliberately narrow in a few ways worth stating plainly. It captures the model's own chat calls, not the non-model actions around them, so an agent's file edits or environment steps show up only through the calls that produced them. The models are specific snapshots evaluated at one point in time, not standing verdicts on any model family. And six benchmarks, however varied, are not the full range of work agents will eventually do. If you need the surrounding scaffolding — the user-simulator turns and grading calls we filtered out — the full corpus below keeps all of it.

## See for yourself

The runs are public and ready to load — one open format, 236 MB, [on Hugging Face](https://huggingface.co/datasets/Exgentic/agent-llm-traces-v2). Whatever you are building agents to do, or worried they might do, you can now start from what they actually did instead of a single line of results. Open a few runs and follow how they get there.

> The how was always there, inside every run. Now anyone can read it.

## Sources

- Exgentic Agent LLM Traces: [huggingface.co/datasets/Exgentic/agent-llm-traces-v2](https://huggingface.co/datasets/Exgentic/agent-llm-traces-v2)
- Full corpus: [huggingface.co/datasets/Exgentic/traces-v2](https://huggingface.co/datasets/Exgentic/traces-v2)
- OpenTelemetry GenAI semantic conventions: [opentelemetry.io](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- inference-perf: [github.com/kubernetes-sigs/inference-perf](https://github.com/kubernetes-sigs/inference-perf) · [Benchmarking LLM Inference with Production Agent Traces](https://medium.com/inference-perf/benchmarking-llm-inference-with-production-agent-traces-f47f7f994aff)
- Exgentic & Open Agent Leaderboard: [arXiv:2602.22953](https://arxiv.org/abs/2602.22953) · [exgentic.ai](https://www.exgentic.ai)
</content>
