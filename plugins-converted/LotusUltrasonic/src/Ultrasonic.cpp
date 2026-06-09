/******************************************************************
 * Ultrasonic HC-SR04 library for KBIDE
 * Fixed:
 *   - pulseIn(..., 1, ...) → pulseIn(..., HIGH, ...)
 *   - timeout 15000μs → 30000μs (~510cm ครอบคลุม range จริง 400cm)
 *   - distance formula ใช้ / 58 (cm) และ / 5.8 (mm) ที่แม่นกว่า
 *   - เพิ่ม read_distance_mm()
 ******************************************************************/

#include "Ultrasonic.h"

ULTRASONIC::ULTRASONIC() {}
ULTRASONIC::~ULTRASONIC() {}

void ULTRASONIC::begin(uint8_t trig, uint8_t echo) {
    _trig = trig;
    _echo = echo;
    pinMode(_trig, OUTPUT);
    pinMode(_echo, INPUT);
    digitalWrite(_trig, LOW);
    delay(20);
}

unsigned int ULTRASONIC::read_distance_cm() {
    // Trigger pulse
    digitalWrite(_trig, LOW);
    delayMicroseconds(2);
    digitalWrite(_trig, HIGH);
    delayMicroseconds(10);
    digitalWrite(_trig, LOW);

    // รับ echo pulse — timeout 30000μs ≈ 510cm
    long duration = pulseIn(_echo, HIGH, 30000UL);

    // duration=0 หมายถึง timeout (ไม่มีวัตถุ / ระยะเกิน)
    if (duration == 0) return 0;

    // ระยะ (cm) = duration(μs) / 58  [เสียงเดินทาง 2 เท่า = /29/2 = /58]
    return (unsigned int)(duration / 58UL);
}

unsigned int ULTRASONIC::read_distance_mm() {
    digitalWrite(_trig, LOW);
    delayMicroseconds(2);
    digitalWrite(_trig, HIGH);
    delayMicroseconds(10);
    digitalWrite(_trig, LOW);

    long duration = pulseIn(_echo, HIGH, 30000UL);
    if (duration == 0) return 0;

    // ระยะ (mm) = duration(μs) / 5.8
    return (unsigned int)((duration * 10UL) / 58UL);
}
