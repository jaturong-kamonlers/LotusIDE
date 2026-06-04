#ifndef QMC5883LCOMPASS_H
#define QMC5883LCOMPASS_H

#include <Arduino.h>
#include <Wire.h>

#define QMC5883L_ADDR       0x0D
#define QMC5883L_REG_DATA   0x00
#define QMC5883L_REG_STATUS 0x06
#define QMC5883L_REG_CTRL1  0x09
#define QMC5883L_REG_CTRL2  0x0A
#define QMC5883L_REG_SETRST 0x0B

class QMC5883LCompass {
public:
    QMC5883LCompass() : _wire(&Wire), _x(0), _y(0), _z(0) {}

    void init(TwoWire &wirePort = Wire) {
        _wire = &wirePort;
        writeReg(QMC5883L_REG_CTRL2,  0x01); // soft reset
        delay(10);
        writeReg(QMC5883L_REG_SETRST, 0x01); // set/reset
        // Continuous mode, 200Hz ODR, 8G range, 512 OSR
        writeReg(QMC5883L_REG_CTRL1,  0x1D);
    }

    void read() {
        _wire->beginTransmission(QMC5883L_ADDR);
        _wire->write(QMC5883L_REG_DATA);
        _wire->endTransmission(false);
        _wire->requestFrom(QMC5883L_ADDR, 6);
        if (_wire->available() >= 6) {
            _x = (int16_t)(_wire->read() | _wire->read() << 8);
            _y = (int16_t)(_wire->read() | _wire->read() << 8);
            _z = (int16_t)(_wire->read() | _wire->read() << 8);
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
    TwoWire* _wire;
    int16_t _x, _y, _z;

    void writeReg(uint8_t reg, uint8_t val) {
        _wire->beginTransmission(QMC5883L_ADDR);
        _wire->write(reg);
        _wire->write(val);
        _wire->endTransmission();
    }
};

#endif
