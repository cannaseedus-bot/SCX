# Micronaut ASX Fine-Tuning Dataset

**Generated:** 2025-11-11T21:14:24.534791Z
**Modernized:** 2026-02-08

Train Micronaut/Mx2LM-style agents to build full-stack apps, ASX websites,
and work with the SCX/SCXQ2/SCXQ4 execution model.

## Contents
- `train.jsonl` — 87 unique samples (deduplicated & expanded from legacy 220)
- `dev.jsonl` — 16 evaluation samples
- `schema.json` — record schema
- `snippets/atomic.css` — Atomic CSS utilities
- `snippets/asx-blocks.html` — Reusable ASX blocks
- `brains/` — legacy bigrams, trigrams, meta-intent maps
- `starter.html` — bare-bones page wiring

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
| **Architecture** | `architecture`, `execution-model`, `kuhul-pi` | Execution model, π enforcement, guarantees |
| **CM-1** | `cm1`, `test-vectors`, `verification` | Control character verification |
| **Ramble** | `ramble-engine` | Ramble Engine spec and constraints |
| **PowerShell** | `powershell` | Micronaut orchestrator code patterns |

### What Changed from Legacy
- **Deduplicated:** 220 → 87 unique train samples (removed ~130 exact duplicates)
- **Expanded:** Added 60+ new instruction types covering:
  - SCXQ2 control lane encoding (domain IDs, operators, payloads, flags)
  - SCXQ2 binary format (header, dictionary, lane records, packets)
  - SCXQ4 extended lanes (64-bit TargetID, lifting/downcasting law)
  - Micronaut SCO/1 architecture (lifecycle, chat.txt, stream.txt, snapshots)
  - PowerShell orchestrator patterns (CM-1 verify, KUHUL-TSG, main loop)
  - Universal connectors (HTTP, WS, FS, IPC adapters)
  - SCX tokenizer pipeline and π-signature binding
  - K'uhul glyph encoding round-trips
  - Multi-agent collaboration, snapshot branching, error handling
  - Real-time game ticks, CI/CD pipelines, data pipelines

### Tips
- Tag-aware sampling for curriculum learning.
- New tags enable SCXQ2/SCXQ4/Micronaut-specific fine-tuning.
- The `reference` tag marks explanatory samples (good for instruction-following).
- The `powershell` tag marks code-generation samples for orchestrator patterns.
