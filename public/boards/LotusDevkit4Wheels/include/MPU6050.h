#ifndef MPU6050_H
#define MPU6050_H

#include <Arduino.h>
#include <Wire.h>

#define MPU6050_ADDR_LOW   0x68  // AD0 = GND (default)
#define MPU6050_ADDR_HIGH  0x69  // AD0 = VCC

// Registers
#define MPU6050_REG_PWR_MGMT_1   0x6B
#define MPU6050_REG_ACCEL_CONFIG 0x1C
#define MPU6050_REG_GYRO_CONFIG  0x1B
#define MPU6050_REG_ACCEL_XOUT_H 0x3B
#define MPU6050_REG_GYRO_XOUT_H  0x43
#define MPU6050_REG_TEMP_OUT_H   0x41
#define MPU6050_REG_WHO_AM_I     0x75

// Accel range
#define MPU6050_ACCEL_2G   0x00
#define MPU6050_ACCEL_4G   0x08
#define MPU6050_ACCEL_8G   0x10
#define MPU6050_ACCEL_16G  0x18

// Gyro range
#define MPU6050_GYRO_250   0x00
#define MPU6050_GYRO_500   0x08
#define MPU6050_GYRO_1000  0x10
#define MPU6050_GYRO_2000  0x18

class MPU6050 {
public:
    MPU6050(uint8_t addr = MPU6050_ADDR_LOW)
        : _addr(addr), _wire(&Wire),
          _accelScale(16384.0f), _gyroScale(131.0f) {}

    bool begin(TwoWire &wirePort = Wire) {
        _wire = &wirePort;
        // ตรวจ WHO_AM_I
        if (readByte(MPU6050_REG_WHO_AM_I) != 0x68) return false;
        // Wake up
        writeByte(MPU6050_REG_PWR_MGMT_1, 0x00);
        delay(100);
        setAccelRange(MPU6050_ACCEL_2G);
        setGyroRange(MPU6050_GYRO_250);
        return true;
    }

    void setAccelRange(uint8_t range) {
        writeByte(MPU6050_REG_ACCEL_CONFIG, range);
        switch(range) {
            case MPU6050_ACCEL_2G:  _accelScale = 16384.0f; break;
            case MPU6050_ACCEL_4G:  _accelScale = 8192.0f;  break;
            case MPU6050_ACCEL_8G:  _accelScale = 4096.0f;  break;
            case MPU6050_ACCEL_16G: _accelScale = 2048.0f;  break;
        }
    }

    void setGyroRange(uint8_t range) {
        writeByte(MPU6050_REG_GYRO_CONFIG, range);
        switch(range) {
            case MPU6050_GYRO_250:  _gyroScale = 131.0f;  break;
            case MPU6050_GYRO_500:  _gyroScale = 65.5f;   break;
            case MPU6050_GYRO_1000: _gyroScale = 32.8f;   break;
            case MPU6050_GYRO_2000: _gyroScale = 16.4f;   break;
        }
    }

    // Accelerometer (g)
    float getAccelX() { return readRaw16(MPU6050_REG_ACCEL_XOUT_H)   / _accelScale; }
    float getAccelY() { return readRaw16(MPU6050_REG_ACCEL_XOUT_H+2) / _accelScale; }
    float getAccelZ() { return readRaw16(MPU6050_REG_ACCEL_XOUT_H+4) / _accelScale; }

    // Gyroscope (deg/s)
    float getGyroX()  { return readRaw16(MPU6050_REG_GYRO_XOUT_H)    / _gyroScale; }
    float getGyroY()  { return readRaw16(MPU6050_REG_GYRO_XOUT_H+2)  / _gyroScale; }
    float getGyroZ()  { return readRaw16(MPU6050_REG_GYRO_XOUT_H+4)  / _gyroScale; }

    // Temperature (Celsius)
    float getTemp() {
        int16_t raw = readRaw16(MPU6050_REG_TEMP_OUT_H);
        return raw / 340.0f + 36.53f;
    }

    // อ่านทุกค่าพร้อมกัน (efficient — 1 I2C transaction)
    void update() {
        _wire->beginTransmission(_addr);
        _wire->write(MPU6050_REG_ACCEL_XOUT_H);
        _wire->endTransmission(false);
        _wire->requestFrom(_addr, (uint8_t)14);
        _ax = readWire16() / _accelScale;
        _ay = readWire16() / _accelScale;
        _az = readWire16() / _accelScale;
        int16_t tr = readWire16();
        _temp = tr / 340.0f + 36.53f;
        _gx = readWire16() / _gyroScale;
        _gy = readWire16() / _gyroScale;
        _gz = readWire16() / _gyroScale;
    }

    float ax() { return _ax; }
    float ay() { return _ay; }
    float az() { return _az; }
    float gx() { return _gx; }
    float gy() { return _gy; }
    float gz() { return _gz; }
    float temp() { return _temp; }

private:
    uint8_t  _addr;
    TwoWire* _wire;
    float    _accelScale, _gyroScale;
    float    _ax=0,_ay=0,_az=0,_gx=0,_gy=0,_gz=0,_temp=0;

    void writeByte(uint8_t reg, uint8_t val) {
        _wire->beginTransmission(_addr);
        _wire->write(reg);
        _wire->write(val);
        _wire->endTransmission();
    }

    uint8_t readByte(uint8_t reg) {
        _wire->beginTransmission(_addr);
        _wire->write(reg);
        _wire->endTransmission(false);
        _wire->requestFrom(_addr, (uint8_t)1);
        return _wire->available() ? _wire->read() : 0xFF;
    }

    int16_t readRaw16(uint8_t reg) {
        _wire->beginTransmission(_addr);
        _wire->write(reg);
        _wire->endTransmission(false);
        _wire->requestFrom(_addr, (uint8_t)2);
        int16_t val = _wire->read() << 8;
        val |= _wire->read();
        return val;
    }

    int16_t readWire16() {
        int16_t val = _wire->read() << 8;
        val |= _wire->read();
        return val;
    }
};

#endif // MPU6050_H
