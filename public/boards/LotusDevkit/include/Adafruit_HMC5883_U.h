#ifndef ADAFRUIT_HMC5883_U_H
#define ADAFRUIT_HMC5883_U_H

#include <Arduino.h>
#include <Wire.h>

#define HMC5883L_ADDR       0x1E
#define HMC5883L_REG_CFGA   0x00
#define HMC5883L_REG_CFGB   0x01
#define HMC5883L_REG_MODE   0x02
#define HMC5883L_REG_DATA   0x03

class Adafruit_HMC5883_Unified {
public:
    Adafruit_HMC5883_Unified(int32_t sensorID = -1)
        : _wire(&Wire), _x(0), _y(0), _z(0) {}

    bool begin(TwoWire &wirePort = Wire) {
        _wire = &wirePort;
        // 8-average, 15Hz, normal measurement
        writeReg(HMC5883L_REG_CFGA, 0x70);
        // Gain = 1090 LSb/Gauss (+/-1.3Ga)
        writeReg(HMC5883L_REG_CFGB, 0xA0);
        // Continuous measurement mode
        writeReg(HMC5883L_REG_MODE, 0x00);
        delay(10);
        return true;
    }

    void read() {
        _wire->beginTransmission(HMC5883L_ADDR);
        _wire->write(HMC5883L_REG_DATA);
        _wire->endTransmission(false);
        _wire->requestFrom(HMC5883L_ADDR, 6);
        if (_wire->available() >= 6) {
            _x = (int16_t)(_wire->read() << 8 | _wire->read());
            _z = (int16_t)(_wire->read() << 8 | _wire->read()); // Z comes before Y
            _y = (int16_t)(_wire->read() << 8 | _wire->read());
        }
    }

    int16_t getX() { return _x; }
    int16_t getY() { return _y; }
    int16_t getZ() { return _z; }

    float getAzimuth() {
        float heading = atan2((float)_y, (float)_x) * 180.0f / PI;
        if (heading < 0) heading += 360.0f;
        return heading;
    }

private:
    TwoWire*  _wire;
    int16_t   _x, _y, _z;

    void writeReg(uint8_t reg, uint8_t val) {
        _wire->beginTransmission(HMC5883L_ADDR);
        _wire->write(reg);
        _wire->write(val);
        _wire->endTransmission();
    }
};

#endif
