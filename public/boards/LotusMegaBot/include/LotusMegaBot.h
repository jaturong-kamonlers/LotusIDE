#ifndef LOTUSMEGABOT_H
#define LOTUSMEGABOT_H

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>

#include "Servo.h"
#include "Adafruit_GFX.h"
#include "Adafruit_SSD1306.h"

// Motor drive TB6612FNG — Channel A
#define AIN1  8
#define AIN2  9
#define PWMA  2
// Channel B
#define BIN1  10
#define BIN2  11
#define PWMB  3
// Channel Ab
#define AIN1b 12
#define AIN2b 13
#define PWMAb 4
// Channel Bb
#define BIN1b 14
#define BIN2b 15
#define PWMBb 5
// Channel Ac
#define AIN1c 16
#define AIN2c 17
#define PWMAc 6
// Channel Bc
#define BIN1c 22
#define BIN2c 23
#define PWMBc 7

#define _knob A15
#define _BT   53
#define _BZ   52

#include "nano_motor.h"

Adafruit_SSD1306 display(128, 64);

typedef int Number;
typedef int Boolean;

#define _servo1 24
#define _servo2 25
#define _servo3 26
#define _servo4 27
#define _servo5 28
#define _servo6 29
#define _servo7 30
#define _servo8 31

#include "nano_servo.h"

inline void beep() {
  tone(_BZ, 1000, 100); delay(150);
}

inline void soundmega(int freq, int ms) {
  tone(_BZ, freq, ms); delay(ms + 150);
}

inline void wait() {
  display.clearDisplay();
  display.setTextColor(WHITE, BLACK);
  display.setTextSize(2);
  display.setCursor(28, 10);
  display.println("Press!");
  display.setTextSize(1);
  display.setCursor(34, 36);
  display.println("Button D53");
  display.setCursor(15, 52);
  display.setTextColor(BLACK, WHITE);
  display.println("to start program");
  display.setTextColor(WHITE, BLACK);
  display.display();
  int button = 1;
  do { button = digitalRead(_BT); } while (button);
}

inline int map_func(int v1, int v2, int v3, int v4, int v5) {
  return map(v1, v2, v3, v4, v5);
}

#endif // LOTUSMEGABOT_H
