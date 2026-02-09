# Micronaut ASX Fine-Tuning Dataset

**Generated:** 2025-11-11T21:14:24.534791Z
**Modernized:** 2026-02-09

Train Micronaut/Mx2LM-style agents to build full-stack apps, ASX websites,
and work with the SCX/SCXQ2/SCXQ4 execution model.

## Contents

### Primary Dataset (SCX-specific)
- `train.jsonl` — 137 training samples
- `dev.jsonl` — 24 evaluation samples
- `schema.json` — record schema

### Snippets & Assets
- `snippets/atomic.css` — Atomic CSS utilities
- `snippets/asx-blocks.html` — Reusable ASX blocks
- `brains/` — legacy bigrams, trigrams, meta-intent maps
- `starter.html` — bare-bones page wiring

### Supplementary Datasets
- `supplementary/conversations-ds.json` — 200 SCX/ASX/K'uhul project conversations (source for extracted examples)
- `supplementary/ToolACE-query.jsonl` — 7,327 tool-calling conversation samples
- `supplementary/grok-code-fast-1-1000x.jsonl` — 1,016 code generation samples
- `supplementary/val-mathmatics.json` — 2,007 mathematics Q&A samples

### Record Format
```json
{"instruction": "...", "input": "...", "output": "...", "tags": ["..."]}
```

### Tag Categories

| Category | Tags | Description |
|----------|------|-------------|
| **SCX Core** | `scx`, `sigils`, `actions`, `runtime` | SCX sigil system, operators, general actions |
| **Commerce** | `commerce`, `auth`, `payments`, `wallet`, `staking` | Checkout, trading, wallets, staking |
| **SCXQ2** | `scxq2`, `lanes`, `binary`, `format`, `packet` | Control lanes, packing format, dictionary |
| **SCXQ4** | `scxq4`, `lifting`, `multi-cluster`, `shards` | Extended lanes, 64-bit addressing, shard rules |
| **ASX/UI** | `asx-block`, `ui`, `html`, `css`, `atomic`, `asxr` | ASX blocks, ASXR bootstrap, atomic CSS |
| **Micronaut** | `micronaut`, `lifecycle`, `sco1`, `orchestrator` | SCO/1 lifecycle, PowerShell orchestrator |
| **Brains** | `brains`, `ngrams`, `agents`, `sealed` | N-gram brain queries, domain routing |
| **Connectors** | `connector`, `http`, `websocket`, `filesystem`, `ipc` | Universal app connectivity |
| **Tokenizer** | `scx-tokenizer`, `encoding` | SCX-TOK-V1 pipeline, registry |
| **Architecture** | `architecture`, `execution-model`, `kuhul-pi` | Execution model, pi enforcement, guarantees |
| **CM-1** | `cm1`, `test-vectors`, `verification` | Control character verification |
| **Ramble** | `ramble-engine` | Ramble Engine spec and constraints |
| **PowerShell** | `powershell` | Micronaut orchestrator code patterns |
| **K'uhul** | `kuhul-compression` | K'uhul glyph compression, pi-LZ77, glyph VM |
| **ASX Runtime** | `asx-runtime`, `mx2lm-runtime` | ASX kernel, MX2LM server, service workers |
| **XJSON** | `xjson` | XJSON control flow, schema, AST format |
| **PrimeOS** | `primeos`, `agent-spawning` | Agent factory, Micronaut spawning system |
| **Basher** | `basher-terminal` | CLI terminal, command processing |
| **SCX Cipher** | `scx-cipher`, `scxq` | Cipher operations, SCXQ encoding |

### Dataset History

**v1 (legacy):** 220 train + 60 dev samples, ~8 unique patterns heavily duplicated.

**v2 (modernized):** Deduplicated to 87 unique train + 16 dev. Added 60+ new
instruction types for SCXQ2/SCXQ4/Micronaut/connectors/tokenizer/architecture.

**v3 (current):** Expanded to 137 train + 24 dev by extracting 58 real-world
examples from 200 SCX/ASX/K'uhul project conversations (`conversations-ds.json`).
Added supplementary general-purpose datasets for multi-task fine-tuning:
  - Tool-calling patterns (ToolACE-query: 7,327 samples)
  - Code generation (grok-code-fast: 1,016 samples)
  - Mathematics reasoning (val-mathmatics: 2,007 samples)

### New in v3 — Real-World Conversation Examples
Extracted from actual SCX project development sessions covering:
  - ASX PRIME kernel implementation (sw.khl, service workers)
  - K'uhul pi compression engine (pi-LZ77, glyph dictionaries)
  - SCX cipher compression with 89%+ reduction
  - XJSON control flow engine (XCF interpreter, AST execution)
  - MX2LM runtime and AI inference integration
  - PrimeOS agent spawning (MicronautFactory, topic agents)
  - Basher terminal CLI commands and tunneling
  - Atomic blocks game mechanics with K'uhul physics
  - ASX TPU OS architecture with virtual training
  - K'uhul XML-SVG-3D fusion specification

### Tips
- Tag-aware sampling for curriculum learning.
- New tags enable SCXQ2/SCXQ4/Micronaut-specific fine-tuning.
- The `reference` tag marks explanatory samples (good for instruction-following).
- The `powershell` tag marks code-generation samples for orchestrator patterns.
- Supplementary datasets can be mixed in for multi-task generalization.
- The `conversations-ds.json` source has 200 full conversations for deeper extraction.
