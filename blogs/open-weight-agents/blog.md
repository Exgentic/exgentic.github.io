---
title: "Are open-weight models fit for agentic workloads?"
subtitle: "We tested two leading open-weight models against the closed-source frontier: both the performance leaders and the cost-effective option. Open-weight trails on quality, fails unpredictably, and is competitive but not dominant on cost."
author: Elron Bandel
date: 2026-05-13
reading_time: 10 min
slug: open-weight-agents
---

Pair the open-weight model Kimi K2.5 with ReAct, a simple tool-calling agent, and it handles 83% of telecom customer-service tasks. Pair the same Kimi with Claude Code, a more autonomous agent, and it handles zero. The model didn't change. The wrapper around it did.

This isn't a one-off. We tested **DeepSeek V3.2** and **Kimi K2.5**, the two most widely deployed open-weight language models, against three closed-source models that span the frontier from two ends. **Claude Opus 4.5** and **Gemini 3 Pro** set the quality bar. **GPT-5.2** sets the cost bar. Together they answer two questions: how far is open-weight from the top, and is it really the cheap choice once you stop comparing against the premium frontier?

(*Open-weight* means the model's weights are published openly: anyone can download and run them. *Closed-source* models are only accessible through a vendor's API.) DeepSeek and Kimi see close to 10 million downloads per month on Hugging Face alone, and each downloaded copy can power many more local deployments. This isn't a comparison against fringe options; it's a comparison against what teams actually deploy. We ran every model with five agent designs across six benchmark categories that simulate realistic agent tasks.

## How we tested

An *agent* is the software that wraps a language model with tools, rules, and a way to keep track of itself across many steps. The language model handles language. The agent handles everything that turns language into work.

We tested five different agent designs, spanning a spectrum:

- **ReAct**: a simple tool-caller. The model picks one action at a time from a menu. Lightweight, predictable.
- **ReAct + Shortlisting**: same idea, but the agent first narrows down the menu when there are too many options.
- **Smolagent**: a code-writing agent. The model writes short scripts that get executed in a sandbox.
- **Claude Code** and **OpenAI's agent SDK**: two autonomous agents. The model runs its own multi-step loop, plans, calls tools, and decides when it's done.

We tested each model and agent combination across six of the most widely-used academic benchmarks for agent evaluation:

- **Software engineering**: fixing real bugs in real open-source codebases (SWE-bench).
- **Customer service**: handling customer requests like rebookings and returns under company policies (TauBench-Airline, TauBench-Retail).
- **Technical support**: troubleshooting under policy constraints (TauBench-Telecom).
- **Deep research**: answering complex research questions that require digging through the web (BrowseComp+).
- **Personal-task automation**: completing everyday digital tasks across hundreds of apps and actions (AppWorld).

One hundred tasks per benchmark, scored by each benchmark's own evaluator. Full methodology is in the [paper](https://arxiv.org/abs/2602.22953); all data and code are on the [Open Agent Leaderboard](https://www.exgentic.ai).

## On average, open-weight trails the frontier

Averaged across all five agent designs and all six categories of work, the ranking is clear:

{% include_html figures/aggregate-scores.html %}

That's an 18- to 29-percentage-point gap between the open-weight models and the two frontier closed-source models. DeepSeek beats Kimi by 4 points, but neither comes near Gemini, let alone Opus. On raw average quality, the frontier still holds.

But the average is the wrong number to stop at.

## With the right agent, open-weight is competitive

Look at specific combinations and the picture changes. Kimi with ReAct hits **83%** on telecom technical support, within a point of Claude Opus's best on the same task. DeepSeek with ReAct reaches **82%** on retail customer service. Picking the right wrapper closes most of the headline gap.

The average doesn't reflect a uniformly worse model. It reflects a small number of catastrophic failures dragging the mean down. In some combinations open-weight is already competitive. In others it's at zero. The average mixes both.

> Open-weight isn't worse everywhere. It's wildly inconsistent.

## Open-weight is more sensitive to the agent design

The cleanest way to see the inconsistency: ask how much the overall score swings as you change the agent design, while keeping the model the same.

{% include_html figures/architecture-variance.html %}

For the closed-source models, the best and worst agent design land within **7 to 12 points**. For the open-weight models, the same swing is **14 to 18 points**.

If you're using Claude Opus or Gemini, you can pick a reasonable agent design and expect to land near the best result for that model. If you're using DeepSeek or Kimi, the gap between the best and worst agent design is roughly twice as wide. Agent choice matters more for open-weight.

> With a frontier model, agent choice is a tuning knob. With open-weight, it can move your score by 18 points without touching the model or the task.

The biggest swings cluster on customer-service tasks. There, Kimi goes from 83% with ReAct to 0% with Claude Code.

## Two kinds of performance sinks

The open-weight models show two distinct shapes of failure that the closed-source models don't. Both have the same practical effect: on a specific combination, the model essentially fails.

**The first kind rules out a task category.** Averaged across all five agent designs, both open-weight models land below 10% on personal-task automation. No agent choice moves them out of single digits.

{% include_html figures/task-sink.html %}

**The second kind shows up on a specific agent design.** On telecom customer-service, the OpenAI agent SDK is the top-scoring wrapper for both closed-source models (84% with Opus, 89% with Gemini). For both open-weight models, it's the worst by far (18% for DeepSeek, 0% for Kimi). The agent that lifts closed-source is the one that sinks open-weight on the same task. And nothing else in the data tells you where the next sink will land.

{% include_html figures/agent-design-sink.html %}

> Open-weight is competitive where we measured. It's unpredictable everywhere else.

That is the deployment risk in concrete form. On the specific (task × agent) combinations you've measured, open-weight can be a strong choice. Move to one you haven't, and you have no basis to predict whether it will work. You find out at evaluation time.

## On cost-effectiveness, open-weight is competitive, not dominant

The cost case for open-weight usually starts with DeepSeek versus Claude Opus. On the same autonomous agent, DeepSeek delivers about 62% of Opus's quality at roughly 2.7% of the cost: a 23× advantage on quality-per-dollar. That number is real but misleading. The real question isn't whether open-weight beats the most expensive frontier model. It's whether open-weight beats **the cheapest closed-source option**.

So we compared each model's best-quality configuration on cost and score, restricting closed-source to the cost-effective option:

{% include_html figures/cost-efficiency.html %}

At their best-quality operating points, the cost-effective closed-source model has **higher quality and lower cost** than either open-weight model. The "open-weight wins on cost" headline only survives when you compare to Opus or Gemini, where the gap is 15–25×. Against the cheap end of closed-source, the gap closes.

DeepSeek retains one specific niche: at absolute minimum cost with no quality floor, it drops to **$0.09/task** with the OpenAI agent SDK, about half the cheapest closed-source configuration. But quality there is 32%, which doesn't beat the cheap closed-source option on quality-per-dollar either. You're just running a worse model for fewer cents.

> Open-weight is competitive with the cheap end of closed-source. It isn't the bargain it looks like when you only compare against the top end.

## What this means for deployment

**For a (task × agent) combination you've measured directly,** open-weight can be a strong choice. With the right wrapper, DeepSeek delivers 80%+ on specific tasks at a fraction of premium-frontier prices. If you control the workload and can run your own evaluation on the exact combination you plan to ship, you can lock in the cost gap: meaningful against Opus and Gemini, modest against GPT-5.2.

**For tasks or agent designs you haven't measured, open-weight is not safe to deploy.** The 18-to-29-point gap to the performance frontier matters, but the bigger problem is unpredictability. Open-weight scores swing twice as widely as closed-source scores under agent choice, and the combinations that collapse only reveal themselves at evaluation time.

**For general-purpose agents meant to handle whatever comes their way,** open-weight is not ready. A general-purpose system meets combinations it hasn't been measured on and runs inside diverse agent designs. Both are the conditions where open-weight is hardest to predict.

> Open-weight is reliable on the specific combinations you've measured. The closed-source frontier is reliable across the board.

## Bottom line

The two open-weight models we tested are not close to the two leading closed-source models on agentic workloads. They trail Opus and Gemini by 18 to 29 percentage points on average, swing twice as widely with agent choice, and fail catastrophically on specific combinations the closed-source models handle cleanly.

On cost, the picture is mixed rather than triumphant. Against Opus and Gemini, open-weight is dramatically cheaper. Against the cost-effective end of closed-source, open-weight comes in slightly behind on both axes: neither cheaper nor higher-quality at the best deployment configuration.

Practically, open-weight is a strong choice for combinations you've measured directly, and a poor choice for combinations you haven't, because nothing in the data tells you how it will behave there. The cost-savings case is real only against the premium-tier closed models; the cheap closed-source alternative closes the gap.

We'll keep the leaderboard updated as new open-weight models ship. If you've evaluated others, or have data that contradicts what we found here, open a PR on [our GitHub](https://github.com/Exgentic/exgentic) and we'll include it.
