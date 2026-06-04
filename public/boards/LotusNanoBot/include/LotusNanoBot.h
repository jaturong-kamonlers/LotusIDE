#ifndef LOTUSNANOBOT_H
#define LOTUSNANOBOT_H

#include <Arduino.h>
#include <Wire.h>  
#include <SPI.h>
#include "Servo.h"
#include "Adafruit_GFX.h"
#include "Adafruit_SSD1306.h"

// --- Pin Configuration ---
#define AIN1 4
#define AIN2 9
#define BIN1 8
#define BIN2 7
#define PWMA 5
#define PWMB 6
#define _knob A7
#define _BT 2
#define _BZ 3
#define _servo1 10
#define _servo2 11
#define _servo3 12

// --- Display Setup ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
static Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// --- Forward Declarations ---
inline void beep();
inline void wait();

// --- Include Sub-libraries ---
#include "nano_motor.h"
#include "nano_servo.h"

// --- Helper Functions ---
inline void beep() {
    tone(_BZ, 1000, 100);
    delay(150);
}

inline void wait() {
    pinMode(_BT, INPUT_PULLUP);
    display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE, SSD1306_BLACK); 
    display.setCursor(30, 10);
    display.setTextSize(2);
    display.println("Press!");
    display.setCursor(10, 30);
    display.println("Button D2");
    display.display();

    while (digitalRead(_BT) == HIGH) { delay(10); }
    
    display.clearDisplay();
    display.display();
    beep();
}

inline int map_func(int v1, int v2, int v3, int v4, int v5) {
    return map(v1, v2, v3, v4, v5);
}

typedef int Number;
typedef int Boolean;

#endif