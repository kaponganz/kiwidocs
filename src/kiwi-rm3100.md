# Kiwi-RM3100 CAN Compass

## Overview

The **Kiwi-RM3100** is an external compass module based on the PNI RM3100 magnetometer, designed as a DroneCAN peripheral for ArduPilot-powered flight controllers. Built on the STM32F103 MCU, it connects to any CAN-enabled flight controller and provides high-precision heading data via the DroneCAN protocol.

The RM3100 sensor offers superior magnetic resolution and noise performance compared to common QMC5883L or HMC5843 compasses, making it well-suited for applications where accurate heading is critical — long-range wings, survey drones, and missions in magnetically noisy environments.

## Firmware

- ArduPilot AP_Periph [KiwiF103-RM3100.zip](download/KiwiF103-RM3100.zip)

---

## Technical Specifications

### Processor

- MCU: STM32F103xB (ARM Cortex-M0, 72 MHz)
- Flash: 128 KB
- Crystal: 8 MHz external oscillator

### Compass Sensor

- Sensor: PNI RM3100
- Interface: SPI (1 MHz)
- Mounting orientation: ROTATION_PITCH_180

### Communication

- **CAN bus** — primary interface, DroneCAN protocol
- CAN silent pin on PB5 (active low)

### Serial Ports

| Port   | Function            | Pins        |
|--------|---------------------|-------------|
| USART1 | GPS / general       | PA9, PA10   |
| USART2 | General purpose      | PA2, PA3    |
| USART3 | Telemetry           | PB10, PB11  |

### Additional Interfaces

- SPI2 spare bus (PB13/PB14/PB15) — available for additional sensors
- AUX analog input on PA0

### Indicators

- Status LED on PC13 (active low)

---

## ArduPilot Configuration

The Kiwi-RM3100 runs ArduPilot AP_Periph firmware. Once connected to the CAN bus, the flight controller auto-detects the compass.

### Flight Controller Parameters

Enable CAN on the flight controller:

```
CAN_P1_DRIVER = 1
CAN_D1_PROTOCOL = 1   (DroneCAN)
```

The compass should appear automatically. Verify with:

```
COMPASS_DEV_ID
```

---

## Pinout

### CAN Connector

| Pin | Function |
|-----|----------|
| 1   | CAN_H    |
| 2   | CAN_L    |
| 3   | VCC      |
| 4   | GND      |

