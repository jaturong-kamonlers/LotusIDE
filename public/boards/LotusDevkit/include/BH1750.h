#ifndef BH1750_H
#define BH1750_H

#include <Arduino.h>
#include <Wire.h>

// I2C Address
#define BH1750_ADDR_LOW   0x23  // ADDR pin = GND
#define BH1750_ADDR_HIGH  0x5C  // ADDR pin = VCC

// Commands
#define BH1750_POWER_DOWN       0x00
#define BH1750_POWER_ON         0x01
#define BH1750_RESET            0x07
#define BH1750_CONT_H_RES       0x10  // Continuous 1 lx resolution
#define BH1750_CONT_H_RES2      0x11  // Continuous 0.5 lx resolution
#define BH1750_CONT_L_RES       0x13  // Continuous 4 lx resolution
#define BH1750_ONE_H_RES        0x20  // One-time 1 lx resolution
#define BH1750_ONE_H_RES2       0x21  // One-time 0.5 lx resolution
#define BH1750_ONE_L_RES        0x23  // One-time 4 lx resolution

typedef enum {
    UNCONFIGURED        = 0,
    CONTINUOUS_HIGH_RES_MODE  = BH1750_CONT_H_RES,
    CONTINUOUS_HIGH_RES_MODE_2= BH1750_CONT_H_RES2,
    CONTINUOUS_LOW_RES_MODE   = BH1750_CONT_L_RES,
    ONE_TIME_HIGH_RES_MODE    = BH1750_ONE_H_RES,
    ONE_TIME_HIGH_RES_MODE_2  = BH1750_ONE_H_RES2,
    ONE_TIME_LOW_RES_MODE     = BH1750_ONE_L_RES
} Mode;

class BH1750 {
public:
    BH1750(uint8_t addr = BH1750_ADDR_LOW)
        : _addr(addr), _wire(&Wire), _mode(UNCONFIGURED) {}

    bool begin(Mode mode = CONTINUOUS_HIGH_RES_MODE, TwoWire &wirePort = Wire) {
        _wire = &wirePort;
        _mode = mode;
        // Wire.begin() ถูกเรียกแล้วใน LotusDevkit()
        return configure(mode);
    }

    bool configure(Mode mode) {
        _wire->beginTransmission(_addr);
        _wire->write((uint8_t)mode);
        uint8_t err = _wire->endTransmission();
        if (err == 0) {
            _mode = mode;
            delay(180); // รอ measurement ครั้งแรก
            return true;
        }
        return false;
    }

    // อ่านค่าแสง หน่วย lux
    float readLightLevel() {
        if (_mode == UNCONFIGURED) return -1.0f;

        uint16_t raw = 0;
        uint8_t n = _wire->requestFrom(_addr, (uint8_t)2);
        if (n == 2) {
            raw  = _wire->read() << 8;
            raw |= _wire->read();
        } else {
            return -1.0f;
        }

        float lux = raw / 1.2f;  // BH1750 factor

        // HIGH_RES_MODE_2 = 0.5 lx resolution
        if (_mode == CONTINUOUS_HIGH_RES_MODE_2 ||
            _mode == ONE_TIME_HIGH_RES_MODE_2) {
            lux /= 2.0f;
        }
        return lux;
    }

    // Alias ให้เรียกง่าย
    float read()      { return readLightLevel(); }
    float getLux()    { return readLightLevel(); }

private:
    uint8_t  _addr;
    TwoWire* _wire;
    Mode     _mode;
};

#endif // BH1750_H
