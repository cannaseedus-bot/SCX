# SCX Unified Encoder/Decoder Interface Law v1

**Purpose:** allow runtimes to handle SCXQ2 and SCXQ4 without branching system
logic.

## 1. Canonical Interface

```ts
interface SCXCodec {
  mode: "SCXQ2" | "SCXQ4"

  encodeLane(lane: LogicalLane): ByteStream
  decodeLane(bytes: ByteStream): LogicalLane

  liftQ2toQ4?(laneQ2): laneQ4
  canDowncastQ4?(laneQ4): boolean
}
```

## 2. LogicalLane (Mode-Neutral)

```ts
LogicalLane {
  domain: u8
  opcode: u16
  flags: u8
  targetID: u64   // Always 64-bit in logical model
  payload: bytes
}
```

Internally:

- Q2 codecs truncate to 32 bits
- Q4 codecs use full 64 bits

## 3. Encode Rule

```
if mode == SCXQ2:
    assert targetID <= 0xFFFFFFFF
    assert payloadLen <= 65535
```

## 4. Decode Rule

Decoder produces `LogicalLane` regardless of mode.

## 5. Mode Agnosticism

Higher-level systems never see Q2/Q4; they operate on `LogicalLane` only.

## 6. Determinism Law

```
decode(encode(lane)) == lane
```

for both modes.

## 7. Cross-Mode Replay Law

```
decode_Q4(lift_Q2(encode_Q2(lane))) == decode_Q2(encode_Q2(lane))
```

## 8. Why This Matters

Ensures one runtime code path, safe future expansion, no branching semantic
logic, and transport-layer abstraction.
