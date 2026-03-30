---
title: "Rethinking Agent Evaluation Reporting"
subtitle: "Why pass/fail scores hide what matters most about agent systems."
author: Elron Bandel
date: 2026-03-17
reading_time: 12 min
slug: eval-reporting
---

You give two AI agents the same task. Both get it done. But one finishes cleanly in a few steps. The other takes five times longer, crashes your environment twice, retries repeatedly, costs ten times more, and when you finally dig in, the problems all trace back to one faulty subagent. Swap it out and the agent is fine. Nothing in the evaluation told you any of this. The score just said "pass."

Over the past year, while building Exgentic and the Open Agent Leaderboard, we kept hitting these gaps. So we surveyed nine major agent evaluation projects (Including HAL, Harbor, Inspect AI and more) and found something striking: the field is quietly converging on what we should actually be looking at when we evaluate agents. In this post, we propose a concrete extension to Every Eval Ever, the leading evaluation-standardisation project, to make agent evaluations tell the full story.

## The cost of not knowing

If you're building on, investing in, or purchasing agent systems, you're relying on evaluation scores to compare them. Those scores are increasingly incomplete. Not because the evaluations are bad, but because the result records were designed for simpler systems and leave out information you need.

You pick the highest-scoring agent. It crashes in production, costs far more than expected, or runs orders of magnitude slower than you anticipated. The evaluation didn't warn you because it only measured whether the agent got the right answer. It didn't measure how it got there, what broke along the way, or how much it cost. The metrics everyone uses to measure speed and efficiency assume the system is a single language model, which agents are not.

> The score isn't wrong. It's just not telling you enough.

So what changed? Why did scores used to be sufficient, and why aren't they now?

## Why scores used to work (and why they don't now)

For most of the LLM era, evaluation was simple: you gave a model a question, it gave you an answer, and you checked if the answer was right. Even more advanced evaluations, like tool-use benchmarks such as BFCL, still followed this pattern. The model receives a prompt, picks the right function to call, and you grade the output. One input, one output, one score.

Agents don't work that way. An agent receives a task and then runs: taking actions, calling tools, hitting errors, recovering, sometimes delegating to subagents, sometimes running steps in parallel. The thing you're evaluating isn't a single response anymore. It's an entire session with a beginning, a middle, and an end. A score that only captures "did it get the right answer?" is ignoring everything that happened along the way.

> Getting the right answer used to be all that mattered. For agents, it's just the beginning.

So how should we think about evaluating these systems?

## Don't look inside. Look inside.

Here's the counterintuitive part. When you evaluate a session, you should treat the agent as a black box. You're on the outside, measuring what you can observe: time, cost, actions, interaction patterns, whether it finished, whether the benchmark accepted the result. This holds whether the agent is a software system or a human doing the same task.

This is why token metrics don't just happen to be inaccurate for agents. They're the wrong category of measurement. They assume you're looking inside a single model. Black-box evaluation means measuring what the system does, not how its internals work. Time to first action, wall-clock time, interaction count, cost. Those are agent metrics.

But when you describe the evaluated system, for interpretation and reproducibility, you flip the lens. Treat the agent as a white box. You want to know what's inside: which models, which tools, which subagents, how they're composed. A real agent might use one model for planning, another for code generation, and a third for summarization, with a subagent handling browser interaction. That structure affects the result. It should be reported.

> Observe the session like a black box. Describe the system like a white box.

With that distinction in mind, what specifically should a result report? Across nine systems, the same answers keep emerging.

## Eight questions every agent evaluation should answer

Across the nine systems we surveyed, the same reporting needs compress into eight questions:

1. **What was the evaluated system?** Not just a model name, but the full composed agent: all models involved, its subagents and their models, tools, MCP servers, and major components like context compression. For every LLM, there are many different agents. A result tagged "Claude 3.5 Sonnet" is ambiguous without knowing which agent, which version, and what it's made of.
2. **What was the benchmark-side system?** The environment, protocol, and grader matter too.
3. **What happened during the run?** Actions, observations, errors, control transitions.
4. **How did the run end?** Clean completion, timeout, crash, or policy limit. Did the agent signal "done," and did the benchmark accept it?
5. **Which side failed?** Agent mistake, environment crash, or something external.
6. **How much interaction happened?** Steps, retries, cost, wall-clock time.
7. **Under what conditions?** Internet access, memory exposure, permissions.
8. **Capable or reliable?** Succeeding once and succeeding repeatedly are different claims.

> If your evaluation can't answer these eight questions, it's not describing what happened.

These are the gaps we kept hitting while building the Open Agent Leaderboard. But why is this all coming to a head now?

## Why this couldn't have happened two years ago

For a long time, unified agent evaluation simply wasn't on the table. Most agents were local systems, each tied to one benchmark's interface, one scaffold, one environment. Comparing agents across environments wasn't just hard; it was unclear what such a comparison would even mean. Each agent spoke a different protocol, so each evaluation could reasonably live in its own format.

What changed is the emergence of general-purpose agents as an evaluation target. Work like Harbor and our own Exgentic framework established that agents can present a consistent API across multiple benchmarking environments. The same agent, the same interface, evaluated on AppWorld and tau2-bench and SWE-bench without being rewritten for each. (We wrote about this shift in depth in our [ICLR 2026 blog post on general agent evaluation](https://iclr-blogposts.github.io/2026/blog/2026/general-agent-evaluation/).)

This is the shift that makes everything in this post urgent rather than theoretical. When every agent was bespoke, inconsistent reporting was tolerable. When general-purpose agents can be compared across environments with a consistent API, inconsistent result schemas become a real barrier.

> The agent side has unified. The reporting side hasn't caught up.

## The evidence: nine systems, same gaps

We surveyed nine major systems to see whether this convergence is real. Here's what their public artifacts actually expose.

The columns track whether each system reports system identity, evaluation setup, task outcome, run traces, agent actions, stop reason, finish signal, error attribution, interaction accounting, robustness testing, and agent composition.

| System | Identity | Setup | Outcome | Traces | Actions | Stoppage | Finish | Errors | Accounting | Robustness | Composition |
|--------|----------|-------|---------|--------|---------|----------|--------|--------|------------|------------|-------------|
| Every Eval Ever | **V** | **V** | **V** | ~ | ~ | X | X | X | X | ~ | X |
| AppWorld | ~ | X | **V** | X | X | X | X | **V** | X | ~ | X |
| Tau2-bench | **V** | **V** | **V** | **V** | ~ | **V** | ~ | ~ | X | ~ | ~ |
| SWE-bench | ~ | X | **V** | X | X | X | X | ~ | X | ~ | X |
| BrowseComp Plus | ~ | ~ | **V** | **V** | **V** | ~ | X | X | X | ~ | X |
| Harbor | **V** | **V** | **V** | **V** | **V** | X | X | **V** | **V** | ~ | ~ |
| HAL | **V** | **V** | **V** | **V** | **V** | X | X | ~ | X | ~ | X |
| Inspect | **V** | **V** | **V** | **V** | **V** | ~ | ~ | ~ | ~ | ~ | X |
| Exgentic | **V** | **V** | **V** | **V** | **V** | **V** | **V** | **V** | **V** | ~ | ~ |

**V** present &nbsp; **~** partial &nbsp; **X** not standardized

The basics are settled. Identity, setup, and outcomes show up across most systems. The field broadly agrees that a run result needs more than a score. Every Eval Ever already captures much of this layer, and its schema reaches into agentic territory through agentic_eval_config, eval_limits, sandbox, messages, and tool_calls. Tool calls alone don't fully capture agent actions, since agents can act outside this protocol, but the foundation is there. The extension we're proposing builds on that logic rather than breaking from it.

The critical middle layer is patchy. Stoppage, finish semantics, and error attribution are the fields that would tell you why two agents with the same score behave so differently in production, and they show up in only a few systems. tau2-bench reports termination reasons, per-side costs, and decomposed reward checks. Exgentic reports status, finish state, and error source. Most others leave it implicit. When it's missing, you can't distinguish an agent failure from an environment crash from a timeout. Interaction accounting is similarly thin: how many actions did the agent take, how many ran in parallel, how long before the first action, what was the total wall-clock time? These are the numbers that explain why one "pass" takes seconds and another takes minutes and ten times the cost. Few systems report them consistently.

Building the Open Agent Leaderboard, the first of its kind for general-purpose agents, is what made this gap unavoidable for us. Exgentic's session results had to answer almost all of the eight questions: did the agent finish? Did the benchmark accept it? Who failed? How much did it cost? (Details in the appendix, and in our [Exgentic paper](https://arxiv.org/abs/2602.22953) and [OpenReview submission](https://openreview.net/forum?id=CbJpizP0vJ).) These are core evaluation fields, not diagnostics. We couldn't build the leaderboard without them.

Composition and robustness are barely standardized anywhere. No system provides a standard way to describe what the agent is beyond a name and a model identifier. Real agents are composed of multiple models, tools, MCP connections, and subagents. The same model might appear in multiple roles, and a subagent might have independent evaluation results on another benchmark. That information matters. Meanwhile, HAL and Harbor push on adjacent problems: HAL on repeatability and cost, Harbor on structured trial-level artifacts including verifier outputs, timing, and exceptions. Robustness is being tested across the ecosystem, but not yet reported in a shared format.

> Nine systems, same gaps. The structure exists in fragments.

## What we're proposing

The field doesn't need a separate "agent evaluation format." It needs the existing infrastructure to expand so it can describe agent sessions, not just model outputs. Specifically, we're proposing that Every Eval Ever add a session-result layer.

The reporting needs split into four categories:

**System composition** describes what was actually evaluated. Not just a model name, but the full agent: which models in which roles and at which versions, which tools, which subagents, how they connect. This matters because for every LLM there are many different agents built on top of it. A result that just says "GPT-4o" could come from dozens of different agent systems with completely different behavior. The same information is needed for the benchmark side: environment, protocol, grader, and their versions. If you can't describe and version the system, you can't interpret or reproduce the result.

**Session semantics** describes what happened during the run. Error attribution by side: was it the agent's fault or the environment's? Stoppage and finish signals: did the agent complete, time out, or crash? Interaction shape: how many actions, how many in parallel, time to first action, total wall-clock time, cost. Not token counts, which are an LLM-specific metric masquerading as a general one.

**Conditions** shape interpretation without being part of the event itself. Internet access. Memory exposure. Whether the agent had seen the task before. Repeated-run consistency.

**Robustness** is an emerging layer. Teams keep reaching for similar levers: different seeds (tau2-bench), prompt variations (AppWorld), many tasks per similar environment (SWE-bench). Some of this already shows up in scores like pass@k, pass^k, and SGC. They're all measuring the same underlying thing: variance over noise. But despite that, none of these are standardized across systems.

Model eval stays first-class in this design. It becomes the simpler case within a more general schema. A detailed proposal is in the appendix.

> We have great standards for AI evaluation. Now they need to fit agents.

## Why now, and an invitation

The cost of waiting grows fast. If the ecosystem keeps treating agent runs as decorated model outputs, the missing information will spill into ad hoc metadata, custom dashboards, bespoke artifacts, and local conventions that don't travel. That's how fragmentation forms. Not because people fail to notice the problem, but because they solve it privately and incompatibly.

Right now the vocabulary isn't frozen. That's exactly when a shared schema helps most.

Every Eval Ever by Evaluating Evaluations is the right place to land this. It already has the normalization infrastructure, the community trust, and the schema logic. What it doesn't yet have is a first-class session-result layer.

So we're opening a draft pull request on the EEE repository with a concrete schema proposal based on what we've outlined here and detailed in the appendix below. We're inviting the EEE team, agent benchmark authors, framework builders, and anyone who's run into these gaps to join the discussion.

> Let's standardize agent evaluation before everyone ships their own version.

## Key takeaways

- **Agents aren't models.** The evaluation shouldn't pretend they are. A model produces an answer. An agent runs a whole session with multiple steps, components, failures, and recoveries. The reporting needs to reflect that.
- **Same score, completely different in production.** One agent finishes cleanly. The other crashes, retries, and costs ten times more. Without knowing what went wrong, whose fault it was, and how the run ended, you can't tell them apart.
- **Measure the run from the outside. Describe the system from the inside.** When evaluating, treat the agent as a black box: track time, cost, actions, outcomes. When reporting what was tested, open it up: which models, which subagents, which tools.
- **General-purpose agents made this urgent.** Once the same agent runs across multiple environments with a consistent API, inconsistent reporting becomes a real barrier.
- **Nine systems are already converging on the same structure.** It's time to standardize it. We're proposing to extend Every Eval Ever so model eval stays as-is and agent eval gets the session-level reporting it needs.

## Sources

- Every Eval Ever: [evalevalai.com](https://evalevalai.com) · [GitHub](https://github.com/EvalEvalAI/eee)
- Exgentic & Open Agent Leaderboard: [arXiv:2602.22953](https://arxiv.org/abs/2602.22953) · [OpenReview](https://openreview.net/forum?id=CbJpizP0vJ) · [GitHub](https://github.com/Exgentic/exgentic)
- General Agent Evaluation (ICLR 2026 blog post): [iclr-blogposts.github.io](https://iclr-blogposts.github.io/2026/blog/2026/general-agent-evaluation/)
- Berkeley Function Calling Leaderboard: [gorilla.cs.berkeley.edu](https://gorilla.cs.berkeley.edu)
- HAL: [hal.cs.princeton.edu](https://hal.cs.princeton.edu) · [GitHub](https://github.com/HAL-Benchmark)
- Harbor: [harborframework.com](https://harborframework.com) · [GitHub](https://github.com/harbor-framework)
- Inspect: [inspect.ai-safety-institute.org.uk](https://inspect.ai-safety-institute.org.uk) · [GitHub](https://github.com/UKGovernmentBEIS/inspect_ai)
- AppWorld: [GitHub](https://github.com/stonybrooknlp/appworld)
- tau2-bench: [GitHub](https://github.com/sierra-research/tau2-bench)
- SWE-bench: [GitHub](https://github.com/princeton-nlp/SWE-bench)
- BrowseComp Plus: [GitHub](https://github.com/openai/browsecomp)

## Appendix: Proposed Extensions to Every Eval Ever

Starting point for discussion, not a finished specification. Maps to the four categories in the body: system composition, session semantics, conditions, robustness.

### Session Result

```yaml
session_result:
  status:             # success | unsuccessful | unfinished | error | cancelled | limit_reached
  is_finished:        # bool: did the agent emit a recognized completion signal?
  finish_accepted:    # bool: did the benchmark accept the completion as valid?
  stop_reason:        # agent_done | timeout | max_steps | error | cancelled | benchmark_policy
  error_attribution:  # agent | benchmark | external | unknown
  error_detail:       # freeform or structured error description
```

status and is_finished are separable because a run can finish and fail, or succeed without explicitly finishing. error_attribution is what tells you whether a failure was the agent's fault or the environment's.

### Interaction Accounting

Token counts are intentionally absent. They're an LLM-specific metric that doesn't describe composed systems running models in parallel.

```yaml
session_accounting:
  step_count:              # total steps
  action_count:            # total agent actions
  invalid_action_count:    # actions rejected or malformed
  parallel_action_max:     # max concurrent actions observed
  time_to_first_action:    # seconds until the agent's first observable action
  wall_clock_seconds:      # total elapsed time
  agent_cost:              # cost on the agent side (USD)
  benchmark_cost:          # cost on the benchmark side
```

### System Composition

Describes both sides of the evaluation. The agent side is a white-box description: what's inside, in enough detail to interpret and reproduce the result.

```yaml
agent_system:
  name:                # agent name or identifier
  version:             # agent version
  models:              # list of model identifiers used, with roles
  tools:               # list of tools / MCP servers available
  skills:              # list of skills available
  memory:              # memory type / exposure level
  software_surfaces:   # e.g. browser, IDE, terminal, sandbox
  subagents[]:
    name:              # subagent identifier
    version:           # subagent version
    role:              # e.g. "browser_interaction", "code_gen"
    models:            # models used by this subagent
    tools:             # tools available to this subagent
    independent_evals: # optional: references to eval results for this subagent

benchmark_system:
  name:                # benchmark name
  version:             # benchmark version
  environment:         # environment type or identifier
  grader:              # grader type or identifier
  protocol:            # protocol version or description
```

### Evaluation Conditions

Material conditions that change how the result should be interpreted.

```yaml
eval_conditions:
  internet_access:        # true | false | restricted
  memory_exposure:        # zero | nonzero | unknown
  reset_policy:           # fresh | persistent | unknown
  permissions:            # sandboxed | elevated | unknown
  repeated_runs:          # number of runs if repeated-run evaluation
  seed:                   # random seed if applicable
```

### Robustness (Optional / Emerging)

```yaml
robustness:
  method:                 # e.g. seed_variation, prompt_perturbation, env_variation
  num_variants:           # variant runs performed
  variance_metric:        # e.g. pass@k, pass^k, SGC, custom
  variance_value:         # measured variance or consistency score
```

### Backward Compatibility

Previous evaluations map to simpler cases within this framework:

- **single_turn**: one input, one output, no interaction loop
- **tool_calling_loop**: model with tool access in a loop, single compact system
- **agentic**: composed system with full session-level semantics

Existing EEE records stay valid. The session-result layer activates for agentic evaluations.

### Compatibility with Existing EEE Fields

- `interaction_type: agentic` triggers the availability of the session_result layer.
- `messages` and `tool_calls` remain unchanged as trace and observability fields.
- `agentic_eval_config` is extended by `benchmark_system` and `eval_conditions`.
- `eval_limits` maps to `stop_reason` (when a limit is hit, the stop reason becomes `limit_reached`).
- `sandbox` is subsumed into `eval_conditions.permissions` and `benchmark_system.environment`.
- Score and metric fields are unchanged. `session_result` sits alongside them, not replacing them.
