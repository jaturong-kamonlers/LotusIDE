# Third-Party Notices for Lotus IDE

Lotus IDE incorporates third-party open-source components. Each component is
governed by its own license; the full license text for each is reproduced or
referenced below. This notice satisfies the attribution requirements of those
licenses.

Lotus IDE ใช้ส่วนประกอบโอเพนซอร์สของบุคคลที่สาม โดยแต่ละตัวอยู่ภายใต้ license
ของตนเอง เอกสารฉบับนี้แสดงประกาศและรายชื่อ license ทั้งหมดตามที่กำหนด

---

## 1. KBProIDE

- **Source:** https://github.com/MakerAsia/KBProIDE
- **Author:** tookit (MakerAsia)
- **License:** MIT License
- **Used for:** Reference and template for several Lotus IDE plugins and
  board definitions (notably the legacy plugin format under
  `plugins-converted/`, sensor/actuator block definitions, and some C++
  helper sources adapted from the KBIDE plugin ecosystem).

```
MIT License

Copyright (c) 2018-present tookit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. Arduino CLI

- **Source:** https://github.com/arduino/arduino-cli
- **License:** GNU General Public License, version 3 (GPL-3.0)
- **Used for:** Bundled compile/upload pipeline. Lotus IDE invokes
  `arduino-cli` as a separate executable process via `child_process.spawn`;
  it is not statically linked. Full license text ships at
  `resources/arduino-cli/LICENSE.txt`.

A full copy of the GPL-3.0 is available at:
https://www.gnu.org/licenses/gpl-3.0.txt

---

## 3. Electron

- **Source:** https://github.com/electron/electron
- **License:** MIT License
- **Copyright:** © Electron contributors, © GitHub Inc.

---

## 4. Vue.js

- **Source:** https://github.com/vuejs/core
- **License:** MIT License
- **Copyright:** © Evan You

---

## 5. Vuetify

- **Source:** https://github.com/vuetifyjs/vuetify
- **License:** MIT License
- **Copyright:** © John Leider

---

## 6. Blockly

- **Source:** https://github.com/google/blockly
- **License:** Apache License, Version 2.0
- **Copyright:** © Google LLC

A full copy of the Apache 2.0 license is available at:
https://www.apache.org/licenses/LICENSE-2.0.txt

---

## 7. Pinia

- **Source:** https://github.com/vuejs/pinia
- **License:** MIT License
- **Copyright:** © Eduardo San Martin Morote

---

## 8. node-serialport

- **Source:** https://github.com/serialport/node-serialport
- **License:** MIT License

---

## 9. electron-updater (electron-builder)

- **Source:** https://github.com/electron-userland/electron-builder
- **License:** MIT License
- **Copyright:** © electron-userland contributors

---

## 10. JSZip

- **Source:** https://github.com/Stuk/jszip
- **License:** MIT License
- **Copyright:** © Stuart Knightley, David Duponchel, Franz Buchinger,
  António Afonso

---

## 11. Material Design Icons (@mdi/font, @mdi/js)

- **Source:** https://github.com/Templarian/MaterialDesign
- **License:** Apache License, Version 2.0 (icons)
- **Font:** SIL Open Font License, Version 1.1

---

## 12. Vite, @vitejs/plugin-vue

- **License:** MIT License
- **Copyright:** © Evan You, Vite contributors

---

## 13. Arduino Toolchains (bundled in `resources/`)

Lotus IDE ships precompiled toolchains used by `arduino-cli`. These are the
upstream Arduino-distributed toolchains and retain their original licenses:

- **AVR-GCC toolchain (avr-gcc, avr-libc, avr-binutils):** GPL-2.0+, LGPL-2.1+
- **ESP32 Xtensa / RISC-V GCC toolchain:** GPL-3.0+ with GCC Runtime Library
  Exception
- **Arduino AVR Core:** LGPL-2.1+
- **Arduino ESP32 Core (Espressif Systems):** LGPL-2.1+

Full license texts ship inside the respective toolchain directories under
`resources/arduino-cli/`.

---

## 14. Arduino Libraries Bundled in Plugins and Boards

The following Arduino libraries are bundled as C++ source inside the
`plugins/` and `public/boards/*/include/` directories so that user sketches
compile out-of-the-box. Each retains its original license; user sketches that
include these libraries are bound by the respective terms.

| Library                  | Original Author      | License           |
|--------------------------|----------------------|-------------------|
| DallasTemperature        | Miles Burton et al.  | LGPL-2.1+         |
| OneWire                  | Paul Stoffregen      | MIT-like (custom) |
| Adafruit_GFX / SSD1306   | Adafruit Industries  | BSD 3-Clause      |
| Adafruit_BMP280 / BME280 | Adafruit Industries  | BSD 3-Clause      |
| BH1750                   | claws / community    | MIT               |
| DHT (sensor library)     | Adafruit / community | MIT               |
| HMC5883L                 | Korneliusz Jarzebski | GPL-3.0           |
| MPU6050                  | Korneliusz Jarzebski | GPL-3.0           |
| MLX90614                 | community / Adafruit | BSD-like          |
| Ultrasonic (HC-SR04)     | community            | MIT               |
| ESP32Servo               | Kevin Harrington     | LGPL-3.0          |
| Adafruit PCA9685         | Adafruit Industries  | BSD 3-Clause      |
| HuskyLens                | DFRobot              | MIT               |
| RTClib                   | Adafruit Industries  | MIT               |
| PMS (particulate sensor) | community            | MIT               |

If a library you find here is missing or its license has been misattributed,
please open an issue at:
https://github.com/jaturong-kamonlers/LotusIDE-Releases/issues

---

## 15. CH340 / CP210x / FTDI USB-Serial Drivers

The Windows installer bundles vendor-supplied USB-serial drivers. Each driver
remains the property and copyright of its original vendor (WCH, Silicon Labs,
FTDI) and is redistributed under the vendor's terms permitting end-user
deployment.

---

## Reporting Issues

If you believe an open-source component is used in a way that violates its
license, or if attribution here is incomplete or incorrect, please contact:

- jaturong9999@gmail.com
- https://github.com/jaturong-kamonlers/LotusIDE-Releases/issues

We will respond and remediate promptly.
