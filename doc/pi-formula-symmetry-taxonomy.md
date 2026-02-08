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

## 2. Binary Splitting (Canonical Evaluation Kernel)

Binary splitting is the canonical divide-and-conquer evaluation method for
series whose terms are rational (or rational × polynomial) in k. It relies on:

1. **Associativity of addition**
2. **Distributivity over rational combination**
3. **Delayed division** for exact integer arithmetic

This yields parallelizable interval decomposition while preserving exactness
until the final division step.

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
