# SmartESAD

<nav class="quick-nav">
  <a href="#overview">Overview</a>
  <a href="#переваги-над-pwm--advantages-over-pwm">vs PWM</a>
  <a href="#архітектура-безпеки--safety-architecture">Safety</a>
  <a href="#стани-системи--system-states">States</a>
  <a href="#захисні-таймери--safety-timers">Timers</a>
  <a href="#налаштування-пристрою--device-persistent-settings">Device Settings</a>
  <a href="#швидке-налаштування--quick-setup">Quick Setup</a>
  <a href="#перемикачі-rc--rc-mode-boxes">RC Boxes</a>
  <a href="#налаштування-польотного-контролера--fc-side-settings">FC Settings</a>
  <a href="#довідник-cli-команд--cli-command-reference">CLI Commands</a>
  <a href="#довідник-фаултів--fault-code-reference">Fault Codes</a>
  <a href="#osd-індикація--osd-display">OSD</a>
  <a href="#поведінка-при-втраті-звязку--failsafe--link-loss">Failsafe</a>
  <a href="#діагностика--troubleshooting">Troubleshooting</a>
  <a href="#протокол--protocol-summary">Protocol</a>
  <a href="#сумісні-плати--compatible-boards">Boards</a>
  <a href="#стандарти--standards">Standards</a>
</nav>

## Overview

**SmartESAD** (Electronic Safe-Arm Device protocol) — двосторонній серійний
протокол між польотним контролером і піротехнічним пристроєм що замінює класичні PWM-сигнали ARM/FIRE.
Замість двох однонаправлених ліній SmartESAD дає польотному контролеру
повний контроль над послідовністю безпеки і повертає назад стан пристрою,
залишковий час таймерів і телеметрію.

**SmartESAD** is a bidirectional serial protocol between the flight
controller and pyrotechnic device,
replacing the classic PWM ARM/FIRE signal pair. Instead of two
one-way lines, SmartESAD gives the FC full control of the safety
sequence and returns the device's live state, remaining timer counts,
and telemetry.

Ця сторінка описує протокол **smartESAD v1.1** (іменування станів
Cold/Timer/Safe) та прошивку KIWI Betaflight гілки 2025.12. This page
covers **smartESAD v1.1** and the KIWI Betaflight 2025.12 firmware line.

---

## Переваги над PWM / Advantages over PWM

| PWM | SmartESAD |
|-----|-----------|
| Одностороннє керування | Двосторонній зв'язок |
| Немає зворотного зв'язку про стан | Стан пристрою на OSD у реальному часі |
| 2 дроти (ARM + FIRE) | UART, 2 дроти (TX/RX) |
| Контроль цілісності відсутній | CRC-16 на кожному кадрі, відхиляє пошкоджені |
| Сплутування ARM/FIRE можливе | Кожна команда має власний 4-байтовий ASCII-код (`ARM!`, `FIRE`, `COLD`…) |
| Втрата сигналу — невизначена поведінка | Link-watchdog блокує постріл; опційна автодемоція стану (`safe_on_lostconnection`) |
| Фіксовані часи | Налаштовувані таймери (timer, self-destruct, поріг удару), зберігаються у флеші пристрою |
| Тільки одна гілка спрацювання | Дублюючі канали FIRE1+FIRE2 синхронно ведуть незалежні підривники |

---

## Архітектура безпеки / Safety architecture

SmartESAD реалізує модель з кількома незалежними рівнями захисту. Щоб
підривник отримав напругу, **усі** перелічені умови мають бути виконані
одночасно. Бажано прочитати [MIL-STD-1316F](https://quicksearch.dla.mil/)
для розуміння принципів.

SmartESAD implements a defence-in-depth model. **All** the conditions
below must hold simultaneously for the initiator to receive energy.

| Гейт / Gate | Що гарантує / What it guarantees |
|---|---|
| Стан машини станів = `Armed` | Команди надходили у правильному порядку (`Timer` → `Safe` → `Arm`) |
| 4-байтовий ASCII-код у кожній safety-команді | Випадкове співпадіння за бітовим шумом ~2⁻³² на команду |
| CRC-16-CCITT по всьому кадру | Спотворені фрейми відхиляються до обробки |
| Версія протоколу (`Ver` byte) збігається | Несумісні FC отримують `Fault::BadVersion` до досягнення SM |
| Link-watchdog | Постріл не вмикається, якщо UART мовчав довше за watchdog-вікно |
| Окремі `fire_command_latched` і `state` | Помилка пам'яті, що псує одне з двох, не призводить до пострілу |
| Дублюючі лінії FIRE1+FIRE2 | Один обірваний/закорочений драйвер не вимикає весь пристрій |
| FC-side FIRE gate | Betaflight не відправляє `Fire`, поки стан пристрою ≠ `Armed` (захист у глибину, не покладається лише на відмову пристрою) |

Протокол додатково передбачає GPIO co-sign (`IN_ARM`, `IN_BLAST`) —
окрему фізичну лінію підтвердження. На платах KIWI підключення чисто
серійне (без GPIO), тому цей гейт опційний і залежить від конкретного
виробу.

---

## Стани системи / System States

SmartESAD керує пристроєм через послідовність безпекових станів. Перехід
між основними станами — лише вперед:

The FC drives SmartESAD through this safety state progression. Forward
transitions only:

```
START ──Version──▶ DEACTIVATED ──Activate──▶ COLD ──Timer──▶ TIMER
                        ▲                     ▲                │ (auto, after
                        │                     │                │  countdown)
                   Deactivate            Cold cmd*             ▼
                 (з будь-якого       (*таймер продовжує      SAFE ──Arm──▶ [CHARGE_UP] ──▶ ARMED ──Fire──▶ FIRED
                  стану крім Fired)    тикати, правило R1)         (лише плати з                (термінальний
                                                                    конденсатором)               стан)
```

| Стан / State | OSD | Опис / Description |
|---|---|---|
| **Start** | `ESAD INIT` | Пристрій щойно завантажився, мовчить. Чекає на `Version` від FC. |
| **Deactivated** | `ESAD CFG.` | Конфігураційний / maintenance режим. `Set*`/`Save` приймаються, arm/fire відхиляються. Вихід — лише команда `Activate`. |
| **Cold** | `ESAD COLD` | Передпольотне очікування. Ланцюг озброєння скинуто, `Arm` відхиляється. Приймаються налаштування. |
| **Timer** | `ESAD T-NN` | Йде countdown. **Не скасовується** (правило R1): команда `Cold` повертає стан, але таймер тикає далі (OSD: `COLD T-NNN`). Автоматичний перехід у `Safe` при нулі. |
| **Safe** | `ESAD SAFE` / `SD T-NNNN` | Countdown вичерпано, self-destruct таймер запущено. Готовий приймати `Arm`. OSD чергує напис стану та SD-countdown з частотою 1 Гц. |
| **ChargeUp** | `ESAD CHRG` | Транзит `Safe → Armed` на платах з конденсатором (заряджання 1–3 с). Якщо заряд застряг — авто-повернення у `Safe` через ~10 с. |
| **Armed** | `ESAD !ARM` | Заряджено. Команда `Fire` ініціює постріл. Імпакт-детектор активний. |
| **Fired** | `ESAD !FIR` | Постріл відбувся. **Термінальний стан** — повернення лише через перезавантаження пристрою. |
| **SafetyPin** | `ESAD PIN.` | Зарезервовано: фізичний запобіжник вставлено. Поточні плати цей стан не повідомляють. |

---

## Захисні таймери / Safety timers

SmartESAD веде два **незалежні** таймери:

| Таймер / Timer | За замовч. / Default | Призначення / Purpose |
|---|---|---|
| **Timer** (pre-arm countdown) | 420 с (7 хв) | Мандатний час між командою `Timer` і станом `Safe`. **Не скасовується** командою `Cold` (правило R1). |
| **Self-destruct** | 7200 с (2 год) | Час від `Safe` до автоматичного пострілу. Failure-mode-of-last-resort: пристрій, що перетнув лінію бойового зіткнення, не має лишитися у руках супротивника. |

Обидва налаштовуються через CLI (`kiwi_esad set timer` /
`kiwi_esad set destruct_delay`), зберігаються у флеш пристрою командою
`kiwi_esad save` і переживають перезавантаження.

---

## Налаштування пристрою / Device persistent settings

Зберігаються у флеші **пристрою** (не польотного контролера) у
двосторінковому буфері з CRC-32. При пошкодженні — fallback на
заводські значення, ніколи на `Armed`. Змінюються через
`kiwi_esad set <name> <N>` + `kiwi_esad save` (див.
[довідник команд](#довідник-cli-команд--cli-command-reference)).

Stored in the **device's** flash (not the FC). On corruption the device
falls back to compiled defaults — never to `Armed`.

| Параметр / Setting | Діапазон / Range | За замовч. / Default | Опис / Purpose |
|---|---|---|---|
| `timer` | 1…65535 с | 420 | Pre-arm countdown (`Timer` → `Safe`) |
| `destruct_delay` | 2…65535 с | 7200 | Self-destruct: час від `Safe` до автопострілу. Має бути > `timer`. |
| `impact_threshold` | 50…32767 | 120 (~15 g) | Поріг імпакт-пострілу в стані `Armed` (метрика \|a\|²×64) |
| `takeoff_required` | 0 / 1 | 0 | `Arm` приймається лише після детекції зльоту акселерометром (AOP-4187 §3.1.2.d) |
| `safe_on_lostconnection` | 0 / 1 | 0 | Автодемоція `Timer/Safe/Armed → Cold` після ~1 с тиші на UART |
| `det_check` | 0 / 1 | 1 | Перевірка цілісності ланцюга підривника перед `Arm` (плати з det-check апаратурою) |
| `accel_rate` | 400 / 800 / 1600 / 3300 Гц | 400 | Частота семплування акселерометра. Застосовується після `save` (перезавантаження пристрою). |

Опційний імпакт-постріл працює завжди, коли пристрій у стані `Armed`:
акселерометр виявляє удар понад поріг і пристрій переходить
`Armed → Fired` без серійної команди.

---

## Швидке налаштування / Quick setup

### 1. Підключення / Wiring

Один UART (TX, RX, GND) від польотного контролера до ESAD:

- FC TX → ESAD RX
- FC RX → ESAD TX
- спільний GND

Швидкість фіксована: **57600 8N1**, без апаратного потоку.

### 2. CLI у Betaflight

```text
# Призначити UART для SmartESAD (приклад: UART1 = serial 0)
serial 0 1048576 57600 57600 0 57600

# Налаштування пристрою (зберігаються у флеші ESAD)
kiwi_esad deactivate
kiwi_esad set timer 420
kiwi_esad set destruct_delay 7200
kiwi_esad set impact_threshold 120
kiwi_esad set takeoff_required 0
kiwi_esad set safe_on_lostconnection 0
kiwi_esad save
kiwi_esad activate

# Налаштування польотного контролера
set kiwi_esad_poll_interval_ms = 100
set kiwi_esad_fault_threshold = 3
set kiwi_esad_activate_on_boot = 0
set kiwi_esad_activation_delay_s = 0

# Позиція OSD елементів
set kiwi_osd_esad_status_pos = 2242
set kiwi_osd_esad_debug_pos  = 2498   # 2498 = bottom-left; 341 = hidden

# Перемикачі RC
aux 1 57 2 1725 2100 0 0     # ATAK on AUX3 — momentary, OR logic, no link
aux 2 58 3 1725 2100 0 0     # FIRE on AUX4 — momentary, OR logic, no link

save
```

Формула позиції OSD: `pos = x + (y * 32) + 2048` (2048 = видимий у
профілі 1). Значення `341` ховає елемент.

> **Примітка про маску `serial`**: у прошивках гілки 2025.12
> `FUNCTION_KIWI_ESAD = 1048576` (біт 20). У збірках на базі 2026.6+
> маска змінена на `2097152` (біт 21), а permanentId боксів зсунуто
> 56/57/58/62 → 57/58/59/63.

### 3. Betaflight Configurator

1. **Ports** → оберіть UART і увімкніть KIWI ESAD.
2. **Modes** → призначте KIWI ESAD ACTIVE / ATAK / FIRE на перемикачі пульта.
3. **OSD** → розмістіть елемент ESAD Status на екрані.

---

## Перемикачі RC / RC mode boxes

Бокси спрацьовують **по фронту** (edge-triggered): на кожному
rising/falling фронті прошивка один раз відправляє відповідну команду.
Між подіями FC опитує стан пристрою кожні `kiwi_esad_poll_interval_ms`.

Boxes are edge-triggered: each rising/falling edge emits the command
once; between events the FC polls device state.

| Бокс / Box | permanentId | Фронт / Edge | Команда / Emits | Потрібний стан пристрою / Device state |
|---|---|---|---|---|
| KIWI ESAD ACTIVE | 56 | rising | `Timer` (`TIMR`) | Cold |
| KIWI ESAD ATAK | 57 | rising | `Arm` (`ARM!`) | Safe |
| KIWI ESAD ATAK | 57 | falling | `Cold` (`COLD`) | будь-який крім Deactivated |
| KIWI ESAD FIRE | 58 | rising | `Fire` (`FIRE`) | Armed (FC додатково блокує Fire, поки стан ≠ Armed) |
| KIWI ESAD CFG | 62 | rising | `Deactivate` (`DACT`) | будь-який крім Fired |
| KIWI ESAD CFG | 62 | falling | `Activate` (`ACTV`) | Deactivated |

Приклад прив'язки (FC ARM на AUX1, ESAD на AUX2/3/4, CFG на AUX5):

```text
aux 0  0 0 1300 2100 0 0     # FC ARM           on AUX1
aux 1 56 1 1725 2100 0 0     # KIWI ESAD ACTIVE on AUX2
aux 2 57 2 1725 2100 0 0     # KIWI ESAD ATAK   on AUX3
aux 3 58 3 1725 2100 0 0     # KIWI ESAD FIRE   on AUX4
aux 4 62 4 1725 2100 0 0     # KIWI ESAD CFG    on AUX5 (ON=DACT, OFF=ACTV)
save
```

Формат: `aux <slot> <permanentId> <auxChannel_0based> <startUs> <endUs>
<modeLogic> <linkedTo>`. Поріг 1725 мкс дає мертву зону вище середини
стіка.

**Двоключовий інтерлок / two-key interlock**: прив'яжіть FIRE так, щоб
він працював лише коли ATAK теж активний — останнє поле `57` у рядку
FIRE:

```text
aux 3 58 3 1725 2100 0 57    # FIRE діє лише поки ATAK (57) теж HIGH
```

Рекомендовано для бойового спорядження. Recommended for live ordnance.

**CFG-бокс** (maintenance): поки утримується HIGH, FC призупиняє
автоактиваційні цикли, щоб оператор міг заливати налаштування
(`kiwi_esad set …`, `kiwi_esad save`) навіть при
`kiwi_esad_activate_on_boot = 1`. Автоцикли поновлюються після disarm
польотного контролера.

---

## Налаштування польотного контролера / FC-side settings

Звичайні змінні Betaflight CLI (`set <name> = <value>`, потім `save`):

| Змінна / Setting | Діапазон / Range | За замовч. / Default | Опис / Purpose |
|---|---|---|---|
| `kiwi_esad_poll_interval_ms` | 20…1000 | 100 | Період опитування стану пристрою (keep-alive) |
| `kiwi_esad_fault_threshold` | 1…50 | 3 | Кількість пропущених відповідей поспіль до статусу `ESAD LOST` |
| `kiwi_esad_activate_on_boot` | 0 / 1 | 0 | Автоматично відправити `Timer` щойно з'явився зв'язок; тримається доки пристрій не повернеться у Cold |
| `kiwi_esad_activation_delay_s` | 0…600 | 0 | FC-side вікно відміни: при ARM польотника — countdown на OSD, потім авто-`Timer`. 0 = вимкнено |
| `kiwi_esad_expected_identifier` | рядок ≤ 4 | "" | Перевірка ідентифікатора пристрою для boot-latch |
| `kiwi_osd_esad_status_pos` | — | — | Позиція основного OSD елемента стану |
| `kiwi_osd_esad_debug_pos` | — | 341 (сховано) | Позиція діагностичного OSD рядка (телеметрія: det-check, напруги, peak-metric) |

### Таблиця автоактивації / Auto-activation matrix

| `activate_on_boot` | `activation_delay_s` | Поведінка / Behaviour |
|---|---|---|
| 0 | 0 | Повністю ручне керування (бокси / CLI). Найсуворіший контроль — за замовчуванням. |
| 0 | >0 | ARM польотника → countdown на OSD → авто-`Timer`. Disarm → `Cold`. |
| 1 | 0 | Залочено з увімкнення: щойно зв'язок живий, FC відправляє `Timer` і не заважає далі. |
| 1 | >0 | Обидва шляхи працюють одночасно. |

---

## Довідник CLI команд / CLI command reference

Прошивка KIWI має вбудовану CLI команду `kiwi_esad` для керування та
діагностики пристрою прямо з CLI Betaflight (Configurator → CLI, або
термінал на USB-порту, 115200, символ `#` вмикає CLI).

The KIWI firmware ships a `kiwi_esad` CLI command for driving and
debugging the device straight from the Betaflight CLI.

### Команди стану / Status commands

| Команда / Command | Дія / Effect |
|---|---|
| `kiwi_esad` або `kiwi_esad status` | Повний рантайм-статус: стан, залишок таймера, зв'язок, останній фаулт, версія прошивки пристрою, фази автоактивації, телеметрія (det_check, напруги, peak-metric). |
| `kiwi_esad settings` | Живий запит `GetSettings` до пристрою (~100 мс). Друкує блок готових `kiwi_esad set …` рядків — можна скопіювати з однієї плати і вставити на іншу. |

Приклад виводу `kiwi_esad status`:

```text
# kiwi_esad status
state: COLD
remaining_secs: 420
status_byte: 0x01
det_check_ok: yes
pin_present: no
vcap_mv: 0
vbat_mv: 12600
peak_metric: 64
link_alive: yes
misses: 0
last_fault: code=0x00 subcode=0x00
firmware_version: 0x01010000
reset_cause: 0x00
auto_phase: IDLE
countdown_remaining_ms: 0
boot_phase: DISABLED
cfg_mode: off
```

Поля / Fields:

| Поле / Field | Значення / Meaning |
|---|---|
| `state` | Поточний стан пристрою: `UNKNOWN`, `START`, `COLD`, `TIMER`, `SAFE`, `CHARGE_UP`, `ARMED`, `FIRED`, `FAULT`, `DEACTIVATED`, `SAFETY_PIN` |
| `remaining_secs` | Залишок активного countdown (pre-arm або self-destruct, залежно від стану) |
| `configured_timer_s` | (лише у DEACTIVATED) значення таймера, з яким `Activate` продовжить роботу |
| `det_check_ok` | Ланцюг підривника цілий (плати з det-check) |
| `vcap_mv` / `vbat_mv` | Напруга конденсатора пострілу / батареї, мВ. `0` = немає апаратури |
| `peak_metric` | Пікова метрика прискорення \|a\|²×64 від останнього `Arm` (~64 = 1 g спокою; кліпується на ±16 g) |
| `link_alive` / `misses` | Стан UART-зв'язку і лічильник пропущених відповідей |
| `last_fault` | **Останній** побачений фаулт (липкий, діагностичний) — не поточний стан. Розшифровку див. у [довіднику фаултів](#довідник-фаултів--fault-code-reference) |
| `firmware_version` | Версія прошивки пристрою (u32; `0x01010000` = v1.1.0.0) |
| `auto_phase` / `boot_phase` / `cfg_mode` | Стан FC-side автоактиваційних циклів і CFG-режиму |

### Команди керування / Action commands

Кожна команда чекає відповідь пристрою до 500 мс і друкує результат:

```text
-> OK  state: TIMER  fault: 0x00/0x00
```

| Результат / Result | Значення / Meaning |
|---|---|
| `OK` | Пристрій відповів нормальним стан-кадром |
| `FAULT` | Пристрій відповів `StateFault` — причина у `fault: 0xCC/0xSS` |
| `TIMEOUT` | Запит відправлено, відповіді немає протягом 500 мс |
| `BUSY` | Не вдалося відправити (порт зайнятий попереднім запитом) |

| Команда / Command | Wire cmd | Потрібний стан / Required state | Дія / Effect |
|---|---|---|---|
| `kiwi_esad version` | `Version` | будь-який | Хендшейк. Перший `Version` після ввімкнення переводить пристрій Start → Deactivated. |
| `kiwi_esad activate` | `Activate` (`ACTV`) | Deactivated | Вихід з maintenance у Cold. |
| `kiwi_esad deactivate` | `Deactivate` (`DACT`) | будь-який крім Fired | Вхід у maintenance (CFG). Скидає countdown до налаштованих значень і всі firing-затвори. |
| `kiwi_esad timer` | `Timer` (`TIMR`) | Cold | Старт pre-arm countdown. |
| `kiwi_esad cold` | `Cold` (`COLD`) | будь-який крім Deactivated | Повернення у Cold. Запущений countdown **продовжує тикати** (правило R1). З Deactivated відхиляється — використовуйте `activate`. |
| `kiwi_esad safe` | — | — | Псевдонім `cold` (ті самі байти на дроті). |
| `kiwi_esad disarm` | — | — | Псевдонім `cold`. |
| `kiwi_esad arm` | `Arm` (`ARM!`) | Safe | Озброєння. На платах з конденсатором — через транзит ChargeUp. |
| `kiwi_esad fire` | `Fire` (`FIRE`) | Armed | Постріл. Термінальний. |

### Команди налаштувань / Settings commands

`set` пише значення у RAM пристрою; **зберігає лише** `kiwi_esad save`.
Пристрій приймає `set`/`save` у станах **Cold або Deactivated**
(`save` — Safe або Deactivated).

`set` writes device RAM; only `kiwi_esad save` persists. Accepted in
Cold / Deactivated.

| Команда / Command | Діапазон / Range | Дія / Effect |
|---|---|---|
| `kiwi_esad set timer <N>` | 1…65535 с | Pre-arm countdown |
| `kiwi_esad set destruct_delay <N>` | 2…65535 с | Self-destruct таймер |
| `kiwi_esad set impact_threshold <N>` | 50…32767 | Поріг імпакт-пострілу |
| `kiwi_esad set takeoff_required <0\|1>` | 0/1 | `Arm` лише після детекції зльоту |
| `kiwi_esad set safe_on_lostconnection <0\|1>` | 0/1 | Автодемоція у Cold при втраті зв'язку |
| `kiwi_esad set det_check <0\|1>` | 0/1 | Перевірка цілісності ланцюга підривника |
| `kiwi_esad set accel_rate <N>` | 400, 800, 1600, 3300 | Частота акселерометра (застосовується після `save`) |
| `kiwi_esad save` | — | Запис у флеш пристрою. Пристрій м'яко перезавантажується (~50 мс): `-> OK  saved, device rebooting (~50 ms)` |

Якщо `set`/`save` відхилено з `fault: 0x06/0x01` (WrongState), CLI
підкаже правильний шлях:

```text
tip: Set/Save accept state in {Safe, Deactivated}. Use
`kiwi_esad deactivate` to enter CFG, push, then `kiwi_esad activate`.
```

### Приклад повної сесії / Full bench session

```text
# kiwi_esad status
state: COLD  remaining_secs: 7
link_alive: yes  misses: 0
...

# kiwi_esad timer
-> OK  state: TIMER  fault: 0x00/0x00

# kiwi_esad status
state: SAFE  remaining_secs: 7189

# kiwi_esad arm
-> OK  state: ARMED  fault: 0x00/0x00

# kiwi_esad fire
-> OK  state: FIRED  fault: 0x00/0x00
```

---

## Довідник фаултів / Fault code reference

`last_fault: code=0xCC subcode=0xSS` у виводі `kiwi_esad status` та
`fault: 0xCC/0xSS` після команд. Код липкий — тримає **останню**
причину відмови, а не поточний стан.

Top-level codes:

| Код / Code | Назва / Name | Значення / Meaning |
|---|---|---|
| `0x00` | (none) | Немає фаултів |
| `0x01` | BadCrc | CRC-16 кадру не зійшовся |
| `0x02` | BadVersion | Байт версії кадру ≠ `0x01` — несумісна прошивка FC або пристрою |
| `0x03` | UnknownCommand | Невідомий байт команди (напр., нова команда до старої прошивки пристрою) |
| `0x04` | BadMagic | Невірний 4-байтовий ASCII-код команди (напр., FC зі старим протоколом v1.0) |
| `0x05` | BadLength | Довжина payload не відповідає специфікації команди |
| `0x06` | PreconditionFailed | Умови не виконані — справжня причина у subcode, див. нижче |
| `0x07` | InternalError | Внутрішня помилка кодека / машини станів пристрою |

Subcodes для `PreconditionFailed` (0x06):

| Subcode | Назва / Name | Значення / Meaning |
|---|---|---|
| `0x01` | WrongState | Команда не дозволена у поточному стані (напр., `arm` з Cold) |
| `0x02` | InArmLow | `Arm` відхилено — GPIO IN_ARM низький (плати з co-sign) |
| `0x03` | InBlastLow | `Fire` відхилено — GPIO IN_BLAST низький (плати з co-sign) |
| `0x04` | TimerRunning | Операція заблокована — pre-arm countdown ще тикає |
| `0x05` | SelfDestructRunning | Операція заблокована — self-destruct countdown тикає |
| `0x06` | OutOfBounds | Значення `set` поза діапазоном, або порушено інваріант `destruct_delay > timer` |
| `0x07` | PreLaunchNotDetected | `Arm` відхилено — `takeoff_required=1`, а зльоту ще не зафіксовано. OSD: `ESAD NOLT` |
| `0x08` | DetCheckOpen | `Arm` відхилено — ланцюг підривника розімкнутий. OSD: `ESAD NODT` |

---

## OSD-індикація / OSD display

Основний елемент (`kiwi_osd_esad_status_pos`), 9 символів:

| Умова / Condition | Текст / Text |
|---|---|
| Зв'язку ще не було | `ESAD....?` (анімований `?`) |
| Зв'язок був і зник (misses ≥ `fault_threshold`) | `ESAD LOST` |
| Хендшейк | `ESAD INIT` |
| Cold, без countdown | `ESAD COLD` |
| Cold, countdown ще тикає (R1) | `COLD T-NNN` |
| Timer | `ESAD T-NN` / `ESD T-NNN` / `ESDT-NNNN` (префікс скорочується зі зростанням цифр) |
| Safe | `ESAD SAFE` ↔ `SD T-NNNN` чергуються з частотою 1 Гц. Чергування — сигнал безпеки: оператор кожні пів секунди бачить і стан, і SD-countdown до автономного пострілу. |
| ChargeUp | `ESAD CHRG` ↔ `SD T-NNNN` (1 Гц) |
| Armed | `ESAD !ARM` ↔ `SD T-NNNN` (1 Гц, обидві половини без блимання) |
| Fired | `ESAD !FIR` (блимає 4 Гц) |
| Fault | `ESAD F-NN` (hex-код фаулту) |
| Deactivated | `ESAD CFG.` |
| SafetyPin (зарезервовано) | `ESAD PIN.` |
| Останній `Arm` відхилено DetCheckOpen | `ESAD NODT` (блимає 4 Гц; тримається до успішного Arm або скидання хендшейком) |
| Останній `Arm` відхилено PreLaunchNotDetected | `ESAD NOLT` (блимає 4 Гц; та сама логіка) |
| FC-side activation countdown | `ESAD T-NN` (перекриває стан пристрою) |

Діагностичний рядок (`kiwi_osd_esad_debug_pos`, за замовчуванням
схований) показує телеметрію: `ED+ V24.1 B12.4 P- M64` — det-check,
напруга конденсатора, напруга батареї, шунт-пін, peak-metric
акселерометра. Для стендів і демонстрацій; у польових збірках ховайте
(`341`).

---

## Поведінка при втраті зв'язку / Failsafe & link-loss

- **Disarm польотника** повертає пристрій у безпечний стан (якщо
  boot-latch не активний). Запущені countdown при цьому не
  скасовуються — правило R1.
- **FC-side watchdog**: misses ≥ `kiwi_esad_fault_threshold` → OSD
  `ESAD LOST`, стан UNKNOWN. Опитування продовжується; перша успішна
  відповідь відновлює все.
- **Device-side `safe_on_lostconnection`**: коли увімкнено, пристрій
  сам демотує `Timer`/`Safe`/`Armed` → `Cold` після ~1 с тиші від FC.
- **Регресія стану** (перезавантаження пристрою, стан впав нижче
  попереднього): FC скидає автоактиваційні затвори — оператор мусить
  явно повторити послідовність озброєння.
- **FC ніколи не стріляє сам.** Прошивка лише передає намір оператора;
  фінальний гейт пострілу — власна логіка пристрою.

---

## Діагностика / Troubleshooting

Усе через CLI Betaflight (Configurator → CLI). Перший крок завжди —
`kiwi_esad status`.

| Симптом / Symptom | Причина і рішення / Fix |
|---|---|
| OSD: `ESAD....?` назавжди, `kiwi_esad status` показує `link_alive: no`, `state: UNKNOWN` | TX/RX переплутано — поміняйте місцями. Перевірте спільний GND і що обрано правильний UART у `serial`. |
| OSD: `ESAD LOST` через кілька секунд після старту | Зв'язок був і зник: кабель, живлення пристрою або його зависання. `kiwi_esad status` → дивіться `misses`. Пересадіть роз'єм. |
| `kiwi_esad: command not found` | Прошивка без підтримки ESAD CLI — оновіться на актуальну KIWI прошивку. |
| `set kiwi_esad_* = …` → unknown setting | Прошивка зібрана без `USE_KIWI_ESAD` — це не KIWI збірка. |
| `set kiwi_esad_arm_delay` / `kiwi_esad_sd_delay` не існують | Застаріла інструкція: ці параметри переїхали у флеш пристрою. Використовуйте `kiwi_esad set timer …` / `kiwi_esad set destruct_delay …` + `kiwi_esad save`. |
| `-> TIMEOUT` після кожної команди | Пристрій не відповідає: перевірте живлення ESAD і проводку; `kiwi_esad status` → `link_alive`. |
| `-> BUSY` | Попередній запит ще у польоті — зачекайте пів секунди і повторіть. |
| `-> FAULT … 0x04/…` (BadMagic) | Несумісні версії протоколу FC ↔ пристрій (напр., прошивка пристрою старша за v1.1). Оновіть прошивку пристрою. |
| `-> FAULT … 0x06/0x01` (WrongState) після `arm` | Пристрій ще у TIMER — дочекайтеся стану SAFE (`kiwi_esad status`) і повторіть. |
| `-> FAULT … 0x06/0x01` після `set`/`save` | Пристрій не у Cold/Deactivated. Шлях: `kiwi_esad deactivate` → `set …` → `save` → `activate`. |
| `-> FAULT … 0x06/0x06` (OutOfBounds) | Значення поза діапазоном, або `destruct_delay ≤ timer`. Спершу підніміть `destruct_delay`. |
| `-> FAULT … 0x06/0x08`, OSD `ESAD NODT` | Ланцюг підривника розімкнутий — перевірте лінії і контакт. Для стенду без підривника: `kiwi_esad deactivate` → `kiwi_esad set det_check 0` → `save` → `activate`. |
| OSD `ESAD NOLT`, `-> FAULT … 0x06/0x07` | `takeoff_required=1`, а зльоту не було. Для стенду: `kiwi_esad set takeoff_required 0` (у Cold/Deactivated) + `save`. |
| OSD `ESAD CHRG` висить > 5 с | Заряд конденсатора застряг (низька батарея, несправність). Пристрій сам повернеться у SAFE через ~10 с; повторіть `arm`. |
| OSD `ESAD PIN.` | Зарезервований стан фізичного запобіжника. Поточні плати його не повідомляють — якщо бачите, вважайте пристрій механічно заблокованим і огляньте апаратуру. |
| Бокс ACTIVE не діє | Бокс не прив'язаний — перевірте `aux` (permanentId 56) і вкладку Modes. |
| Команди боксів ігноруються, OSD `ESAD CFG.` | Пристрій у Deactivated (CFG-бокс тримається HIGH?). Опустіть CFG-бокс або `kiwi_esad activate`. |
| `kiwi_esad settings` → `GetSettings timed out` | Те саме, що TIMEOUT: немає зв'язку з пристроєм. |
| Налаштування «не збереглися» після перезавантаження | Забули `kiwi_esad save` — `set` пише лише у RAM пристрою. |

### Прослуховування шини / Sniffing the wire

Для глибокої діагностики можна дивитися сирі кадри:

1. **Зовнішній USB-TTL адаптер** паралельно на лінію TX або RX (спільний
   GND) — FC продовжує працювати з ESAD, ви бачите трафік.
2. **`serialpassthrough`**: звільніть порт і прокиньте його на USB:

   ```text
   serial 0 0 57600 57600 0 57600     # зняти FUNCTION_KIWI_ESAD з UART1
   save
   # після перезавантаження:
   serialpassthrough usart1 57600
   ```

   Зверніть увагу: `serialpassthrough` приймає **ім'я порту**
   (`usart1`, `usart2`…), а не числовий індекс. Поверніть функцію
   назад (`serial 0 1048576 …` + `save`) після діагностики.

---

## Протокол / Protocol summary

| Параметр / Property | Значення / Value |
|---|---|
| Транспорт / Transport | UART, 57600 8N1, без потоку |
| Кадр / Frame | `AA 55 VER CMD SEQ LEN DATA[…] CRC_hi CRC_lo` |
| Цілісність / Integrity | CRC-16-CCITT-FALSE (poly `0x1021`, init `0xFFFF`); тест-вектор `crc16("123456789") == 0x29B1` |
| Replay-захист / Replay protection | 8-бітний seq nonce, відповідь повертає `(seq+1) mod 256` |
| Каденс / Cadence | FC опитує кожні `poll_interval_ms` (за замовч. 100 мс = 10 Гц); пристрій відповідає за ~10 мс |
| Boot-handshake | Пристрій після ввімкнення мовчить; FC надсилає `Version` (Start → Deactivated), потім `Activate` (→ Cold) |
| Безпекові команди / Safety commands | Кожна має власний 4-байтовий ASCII-код: `COLD`, `TIMR`, `ARM!`, `FIRE`, `DACT`, `ACTV`, `SAV!` |
| Config-команди / Config commands | `SetTimer`, `SetSelfDestructDelay`, `SetImpactThreshold`, `SetTakeoffRequired`, `SetSafeOnLostLink`, `SetDetCheckEnabled`, `SetAccelRate`, `SaveSettings`, `GetSettings` |
| Версія пристрою / Device firmware | `StateStart` повертає `FW_VERSION` (u32 BE; v1.1.0.0 = `0x01010000`) |

---

## Сумісні плати / Compatible boards

SmartESAD вбудовано у прошивку KIWI Betaflight для всіх плат KIWI:

- [KIWI F405 6S](02.1-kiwif405-6s.md)
- [KIWI F405 12S](02.2-kiwif405-12S.md)
- [KIWI F722](02.3-kiwif722.md)
- [KIWI H743](02.4-kiwih743.md)

---

## Стандарти / Standards

SmartESAD спроектовано на принципах:

- **MIL-STD-1316F** — Fuze Design Safety Criteria (DoD)
- **STANAG 4560 ed 3** — EED Assessment & Test Methods (NATO)
- **NAWCWD TP 8504** — Design Methodology for Safe and Arm Devices (US Navy)
- **AOP-4187 Ed A v1** — Fuzing System Safety Design (NATO)

Це не сертифікація; зазначені стандарти — джерело правил дизайну.
Цільовий ризик передчасного озброєння — менше 1 на 1 000 000 пристроїв
(`MIL-STD-1316F §4.3`).
