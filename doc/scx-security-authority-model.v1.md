# SCX Security & Authority Model v1

**Purpose:** ensure only authorized entities can emit SCX lanes that mutate
shared state.

## 0. Core Law

Execution is free. Emission is governed. Anyone can interpret lanes; not
everyone can create lawful lanes.

## 1. Authority Hierarchy

| Level              | Role           | Capability                |
| ------------------ | -------------- | ------------------------- |
| **Observer**       | Read-only      | Cannot emit lanes         |
| **Agent**          | Limited domain | Emit agent-domain lanes   |
| **Builder**        | Structural     | Emit graph/geometry lanes |
| **Operator**       | System control | Emit cross-domain lanes   |
| **Authority Node** | Root trust     | Issue authority tokens    |

## 2. Lane Signature Requirement

All lanes in distributed systems must include:

```
Lane {
    payload
    signature
    authorityID
}
```

Unsigned lanes are rejected.

## 3. Authority Tokens

Each emitter holds:

```
AuthorityToken {
    id
    role
    domainPermissions
    expiry
    publicKey
}
```

## 4. Domain Permissions

Tokens define which domains can be modified.

| Token Role  | Allowed Domains  |
| ----------- | ---------------- |
| Agent       | Agent only       |
| UI Operator | UI + Agent       |
| Builder     | Graph + Geometry |
| Admin       | All              |

## 5. Signature Model

When emitting a lane:

```
hash = HASH(laneContent)
signature = SIGN(hash, privateKey)
```

Receiver:

```
VERIFY(signature, publicKey)
CHECK domain permissions
APPLY if valid
```

## 6. Trust Chain

Authority nodes issue tokens.

```
Root Authority
    ↓
Operator
    ↓
Builder
    ↓
Agents
```

Trust flows downward.

## 7. Revocation

Tokens can be revoked by expiry, misbehavior, or compromise. Revocation lists
are synced across nodes.

## 8. Snapshot Integrity

Snapshots include:

```
signatureSet
stateHash
authorityLog
```

This preserves historical trust.

## 9. Malicious Lane Handling

| Action       | Result          |
| ------------ | --------------- |
| Reject lane  | Ignore mutation |
| Log          | Audit trail     |
| Flag node    | Reduce trust    |
| Revoke token | Cut authority   |

## 10. Isolation Rules

Nodes never trust unsigned lanes, over-privileged tokens, or invalid domain
access.

## 11. Security Guarantees

* Deterministic state
* Controlled mutation
* Auditable history
* Trust boundaries
* Distributed enforcement

## 12. What This Prevents

Without this: rogue agents altering world state, corrupted graph structures,
unauthorized AI changes, UI spoofing, distributed chaos. With SCX security:
controlled causality, structured authority, trust-based execution.

## Final Definition

SCX security governs the emission of causality, ensuring only authorized
entities can create state-changing lanes with cryptographic validation and
domain-scoped permissions.
