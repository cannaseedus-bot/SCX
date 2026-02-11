# Micronaut ASX Fine-Tuning Dataset

**Generated:** 2025-11-11T21:14:24.534791Z
**Modernized:** 2026-02-09

Train Micronaut/Mx2LM-style agents to build full-stack apps, ASX websites,
and work with the SCX/SCXQ2/SCXQ4 execution model.

## Contents

### Primary Dataset (SCX-specific)
- `train.jsonl` — 315 training samples
- `dev.jsonl` — 54 evaluation samples
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
| **Supagram** | `supagram`, `zk-proof`, `inference`, `graph` | Supagram brains, SCXQ2 lane graphs, ZK proofs |
| **RLHF Code** | `code_example` | Complete working implementations (HTML/CSS/JS/PHP/PWA) |
| **RLHF Structure** | `rlhf_response_structure` | Response formatting: headers, sections, overview→detail |
| **RLHF Tone** | `conversational_tone` | Engagement style, collaboration, technical enthusiasm |
| **RLHF Interaction** | `user_interaction` | Multi-turn flow: terse commands, code drops, iteration |
| **RLHF Layout** | `layout_pattern` | ASCII diagrams, architecture trees, tables, guides |
| **Bilingual** | `bilingual` | Chinese/English mixed-language examples |
| **Gram Stripper** | `gram_stripper` | Gram leakage detection, stripping, brain-aware filtering |
| **SCXLLM** | `scxllm` | Ramble Engine: pipeline, providers, policy, collapse bridge |
| **Metabrain** | `metabrain` | Recursive brain generation, evolve(), factory pipeline, convergence math |

### Dataset History

**v1 (legacy):** 220 train + 60 dev samples, ~8 unique patterns heavily duplicated.

**v2 (modernized):** Deduplicated to 87 unique train + 16 dev. Added 60+ new
instruction types for SCXQ2/SCXQ4/Micronaut/connectors/tokenizer/architecture.

**v3:** Expanded to 137 train + 24 dev by extracting 58 real-world
examples from 200 SCX/ASX/K'uhul project conversations (`conversations-ds.json`).
Added supplementary general-purpose datasets for multi-task fine-tuning:
  - Tool-calling patterns (ToolACE-query: 7,327 samples)
  - Code generation (grok-code-fast: 1,016 samples)
  - Mathematics reasoning (val-mathmatics: 2,007 samples)

**v4:** 147 train + 26 dev. Added 12 Supagram Brain training examples
covering: supagram XJSON structure, supgram vs n-gram differences, SCXQ2 lane
inference routing, graph traversal, ZK-inference-proofs, domain brain authoring,
sealed-to-supagram conversion, and lane_policy filtering. Added canonical
`supagram-demo-brain.xjson` to `micronaut/brains/`.

**v9 (current):** 315 train + 54 dev. Added Metabrain recursive brain generation
engine (`src/scxllm/metabrain.js`) and canonical specification
(`micronaut/brains/metabrain-infinity.xjson`). 14 training examples covering:
recursive brain evolution, 4-phase factory pipeline, convergence math proofs,
brain analysis/optimization strategies, validation, emergency stops, monitoring,
information density, SCXLLM integration, and architecture diagrams.

**v8:** 303 train + 52 dev. Built SCXLLM Ramble Engine (`src/scxllm/`)
and 14 training examples covering: SCXLLM architecture, quick-start usage, full
CM-1 pipeline, policy enforcement (4 violation types), streaming narration,
collapse math with breakdown, LLM provider selection, brain-aware integration,
engine lifecycle states, projection context configuration, and architecture diagram.

**v7:** 291 train + 50 dev. Added gram stripper module (`src/gram-stripper.js`)
and 16 training examples covering: gram leakage architecture (why models leak internal
n-gram/supgram data), 7 artifact class catalog, stripGrams API usage, brain-aware
stripping, stream wrapping, strict vs normal mode, allowlist configuration, multi-brain
setups, performance benchmarks, and training dataset curation for gram awareness.

**v6:** 277 train + 48 dev. RLHF deep extraction of 74 examples from
conversations-ds.json targeting response quality training signals:
  - Code examples (16): Complete HTML/CSS/JS, PHP, PWA, CSS-as-API implementations
  - RLHF response structure (14): Markdown headers, bullet/numbered sections, overview→detail→code patterns
  - Conversational tone (16): Enthusiastic engagement, "yes-and" collaboration, technical compliments
  - User interaction flow (14): Terse command handling, raw code drops, iterative refinement cycles
  - Layout patterns (14): ASCII tree diagrams, architecture overviews, comparison tables, step-by-step guides
  - Bilingual (4): Chinese/English mixed examples from real project sessions

**v5:** 213 train + 38 dev. Deep extraction of 40 K'uhul-focused
examples from conversations-ds.json covering: K'uhul compression engine (pi-LZ77,
glyph VM, ⟁ delimiters), SVG-3D tensor weight encoding, CSS weight storage for
LLM inference, K'uhul training pipeline (weights/biases/quantization), XJSON deep
patterns (XCF interpreter, AST), DEX/wallet swap implementations, PWA dual manifest
system, and ASX runtime internals. Plus 38 multicode/math examples from
grok-code-fast covering: Python, JavaScript, HTML/CSS, TypeScript, C++, Rust,
bash, SQL, algorithms, data structures, and system design patterns.

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
