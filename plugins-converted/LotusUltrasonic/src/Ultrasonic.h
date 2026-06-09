/******************************************************************
 * Ultrasonic HC-SR04 library for KBIDE
 * Fixed: include guard typo (tultrasonic_h → ultrasonic_h)
 ******************************************************************/

#ifndef ultrasonic_h
#define ultrasonic_h

#include <Arduino.h>

class ULTRASONIC {
public:
    ULTRASONIC();
    ~ULTRASONIC();

    // begin(trig, echo) — ลำดับ TRIG ก่อน ECHO
    void begin(uint8_t _trig, uint8_t _echo);

    unsigned int read_distance_cm();
    unsigned int read_distance_mm();

private:
    uint8_t _trig, _echo;
};

#endif /* ultrasonic_h */
