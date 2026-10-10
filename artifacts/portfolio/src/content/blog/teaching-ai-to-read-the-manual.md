---
title: "Teaching AI to Read the Manual"
subtitle: "Building an AI Skills framework for Jaeger — CNCF LFX Mentorship"
date: "2026-09-20"
excerpt: "What I built during my LFX Mentorship on Jaeger: an MCP tool that lets any agent load expert trace-diagnosis playbooks on demand, and what I learned when the agents refused to use it."
tags: ["Jaeger", "MCP", "Observability", "LFX"]
cover: "/writing/teaching-ai-to-read-the-manual.webp"
canonical: "https://lnkd.in/p/dDR-srUT"
linkedinTitle: "My LFX Mentorship on Jaeger"
---

> This post was first published on LinkedIn as [My LFX Mentorship on Jaeger](https://lnkd.in/p/dDR-srUT). The full article text is still only there.

<!-- TODO: paste the LinkedIn article text here. Until then this page carries a short summary built from the mentorship issue and PRs. -->

## In one paragraph

Jaeger ships an AI assistant that can look at your traces. During the CNCF LFX Mentorship (June to September 2026, mentored by Yuri Shkuro and Jonah Kowall) I built the layer underneath it: a `read_skill` MCP tool that lets an agent pull expert diagnosis playbooks on demand instead of stuffing them into the prompt, an agent-agnostic gateway over ACP so Gemini, Claude and Goose sidecars all plug into the same place, and the OpenTelemetry instrumentation that makes Jaeger trace its own agents.

## What is in the framework

- **`read_skill`** ([#8849](https://github.com/jaegertracing/jaeger/pull/8849)): three-level progressive disclosure, catalog → sub-skill → references. The handler depends only on `fs.FS` and is secured with `fs.ValidPath` and `os.OpenRoot`.
- **Operator skills** ([#9169](https://github.com/jaegertracing/jaeger/pull/9169)): drop playbooks under `ai.skills_dir` and they appear under `custom/` without rebuilding Jaeger.
- **ACP gateway fixes** ([#9296](https://github.com/jaegertracing/jaeger/pull/9296), [#9395](https://github.com/jaegertracing/jaeger/pull/9395)): correct WebSocket message framing and configurable handshake headers for authenticated agents.
- **Self-tracing** ([#8942](https://github.com/jaegertracing/jaeger/pull/8942), [#9011](https://github.com/jaegertracing/jaeger/pull/9011), [#9304](https://github.com/jaegertracing/jaeger/pull/9304)): GenAI semantic-convention attributes and `traceparent` across ACP, so a chat turn is one trace.
- **Fixtures and E2E coverage** ([#9263](https://github.com/jaegertracing/jaeger/pull/9263)) so a skill regression fails CI.

## The part that surprised me

The agents mostly did not call `read_skill`. Not because they could not find it: they judged the direct telemetry tools sufficient and skipped the manual. Three routing fixes changed nothing (0/5, 0/10). Putting disconfirming signals into the telemetry tool descriptions took both harnesses from 0/5 to 5/5. The write-up, including two conclusions I had to withdraw, is in [issue #9336](https://github.com/jaegertracing/jaeger/issues/9336).
