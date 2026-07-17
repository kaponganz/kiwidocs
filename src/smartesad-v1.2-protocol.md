# smartESAD v1.2 — Serial Control Protocol

Description of the smartESAD serial control
interface between a flight controller / host integrator and a
smartESAD-compatible Electronic Safe-Arm Device (ESAD) for one-way-attack
UAV payloads. It covers the electrical interface, frame format, message
set, safety state model, timing, telemetry, and status indication.

This document revision is **v1.2**; it describes **wire protocol
version 1** (frame byte 2 `Ver = 0x01`). "v1.2" is the interface-control
revision, not the on-wire version field — an FC still sends and expects
`Ver = 0x01`.

Values a device vendor assigns per program build are marked **[vendor]**;
behaviour the base interface leaves to the integration profile is marked
**[profile]** and summarised in §13. Nothing here identifies a specific
manufacturer, board, or part number.

---

## 1. Overview

The ESAD is a **command server**: it transmits only in response to a
received command frame and, with a single documented exception (§4.2), it
never sends unsolicited traffic. A host reads the device's status and
identity, brings it through a mandatory arming-delay countdown, and drives
it through a safety state machine gated by serial commands.

```
                          UART serial (smartESAD v1)
  Flight Controller ─────────────────────►  smartESAD ── FIRE1 / FIRE2 ──►  initiator
  / Host Integrator                         Device     ── LED(s) / buzzer ──►  operator
  DC Power ──────────── V+ / Return ─────►
```

The device is the **last line of defence** between an operator mistake or
wiring fault and a premature detonation. Two independent safety features
gate the terminal action: the ordered command sequence and a mandatory
non-cancellable arming-delay countdown. A forged or corrupted serial
command alone cannot fire the warhead.

---

## 2. Physical & electrical interface

### 2.1 Serial link

| Parameter | Value |
|---|---|
| Electrical | UART, TTL levels **[vendor]** |
| Baud rate | 57,600 |
| Data / parity / stop | 8 / None / 1 |
| Flow control | None |
| Host cadence | 50 Hz (a frame every 20 ms) recommended |
| Device response | within 10 ms of a valid received frame (except after a settings commit, §3.4) |

Signal names are from the device's perspective: **Rx** is driven by the
host, **Tx** is driven by the device.

---

## 3. Frame format

Every message (command and response) uses one frame. All multi-byte
fields are **big-endian**.

```
byte:  0     1     2     3     4     5     6 ........ L-3   L-2  L-1
      +-----+-----+-----+-----+-----+-----+----- ... -----+-----+-----+
      | AA  | 55  | Ver | Cmd | Seq | Len |     Data      | CRC | CRC |
      +-----+-----+-----+-----+-----+-----+----- ... -----+-----+-----+
                                                            MSB   LSB
```

| Field | Size | Description |
|---|---|---|
| Sync | 2 | Fixed `0xAA 0x55`. A maximum-transition bit pattern for UART clock recovery; frame uniqueness comes from `Ver` + CRC, not the sync bytes. |
| Ver | 1 | Protocol version. v1 = `0x01`. Unknown version → Fault. |
| Cmd | 1 | Command (host→device, `0x00–0x7F`) or state/reply (device→host, `0x80–0xFF`). See §4. |
| Seq | 1 | 8-bit nonce chosen by the host per request. The device echoes `(Seq + 1) mod 256`. |
| Len | 1 | Number of `Data` bytes `N` that follow (0..=255). |
| Data | N | Message-specific payload. |
| CRC | 2 | CRC-16/CCITT-FALSE over all preceding bytes, big-endian. |

- Total frame size is `8 + N` bytes (minimum 8, maximum 263).
- **CRC-16/CCITT-FALSE**: polynomial `0x1021`, init `0xFFFF`, no
  reflection, no final XOR. Check value for ASCII `"123456789"` is
  `0x29B1`.

### 3.1 Sequence nonce

The host chooses any 8-bit value per request; the device reply carries
`(Seq + 1) mod 256`. The host verifies the reply nonce equals its request
nonce plus one — proving the reply is fresh and matches the request (not a
verbatim echo).

### 3.2 Framing & error handling

- A frame that fails CRC is reported back as a Fault (`BadCrc`, §4.4)
  rather than silently dropped — this aids host-side diagnostics.
  Whether a device silently drops malformed frames instead is a profile
  choice. **[profile]**
- Bad-frame conditions never change device state (§8, R6).

---

## 4. Message set

### 4.1 Host → device commands (`Cmd` `0x00–0x7F`)

Read-only / housekeeping:

| Cmd | Name | Data len | Purpose |
|---|---|---|---|
| `0x00` | StatusPoll | 0 | current state card |
| `0x01` | Version | 0 | current state card + firmware version (drives boot handshake, §4.2) |
| `0x02` | Identifier | 0 | current state card + identity body **[vendor]** |
| `0x03` | GetCounters | 0 | current state card + event counters **[profile]** |
| `0x23` | GetSettings | 0 | current persistent-settings payload (§4.5) |

Safety state-machine commands — each carries a **distinct 4-byte guard
payload [vendor]** in `Data`; a wrong or missing guard → `BadMagic`
(§4.4). The guard is an integrity/anti-corruption token (false-positive
resistance ≈ 2⁻³² against bit-flip noise), **not** a secret — the safety
case rests on the arming-delay gate, not guard secrecy.

| Cmd | Name | Guard | Extra precondition | Effect |
|---|---|---|---|---|
| `0x10` | Cold | [vendor] | none | state ← Cold (countdowns keep running, §8 R1) |
| `0x11` | Timer | [vendor] | from Cold | state ← Timer, start arm-delay countdown |
| `0x12` | Safe | [vendor] | from Timer, countdown = 0 | state ← Safe, start self-destruct countdown |
| `0x13` | Arm | [vendor] | from Safe | state ← Armed (or ChargeUp, §8 R10) |
| `0x14` | Fire | [vendor] | from Armed | state ← Fired, assert FIRE1 + FIRE2 |
| `0x15` | Reboot | [vendor] | none | soft reset (test/debug) |
| `0x16` | Deactivate | [vendor] | any state ≠ Fired | state ← Deactivated; stop timers, clear fire latches, restore countdowns to configured values |
| `0x17` | Activate | [vendor] | from Deactivated | state ← Cold; enable the arming chain |

Configuration commands — accepted **only in Cold or Deactivated**; they
update RAM and reply with the current state card. Values persist across
reboot only after a `SaveSettings` commit (§3.4).

| Cmd | Name | Data | Range |
|---|---|---|---|
| `0x20` | SetTimer | u16 BE seconds | 1..=65535 |
| `0x21` | SetSelfDestructDelay | u16 BE seconds | (timer+1)..=65535 |
| `0x22` | SetImpactThreshold | u16 BE | 50..=32767 (accelerometer raw LSB) |
| `0x24` | SetTakeoffRequired | u8 | 0 / 1 — gate Arm on a detected launch signature |
| `0x25` | SaveSettings | 4 B guard [vendor] | commit RAM → flash, then soft reset (§3.4) |
| `0x26` | SetSafeOnLostLink | u8 | 0 / 1 — opt-in link-loss demote (§8 R9) |
| `0x28` | SetAccelRate | u16 BE Hz | ∈ {400, 800, 1600, 3300} nominal preset |
| `0x30` | SetBroadcast | u8 rate code | 0 = off, 1 = 1 Hz, 2 = 10 Hz (§4.3) |

A device may omit configuration and safety features it does not
physically support; unsupported commands reply `UnknownCommand`. Which
features a given unit implements is a capability profile (§12). **[profile]**

### 4.2 Boot handshake

The device is a strict server and does **not** announce its own boot (a
one-shot boot frame would be lost while the host's serial port is not yet
open — the device boots in milliseconds, a host OS in seconds). Instead:

1. Device powers up into state **Start** and silently opens its Rx.
2. Host polls **Version (`0x01`)** at its cadence from its own boot.
3. The first `Version` the device receives returns a **StateStart
   (`0x80`)** card (firmware version + reset cause), **immediately
   followed by one unsolicited Settings (`0x87`)** frame carrying the
   persisted configuration. This is the **only** unsolicited frame, emitted
   exactly once per boot.
4. The device transitions **Start → Deactivated**. To enable the arming
   chain the host must then send **Activate (`0x17`)** → Cold.

Routing boot through Deactivated is deliberate: an outdated or misbehaving
host that only polls `Version` but never sends `Activate` can never
accidentally arm.

### 4.3 Optional periodic broadcast

| Cmd | Name | When | Data |
|---|---|---|---|
| `0x89` | StatusBroadcast | if `SetBroadcast` ≠ 0 | same body as the current state card |

Opt-in (`SetBroadcast(0)` = default, off). Useful for passive monitors /
flight recorders. Broadcast frames coexist with normal request/reply
traffic and are identified by their `0x89` Cmd.

---

## 5. Command payloads

### 5.1 Guard-word safety commands

Each safety command (`0x10`–`0x17`, and `0x25`) carries a fixed 4-byte
guard payload **[vendor]** that must match exactly. Wrong length →
`BadLength`; correct length with a mismatched guard → `BadMagic`. Guards
are per-command distinct so a corrupted Cmd byte cannot alias one safety
action onto another.

---

## 6. Device → host state replies (`Cmd` `0x80–0xFF`)

A device reply `Cmd` reflects the device's **current state**, not an ack
of the received command. Sending `Arm` while the arm-delay is still
running therefore returns a `StateTimer` card with the remaining seconds,
not an error about `Arm`.

| Cmd | State card | Body (before telemetry tail) |
|---|---|---|
| `0x80` | StateStart | u32 BE firmware version, u8 reset cause |
| `0x81` | StateCold | u32 BE arm-delay seconds remaining (0 if not running) |
| `0x82` | StateTimer | u32 BE arm-delay seconds remaining |
| `0x83` | StateSafe | u32 BE self-destruct seconds remaining |
| `0x84` | StateArmed | (none) |
| `0x85` | StateFired | (none) |
| `0x86` | StateFault | u8 fault code + optional detail (§4.4) — **no tail** |
| `0x87` | Settings | persistent-settings payload (§4.5) — **no tail** |
| `0x88` | StateDeactivated | u32 BE configured arm-delay seconds |
| `0x8A` | StateChargeUp | (none) — transit state while the firing capacitor charges (§8 R10); capacitor-equipped devices only [profile] |
| `0x8B` | StateSafetyPin | (none) — physically safed by a hardware shunt pin; shunt-sense devices only [profile] |

### 6.1 Trailing telemetry tail

Every state card **except** `StateFault (0x86)` and `Settings (0x87)`
carries a fixed 7-byte telemetry tail after its body, so the host renders
a uniform view across device variants:

```
[ peak_metric: u16 BE ][ status_byte: u8 ][ vcap_mv: u16 BE ][ vbat_mv: u16 BE ]
```

- **peak_metric** — running-max acceleration metric observed since the
  most recent Arm (reset to 0 on Arm and at boot). Units follow the impact
  detector; **saturation dominates** on a hard impact, so it is
  informative mainly in the marginal band. `0` = no data / no
  accelerometer. On `StateFired` it doubles as the trigger-time
  acceleration.
- **status_byte** — boolean health flags. Readers **must mask** to known
  bits; reserved bits are not guaranteed 0 in future revisions.

| Bit | Mask | Name | Meaning when 1 |
|---|---|---|---|
| 0 | 0x01 | det_check_ok | initiator-loop continuity check passed [profile] |
| 2 | 0x04 | pin_present | safety shunt pin inserted / firing path physically interrupted [profile] |
| others | — | reserved | sender writes 0 |

- **vcap_mv** — firing-capacitor voltage, mV. `0` on devices with no
  firing capacitor.
- **vbat_mv** — battery-rail voltage, mV. `0` on devices without battery
  sense.

Which fields are live vs zero depends on the device capability profile
(§12); the tail is **always emitted at full size**, so a host parser stays
device-agnostic.

---

## 7. (reserved)

---

## 8. Safety state model

| State | Meaning | FIRE1 / FIRE2 |
|---|---|---|
| Start | power-on, pre-handshake | OFF / OFF |
| Cold | disarmed; configuration accepted here | OFF / OFF |
| Timer | arm-delay countdown running; not yet armable | OFF / OFF |
| Safe | past arm-delay; self-destruct running; armable | OFF / OFF |
| ChargeUp | firing capacitor charging (capacitor devices only) | OFF / OFF |
| Armed | fire-ready; terminal action or impact auto-fire will detonate | OFF / OFF |
| Fired | initiators energised, pins latched | **ON / ON** |
| Deactivated | maintenance / pre-Activate; arming chain locked out | OFF / OFF |
| SafetyPin | physically safed by shunt pin (shunt-sense devices only) | OFF / OFF |

```
[Start] --Version handshake--> [Deactivated] --Activate--> [Cold]
[Cold]  --Timer-------------> [Timer]     starts arm-delay countdown
[Timer] --auto @ countdown=0-> [Safe]      starts self-destruct countdown
[Safe]  --Arm---------------> [Armed]      (via [ChargeUp] on capacitor devices)
[Armed] --Fire--------------> [Fired]      FIRE1/FIRE2 latched ON
```

### Transition rules (non-negotiable; MIL-STD-1316F §4.2)

- **R1 — arm-delay is non-cancellable.** Once started, a `Cold` command
  masks the state back to Cold but does **not** stop or reset the
  countdown; re-entry to Timer cannot extend it. Same for self-destruct.
  Prevents an operator mistake or RF glitch from endlessly resetting the
  arming timer.
- **R2 — Arm/Fire require the ordered sequence.** Arm outside Safe, or
  Fire outside Armed → `PreconditionFailed`.
  An optional launch-detect gate (`SetTakeoffRequired`) can additionally
  require a detected launch signature before Arm.
- **R3 — handshake routes Start → Deactivated; Activate required to arm.**
  A `Version` from Start replies StateStart and transitions to
  Deactivated. The host must then Activate to reach Cold. A `Version` in
  any other non-terminal state resets the countdowns to configured values
  and returns to Deactivated (FC-reboot recovery).
- **R5 — Fire is one-way.** Once Fired, the device stays Fired; fire pins
  are latched. Only a reboot resets it.
- **R7 — impact auto-fire (Armed only).** An accelerometer impact ≥ the
  configured threshold while Armed latches the fire path independent of
  link state (the terminal-impact case routinely severs the host link).
  Impact in non-Armed states is recorded but does **not** transition.
  [profile]
- **R8 — settings changes require Cold and survive only via Save.** `Set*`
  commands update RAM and are lost on reboot unless committed by
  `SaveSettings` (§3.4).
- **R9 — opt-in link-loss demote (`safe_on_lost_link`).** When the
  operator has persisted this flag, a silent link for ≥ 1 s demotes
  {Timer, Safe, Armed} → Cold and cancels both countdowns. Default off:
  link-loss handling is otherwise host-driven. Note this is deliberately
  **opt-in** — the one-way-attack mission profile normally requires the
  device to remain committed through link loss to impact. [profile]
- **R10 — ChargeUp transit (capacitor devices).** On devices with a firing
  capacitor, Arm routes Safe → ChargeUp; the device reaches Armed only
  after the capacitor holds fire voltage for a settle window, and reverts
  to Safe on a charge timeout. Self-destruct expiry on such devices also
  routes through ChargeUp (best-effort fire on timeout). Devices without a
  capacitor go Safe → Armed and (on SD) → Fired directly. [profile]
- **R11 — SafetyPin (shunt-sense devices).** A hardware shunt pin that
  shorts the initiator leads may drive a dedicated safed state (or, on
  some devices, act purely as a fire inhibit). All state-advancing
  commands are rejected while safed. [profile]
- **R6 — bad frames don't transition.** Any CRC / version / command /
  guard / length / precondition error replies StateFault (§4.4) with no
  state change.

### Countdowns

Two independent countdowns (MIL-STD-1316F §4.2.5 independence):

- **Arm-delay** — default 420 s **[vendor]**. Starts on the first `Timer`
  from Cold; decrements in real time regardless of state; auto-advances
  Timer → Safe at 0. Reset only by `Version` or reboot.
- **Self-destruct** — default 7200 s **[vendor]**. Starts when the
  arm-delay expires; decrements **only while committed to arm** (Armed /
  Fired, and ChargeUp on capacitor devices) and pauses otherwise,
  preserving remaining seconds across de-arm. On expiry the device fires
  automatically (the failure-mode-of-last-resort so a crossed-over UAV is
  not recoverable in enemy territory). Reset only by `Version` or reboot.

### Fire-pin gate (independent of the state variable)

```
assert_fire = (state == Fired) AND fire_command_latched AND (link_alive OR sd_expired)
FIRE1 = FIRE2 = assert_fire
```

FIRE1 and FIRE2 drive two independent initiator channels asserted
together; a single stuck/failed driver still leaves the surviving channel
functional (MIL-STD-1316F §4.2.1 two independent safety features / §4.2.5
non-subvertibility). The fire pins are driven LOW in hardware as the first
action after power-on, before any code that could panic.

---

## 9. Timing

| Parameter | Value | Effect |
|---|---|---|
| Host cadence | 20 ms (50 Hz) | recommended request interval |
| Device reply latency | ≤ 10 ms | except after a settings commit |
| Link-alive gate | ~25 ms | fire-pin gate requires a recent valid frame to assert |
| Link-loss demote (R9) | 1000 ms | opt-in state demote on silent link [profile] |
| Arm-delay | 420 s default **[vendor]** | Timer → Safe |
| Self-destruct | 7200 s default **[vendor]** | auto-fire from committed-to-arm states |
| Settings-commit silence | ~40–60 ms | the only window a device may exceed 10 ms — see §3.4 |

---

## 3.4 Persistent settings & commit sequence

A small set of operator-tunable parameters (arm-delay, self-destruct
delay, impact threshold, launch-required, safe-on-lost-link,
accelerometer rate) is held in RAM and updated by the `Set*` commands.
They persist across reboot only after a **SaveSettings (`0x25`)** commit,
which is Cold-only and re-validates bounds:

1. Device ACKs with the StateCold card.
2. Device writes flash (host Rx may be masked briefly during the erase).
3. Device soft-resets.
4. After boot the device is back in Start; the host's next `Version`
   handshake returns StateStart **and** the unsolicited Settings frame
   with the freshly loaded values — the end-to-end confirmation that the
   commit succeeded.

Host-visible silence between the ACK and the post-reboot reply is
~40–60 ms; the host must tolerate this **only** on `SaveSettings`. Every
other command replies within 10 ms.

---

## 4.4 Fault codes (in `Data[0]` of StateFault `0x86`)

| Code | Name | Cause |
|---|---|---|
| `0x01` | BadCrc | CRC mismatch |
| `0x02` | BadVersion | `Ver` ≠ `0x01` |
| `0x03` | UnknownCommand | Cmd not in the catalog / not supported by this device |
| `0x04` | BadMagic | safety command with wrong / missing guard |
| `0x05` | BadLength | `Len` wrong for the command |
| `0x06` | PreconditionFailed | state precondition unmet |
| `0x07` | InternalError | self-test / peripheral error |

When `0x06`, `Data[1]` sub-codes the failed precondition: `0x01` wrong
state, `0x02`/`0x03` reserved, `0x04` arm-delay still running, `0x05`
self-destruct still running, `0x06` value out of bounds, `0x07` launch
not yet detected.

---

## 4.5 Settings payload (`Cmd = 0x87`)

10 bytes, fixed layout (same struct on the wire and in flash):

| Offset | Type | Field | Range |
|---|---|---|---|
| 0 | u16 BE | timer_s | 1..=65535 |
| 2 | u16 BE | sd_delay_s | (timer_s+1)..=65535 |
| 4 | u16 BE | impact_threshold | 50..=32767 |
| 6 | u8 | takeoff_required | 0 / 1 |
| 7 | u8 | safe_on_lost_link | 0 / 1 |
| 8 | u16 BE | accel_rate_hz | ∈ {400, 800, 1600, 3300} |

Emitted as the reply to `GetSettings (0x23)` (any state) and once per boot
piggybacked on the first handshake (§4.2).

---

## 10. Status indication

Devices carry one or more indicators — commonly a two-LED panel
(green + red) and optionally a buzzer. A power-on lamp-test lights all
indicators solid for ~1 s to prove them before the per-state pattern
shows. LED patterns derive from a single 8 Hz tick base.

| State | Green | Red |
|---|---|---|
| Start / Cold | solid | off |
| Timer (arm-delay running) | 1 Hz blink | off |
| Safe (armable) | 2 Hz blink | off |
| ChargeUp | off | 4 Hz blink |
| Armed | off | 2 Hz blink |
| Fired | solid | solid |
| Fault | 1 Hz blink | 1 Hz blink |
| SafetyPin / physically safed | solid | solid |

Buzzer-equipped devices **[profile]** add: a boot chime (ready), a
distinct impact alert, a pitch-tracking tone that rises with
firing-capacitor voltage during ChargeUp, and a soft periodic
"capacitor-hot" reminder while the cap holds energy. Exact tones are
vendor detail **[vendor]**; the semantic mapping (ready / impact /
charging / cap-hot) is the interface-relevant part.

---

## 11. Integration sequence

1. **Apply power.** From your own boot, poll `Version (0x01)` at ~50 Hz
   until a StateStart reply arrives (covers the boot race). Capture the
   firmware version and the one unsolicited Settings frame.
2. **Verify.** Check the `Ver` byte and firmware version;
   `Identifier (0x02)` for identity; `GetSettings (0x23)` if you did not
   capture the boot Settings frame.
3. **Activate.** Send `Activate (0x17)` → Cold. (Without this, the arming
   chain stays locked out — by design.)
4. **Configure (optional).** In Cold, `Set*` the arm-delay / self-destruct
   / threshold, then `SaveSettings (0x25)` to persist; tolerate the
   ~40–60 ms reboot silence and re-handshake.
5. **Arm the timeline.** `Timer (0x11)` starts the mandatory arm-delay;
   the device auto-advances to Safe at 0.
6. **Arm.** Send `Arm (0x13)` → Armed (via ChargeUp on capacitor
   devices).
7. **Fire.** Send `Fire (0x14)` → Fired.
8. **Abort / safe.** `Cold (0x10)` drops the state (countdowns persist per
   R1); `Deactivate (0x16)` returns to the maintenance lock-out.

Host invariants:

- Poll continuously — status polling is the only liveness signal, and the
  fire-pin gate requires a recent valid frame (~25 ms).
- The arm-delay and self-destruct countdowns are **not** cancellable once
  started (R1); design the mission timeline around them.
- Loss of link does **not** auto-disarm by default; the device is built to
  remain committed through terminal link loss. Opt into R9
  (`safe_on_lost_link`) only if your concept of operations wants a
  link-loss safe-down.

---

## 12. Capability profiles

Devices share one wire protocol but differ in physical capability. The
telemetry tail and state set are single-source (absent fields sent as
zero, unsupported states never entered), so a host parser stays
device-agnostic. Typical capability axes **[profile]**:

| Capability | Meaning for the host |
|---|---|
| firing capacitor / charge control | ChargeUp state (`0x8A`) is used; vcap_mv is live |
| vcap monitor | vcap_mv is a real reading (else 0) |
| battery sense | vbat_mv is a real reading (else 0) |
| initiator continuity check | status bit 0 (det_check_ok) is meaningful |
| shunt-pin sense | status bit 2 (pin_present) is meaningful; SafetyPin (`0x8B`) may be used |
| buzzer | audio cues per §10 |

The base interface currently exposes these **only out-of-band** — there is
no runtime capability-query command. An integrator supporting multiple
device variants must know the target unit's profile in advance. A future
protocol revision may add a runtime capability descriptor. **[profile]**

---

## 13. Points requiring profile / vendor agreement

Behaviours the base v1.2 interface leaves to the integration profile
(**[profile]**), collected:

1. Whether malformed frames are answered with `BadCrc` or silently
   dropped.
2. Exact `GetCounters (0x03)` body layout.
3. Which optional features a unit implements (capacitor / vcap / vbat /
   continuity / shunt / buzzer) — the capability profile of §12.
4. R7 impact-auto-fire threshold semantics and non-Armed recording.
5. R9 link-loss demote timing and whether it is enabled.
6. R10 ChargeUp settle/timeout values and the self-destruct-through-charge
   contract.
7. R11 shunt-pin behaviour (dedicated safed state vs. fire inhibit).
8. Buzzer tone details and any additional indicators.

Vendor-assigned values (**[vendor]**): the 4-byte command guard payloads,
identity/version strings, default arm-delay and self-destruct times, board
pinouts, and electrical thresholds.

---

*This is a manufacturer-neutral interface description. The authoritative
wire behaviour is defined by the vendor's codec implementation and its
conformance test vectors; where this document and a conformant device
disagree, the device's tested behaviour governs the wire, and this
document should be corrected.*
