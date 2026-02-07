# CONTROL-MICRONAUT-1 (Draft Specification)

## Overview
CONTROL-MICRONAUT-1 defines a safe, transport-friendly control alphabet using
ASCII control characters (U+0000–U+001F) as **state transitions** rather than
rendered content. The goal is to provide **control-before-syntax** for streams,
files, and DOM-safe text while preserving visible output. This specification is
informational and does not grant execution authority.

## Design Principles
- **Projection-only:** Control codes shape interpretation without mutating
  semantic content.
- **Deterministic replay:** Given identical inputs, the interpretation is stable.
- **No symbol invention:** The control layer does not create new tokens.
- **Transport robustness:** The grammar survives common encodings, compression,
  and copy/paste.
- **Separable from rendering:** Render output is unaffected by control codes.

## Control Alphabet Roles
The following mapping assigns operational roles to core control codes. These
roles are abstract and do not execute logic by themselves.

| Code | ASCII | Role | Micronaut Meaning |
| --- | --- | --- | --- |
| U+0000 | NUL | Absolute zero | Void / no-op / inert |
| U+0001 | SOH | Header start | Metadata boundary |
| U+0002 | STX | Text start | Renderable content begins |
| U+0003 | ETX | Text end | Renderable content ends |
| U+0004 | EOT | Transmission end | Flush / finalize / collapse |
| U+0005 | ENQ | Enquiry | Capability negotiation |
| U+0006 | ACK | Acknowledge | Capability acceptance |
| U+0015 | NAK | Negative acknowledge | Capability rejection |
| U+0007 | BEL | Bell | Attention / alert / wake |
| U+0008 | BS | Backspace | Geometry / layout motion |
| U+0009 | HT | Horizontal tab | Geometry / layout motion |
| U+000A | LF | Line feed | Geometry / layout motion |
| U+000D | CR | Carriage return | Geometry / layout motion |
| U+000E | SO | Shift out | Context stack push |
| U+000F | SI | Shift in | Context stack pop |
| U+0010 | DLE | Data link escape | Literal / bypass parser |
| U+001C | FS | File separator | Structural segmentation |
| U+001D | GS | Group separator | Structural segmentation |
| U+001E | RS | Record separator | Structural segmentation |
| U+001F | US | Unit separator | Structural segmentation |
| U+001B | ESC | Escape | Parser / grammar change |
| U+001A | SUB | Substitute | Fault tolerance |
| U+0018 | CAN | Cancel | Abort / kill branch |

## Space (U+0020) Handling
Space is treated as a **neutral carrier** for alignment and delimiting:
- It may encode intent via placement without affecting render output.
- It is collapsible in many renderers and should not be used as a sole carrier
  for critical semantics.

## Legal Subset for DOM/CSS Safety
The following subset is recommended for DOM-safe payloads:
- **Separators:** FS, GS, RS, US
- **Layout controls:** HT, LF, CR
- **Mode:** SO, SI

Control characters outside this subset should be stripped or escaped when
crossing DOM or CSS boundaries unless explicitly required by a host policy.

## Encoding Rules (Informational)
1. Control codes must **not** appear inside JSON string literals unless escaped
   as `\\u00XX`.
2. When used in files, control codes are **non-printing** and must not be
   interpreted as visible content by renderers.
3. If a transport strips control codes, the stream remains valid but loses
   control metadata.

## Safety Guarantees
- No execution authority is implied by CONTROL-MICRONAUT-1.
- It does not define a virtual machine or bytecode.
- All effects are **interpretation-only**, governed by host policies.
