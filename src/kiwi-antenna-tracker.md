# KIWI Antenna Tracker

Antenna tracking module for the KIWI Ground Station Kit. Receives MAVLink telemetry from the UAV and automatically points the antenna toward the aircraft. Based on the KiwiF405-12S flight controller running ArduPilot AntennaTracker firmware.

## Features

- **Automatic antenna tracking** — receives GPS coordinates from the UAV via MAVLink and drives a yaw servo to keep the antenna pointed
- **Precision encoder** — high-resolution heading sensor for accurate yaw position feedback
- **GPS** — onboard GPS for tracker's own position reference
- **TBS Fusion VRX control** — built-in serial integration for remote frequency control, RSSI monitoring, and band scanning
- **Single-servo yaw** — continuous rotation servo on output 1
- **Plug-and-play** — pre-configured defaults, connects directly to the Ground Station Kit

## Connections

| Port | Function | Default Protocol |
|------|----------|-----------------|
| USB | GCS / Configuration | MAVLink2 |
| SERIAL1 | RC Input | SBUS/CRSF |
| SERIAL2 | MAVLink Telemetry | MAVLink2 (460800) |
| SERIAL3 | GPS | GPS (115200) |
| SERIAL4 | TBS Fusion VRX | VRX Serial (115200, half-duplex) |
| SERIAL5 | MAVLink2 GCS (RS422) | MAVLink2 |
| PWM1 | Yaw Servo | Continuous rotation |

## Modes

| Mode | Description |
|------|-------------|
| MANUAL (0) | Direct servo control from RC |
| STOP (1) | Hold current position |
| SCAN (2) | Sweep back and forth searching for vehicle |
| AUTO (10) | Track vehicle automatically using MAVLink GPS |

Default startup mode is MANUAL.

## Video Receiver Control

The tracker supports remote control of 5.8 GHz video receivers over SERIAL4. Two receivers are currently supported:

| VRX | VRX_ENABLE | Frequency Control | RSSI | Band Scan |
|-----|------------|-------------------|------|-----------|
| TBS Fusion | 2 | Yes | Yes (dual RX) | Yes |
| SteadyView X | 3 | Yes | No | No |

## TBS Fusion VRX Integration

The tracker has built-in support for controlling a TBS Fusion 5.8 GHz video receiver over a single-wire UART connection (SERIAL4). No CAN bus or additional boards required.

### Wiring

One wire from TBS Fusion UART TX/RX to the tracker's SERIAL4 pad. Half-duplex is pre-configured (`SERIAL4_OPTIONS=4`). Power the Fusion separately — only the data wire is needed.

### Features

**Real-time RSSI monitoring** — dual-receiver signal strength (Receiver A and B) and current frequency are polled at 2 Hz and streamed to GCS as MAVLink `NAMED_VALUE_FLOAT` messages:

| Message | Description |
|---------|-------------|
| `VRXF` | Current frequency (MHz) |
| `VRXA` | RSSI Receiver A (0.0–1.0) |
| `VRXB` | RSSI Receiver B (0.0–1.0) |

**Remote frequency control** — change the VRX operating frequency from GCS by setting the `VRX_FREQ` parameter (in MHz, e.g. 5800). The tracker confirms the change and reports back via GCS status message.

**Frequency range scan** — trigger a full-band scan from GCS to find active video transmitters. Scan results (RSSI per frequency) are delivered as a binary MAVLink `TUNNEL` message (`payload_type 60100`) for GCS-side visualization.

### VRX Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| VRX_ENABLE | 2 | 0=Off, 2=TBS Fusion, 3=SteadyView X |
| VRX_FREQ | 5800 | Operating frequency (MHz) |
| VRX_ADDR | 1 | TBS Fusion serial address |
| VRX_SCAN | 0 | Set to 1 to start scan, auto-resets to 0 |
| VRX_SCANLO | 5200 | Scan start frequency (MHz) |
| VRX_SCANHI | 6000 | Scan stop frequency (MHz) |
| VRX_SCANST | 10 | Scan step (MHz) |
| VRX_SCANRX | 0 | Scan receiver (0=A, 1=B) |

### Scan Results Format

Scan results arrive as a `TUNNEL` message with `payload_type 60100`. Binary payload:

| Field | Type | Description |
|-------|------|-------------|
| start_freq | u16 LE | Start frequency (MHz) |
| step | u8 | Step size (MHz) |
| count | u8 | Number of entries |
| rx | u8 | Receiver (0=A, 1=B) |
| rssi[] | u8[] | RSSI value per frequency step |

## SteadyView X VRX Integration

Remote frequency control for the ImmersionRC SteadyView X receiver over SERIAL4. Set `VRX_ENABLE=3`.

### Wiring

Same as TBS Fusion — single wire from SteadyView X UART to SERIAL4 pad, half-duplex.

### Features

**Remote frequency control** — change the VRX channel from GCS by setting the `VRX_FREQ` parameter (in MHz). RSSI monitoring and band scanning are not available on this receiver.

### Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| VRX_ENABLE | 3 | SteadyView X serial backend |
| VRX_FREQ | 5800 | Operating frequency (MHz) |

## Firmware

ArduPilot AntennaTracker firmware for KiwiF405-12S-Tracker. Flash via Mission Planner or `apj` upload over USB.
