# SCX Branch Merge & Conflict Resolution Blueprint v1

**Purpose:** provide deterministic rules for reconciling divergent execution
branches.

## 0. The Core Problem

Timeline splits:

```
        S₀
         |
        S₁
       /   \
   Branch A  Branch B
```

Both branches are valid SCX histories that must merge without corruption or
nondeterminism.

## 1. Fundamental Law

Merge happens at the lane level, not object level. We merge lane histories
rather than state blobs.

## 2. Merge Strategy Overview

```
Find common ancestor snapshot Sₐ
Compute lane deltas:
    ΔA = lanes(Sₐ → A)
    ΔB = lanes(Sₐ → B)
Apply merge rules domain-by-domain
Produce merged lane stream ΔM
Replay from Sₐ
```

## 3. Domain Merge Rules

Each domain resolves conflicts differently.

### Geometry Domain

| Conflict Type            | Rule                          |
| ------------------------ | ----------------------------- |
| Different positions      | Latest logical timestamp wins |
| Transform stack conflict | Combine transforms in order   |
| Constraint violations    | Re-evaluate physics rules     |

### Graph Domain

| Conflict                   | Rule                             |
| -------------------------- | -------------------------------- |
| Same edge added twice      | Deduplicate                      |
| Node deleted in one branch | Deletion wins if flagged final   |
| Structural loops           | Resolve via topological ordering |

### Tensor Domain

| Conflict                  | Rule                      |
| ------------------------- | ------------------------- |
| Same weight updated       | Average or weighted merge |
| Disjoint tensor areas     | Combine                   |
| Structural shape mismatch | Reject merge              |

### Agent Domain

| Conflict               | Rule                              |
| ---------------------- | --------------------------------- |
| Same agent action      | Deduplicate                       |
| Conflicting intents    | Priority by agent role            |
| Agent state divergence | Merge via last confirmed snapshot |

### UI Domain

| Conflict            | Rule                 |
| ------------------- | -------------------- |
| Visibility conflict | Active context wins  |
| Layout changes      | Reflow               |
| State mismatch      | Reflect merged state |

## 4. Lane-Level Conflict Types

| Type       | Meaning                   |
| ---------- | ------------------------- |
| Parallel   | Safe to combine           |
| Overwrite  | Competing mutation        |
| Structural | Affects topology          |
| Causal     | Agent or trigger conflict |

## 5. Merge Algorithm (Simplified)

```
for each lane in ΔA and ΔB:
    classify conflict
    apply domain rule
    produce merged lane
```

Order is preserved via logical timestamps.

## 6. Snapshot Integrity

Merged snapshot:

```
Sₘ = HASH(Sₐ + ΔM)
```

This maintains deterministic history.

## 7. Determinism Guarantee

Given the same inputs:

* Same merged result
* Same snapshot hash
* Same lane order

## 8. Why This Works

SCX mutations are atomic, domains are isolated, lanes are replayable, and state
is derived rather than primary.

## 9. Practical Use Cases

* Multiplayer worlds
* AI simulations
* Distributed runtimes
* Offline → online sync
* Parallel agent planning

## 10. What This Avoids

Traditional systems suffer from last-write-wins chaos, state corruption, and
race conditions. SCX uses causal merge, domain-specific resolution, and replay
validation.

## Final Definition

SCX branch merge is a deterministic reconciliation of divergent lane histories
using domain-specific resolution rules and snapshot integrity hashing.
