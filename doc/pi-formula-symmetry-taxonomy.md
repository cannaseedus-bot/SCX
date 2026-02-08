# π Formula Symmetry Taxonomy & Binary Splitting

This note separates the **mathematical invariants** behind π formulas from the
execution metaphors used to explain efficient evaluation.

## 1. π Formulas by Collapse Geometry (Symmetry Class)

The same constant can be expressed through series that exploit different kinds
of global structure. The deeper the symmetry, the faster the series tends to
converge.

| Symmetry Class (Collapse Geometry) | Standard Math View                              | Structure Exploited |
| --- | --- | --- |
| Path / Tree (Combinatorial) | Binomial and Catalan-driven series | Lattice-path symmetries and generating functions |
| Angle / Rotation (Trig) | Arctan/arcsin series; Machin-like formulas | Group structure of rotations, angle addition laws |
| Integer-Relation (Diophantine) | PSLQ-discovered identities | Linear relations over ℚ among special values |
| Modular / Elliptic | Ramanujan–Chudnovsky-type series | Modular forms, elliptic curves, complex multiplication |

**Invariant:** efficiency increases with the depth of global symmetry exploited
(combinatorial → trigonometric → modular/elliptic).

## 1.1 Closed Pipeline Map (Symmetry → DE → Special Values → Kernel → Microcode)

The closed pipeline expresses how symmetry determines the differential equation
class, which determines the special-value form, which then selects a natural
evaluation kernel.

| Symmetry | DE class | Special value form | Natural kernel | Lane microcode family (conceptual) |
| --- | --- | --- | --- | --- |
| SO(2) rotation | Harmonic / Sturm–Liouville on circle, inverse-trig DEs | Angles, arctan sums, Fourier boundary values | Power-series evaluation; Machin-style arctan combination | `ROT_SERIES_EVAL`, `ROT_COMBINE_ARCTAN`, `PERIOD_CLOSE_CHECK` |
| Path / combinatorial | Gauss hypergeometric ODE ({}_2F_1) and relatives | Hypergeometric at algebraic points | Binary splitting (optional rectangular splitting) | `HYP_TERM`, `BIN_SPLIT_INTERVAL`, `RATIONAL_MERGE`, `FINAL_PROJECT_DIV` |
| Modular / elliptic (SL₂(ℤ)) | Picard–Fuchs, MLDE | Elliptic periods, CM points, modular series | AGM; binary splitting + FFT | `AGM_STEP`, `PERIOD_NORMALIZE`, `MOD_PARAM_UPDATE`, `BIN_SPLIT_INTERVAL`, `BIGINT_MUL` |
| Diophantine | Inherited from source constants | Constant vectors evaluated at high precision | PSLQ / LLL + source evaluation kernels | `CONST_EVAL_BATCH`, `PSLQ_STEP`, `RELATION_VERIFY` |

## 2. Binary Splitting (Canonical Evaluation Kernel)

Binary splitting is the canonical divide-and-conquer evaluation method for
series whose terms are rational (or rational × polynomial) in k. It relies on:

1. **Associativity of addition**
2. **Distributivity over rational combination**
3. **Delayed division** for exact integer arithmetic

This yields parallelizable interval decomposition while preserving exactness
until the final division step.

## 2.1 Kernel Contracts (Microcode-Ready Families)

Each kernel is a lawful reducer with minimal algebraic assumptions. This keeps
the pipeline compile-friendly while separating representation from evaluation.

### K1: Binary Splitting (hypergeometric / period series)

**Contract:** associative merge, exact arithmetic until final projection, and
subrange independence.

**Micro-ops:** split interval, evaluate term, merge rationals, project.

### K2: AGM (elliptic periods)

**Contract:** quadratic convergence, monotone bounds, deterministic iteration.

**Micro-ops:** mean, geometric mean, AGM step, stopping check, period normalize.

### K3: Rotation Combine (Machin / arctan)

**Contract:** stable series evaluation, deterministic combination, controlled
cancellation.

**Micro-ops:** arctan series, scale, add, and (optional) period reduction.

### K4: PSLQ (relation discovery)

**Contract:** exact integer outputs, verification, precision threshold gating.

**Micro-ops:** basis reduction, matrix update, relation check, verify with more
precision.

## 2.2 Kernel Contracts (Canonical Shapes)

Each kernel family can be summarized by a minimal contract that is stable across
series choices.

### K1: Binary Splitting (exact associative interval fold)

**Input:** interval `[a,b)`, term law `T_k`, merge law.  
**Output:** rational pair `(P,Q)` (or structured triple for series variants).

**Contract:** associative merge, exact arithmetic until final projection, and
subrange independence.

**Micro-ops:** `SPLIT`, `EVAL_TERM`, `MERGE_RATIONAL`, `PROJECT`.

### K2: AGM (elliptic periods)

**Input:** `(a₀,b₀)`  
**Output:** mean limit `M(a₀,b₀)` used in elliptic periods.

**Contract:** quadratic convergence, monotone bounds, deterministic iteration.

**Micro-ops:** `MEAN`, `GEOM`, `AGM_STEP`, `STOP_IF_CLOSE`, `NORMALIZE_PERIOD`.

### K3: Rotation Combine (Machin / arctan)

**Input:** list of `(cᵢ, xᵢ)`  
**Output:** Σ `cᵢ arctan(xᵢ)`.

**Contract:** stable series evaluation, deterministic combination, controlled
cancellation.

**Micro-ops:** `ARCTAN_SERIES`, `SCALE`, `ADD`, `REDUCE_MOD_PERIOD`.

### K4: PSLQ (relation discovery)

**Input:** high-precision real vector `v`  
**Output:** integer relation `a` with `a·v≈0`.

**Contract:** exact integer outputs, verification required, precision threshold
gating.

**Micro-ops:** `REDUCE_BASIS`, `UPDATE_MATRIX`, `CHECK_RELATION`,
`VERIFY_WITH_MORE_PRECISION`.

## 3. SCXQ7 Microkernel Analogy (What Is Metaphor)

The microkernel framing is a structural analogy, not a literal execution law.
It holds at the level of algebraic structure:

| Math Reality | Analogy |
| --- | --- |
| Term Tₖ | Event |
| Partial sum over interval | State |
| Recursive split | Causal independence |
| Associative merge | Lawful composition |
| Final division | Projection |

Because binary splitting is a fold over a monoid (ℚ, +), the pattern recurs
beyond π: ζ(s), hypergeometric functions, and modular-form evaluations.

## 4. Two Canonical Statements

1. **π formulas can be classified by the type of mathematical symmetry they
   exploit, and computational efficiency increases with the depth of global
   symmetry used (combinatorial → trigonometric → modular/elliptic).**

2. **Binary splitting is the canonical divide-and-conquer reduction method for
   evaluating series with rational-term structure, enabling exact arithmetic and
   parallel interval decomposition.**

## 5. Conceptual Separation

| Layer | Role |
| --- | --- |
| Geometry / symmetry | Determines which series exist |
| Binary splitting | Determines how a series is evaluated efficiently |

This separation keeps representation (symmetry class) independent from
reduction mechanism (binary splitting).
