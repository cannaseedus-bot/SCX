# Ramble Engine — Canonical Spec v1.0

**Status:** Stable
**Role:** Extrapolation / Narration
**Authority:** None
**Domain:** Outside pi
**Mutability:** Allowed (expression only)
**Feedback into pi:** Forbidden

---

## 1. Purpose

The Ramble Engine exists to **extrapolate a fixed collapse result into extended
human-readable narrative**.

It does **not**:

- reason
- decide
- collapse
- enforce law
- discover truth

It **only** explains what is already decided.

---

## 2. Formal Definition

```
Ramble Engine :=
  function(
    collapse_result,
    context,
    policy
  ) -> narrative_stream
```

Where:

- `collapse_result` is **read-only**
- `context` provides framing (audience, tone, depth)
- `policy` constrains style and safety
- `narrative_stream` may be finite or infinite

---

## 3. Canonical Inputs

### 3.1 Required

- **Collapse Result** (from KUHUL pi)
- **Projection Context** (domain, audience, purpose)

### 3.2 Optional

- Persona / style deltas (LoRA)
- Domain memory (retrieval, notes, docs)
- Verbosity controls

---

## 4. Canonical Outputs

- Natural language text
- Streaming or batched
- Explanatory, speculative, metaphorical
- Multiple valid framings of **one outcome**

> Output volume is unbounded.
> Outcome count is fixed at 1.

---

## 5. Invariants (Hard Rules)

### 5.1 Non-Mutation

- The Ramble Engine **must never alter** the collapse result.
- It may not introduce alternative conclusions.

### 5.2 No Feedback

- Ramble output **must not** re-enter pi.
- No learning, updating, or reinforcement from narration.

### 5.3 Outcome Preservation

```
forall narration n :
  meaning(n) is subset of meaning(collapse_result)
```

If narration implies a different result, that is an **illegal state**.

---

## 6. Allowed Behaviors

- Reframing
- Elaboration
- Metaphor
- Historical context
- Philosophical expansion
- Pedagogical explanation
- "Human-like rambling"
- Continuous emission

---

## 7. Forbidden Behaviors

- Changing conclusions
- Introducing branching outcomes
- Claiming uncertainty where collapse is fixed
- Re-collapsing
- Learning new facts
- Updating policy via output
- Enforcing rules

---

## 8. Architectural Placement

```
Host Environment
      |
Micronaut (orchestration)
      |
KUHUL pi (collapse)
      |
Ramble Engine (extrapolation)
      |
Human / UI / Stream
```

**Key rule:**
KUHUL pi does not know the Ramble Engine exists.

---

## 9. Reference Implementation Pattern

The Ramble Engine is any LLM model. Nothing specific. Inference is
adaptable to any model using geometry.

Typical stack:

```
Base Language Model (GGUF / Transformers / any)
+ Style Delta (LoRA, optional)
+ Tokenizer & Chat Scaffolding
= Ramble Engine
```

These store **verbosity and style**, not intelligence.

---

## 10. Failure Modes (Detectable)

| Symptom                    | Meaning                       |
|----------------------------|-------------------------------|
| Model contradicts itself   | Missing collapse anchor       |
| New conclusions appear     | pi boundary violation         |
| Narration influences truth | Illegal feedback loop         |
| Silence treated as failure | Architecture misunderstanding |

---

## 11. Canonical Distinction

| Component         | Role       |
|-------------------|------------|
| **KUHUL pi**      | Truth      |
| **Micronaut**     | Context    |
| **Ramble Engine** | Expression |

---

## 12. Canonical Statements

> **Truth collapses once. Explanation may unfold forever.**

> **The Ramble Engine narrates silence.**

> **If it never shuts up, it is not thinking — it is extrapolating.**

---

## 13. Versioning Rule

- **MAJOR**: Boundary violation (illegal)
- **MINOR**: New narration policies
- **PATCH**: Safety / formatting updates

pi compatibility must remain intact.
