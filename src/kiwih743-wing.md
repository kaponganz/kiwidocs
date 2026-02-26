# KiwiH743-Wing Flight Controller

## Overview

The **KiwiH743-Wing** is a Pixhawk-format flight controller system consisting of two boards: a Flight Controller and a Power Distribution Board (PDB). Designed for expendable quadcopters and long-range fixed-wing drones. Ready to use with Rover, Wing, Quadcopter, and Hexacopter configurations.

---

## Firmware

- ArduPilot [KiwiH743-wing.zip](download/KiwiH743-wing.zip)
- Betaflight

---

## Flight Controller


<img src="h743-wing-fc.jpg" width="350">
<img src="h743-wing-fc-bot.jpg" width="350">

Built around the STM32H743, the flight controller provides dual IMUs with hardware signal filtering, dual switchable camera inputs, and relay-controlled power outputs.

### Features

- STM32H743 MCU
- 12S power supply
- 5V, 6/7V, 9/12V 5A BECs
- ICM-42688P and ICM-45686 with power and hardware signal filtering
- BMP388 barometer
- Dual camera input, switchable
- 8 motors
- 7 servos
- 5 UARTs, UART7 with flow control
- 1 SPI
- 1 I2C
- 5 GPIOs
- 2 relay outputs, 9/12V switch
- Analog + digital VTX output
- STM32G4 OSD
- SD card via SDMMC
- 36.0 х 39.0 mm mounting holes
- 40 x 42 mm board dimensions

---

## Power Distribution Board (PDB)

![KiwiH743-Wing PDB](h743-wing-pdb.jpg)

### Features

- 4S–12S power input
- 5V 5A output
- 5/6/7/9V 5A adjustable output
- 12V 5A output
- 3.3V 1A output
- 0.1 mOhm current sensor
- 36 x 39 mm mounting holes
- 42 x 75 mm board dimensions

---

## Technical Specifications

### Processor

| Parameter | Value |
|---|---|
| MCU | STM32H743 |
| Architecture | ARM Cortex-M7 |
| Max Frequency | 480 MHz |
| Flash | 2048 KB (2 MB) |
| Crystal | 16 MHz external oscillator |

### Sensors

| Sensor | Part | Notes |
|---|---|---|
| IMU 1 | ICM-42688P | External clock, hardware filtered |
| IMU 2 | ICM-45686 | Hardware filtered |
| Barometer | BMP388 | |
| OSD | STM32G4 | Analog video overlay |

### Power

| Rail | Voltage | Current |
|---|---|---|
| Input | 12S (up to ~50V) | |
| BEC 1 | 5V | 5A |
| BEC 2 | 6/7V | 5A |
| BEC 3 | 9/12V | 5A |

### Mechanical

| Parameter | Value |
|---|---|
| Board size | 39 x 39 mm |
| Mounting holes | 30.5 x 30.5 mm |

---

## UART Mapping

| Serial | UART | TX Pin | RX Pin | Notes |
|---|---|---|---|---|
| Serial 1 | UART1 | PB14 | PB15 | |
| Serial 2 | UART2 | PD5 | PD6 | |
| Serial 3 | UART3 | PD8 | PD9 | |
| Serial 4 | UART4 | PD1 | PD0 | |
| Serial 5 | UART5 | PB13 | PB12 | |
| Serial 6 | UART6 | PC6 | PC7 | |
| Serial 7 | UART7 | PE8 | PE7 | RTS: PE9, CTS: PE10 |
| Serial 8 | UART8 | PE1 | PE0 | OSD UART |

---

## PWM Outputs

### Motors (SERVO 1–8)

| Output | Pin | Timer |
|---|---|---|
| SERVO 1 | PA10 | |
| SERVO 2 | PA9 | |
| SERVO 3 | PA8 | |
| SERVO 4 | PD15 | TIM4 CH4 |
| SERVO 5 | PD14 | TIM4 CH3 |
| SERVO 6 | PD13 | TIM4 CH2 |
| SERVO 7 | PD12 | TIM4 CH1 |
| SERVO 8 | PB1 | ADC1 IN5 |

### Servos (SERVO 9–15)

| Output | Pin | Timer |
|---|---|---|
| SERVO 9 | PB0 | |
| SERVO 10 | PB4 | |
| SERVO 11 | PB5 | |
| SERVO 12 | PA3 | TIM5 CH4 |
| SERVO 13 | PA2 | TIM5 CH3 |
| SERVO 14 | PA1 | TIM5 CH2 |
| SERVO 15 | PA0 | TIM5 CH1 |

---

## Power Monitoring

| Function | Pin | ADC |
|---|---|---|
| Battery voltage | PC5 | ADC1 IN8, scale /21 |
| Battery current | PC4 | ADC1 IN4 |
| VBAT2 | PC3_C | ADC3 IN1, scale /21 |
| ADC 1 | PC1 | ADC1 IN11 |
| ADC 2 | PC0 | ADC1 IN10 |
| ADC 3 | PC2_C | ADC3 IN0 |

---

## GPIOs, Relays, and AUX

| Function | Pin | Notes |
|---|---|---|
| AUX 1 | PD7 | GPIO |
| AUX 2 | PB3 | GPIO |
| AUX 3 | PE5 | TIM15 CH1 |
| AUX 4 | PC13 | Shared with VIDEO BOOT |
| RELAY 1 | PD3 | 9/12V switched output |
| RELAY 2 | PD4 | 9/12V switched output |
| Camera switch | PE2 | Dual camera input select |

---

## Buses

### SPI

| Bus | CLK | MISO | MOSI | Usage |
|---|---|---|---|---|
| SPI 1 | PA5 | PA6 | PA7 | IMU 1 (CS: PB2) |
| SPI 4 | PE12 | PE13 | PE14 | IMU 2 (CS: PE15) |

### I2C

| Bus | SCL | SDA |
|---|---|---|
| I2C 1 | PB6 | PB7 |
| I2C 2 | PB10 | PB11 |

### FDCAN

| Function | Pin |
|---|---|
| CAN RX | PB8 |
| CAN TX | PB9 |
| CAN Silent | PE4 |

### SDMMC (SD Card)

| Function | Pin |
|---|---|
| D0 | PC8 |
| D1 | PC9 |
| D2 | PC10 |
| D3 | PC11 |
| CLK | PC12 |
| CMD | PD2 |

---

## Other

| Function | Pin | Notes |
|---|---|---|
| USB D- | PA11 | |
| USB D+ | PA12 | |
| SWDIO | PA13 | Debug |
| SWDCLK | PA14 | Debug |
| Buzzer | PA15 | TIM2 CH1 |
| LED | PD11 | Status |
| IMU clock | PE6 | TIM15 CH2, external clock for IMUs |
| Video NRST | PE3 | OSD/VTX reset |
| Video BOOT | PC13 | Shared with AUX 4 |

---

## Full Pinout Reference

| Pin | Function | Alternate |
|---|---|---|
| PA0 | SERVO 15 | TIM5 CH1 |
| PA1 | SERVO 14 | TIM5 CH2 |
| PA2 | SERVO 13 | TIM5 CH3 |
| PA3 | SERVO 12 | TIM5 CH4 |
| PA4 | IMU 1 INT | |
| PA5 | SPI 1 CLK | |
| PA6 | SPI 1 MISO | |
| PA7 | SPI 1 MOSI | |
| PA8 | SERVO 3 | |
| PA9 | SERVO 2 | |
| PA10 | SERVO 1 | |
| PA11 | USB N | |
| PA12 | USB P | |
| PA13 | SWDIO | |
| PA14 | SWDCLK | |
| PA15 | BUZZER | TIM2 CH1 |
| PB0 | SERVO 9 | |
| PB1 | SERVO 8 | ADC1 IN5 |
| PB2 | IMU 1 CS | |
| PB3 | AUX 2 | |
| PB4 | SERVO 10 | |
| PB5 | SERVO 11 | |
| PB6 | I2C 1 SCL | |
| PB7 | I2C 1 SDA | |
| PB8 | FDCAN RX | TIM16 CH1 |
| PB9 | FDCAN TX | TIM17 CH1 |
| PB10 | I2C 2 SCL | |
| PB11 | I2C 2 SDA | |
| PB12 | Serial 5 RX | |
| PB13 | Serial 5 TX | |
| PB14 | Serial 1 TX | |
| PB15 | Serial 1 RX | |
| PC0 | ADC 2 | ADC1 IN10 |
| PC1 | ADC 1 | ADC1 IN11 |
| PC2_C | ADC 3 | ADC3 IN0 |
| PC3_C | VBAT2 / 21 | ADC3 IN1 |
| PC4 | ESC CURR | ADC1 IN4 |
| PC5 | VBAT / 21 | ADC1 IN8 |
| PC6 | Serial 6 TX | TIM3 CH1 |
| PC7 | Serial 6 RX | TIM3 CH2 |
| PC8 | SDMMC D0 | TIM3 CH3 |
| PC9 | SDMMC D1 | TIM3 CH4 |
| PC10 | SDMMC D2 | |
| PC11 | SDMMC D3 | |
| PC12 | SDMMC CK | |
| PC13 | VIDEO BOOT / AUX 4 | |
| PD0 | Serial 4 RX | |
| PD1 | Serial 4 TX | |
| PD2 | SDMMC CMD | |
| PD3 | RELAY 1 | |
| PD4 | RELAY 2 | |
| PD5 | Serial 2 TX | |
| PD6 | Serial 2 RX | |
| PD7 | AUX 1 | |
| PD8 | Serial 3 TX | |
| PD9 | Serial 3 RX | |
| PD11 | LED | |
| PD12 | SERVO 7 | TIM4 CH1 |
| PD13 | SERVO 6 | TIM4 CH2 |
| PD14 | SERVO 5 | TIM4 CH3 |
| PD15 | SERVO 4 | TIM4 CH4 |
| PE0 | Serial 8 RX | |
| PE1 | Serial 8 TX | |
| PE2 | CAMERA SWITCH | |
| PE3 | VIDEO NRST | |
| PE4 | FDCAN SILENT | |
| PE5 | AUX 3 | TIM15 CH1 |
| PE6 | IMU CLK IN | TIM15 CH2 |
| PE7 | Serial 7 RX | |
| PE8 | Serial 7 TX | |
| PE9 | Serial 7 RTS | |
| PE10 | Serial 7 CTS | |
| PE11 | IMU 2 INT | TIM1 CH2 |
| PE12 | SPI 4 CLK | TIM1 CH2 |
| PE13 | SPI 4 MISO | TIM1 CH3 |
| PE14 | SPI 4 MOSI | TIM1 CH4 |
| PE15 | IMU 2 CS | |
