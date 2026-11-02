# Picatinny CLIK v3.0 — Payload Serial Control Protocol

A manufacturer-neutral description of the CLIK v3.0 serial control
interface between a host/integrator (carrier platform, fire-control
system) and a CLIK-compatible payload module. It covers the electrical
interface, frame format, message set, function-state model, timing, and
status indication.

Values that a payload vendor assigns per program build are marked
**[vendor]**; behaviour the base interface leaves to the integration
profile is marked **[profile]** and summarised in §12. Nothing here
identifies a specific manufacturer or part number.

---

## 1. Overview

The module is a **command server**: it transmits only in response to a
received command frame and never sends unsolicited traffic. A host reads
the module's status/identity, activates it, and drives it through a
safety state machine gated by two hardware discretes plus serial
commands.

```
                        RS-232 serial (CLIK v3.0)
  Host / Fire-Control ── SAFETY ENABLE  (discrete) ──►  CLIK Payload ── Firing/actuation output ──►
  System              ── SAFETY EXECUTE (discrete) ──►  Module        ── Status indicator (RGB) ──►
  DC Power ────────────── V+ / Return ───────────────►
```

---

## 2. Physical & electrical interface

### 2.1 Serial link

| Parameter | Value |
|---|---|
| Electrical | RS-232 (TIA/EIA-232-F) |
| Baud rate | 115,200 |
| Data / parity / stop | 8 / None / 1 |
| Flow control | None |

Signal names are from the module's perspective: RS-232 **Rx** is driven
by the host, **Tx** is driven by the module.

### 2.2 Power

| Parameter | Value |
|---|---|
| Nominal supply | 28 VDC |
| Tolerance | ±5 % (26.6 – 29.4 VDC) |
| Connector current limit | 10 A max through the connector |
| Overcurrent protection | Module limits its own draw to its rated Maximum Possible Current (MPC) under normal and failure modes |
| Module MPC | **[vendor]** — reported at runtime via GetPayloadSystemConfig (`0x0002`) |
| Back-feed | Module does not feed current back to the platform |

### 2.3 Safety discretes

Two isolated discrete inputs form the hardware side of a two-key
interlock:

| Discrete | Role | Electrical |
|---|---|---|
| SAFETY ENABLE | Hardware enable for arming | true ≥3.5 V, false ≤1.5 V, ≤5 mA |
| SAFETY EXECUTE | Hardware enable for the terminal action | true ≥3.5 V, false ≤1.5 V, ≤5 mA |

Both discretes share a dedicated isolated return. Arming and the
terminal action each require the serial command **and** the matching
discrete — neither alone advances the state (§8).

### 2.4 Connector (9-19 insert)

The module mates through a single Picatinny CLIK payload connector
(micro-miniature dual-start, "Mighty Mouse" class; receptacle; shell
9-19; size #23 male contacts; keying Configuration A). Pins used by a
given module are marked in its wiring drawing; unused/reserved pins
shall not be repurposed.

| Pin | Signal | Notes |
|---|---|---|
| 1 | RS-232 Tx | module → host |
| 2 | RS-232 Rx | host → module |
| 3 | RS-232 Return | serial reference |
| 4–7 | Ethernet (Tx±/Rx±) | optional; often not implemented |
| 8, 9 | Power In (28 VDC) | platform supplies |
| 10 | Chassis | structural / shield bond |
| 11, 12 | Power Return | current return |
| 13 | SAFETY ENABLE | discrete in |
| 14 | SAFETY EXECUTE | discrete in |
| 15 | Safety Return | isolated return for pins 13/14 |
| 16 | Loopback | tied to Power Return inside the module for presence detection |
| 17–19 | Reserved | do not use |

---

## 3. Frame format

Every message (command and response) uses one frame. All multi-byte
fields are **big-endian**.

```
+-----+-----+----------+----------+--------+-----+----------+-----------+
| AA  | 55  | MsgID hi | MsgID lo | Sync   | Len | Data...  | CRC16 be  |
+-----+-----+----------+----------+--------+-----+----------+-----------+
  0     1      2          3         4       5     6..6+N     6+N, 7+N
```

| Field | Size | Description |
|---|---|---|
| Header | 2 | Fixed `0xAA 0x55` |
| Message ID | 2 | Command / response identifier (§4) |
| Sync | 1 | Opaque byte; the module echoes it unchanged in the response |
| Length | 1 | Number of data bytes `N` that follow |
| Data | N | Message-specific payload |
| CRC | 2 | CRC-16/CCITT-FALSE over all preceding bytes, big-endian |

- **CRC-16/CCITT-FALSE**: polynomial `0x1021`, init `0xFFFF`, no
  reflection, no final XOR. Check value for ASCII `"123456789"` is
  `0x29B1`.
- Total frame size is `8 + N` bytes.

**Framing rules**

- After a valid `0xAA 0x55` header the module waits up to **500 ms** for
  the rest of the frame, then discards the buffer and resynchronises on
  the next header.
- Frames that fail the CRC are **ignored** — the module does not reply
  to a frame it cannot trust (msg_id/sync are unverifiable on a corrupt
  frame). A `Bad checksum` result code exists for host-side decode but
  is not transmitted by the module. **[profile]**

---

## 4. Message set

### 4.1 Standard messages

| Msg ID | Name | Type | Data len | Purpose |
|---|---|---|---|---|
| `0x0000` | GetPayloadStatus | GET | 0 | health, discrete levels, function state |
| `0x0001` | GetPayloadIdentifier | GET | 0 | UID, identifier string, version |
| `0x0002` | GetPayloadSystemConfig | GET | 0 | max current, max weight, discretes-monitored flag |
| `0x0003` | GetFunctionStateIdentifiers | GET | 0 | supported state IDs and names |
| `0x0004` | SetFunctionState | SET | 2 | activate / deactivate a function |

A **GET** response returns a multi-byte data structure. A **command/SET**
response returns a single data byte (a result code, §7); this is how a
host distinguishes a data response from a result code.

### 4.2 Application (vendor) command range

Message IDs `0x8000`–`0xFFFF` are reserved for **payload-specific**
commands. A safety payload typically defines a three-command guard
group; the IDs and guard payloads below are an **[vendor]** example
assignment, not part of the base interface:

| Command | Msg ID (example) | Data len | Concurrent discrete |
|---|---|---|---|
| Arm | `0x8111` **[vendor]** | 4 | SAFETY ENABLE |
| Disarm | `0x8222` **[vendor]** | 4 | — |
| Fire / execute | `0x8765` **[vendor]** | 4 | SAFETY EXECUTE |

---

## 5. Command payloads

### 5.1 SetFunctionState (`0x0004`)

Data: `[channel, state]`. `channel = 1` (single-function modules).
`state`: `0x00` = De-Activate, `0x01` = Activate. Wrong length →
`0x03`; unknown channel or state value → `0x04`.

### 5.2 Guard-word safety commands

Each application safety command carries a fixed guard payload (a
vendor-defined constant that must match exactly) to reduce the chance of
an accidental or corrupted command being acted on. The guard word is
typically 4 bytes **[vendor]**. Wrong length → `0x03`; correct length
with a mismatched guard → `0x04`.

"Concurrent discrete" means the serial command must arrive within the
discrete-to-serial window (§9) after the corresponding discrete's rising
edge.

---

## 6. GET responses

Each success response echoes the request's Msg ID and Sync, sets
`Data[0] = 0x00`, and appends:

### 6.1 GetPayloadStatus (`0x0000`)

| Byte | Field |
|---|---|
| 0 | Status bits (below) |
| 1 | Available network interfaces (0 if none) |
| 2 | Enabled network interfaces (0 if none) |
| 3 | Number of functions (1 for single-function modules) |
| 4… | Function state ID, one per function (§8) |

Status bits: `bit0` Health (1 = OK), `bit1` SAFETY ENABLE level, `bit2`
SAFETY EXECUTE level, `bit3` Functions Available, `bit4` Functions
Activated, `bit5` Functions Armed.

### 6.2 GetPayloadIdentifier (`0x0001`)

`uid:u16-BE`, then a null-terminated ASCII identifier string
**[vendor]**, then a null-terminated ASCII version string. Identifier
≤32 chars, version ≤16 chars.

### 6.3 GetPayloadSystemConfig (`0x0002`)

`max_power_cpu:u8` (units of 250 mA @ 28 V), `max_weight:u16-BE` (0.1 lb
units), `monitors_discretes:u8` (boolean — whether the module enforces
the safety discretes). These are fixed device properties; there is no
`Set*` counterpart. A host uses them as a pre-flight compatibility check
(bay power budget, mass/CG update, interlock enforcement).

### 6.4 GetFunctionStateIdentifiers (`0x0003`)

The supported state IDs and their names. Byte layout is **[profile]**; a
common encoding is `count:u8`, then per state `{id:u8, name ASCII,
0x00}`.

---

## 7. Result codes

A rejected message returns exactly one data byte:

| Code | Name | Meaning |
|---|---|---|
| `0x00` | Success | accepted |
| `0x01` | Bad checksum | defined for host decode; not transmitted by the module (§3) **[profile]** |
| `0x02` | Invalid command | unknown message ID |
| `0x03` | Invalid data length | wrong number of data bytes |
| `0x04` | Invalid parameter | bad guard word / bad SetState value |
| `0x05` | Not valid in current state | command not permitted from the current state |
| `0x80` | Safety-validation reject | internal safety check failed (e.g. discrete window missed) — re-verify state/discretes rather than blind-retry **[profile]** |
| `0x81` | Confirm timeout | command not confirmed within the allowed time — re-issue **[profile]** |

A `0x00` result confirms acceptance; a host should always confirm the
resulting state with GetPayloadStatus.

---

## 8. Function-state model

State IDs are sparse — 4 and 5 are unassigned in v3.0:

| ID  | State         | Meaning                                              |
| --- | ------------- | ---------------------------------------------------- |
| 0   | Unavailable   | not ready (power-on delay) or safed-out / locked out |
| 1   | Faulted       | internal fault; power cycle required                 |
| 2   | Not Activated | ready, safe                                          |
| 3   | Activated     | live, awaiting arm                                   |
| 6   | Armed         | first safety removed, awaiting execute               |
| 7   | Firing        | terminal action in progress                          |
|     |               |                                                      |

```
        (power on)
            │
            ▼  power-on delay elapsed
       Unavailable ───────────────────► NotActivated
            ▲  idle lockout                 │ ▲
            │  ┌─────────────────────────────┘ │ SetFunctionState(De-Activate)
            │  │ SetFunctionState(Activate)     │
            │  ▼                                │
            └ Activated ◄─────────────────────┘
              │  ▲ ▲
   ENABLE+Arm │  │ └ Disarm / ENABLE released / armed-inactivity timeout
   (in window)│  │
              ▼  │
            Armed │
              │   │ Disarm
 EXECUTE+Fire │   │
 (in window)  ▼   │
            Firing ┘   (Firing exits only via Disarm — not on a discrete drop)
```

Key rules:

- **Edge-triggered arm/execute.** Arm requires Activated + SAFETY ENABLE
  asserted within the discrete-to-serial window of its rising edge;
  Fire/execute requires Armed + SAFETY EXECUTE the same way. Missing the
  window → `0x80`.
- **ENABLE release** while Armed demotes to Activated. Firing is not
  exited by a discrete drop — only Disarm.
- **Disarm** returns Armed or Firing to Activated.
- **Two-key principle**: arm and execute each need both the serial
  command and the matching physical discrete.

If the module reports `monitors_discretes = false`, it does not enforce
the discretes and the serial commands alone drive the states (a
bench/test posture; a safety regression for field use).

---

## 9. Timing

| Parameter | Typical value | Effect |
|---|---|---|
| Power-on safety delay | ~30 s | Module is Unavailable and rejects Activate/Arm/Fire until it elapses |
| Discrete-to-serial window | 50 ms | Arm/Fire command must arrive within this time of the corresponding discrete's rising edge |
| Armed inactivity timeout | 30 s | Armed with no further command auto-reverts to Activated **[profile]** |
| Idle lockout | 20 min | No state change for this long → Unavailable, power cycle to clear **[profile]** |

Timer reset behaviour is **[profile]**: a common resolution is that the
armed-inactivity timer resets on any valid frame (status polls keep it
alive) while the idle-lockout timer resets only on actual state
transitions.

---

## 10. Status indicator

The module drives an RGB indicator:

| Indication | State |
|---|---|
| Solid green | Safe — Not Activated / Activated |
| Solid red | Armed |
| Flashing red | Firing |
| Flashing blue | Not ready (power-on delay) |
| Solid blue | Fault or idle lockout — power cycle required |

Modules with only a two-colour indicator approximate the two "blue"
states with a distinct pattern (e.g. alternating colours for power-on
delay, both solid for fault/lockout). **[profile]**

---

## 11. Integration sequence

1. **Apply power.** Poll GetPayloadStatus until state = Not Activated (2)
   — this covers the power-on delay.
2. **Discover.** GetPayloadIdentifier and GetPayloadSystemConfig; verify
   identity, bay power budget, mass/CG, and that discretes are monitored.
3. **Activate.** SetFunctionState(Activate) → Activated (3).
4. **Arm.** Assert SAFETY ENABLE, then send Arm within the window → Armed
   (6). Keep SAFETY ENABLE asserted while armed.
5. **Execute.** With SAFETY ENABLE still asserted, assert SAFETY EXECUTE,
   then send Fire within the window → Firing (7).
6. **Safe / abort.** Disarm (→ Activated), or de-assert the discretes;
   SetFunctionState(De-Activate) to return to Not Activated.

Host invariants:

- Drive the discrete GPIO and the serial command from the same task so
  the 50 ms window is met.
- Loss of comms does not auto-disarm; the safest abort is to drop the
  discrete (hardware-authoritative) then Disarm when comms return.
- Status polling is the only liveness signal — the module is server-only.

---

## 12. Points requiring profile agreement

The base v3.0 interface leaves several behaviours to the integration
profile / vendor. The items marked **[profile]** above, collected:

1. Whether the module ever transmits `0x01` or silently drops all
   malformed frames.
2. Exact use of `0x80` vs `0x81`, and the retry contract for each.
3. Whether a successful arm/execute consumes its discrete edge (so a
   held-high discrete needs a fresh drop-and-raise to re-arm).
4. Timer reset semantics (armed-inactivity vs idle-lockout).
5. State/command legality matrix at the edges (arm-while-armed,
   disarm-from-other-states, deactivate-while-armed).
6. Whether Disarm from Firing de-energises the actuation output, and
   whether that output latches.
7. Byte layout of the GetFunctionStateIdentifiers (`0x0003`) response.
8. Entry conditions for the Faulted state.
9. Two-colour indicator substitution for the RGB "blue" states.

Vendor-assigned values (**[vendor]**): identifier/version strings, UID,
MPC/MPW, and the application (`0x8000`–`0xFFFF`) command IDs and guard
payloads.
