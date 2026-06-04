// ============================================================
// LotusMegaBot++ board header
// Target: ATmega2560 + Lotus shield with TFT 1.8", 6×TB6612FNG,
//         9 servos, 2 encoders, 2 start buttons, buzzer
// Pin map per shield datasheet (Stage 1: motors/servos/buttons/buzzer)
// ============================================================
#ifndef _LOTUSMEGABOTPLUS_H_
#define _LOTUSMEGABOTPLUS_H_

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include "Servo.h"

// ============== Motor driver TB6612FNG ×6 ==============
// Direction pins
#define M1A 44
#define M1B 45
#define M2A 10
#define M2B 11
#define M3A 12
#define M3B 13
#define M4A 14
#define M4B 15
#define M5A 22
#define M5B 23
#define M6A 24
#define M6B 25

// PWM pins
#define PWM1 8
#define PWM2 9
#define PWM3 4
#define PWM4 5
#define PWM5 6
#define PWM6 7

// ============== Servos ×9 ==============
#define _servo1 26
#define _servo2 27
#define _servo3 28
#define _servo4 29
#define _servo5 30
#define _servo6 31
#define _servo7 32
#define _servo8 33
#define _servo9 34

// ============== Buzzer / Buttons / Knob ==============
#define _BZ   36
#define _SW1  35
#define _SW2  37
#define _knob A15

// ============== Encoder ×2 ==============
// Encoder 1: D2 (INT0) / D3 (INT1)
// Encoder 2: D18 (INT5) / D19 (INT4)  — conflicts with Serial1 if enabled
#define _ENC1_A 2
#define _ENC1_B 3
#define _ENC2_A 18
#define _ENC2_B 19

// ============== TFT 1.8" (ST7735) — Stage 3 ==============
#define TFT_SCK   52
#define TFT_MOSI  51
#define TFT_CS    42
#define TFT_DC    43
#define TFT_RST   38

// ============== Digital sensor / IO pins ==============
#define SENSOR1 39
#define SENSOR2 40
#define SENSOR3 41
#define SENSOR4 46
#define SENSOR5 47
#define SENSOR6 48
#define SENSOR7 49

// ============== Helpers / typedefs ==============
typedef int Number;
typedef int Boolean;

#include "nano_motor.h"
#include "nano_servo.h"
#include "nano_encoder.h"

// ============== TFT object (ST7735 1.8", HW SPI) ==============
#include "Adafruit_ST7735.h"
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);

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

// Wait for either start button. sw = 1 → SW1 (D35), sw = 2 → SW2 (D37)
void waitButton(uint8_t sw) {
    uint8_t pin = (sw == 2) ? _SW2 : _SW1;
    pinMode(pin, INPUT_PULLUP);
    while (digitalRead(pin) == HIGH) { delay(10); }
    while (digitalRead(pin) == LOW)  { delay(10); }
}

// Backwards-compatible: wait for SW1
inline void wait() { waitButton(1); }

// Buzzer helpers
inline void beep() { tone(_BZ, 1000, 100); delay(150); }
inline void soundmega(int f, int ms) { tone(_BZ, f, ms); delay(ms + 50); }

// Map helper for the "Map Lotus" block
inline int map_func(int v1, int v2, int v3, int v4, int v5) {
    return map(v1, v2, v3, v4, v5);
}

#endif // _LOTUSMEGABOTPLUS_H_
