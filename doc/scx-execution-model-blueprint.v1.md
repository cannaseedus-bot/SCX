# SCX Execution Model — System Blueprint v1

This describes the architecture of an SCX-native runtime system.

## 1. The Big Picture

```
          ┌────────────────────┐
          │   SCX Control Law  │
          │  (semantic layer)  │
          └─────────┬──────────┘
                    ↓
          ┌────────────────────┐
          │  SCXQ2 Lane Stream │
          │ (transport layer)  │
          └─────────┬──────────┘
                    ↓
          ┌────────────────────┐
          │  Lane Interpreter  │
          │ (causality engine) │
          └─────────┬──────────┘
                    ↓
      ┌─────────────┼─────────────┐
      ↓             ↓             ↓
 Geometry      Graph/Topology   Tensor/Field
      ↓             ↓             ↓
      └─────────────┼─────────────┘
                    ↓
          ┌────────────────────┐
          │ Agent Behavior     │
          └─────────┬──────────┘
                    ↓
          ┌────────────────────┐
          │ UI Projection      │
          └─────────┬──────────┘
                    ↓
          ┌────────────────────┐
          │ Snapshot & Replay  │
          └────────────────────┘
```

## 2. Component Roles

### SCX Control Plane

Defines what reality is. Domains: geometry, graph, tensor, agent, UI. This is
the semantic physics layer.

### SCXQ2 Lanes

Carry SCX instructions as compact execution packets. One lane = one causal
mutation.

### Lane Interpreter

Responsibilities:

* Decode lanes
* Route to domains
* Apply deterministic mutation
* Handle flags
* Commit state

This is the software physics engine.

### Domain Engines

| Engine   | Role                    |
| -------- | ----------------------- |
| Geometry | Spatial state           |
| Graph    | Relationships           |
| Tensor   | Multidimensional values |
| Agent    | Autonomous behavior     |
| UI       | Projection of state     |

These engines apply SCX law rather than define it.

### Agent Layer

Agents operate inside the SCX universe. They read state, emit SCX lanes, and
evolve the world. Agents are actors, not controllers.

### UI Layer

UI is projection, not logic. It renders SCX state.

### Snapshot & Replay

State at time T is:

```
Snapshot + Lanes
```

Enables rewind, branching, deterministic rebuild, and auditable history.

## 3. Data Flow

```
SCX instructions
    ↓
Lane packing
    ↓
Transport / storage
    ↓
Runtime interpreter
    ↓
Domain mutation
    ↓
Agent + UI reaction
    ↓
Snapshot recorded
```

## 4. What Makes This System Different

| Traditional Systems | SCX Blueprint                 |
| ------------------- | ----------------------------- |
| Code drives state   | **State law drives behavior** |
| State overwritten   | **State replayed**            |
| UI contains logic   | **UI reflects state**         |
| AI opaque           | **AI emits lanes**            |
| Debugging linear    | **Time is navigable**         |

## 5. Runtime Guarantees

* Determinism
* Replayability
* Cross-runtime portability
* Domain isolation
* Causality auditability

## 6. System Identity

This blueprint describes a universal symbolic causality engine, not a
programming language, framework, database, or game engine. It is execution
physics for software systems.

## 7. Minimal Runtime Implementation Requires

1. SCXQ2 decoder
2. Lane router
3. Domain interpreters
4. State store
5. Snapshot manager

## Final Summary

SCX is the law. Lanes carry the law. The interpreter enforces the law. Domains
express the law. Snapshots preserve the law through time. This is a
causality-first system architecture.
