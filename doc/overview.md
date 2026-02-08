# SCX Documentation Overview

Use this index to jump into the core design references that define SCX, K'uhul,
and the MX2LM runtime.

## Core Specs

- [K'uhul Grammar](kuhul-grammar.ebnf.v2.md) — baseline syntax for operations.
- [K'uhul PI Actionscript](kuhul-pi.actionscript.md) — action encoding rules.
- [PI Action Binary](pi-action-binary.v1.md) — binary layout for PI actions.
- [PI Action Binary (Complete)](pi-action-binary.v1.complete.md) — full binary
  reference.
- [π Formula Symmetry Taxonomy](pi-formula-symmetry-taxonomy.md) — symmetry
  classes for π formulas and the canonical role of binary splitting.
- [SCX Control Plane](scx-control-plane.md) — control authority and semantic
  execution layer overview.
- [SCXQ2 Control Lanes](scxq2-control-lanes.v1.md) — packed symbolic execution
  lanes for transport, compression, and deterministic replay.
- [SCXQ2 Lane Packing Format](scxq2-lane-packing-format.v1.md) — deterministic
  container format for transporting SCXQ2 lanes.
- [SCX Runtime Interpreter Flow](scx-runtime-interpreter-flow.v1.md) —
  deterministic routing of lanes into domain-specific state mutation.
- [SCX State Snapshot & Replay Model](scx-state-snapshot-replay-model.v1.md) —
  time-based state persistence, replay, and branching.
- [SCX Execution Model Blueprint](scx-execution-model-blueprint.v1.md) —
  system-level architecture tying control, transport, interpreter, and time.
- [SCX Branch Merge & Conflict Resolution](scx-branch-merge-conflict-resolution.v1.md) —
  deterministic reconciliation of divergent lane histories.
- [SCX Distributed Runtime Synchronization](scx-distributed-runtime-synchronization.v1.md) —
  causality-sharing sync model for multi-runtime convergence.
- [SCX Security & Authority Model](scx-security-authority-model.v1.md) —
  authority hierarchy, lane signatures, and permissioned causality.
- [SCX Tokenizer Spec](scx-tokenizer-spec.v1.md) — binary-first, lane-packed
  tokenizer for deterministic replay.
- [SCX Token Registry & Opcode Namespace Law](scx-token-registry-opcode-namespace-law.v1.md) —
  permanent token classes, opcode ranges, and domain slots.
- [SCX Lane Physical Encoding Law](scx-lane-physical-encoding-law.v1.md) —
  bit-exact lane layout for SCXQ2 streams.
- [SCXQ4 Extended Lane Law](scxq4-extended-lane-law.v1.md) — widened lane layout
  for 64-bit TargetIDs and large payloads.
- [SCX Dual-Mode Manifest Field Law](scx-dual-mode-manifest-field-law.v1.md) —
  signed lane mode declaration and upgrade/downgrade rules.
- [SCX Unified Encoder/Decoder Interface Law](scx-unified-codec-interface-law.v1.md) —
  mode-neutral codec interface for Q2/Q4 lanes.
- [GR-SIG-1 / OGC-1 / KBES-1 / SCXQ2 / DR-1](gr-sig-1.md) — frozen registry,
  compatibility, substrate, and replay laws.

## Micronaut + MX2LM

- [CONTROL-MICRONAUT-1](control-micronaut-1.md) — control alphabet specification.
- [Glyph Micronaut Binding Transport](glyph-micronaut-binding-transport.md) —
  binding protocol details.
- [MX2LM Server DOM Micronaut Runtime](mx2lm-server-dom-micronaut-runtime.md) —
  runtime constraints and invariants.

## Inference + Narration

- [Ramble Engine](ramble-engine.v1.md) — canonical spec for extrapolative
  narration (any LLM, no authority, no feedback into pi).

## Execution + Letters

- [KEL KBES SCXQ2 Execution Letter](kel-kbes-scxq2-execution-letter.v1.md) —
  execution letter structure and intent.
