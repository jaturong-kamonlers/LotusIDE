// ============================================================
// LotusDueBot board header
// Target: Arduino Due (SAM3X8E) + Lotus shield
//   - 6×TB6612FNG motor drivers (12 dir + 6 PWM)
//   - 9 servos
//   - 4 quadrature encoders (all 4 IN-pairs are interrupt-capable on Due)
//   - 2 start buttons, 1 buzzer
//   - 1.8" TFT (ST7735, software SPI on D10/D12/D4/D13/D33)
//   - I2C (HMC5883L + MPU6050)
//   - microSD (CS=D15)
//   - 3× hardware Serial
// Pin map per shield datasheet
// ============================================================
#ifndef _LOTUSDUEBOT_H_
#define _LOTUSDUEBOT_H_

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
// Use bundled LotusServo (TC1 ch0) instead of platform's <Servo.h> (TC2-based)
// — platform Servo seizes timer channels that would conflict with motor PWM on
// pins D2/D3/D5/D6/D7/D8.
#include "LotusServo.h"

// ============== Start buttons ==============
#define _SW1  22
#define _SW2  23

// ============== Servos ×9 (D24..D32) ==============
#define _servo1 24
#define _servo2 25
#define _servo3 26
#define _servo4 27
#define _servo5 28
#define _servo6 29
#define _servo7 30
#define _servo8 31
#define _servo9 32

// ============== Motor driver TB6612FNG ×3 (6 channels) ==============
// Direction pins (datasheet)
#define M1A 37
#define M1B 36
#define M2A 35
#define M2B 34
#define M3A 40
#define M3B 41
#define M4A 39
#define M4B 38
#define M5A 44
#define M5B 45
#define M6A 43
#define M6B 42

// PWM pins (Due has hardware PWM on D2..D13)
#define PWM1 3
#define PWM2 2
#define PWM3 6
#define PWM4 5
#define PWM5 8
#define PWM6 7

// ============== Encoders ×4 (Due: every digital pin is interrupt-capable) ==============
#define _ENC1_A 46
#define _ENC1_B 47
#define _ENC2_A 48
#define _ENC2_B 49
#define _ENC3_A 50
#define _ENC3_B 51
#define _ENC4_A 52
#define _ENC4_B 53

// ============== Buzzer / Knob ==============
#define _BZ   14
#define _knob A11        // potentiometer
// Sensor PWM extra (D9) — exposed as a generic PWM output
#define SENSOR_PWM_OUT 9
// Generic digital sensor / SD CS shared on D15
#define SD_CS 15

// ============== TFT 1.8" (ST7735) — software SPI ==============
// The shield routes TFT through plain digital pins (not the Due hardware SPI
// header), so we drive it with software SPI for maximum portability.
#define TFT_SCK   12
#define TFT_MOSI  10
#define TFT_MISO  11   // not used by ST7735 but reserved by the shield
#define TFT_CS    4
#define TFT_DC    13   // labelled A0/RS on the LCD
#define TFT_RST   33

// ============== Helpers / typedefs ==============
typedef int Number;
typedef int Boolean;

#include "nano_motor.h"
#include "nano_servo.h"
#include "nano_encoder.h"
#include "Move4ch.h"

// ============== TFT object (ST7735 1.8", software SPI) ==============
#include "Adafruit_ST7735.h"
// Constructor signature: (cs, dc, mosi, sck, rst)
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCK, TFT_RST);

// Common color shortcuts for blocks
#define COLOR_BLACK   ST77XX_BLACK
#define COLOR_WHITE   ST77XX_WHITE
#define COLOR_RED     ST77XX_RED
#define COLOR_GREEN   ST77XX_GREEN
#define COLOR_BLUE    ST77XX_BLUE
#define COLOR_YELLOW  ST77XX_YELLOW
#define COLOR_CYAN    ST77XX_CYAN
#define COLOR_MAGENTA ST77XX_MAGENTA
#define COLOR_ORANGE  ST77XX_ORANGE

// Wait for a start button. sw = 1 → SW1 (D22), sw = 2 → SW2 (D23)
void waitButton(uint8_t sw) {
    uint8_t pin = (sw == 2) ? _SW2 : _SW1;
    pinMode(pin, INPUT_PULLUP);
    while (digitalRead(pin) == HIGH) { delay(10); }
    while (digitalRead(pin) == LOW)  { delay(10); }
}

// Backwards-compatible: wait for SW1
inline void wait() { waitButton(1); }

// Software tone() for SAM3X8E — Due core ships Tone.cpp.disabled so the
// symbol is missing at link time. Bit-bang the pin via delayMicroseconds()
// (blocking; fine for short buzzer beeps).
inline void tone(uint8_t pin, unsigned int frequency, unsigned long duration_ms) {
    pinMode(pin, OUTPUT);
    if (frequency == 0) { digitalWrite(pin, LOW); return; }
    unsigned long half_us = 500000UL / frequency;
    unsigned long cycles  = (unsigned long)frequency * duration_ms / 1000UL;
    if (cycles == 0) cycles = 1;
    for (unsigned long i = 0; i < cycles; i++) {
        digitalWrite(pin, HIGH);
        delayMicroseconds(half_us);
        digitalWrite(pin, LOW);
        delayMicroseconds(half_us);
    }
}
inline void noTone(uint8_t pin) { pinMode(pin, OUTPUT); digitalWrite(pin, LOW); }

// Buzzer helpers
inline void beep() { tone(_BZ, 1000, 100); delay(150); }
inline void soundmega(int f, int ms) { tone(_BZ, f, ms); delay(ms + 50); }

// Map helper for the "Map Lotus" block
inline int map_func(int v1, int v2, int v3, int v4, int v5) {
    return map(v1, v2, v3, v4, v5);
}

#endif // _LOTUSDUEBOT_H_
