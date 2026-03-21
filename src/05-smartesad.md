# SmartESAD

## Overview

**SmartESAD** (Emergency Safety Arming Device) — протокол серійного зв'язку між польотним контролером та платою [DroboDrone](06-drobodrone.md) через UART. Замість простого PWM керування, SmartESAD забезпечує двосторонній зв'язок: передачу команд, зворотній зв'язок про стан пристрою, та відображення статусу на OSD.

**SmartESAD** is a serial protocol for bidirectional communication between the flight controller and the [DroboDrone](06-drobodrone.md) board over UART. Instead of simple PWM control, SmartESAD provides command transmission, device status feedback, and OSD status display.

---

## Переваги над PWM / Advantages Over PWM

| PWM | SmartESAD |
|-----|-----------|
| Одностороннє керування | Двосторонній зв'язок |
| Немає зворотного зв'язку | Статус пристрою на OSD |
| 2 дроти (ARM + FIRE) | 1 дріт (UART) |
| Немає контролю помилок | Checksum на кожному повідомленні |
| Фіксована логіка | Настроювані таймери та пороги |

---

## Стани системи / System States

SmartESAD керує DroboDrone через послідовність станів безпеки:

| Стан / State | Опис / Description |
|---|---|
| **SAFE** | Безпечно. Мотори вимкнені або система в очікуванні / Safe. Motors off or system idle |
| **ALOFT** | В повітрі. Мотори працюють, жодна команда не активна / Airborne. Motors running, no command active |
| **FLET** | Напівозброєно. Передня лінія / Semi-armed. Forward Line of Enemy Troops |
| **ATTACK** | Озброєно. Готовий до пострілу / Armed. Ready to fire |
| **FIRE** | Постріл / Deploy |

Пріоритет команд: FIRE > ATTACK > FLET

---

## OSD Статус / OSD Status Display

Пілот бачить поточний стан SmartESAD на OSD екрані:

| Стан | OSD |
|---|---|
| Немає зв'язку | `ESAD....` з анімацією `?` |
| Помилка зв'язку | `ESAD ERR: CSUM/SEQ/SIZE` |
| Безпечно | `SAFE` |
| Безпечно (таймер) | `SAFE <зворотний відлік>` |
| Напівозброєно | `FLET` |
| Озброєно | `ATTACK` |
| Несправність | `FAULT <код>` |
| Постріл | `FIRE <причина>` |

---

## Перемикачі RC / RC Mode Switches

Три перемикачі на пульті керують станом DroboDrone:

| Перемикач / Switch | Функція / Function |
|---|---|
| KIWI ESAD FLET | Напівозброєння / Semi-arm |
| KIWI ESAD ATAK | Повне озброєння / Full arm |
| KIWI ESAD FIRE | Постріл / Deploy |

Призначте перемикачі через вкладку **Modes** в Betaflight Configurator.

---

## Сумісні плати / Compatible Boards

SmartESAD вбудований у прошивку KIWI Betaflight для всіх плат KIWI:

- KIWI F405 6S
- KIWI F405 12S
- KIWI F722 6S
- KIWI H743

---

## Швидке налаштування / Quick Setup

### 1. Підключення / Wiring

Один дріт від UART TX/RX DroboDrone до вільного UART на польотному контролері.

### 2. CLI налаштування / CLI Configuration

```
# Призначити UART для ESAD (наприклад UART4)
serial 3 1048576 57600 57600 0 57600

# Таймери та пороги (опціонально)
set kiwi_esad_arm_delay = 170
set kiwi_esad_sd_delay = 7200
set kiwi_esad_hit_threshold = 10000

# Позиція OSD елемента
set kiwi_osd_esad_status_pos = 2242

save
```

### 3. Betaflight Configurator

1. **Ports** → оберіть UART, увімкніть SmartESAD
2. **Modes** → призначте FLET, ATAK, FIRE на перемикачі пульта
3. **OSD** → розмістіть елемент ESAD Status на екрані

---

## Протокол / Protocol Summary

- UART 57600 baud, 32-біт бінарні повідомлення
- 50 Hz обмін (надсилання/прийом по черзі)
- 4-біт checksum на кожному повідомленні
- Автоматична ініціалізація при старті (версія, таймери, пороги)
