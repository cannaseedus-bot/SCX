# Micronaut ASX Fine-Tuning Dataset

**Generated:** 2025-11-11T21:14:24.534791Z

Train Micronaut/Mx2LM-style agents to build full‑stack apps and ASX websites.

## Contents
- `train.jsonl` — 220 samples
- `dev.jsonl` — 60 samples
- `schema.json` — record schema
- `snippets/atomic.css` — Atomic CSS utilities
- `snippets/asx-blocks.html` — Reusable ASX blocks
- `brains/` — bigrams, trigrams, meta-intent maps
- `starter.html` — bare-bones page wiring

### Record Format
```json
{"instruction": "...", "input": "...", "output": "...", "tags": ["..."]}
```

### Tips
- Tag-aware sampling for curriculum learning (`asx-block`, `asxr`, `brains`, `commerce`).
- Add your own tasks to improve domain coverage (e.g., Stripe/CF tunnels).