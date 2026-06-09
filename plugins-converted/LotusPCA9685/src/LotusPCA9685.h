#ifndef LOTUS_PCA9685_H
#define LOTUS_PCA9685_H

#include <Arduino.h>
#include <Wire.h>

// ─── PCA9685 Registers ───────────────────────────────────────────
#define PCA9685_MODE1       0x00
#define PCA9685_MODE2       0x01
#define PCA9685_LED0_ON_L   0x06
#define PCA9685_PRESCALE    0xFE
#define PCA9685_ALLLED_OFF_H 0xFD

#define PCA9685_DEFAULT_ADDR 0x40
#define PCA9685_MAX_CHANNELS 16

class LotusPCA9685 {
private:
    uint8_t  _addr;
    float    _freq;
    TwoWire* _wire;

    // Per-channel calibration (microseconds)
    uint16_t _calMin[PCA9685_MAX_CHANNELS];
    uint16_t _calMax[PCA9685_MAX_CHANNELS];

    void     writeReg(uint8_t reg, uint8_t val);
    uint8_t  readReg(uint8_t reg);
    uint16_t usToPwm(uint16_t us);

public:
    LotusPCA9685();

    // Setup
    void begin(uint8_t addr = PCA9685_DEFAULT_ADDR, float freq = 50.0f, TwoWire& wire = Wire);

    // Set PWM frequency (Hz)
    void setFrequency(float freq);

    // Set angle 0-180 (uses per-channel calibration)
    void setAngle(uint8_t ch, float angle);

    // Set pulse width in microseconds
    void setMicroseconds(uint8_t ch, uint16_t us);

    // Set raw PWM value (0-4095 ON, 0-4095 OFF)
    void setPWM(uint8_t ch, uint16_t on, uint16_t off);

    // Turn off specific channel
    void setOff(uint8_t ch);

    // Turn off ALL channels
    void setAllOff();

    // Calibrate channel min/max microseconds
    void calibrate(uint8_t ch, uint16_t minUs, uint16_t maxUs);

    // Get calibration
    uint16_t getCalMin(uint8_t ch) { return (ch < 16) ? _calMin[ch] : 544; }
    uint16_t getCalMax(uint8_t ch) { return (ch < 16) ? _calMax[ch] : 2400; }
};

#endif
