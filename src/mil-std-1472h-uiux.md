# UI/UX Guidelines for Software Applications

This chapter distills MIL-STD-1472H human engineering requirements into actionable guidelines for software applications — particularly those used in marine, industrial, defense, and high-stress environments. Every recommendation traces back to a specific section of the standard.

The core principle: **the system adapts to the human, not the other way around.**

---

## Display Design

### Contrast and Luminance

- Character-to-background contrast ratio: **6:1 minimum, 10:1 preferred** [5.2.2.7]
- Text 14pt or smaller: luminance contrast ratio **above 4.5:1** [5.17.25.16.3]
- Text larger than 14pt: contrast ratio **at least 3:1** [5.17.25.16.3]
- Display luminance adjustability range (max to min): **not less than 50:1** [5.2.1.2.1]
- Display capable of luminance levels of at least **35 cd/m² (10 fL)** [5.2.1.2.2]
- Luminance uniformity across the display: **shall not vary by more than 2:1** (1.5:1 preferred) [5.2.2.4]
- Color-coded elements require luminance **more than 10 cd/m²** [5.17.25.9]

### Day/Night Modes

- Day mode (540 lx or greater): **dark characters on light background** [5.18.2.2.1]
- Night mode (dark adaptation): **light characters on dark background** [5.18.2.2.2]
- Transition: below approximately 0.1 lx, use light-on-dark; otherwise dark-on-light [5.2.2.6]
- Separate day and night color palettes may be necessary [5.18.2.2.3]
- Night operations ambient illumination shall not exceed **0.001 lx** (0.0001 lx preferred) [5.18.2.1.5.1]
- Use **low-level blue-filtered white light** for panel and backlit keyboard lighting [5.2.1.9.8]
- If red lighting is used, controls normally coded red shall be recoded **orange-yellow with black striping** [5.18.3.2.2.1]

### Marine/Bridge Displays

- Exterior displays readable in **108,000 lx full sunlight** with 6,800 cd/m² glare source [5.18.2.1.4]
- Interior displays readable in **3,240 lx** with 6,800 cd/m² glare source [5.18.2.1.4.1]
- Sunlight minimum luminance: **685 cd/m²** [5.18.2.2.3.2]
- Dark adaptation dimmable range: **0.35 cd/m² down to 0.03 cd/m²** (0.003 preferred) [5.18.2.2.3.5]
- Luminance adjustment controls shall **remain visible even when fully dimmed** [5.18.2.2.3.1.1]
- On-screen controls shall remain visible **without external lighting** [5.18.2.2.3.1.2]
- Primary displays placed **below the operator's external line of sight** and below window level [5.18.2.1.6]
- All displays **face away from windows** to avoid reflections [5.18.2.1.9]

### Display Geometry

- Viewing distance for seated operator: **not more than 70 cm (28 in)** [5.2.2.11.2]
- Minimum effective viewing distance: **not less than 33 cm** (50 cm preferred) [5.2.2.11.4]
- Graphic display elements shall not move faster than **60 deg/sec** (20 deg/sec preferred) [5.2.1.1.3]
- Jitter: picture element movement shall not exceed **0.2 milliradians** over 1 second [5.2.2.2]
- Geometric distortion: no point displaced more than **5% of picture height** [5.2.2.1]

---

## Typography and Text

### Character Sizing

- Character height shall subtend at least **4.4 mrad (15 min arc)** minimum; **5.8 mrad (20 min arc)** preferred [5.4.7.1]
- Quick formula: **viewing distance × 0.004** (minimum) or **× 0.006** (preferred) [5.4.7.1]
- At 710 mm (28 in) viewing distance, recommended height: **~5 mm (0.18 in)** [5.4.7.2]
- On-screen characters: not less than **2.9 mrad (10 min arc)**; should be **4.5 mrad (15 min arc)** [5.17.18.2]

**Minimum character heights by viewing distance** (Table XVIII):

| Viewing Distance | Minimum Height |
|---|---|
| < 0.5 m (20 in) | 2.3 mm (0.1 in) |
| 0.5–1.0 m (20–40 in) | 4.7 mm (0.2 in) |
| 1.0–2.0 m (40–80 in) | 9.4 mm (0.4 in) |
| 2.0–4.0 m (80–160 in) | 18 mm (0.75 in) |
| 4.0–9.0 m (160–360 in) | 38 mm (1.5 in) |

### Font and Style

- Use **sans-serif fonts** (Arial, Verdana, Helvetica) under adverse conditions [5.2.2.10.3.2]
- Use a **common standard font** (Arial, Times New Roman, Courier, Verdana) [5.2.2.10.3.1]
- Font must enable discrimination between confusable characters: I vs 1, O vs 0, Z vs 2 [5.2.2.10.3]
- Stroke width: **1/6 to 1/7 of height** (light-on-dark: 1/7 to 1/8) [5.4.7.4.1–2]
- Night mode uses **thinner** strokes than day mode to prevent halation (light bleeding) [5.4.7.4.2]
- Pixel stroke width: **0.0834–0.1667** of the number of pixels used for character height [5.17.18.4]
- Width-to-height ratio: **3:5** for general characters [5.4.7.5.1]
- On-screen character width: approximately **0.9 of height** [5.17.18.5]
- Colored text requires larger characters: minimum **5.8 mrad (20 min arc)** for accurate color perception [5.17.25.14]

### Spacing

- Minimum space between characters: **one stroke width** [5.4.7.8]
- Minimum space between words: **3/5 of character height** [5.4.7.9]
- Minimum line spacing: **1/2 character height** (i.e., line spacing in points ≈ half font size) [5.4.7.10]
- Column separation in tables: **not less than three character widths** [5.17.20.3.13]
- Table row groups separated at intervals of **not more than every 5 rows** [5.17.20.3.14]

### Case and Labeling

- ALL CAPS for single-word labels, headings, signal words, abbreviations [5.4.7.11.1, 5.4.7.11.4]
- Mixed case for phrases and sentences [5.4.7.11.2]
- Abbreviations only if familiar to users; **always define in an accessible list** [5.4.6.6, 5.4.6.6.5]
- No more than **5 colors** in label color coding [5.4.5.6.3]
- Hierarchical labels: each level **25% larger** than the next smaller [5.4.1.7.2]
- Five or more characters without natural grouping: **group in blocks of 3–5** separated by space [5.17.18.10.3]
- **No leading zeros** in numerical data [5.17.18.10.6]

---

## Color Coding

### Limits

- Maximum **11 nameable colors** when user must recognize categories [5.17.25.5]
- No more than **2 brightness levels**; each separated by not less than 2:1 ratio [5.17.26.2]
- Color shall **not be the only means** of coding information [5.17.25.11]
- Colored symbols shall differ from background by **not less than 100 ΔE** (CIE L\*u\*v\*) [5.17.25.16.1]
- Colors in a set shall differ from each other by **not less than 20 ΔE** [5.17.25.16.2]

### Standard Color Meanings (Table XL)

| Color | Meaning |
|---|---|
| **Red** | Alarm, critical, stop, danger, emergency, hostile, OFF, malfunction, failure |
| **Orange** | High threat, warning/caution/hazard, abnormal state |
| **Yellow** | Approaching critical, extreme caution, impending danger, caution signals |
| **Green** | Safe, normal, open/flowing, ON, in tolerance, ready/proceed, friendly |
| **Blue** | Non-critical, advisory (dark blue/navy), guarded threat |
| **Cyan** | Friendly affiliation, advisory |
| **Magenta** | Radiation hazard, advisory |
| **Purple** | Aviation fuels, advisory, steam, medical personnel |
| **White** | Functional/physical position, action in progress, outline/border |
| **Black** | Image or figure edge, smoke |
| **Gray** | Inactive or unavailable options or actions |

### Principles

- **Warm colors** (red, orange) for items requiring action or response [5.17.25.8.2]
- **Cool colors** (blue, green) for background/infrequent information [5.17.25.8.1]
- More dangerous = **more saturated** red; hotter-to-cooler maps red→blue [5.17.25.7]
- Color coding **consistent** within and across all displays [5.17.25.3]
- Color shall **not be used** for gaining attention outside the foveal (central) visual field [5.17.25.2]
- Use **color-filled symbols** instead of outlined symbols for better detectability [5.17.25.15]
- For accurate color perception, symbol major dimension: **not less than 8.7 mrad (30 min arc)**, preferably 13.1 mrad (45 min arc) [5.17.25.13]
- Color customization allowed only for **non-tactically-significant** information [5.17.25.4]
- If color display uses filters, they shall be **neutral density** only [5.18.2.1.4.3]

### Color-Blind Accommodation

- Every effort to select non-confusable colors [5.17.25.10]
- If not possible, **redundant coding** (shape, pattern, text label) shall be used [5.17.25.11]
- Do not rely on color alone where protective eyewear may alter perception [5.17.25.12]

---

## Visual Emphasis and Coding

### Brightness and Reverse Video

- No more than **2 brightness levels**; each separated by at least **2:1 ratio** [5.17.26.2]
- Reverse video (brightness inversion) may highlight critical items requiring attention [5.17.26.3]
- When used for alerting, reverse video shall be **reserved for that purpose only** — not for general highlighting [5.17.26.3]

### Size Coding

- No more than **3 size levels** [5.17.28]
- Larger size shall be **not less than 150%** of the major dimension of the smaller [5.17.28]

### Underlining

- Underlining may indicate **unusual values, errors, changed items, or items to be changed** [5.17.30]

### Flash Suppression

- Flash coding only for **mission-critical events** [5.17.27.1]
- Only a **small area** of a display should flash at any time [5.17.27.7]
- Event acknowledgment or **flash suppression control** shall be provided [5.17.27.6]

---

## Alerts and Warnings

### Alert Hierarchy

Three levels in descending precedence:

1. **Warning (Alarm)** — dangerous condition requiring **immediate action** [5.7.1.7.1]
2. **Caution (Alert)** — impending dangerous condition requiring **attention** [5.7.1.7.2]
3. **Advisory** — safe/normal status change, important but **no immediate action** [5.7.1.7.3]

### Visual Alert Specifications

| Level | Color | Flash Rate | Duty Cycle |
|---|---|---|---|
| Warning | **Flashing Red** | 3–5 Hz | 50% (ON ≥ OFF) |
| Caution | **Yellow** | ≤ 2 Hz (if flashing) | 70% ON / 30% OFF |
| Advisory | Steady (any standard color) | — | — |

- All items flashing at the same rate shall be **synchronized** [5.17.27.4]
- **Characters that must be read shall not flash** — use flashing border, background, or adjacent symbol instead [5.17.27.5]
- No more than **two flash rates** total; differ by at least 2 Hz; higher rate ≤ 5 Hz, lower rate ≥ 0.8 Hz [5.17.27.3]
- Alert text height: **8.7 to 17.4 mrad** from longest viewing distance [5.7.3.6]
- Warning/caution signals and response info **grouped in a single location** [5.7.3.7]
- Users can sort alerts by **priority, chronological, or recency** [5.7.3.7.2]
- Bridge alerts: within operator's **30-degree forward cone of vision** [5.18.2.1.2]
- Safety-of-navigation alerts on **left-most display** if multiple displays [5.18.2.1.3]
- **Minimize false and nuisance alerts** [5.7.3.10]

### Audio Alert Specifications

- Warning signals: **at least 15 dBA above ambient**, not exceeding 140 dBP [5.3.2.1.3]
- Frequency range: 250–8,000 Hz, preferably **500–2,000 Hz** [5.3.3.3.1]
- Recognition time: within **0.5 seconds** [5.3.3.1]
- Minimize startle: increase **not greater than 30 dB** in any 0.5-second period; first 0.2 seconds not at max intensity [5.3.4.2.3–4]
- No more than **4 discriminable audio signals** if absolute discrimination required [5.3.4.3.1.1]
- Advisory signals in quiet areas: **50–70 dBA** [5.3.2.4.1]
- Audio warning persists until condition resolved or acknowledged; if acknowledged but condition persists past timeout, **audio re-initializes**; visual remains even when audio silenced [5.3.2.1.5]
- Critical system mode changes: **both auditory and visual alert** [5.18.8.7]

### Safety Design Precedence

In order: (1) eliminate hazard by design → (2) minimize risk → (3) safety devices → (4) warning devices → (5) procedures and training [5.7.1.1]

---

## Controls and Input

### Touchscreen

- Touchscreen **shall not be the sole input** for mission-critical or safety-critical interfaces [5.1.3.1.1.3]
- **Not the sole input** for large amounts of frequent data entry [5.1.3.1.1.1]
- **Not the sole input** in moving/vibration environments [5.1.3.1.1.2]
- Display response latency: **should not exceed 100 ms** [5.1.3.1.4]
- Critical tasks require **additional confirmatory action** [5.1.3.1.7]
- Repeat function initial delay: **500–750 ms** [5.1.3.1.8]
- Sensitivity shall match **all expected operational modes including gloves** [5.1.3.1.10]
- For glove use: add **5 mm** to each dimension of touch targets [5.1.3.1.17]

**Touch target dimensions:**

| Parameter | Keyboard Targets | General Targets |
|---|---|---|
| Minimum size | 16 × 16 mm | 15 × 15 mm |
| Maximum size | — | 38 × 38 mm |
| Separation (first contact) | ≥ 5 mm | ≥ 5 mm |
| Separation (last contact) | ≥ 3 mm | ≥ 3 mm |

### Keyboard

- Alphanumeric key preferred size: **19 mm**, function key minimum: **15 mm** [Table VII]
- Key resistance: **0.25–1.5 N** (preferred 0.5–0.6 N) [Table VII]
- Key displacement: **0.8–6.3 mm** [Table VII]
- Key separation: minimum **6.4 mm** [Table VII]
- Must provide **tactile feedback** — spring-loaded keys that click and return [5.1.3.2.6]
- In dark environments: dimmable to **minimum 30 incremental positions** from full ON to OFF [5.1.3.2.7]
- Individually **backlit** characters and symbols [5.1.3.2.7.2]

### Mouse

- Operable with **either hand** [5.1.3.3.2.4]
- If cursor can go off-edge: provide **indicators to bring it back** [5.1.3.3.2.6]
- Button resistance: **0.5–1.5 N**; displacement: **5–6 mm** [Table VIII]

### Marine/Bridge-Specific

- GUI controls **shall not be the sole means** for ship steering, propulsion, or emergency functions [5.18.1.5]
- **Hardware-based controls** for direct steering and throttle [5.18.1.5.1]
- If control transfers between positions: **clear, salient indication** of which position is active [5.18.6.1.3]
- **Immediate human override** of automated/autonomous operations [5.18.9.2.2]

---

## Menus, Forms, and Dialogs

### Menu Design

- Drop-down menus when **more than three commands** [5.17.3.1.1.1]
- Submenu depth limited to **three levels** (Main > Sub1 > Sub2) [5.17.3.1.2.6]
- Frequently needed functions: **not in submenus** [5.17.3.1.2.3]
- Right-click menus **shall not be the only method** for any command [5.17.3.1.5.1]
- Menus shall **not span multiple pages** [5.17.3.2.2.4]
- Unavailable options: **greyed out or hidden** [5.17.3.2.3]
- Menu order: **logical** (alphabetical, frequency of use, or workflow) [5.17.3.2.6]
- **Keyboard shortcuts** for frequently used actions [5.17.3.2.10]
- Toolbar icons **shall have tooltip labels** [5.17.3.1.3.5]
- When traversing multiple levels, **all levels remain visible** until selection made [5.17.3.2.14]
- A page should contain **no more than 7 portlets/widgets** [5.17.8.4]

### Form Design

- Pace of data entry **controlled by the user** [5.17.4.2]
- System provides **immediate feedback** on acceptance or rejection [5.17.4.3]
- Entries validated for **format, legal value, and range** before processing [5.17.4.8]
- User shall **not re-enter data** already available to the system [5.17.4.9]
- Data entered in **units familiar to the user** [5.17.4.10]
- Related items **grouped together** [5.17.6.2]
- **Required fields distinguished** from optional fields [5.17.6.6]
- Format hints when ambiguous: e.g., "DATE (MM/DD/YYYY)" [5.17.6.8]
- Cursor positioned at **first data entry field** by default [5.17.6.16]
- Maximum field length **visually indicated** [5.17.6.17]
- User can **review, change, or cancel** any item before submitting [5.17.6.25]
- Non-entry areas: **visually distinguishable and inaccessible** [5.17.6.23–24]

### Cursors

- Different visual attributes for **different modes** (selecting vs editing) [5.17.5.2]
- Cursor **shall not obscure** displayed entities [5.17.5.4]
- Cursor **shall not disappear** at display boundaries [5.17.5.5]
- Permanent deletion of more than one character requires **confirmation** (unless undo available) [5.17.5.14]

---

## System Response and Feedback

### Response Time Requirements

| Event | Required Response |
|---|---|
| Touchscreen actuation | Latency ≤ **100 ms** [5.1.3.1.4] |
| Any user input | **Perceptible response** [5.17.9.3] |
| Processing > 1 second | **"Processing" message** [5.17.9.5.3] |
| Processing > 10 seconds | **Progress indicator** [5.17.9.9.2] |
| Error detection | Error message within **0.2 seconds** [5.17.10.9] |
| Readable dynamic values | Update **no more than 1/second** [5.17.22.1.1.1] |
| Rate-of-change values | Update **3–4 times/second** [5.17.22.1.1.2] |

### Feedback Principles

- Every input produces a **consistent perceptible response** [5.17.9.3]
- If input rejected: feedback indicates **reason and corrective action** [5.17.9.10]
- Messages shall be **explicit and informative** — no codebooks, no system internals [5.17.9.14]
- Time-consuming commands: **warn before starting**, allow **abort during execution** [5.17.9.7–8]
- Auto-updating displays: provide **freeze mode** with visible "FROZEN" label [5.17.22.1.2.1, 5.17.22.1.2.4]

---

## Error Management

- Easy correction of errors; system **permits partial correction** [5.17.10.1–2]
- Error checking at **logical data entry breaks** (end of fields, not per-character) [5.17.10.4]
- Validate: format, sequence, completeness, range [5.17.10.5]
- **Irreversible/destructive actions require explicit confirmation** [5.17.10.6]
- Error messages shall:
  - Describe the error in **application terms**, not system internals [5.17.10.7.1]
  - Instruct user **how to recover** [5.17.10.7.2]
  - Be **constructive and neutral** in tone [5.17.10.7.3]
  - Appear **near the entry** that caused them, without obscuring needed controls [5.17.10.16–17]
  - Display **continuously** until corrected or dismissed [5.17.10.14]
- If user **repeats the same error**, second message includes a **noticeable change** [5.17.10.18]
- **Multi-level undo**: user can stop and return to previous levels at any point [5.17.10.10]
- System should recognize **common misspellings** and suggest corrections [5.17.10.12]

---

## Cybersecurity UX

### Authentication

- **Multifactor authentication**: at least two of token, knowledge, biometrics [5.16.2.3]
- Password **not echoed** on display (asterisks) [5.16.2.6]
- Status feedback on **accept/reject** [5.16.2.5]
- Failed authentication: display **specific reason and corrective action** [5.16.2.10–11]
- Show user **remaining login attempts** before lockout [5.16.3.5]
- User informed of **all active concurrent sessions** [5.16.2.14]
- Locked-out user can **request admin reset** [5.16.3.6]

### Session Management

- Logon is a **separate procedure** completed before any operational access [5.16.3.1]
- **Role-based access control**; user informed of current role [5.16.1.1, 5.16.1.3.2]
- User can see **which account is currently active** [5.16.1.4]
- **Automatic logoff** after predefined inactivity with **no data loss** [5.16.4.1]
- On logoff/exit: check for **pending transactions**, warn of **potential data loss**, prompt for **confirmation** [5.16.4.2]

### Password UX

- Display **password criteria** during creation [5.16.7.1]
- **Dynamic feedback** on which complexity requirements are not yet met [5.16.7.2]
- Users can change passwords **at any time** [5.16.7.5]
- System should **support password managers** [5.16.7.6]

### Data Protection

- **Prominent indication** of security classification level on classified data [5.16.5.1]
- Real system use **clearly distinguished** from simulated operations [5.16.6.2]

---

## Mobile and Handheld Applications

### Physical Constraints

- Single-handed device: < 10.2 × 25.4 × 12.7 cm, weight < **1.4 kg** (precision manipulation < 400 g) [5.19.6.1–3]
- Two-handed device: should not exceed **4.5 kg** [5.19.7.2]
- Operable with **bare hands and gloves** [5.19.1.3.1]
- Operable with **either hand** [5.19.1.7.1]

### Display

- Brightness **full-range continuously adjustable** [5.19.4.2.1]
- Fully dimmed setting **still readable** in natural lighting with backlight off [5.19.4.2.2]
- **User-configurable** backlight timeout, resets on interaction [5.19.4.2.3]
- **Anti-glare** features (filters, coatings) [5.19.4.3]
- Vibrotactile alerts: **150–300 Hz** optimal, duration **50–200 ms** [5.19.4.4.1, 5.19.4.4.3]

### App Design Principles

- Critical information reachable in **no more than 2 key actions** [5.19.5.4.1]
- Provide **shortcuts** (hotkeys, voice, key combos) for frequent commands [5.19.5.4.2]
- Support **auto-rotation** (user-selectable) [5.19.5.4.4]
- **Minimize text input**; prefer selection over manual entry; prepopulate forms [5.19.5.4.7]
- Scrolling in **one dimension only** [5.19.5.5.4b]
- Selected items: **clearly indicated** (color + background + text change) [5.19.5.5.2]
- **Back, Home, Search** always available [5.19.5.5.3]
- Follow **platform conventions** (iOS, Android, Windows) — do not invent non-standard behaviors [5.19.5.1.6.1]
- Color always with **dual coding** (shape or label) [5.19.5.5.7]
- Remaining **battery life indication** (percentage or time) [5.19.2.4.3]
- **Connection status** indication (signal strength/reliability) [5.19.2.5.2]
- Usable **while recharging** [5.19.2.4.6]

### Key Spacing

- Key spacing (center-to-center): min 10 mm, preferred **14 mm**, max 19 mm [5.19.3.8.1]
- Communication keypads: **telephone layout** (not calculator) [5.19.3.8.2]

---

## Speech and Audio UI

### When to Use Audio

- Short, simple information requiring **immediate response** [5.3.1.1a]
- Visual channel is **overburdened or restricted** [5.3.1.1b]
- Criticality makes **redundant notification** desirable [5.3.1.1c]
- Each audio signal: **one meaning only** [5.3.1.3]

### Speech Output

- Speech rate: **150–180 words per minute** [5.3.10.3]
- Instructional prompts: **goal first, then action** ("To delete, press Enter") [5.3.10.6]
- Prompts repeat after command or **10 seconds** of inactivity [5.3.10.6.1]
- **Cancel/mute** capability after initial presentation [5.3.10.7]
- **"Say again"** / repeat on command [5.3.10.8]
- Simultaneous messages: **most critical gets priority** [5.3.10.5]

### Speech Recognition

- Use when hands occupied, mobility required, or visual attention fully occupied [5.3.13.1]
- Use when consequences of recognition errors are **low** and correction is **easy** [5.3.13.1]
- **Shall not be sole control** — always provide alternative input [5.3.14.1–2]
- System shall **adapt to environment variability** [5.3.13.3]
- Provide **feedback** so user knows system understood [5.3.13.5]
- Vocabulary: **minimized and phonetically distinct** [5.3.13.6]
- Must reject involuntary sounds (sneezes, coughs) [5.3.13.10]

### Audio Signal Control

- Non-critical audio signals can be **turned off by user** [5.3.1.8]
- Visual indication must show when audio has been **silenced** [5.3.1.9]

---

## Default Values and Efficiency

- Use **default values** where feasible to reduce workload [5.17.20.2.1]
- Defaults displayed **automatically** in their fields [5.17.20.2.2]
- Accept default by **single keystroke** [5.17.20.2.3]
- User can **replace any default** during a transaction without changing the default definition [5.17.20.2.4]
- Display information in **directly usable form** — no transposing, computing, or mental translation [5.17.15.2]
- Same format for **input and output** within a task [5.17.15.3.2]
- Each multi-page display labeled **"Page X of Y"** [5.17.15.5]

---

## Quick Reference: Critical Numbers

| Parameter | Value |
|---|---|
| Character contrast ratio | 6:1 min, 10:1 preferred |
| Small text contrast | 4.5:1 min |
| Color ΔE from background | ≥ 100 (CIE L\*u\*v\*) |
| Color ΔE between colors | ≥ 20 (CIE L\*u\*v\*) |
| Touch target size | 15–38 mm |
| Touch target separation | 3–6 mm |
| Touch response latency | ≤ 100 ms |
| Processing indicator | After 1 second |
| Progress bar | After 10 seconds |
| Error message latency | ≤ 0.2 seconds |
| Max colors for categories | 11 |
| Max brightness levels | 2 (separated by ≥ 2:1) |
| Max size coding levels | 3 (each ≥ 150% of smaller) |
| Max flash rates | 2 |
| Warning flash rate | 3–5 Hz |
| Max submenu depth | 3 levels |
| Max portlets per page | 7 |
| Table row grouping | Every 5 rows |
| Pixel stroke width range | 0.0834–0.1667 of pixel height |
| Colored text min size | 5.8 mrad (20 min arc) |
| Speech output rate | 150–180 wpm |
| Audio recognition time | ≤ 0.5 seconds |
| Night ambient max | 0.001 lx |
