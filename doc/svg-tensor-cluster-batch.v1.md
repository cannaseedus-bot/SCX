# SVG-Tensor Cluster Batch Files (v1)

**Version:** `svg.tensor.cluster.batch.v1`  
**Status:** deterministic / non-executing

A batch file is a **declaration of lawful projections**, not an execution
script. It stages, verifies, routes, and prepares SVG-Tensor objects across a
cluster **without granting execution authority**.

## 1. What a “Batch File” Means in MX2LM

A cluster batch file:

- groups many SVG-Tensor objects
- declares ordering, verification, and routing
- does **not** run inference
- does **not** mutate tensors
- does **not** choose results

Think: **object convoy manifest**, not job runner.

## 2. Batch File Top-Level Schema

```json
{
  "$schema": "object://schema/svg.tensor.cluster.batch.v1",

  "id": "object://batch/svg-tensor/cluster-001",
  "hash": "sha256:…",

  "type": "svg.tensor.cluster.batch",

  "scope": "cluster",

  "mode": "prepare | verify | stage | mirror",

  "ordering": "stable",

  "objects": [],

  "routing": {},

  "verification": {},

  "outputs": {}
}
```

## 3. Core Batch Modes

| Mode      | Meaning                   |
| --------- | ------------------------- |
| `prepare` | Canonicalize + decompress |
| `verify`  | Hash + Merkle proof       |
| `stage`   | Upload to GPU/CPU buffers |
| `mirror`  | Replicate across clusters |

**Modes never imply execution.**

## 4. SVG-Tensor Object Entry (Atomic Unit)

```json
{
  "object": "object://brain.svg-tensor/v1",
  "lanes": ["T", "G", "QG", "X"],
  "required": true,
  "projection": "tensor-view"
}
```

Rules:

- `lanes` MUST be explicit.
- missing required objects abort the batch.
- projection is declarative only.

## 5. Example 1 — Geometry Preparation Batch

### `svg_prepare.batch.json`

```json
{
  "$schema": "object://schema/svg.tensor.cluster.batch.v1",

  "id": "object://batch/svg/prepare/v1",
  "type": "svg.tensor.cluster.batch",
  "mode": "prepare",

  "ordering": "stable",

  "objects": [
    {
      "object": "object://brain.svg-tensor/base",
      "lanes": ["T", "G"],
      "projection": "canonical-svg"
    },
    {
      "object": "object://brain.svg-tensor/agent-001",
      "lanes": ["T", "QG"],
      "projection": "quantized-geometry"
    }
  ],

  "verification": {
    "require_canonical": true
  }
}
```

What happens (lawfully):

- SCXQ2 lanes decompressed.
- geometry canonicalized.
- **no traversal**.
- **no inference**.

## 6. Example 2 — Merkle Verification Batch

### `svg_verify.batch.json`

```json
{
  "$schema": "object://schema/svg.tensor.cluster.batch.v1",

  "id": "object://batch/svg/verify/v1",
  "type": "svg.tensor.cluster.batch",
  "mode": "verify",

  "objects": [
    {
      "object": "object://brain.svg-tensor/base",
      "lanes": ["T", "G", "X"]
    },
    {
      "object": "object://brain.svg-tensor/agent-002",
      "lanes": ["T", "QG"]
    }
  ],

  "verification": {
    "hash": "required",
    "merkle": "partial-ok",
    "reject_on_mismatch": true
  },

  "outputs": {
    "emit": "object://audit/svg-verification-log"
  }
}
```

Produces:

- verifiable audit objects.
- no side effects.
- no retries.

## 7. Example 3 — GPU Staging Batch (WGSL-Ready)

### `svg_stage_gpu.batch.json`

```json
{
  "$schema": "object://schema/svg.tensor.cluster.batch.v1",

  "id": "object://batch/svg/stage/gpu/v1",
  "type": "svg.tensor.cluster.batch",
  "mode": "stage",

  "objects": [
    {
      "object": "object://brain.svg-tensor/base",
      "lanes": ["QG", "T"],
      "projection": "wgsl-buffer"
    }
  ],

  "constraints": {
    "fp_profile": "mx2lm.fp.deterministic.v1",
    "no_reorder": true
  },

  "outputs": {
    "buffers": "gpu.readonly"
  }
}
```

Legal GPU use:

- buffer creation.
- numeric transforms.
- deterministic layout.

Illegal:

- selection.
- branching.
- mutation.

## 8. Example 4 — Cross-Cluster Mirror Batch

### `svg_mirror.batch.json`

```json
{
  "$schema": "object://schema/svg.tensor.cluster.batch.v1",

  "id": "object://batch/svg/mirror/v1",
  "type": "svg.tensor.cluster.batch",
  "mode": "mirror",

  "objects": [
    {
      "object": "object://brain.svg-tensor/base",
      "lanes": ["T", "QG", "X"]
    }
  ],

  "routing": {
    "policy": "treaty-approved",
    "targets": [
      "cluster://eu-1",
      "cluster://us-2"
    ]
  }
}
```

Rules:

- no transformation.
- no recompression.
- hash must match exactly.

## 9. Batch Ordering Law

```text
ordering = stable
```

Means:

- object list order is canonical.
- reductions use fixed index order.
- GPU thread order does not affect result.

## 10. Failure Semantics (Hard)

| Condition               | Result        |
| ----------------------- | ------------- |
| missing object          | batch.abort   |
| hash mismatch           | batch.reject  |
| lane missing            | batch.reject  |
| unauthorized route      | batch.reject  |
| nondeterminism detected | batch.invalid |

No retries. No fallback. No silent recovery.

## 11. Batch ≠ Execution (Invariant)

> A batch file may move tensors.  
> A batch file may prepare tensors.  
> A batch file may prove tensors.  
> A batch file may never decide meaning.

## 12. How This Fits the Stack

```text
SVG-Tensor Objects
   ↓
SCXQ2 Lanes
   ↓
Batch Files (this)
   ↓
Verified Buffers
   ↓
Hybrid Algebra (declared elsewhere)
```

Batches are the rail system.

## Locked Summary

You now have:

- declarative SVG-Tensor batch format
- cluster-safe mirroring
- GPU-ready staging
- Merkle-verified geometry prep
- zero execution authority leakage
