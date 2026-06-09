#include "MPU6050_Plugin.h"

MPU6050_Plugin::MPU6050_Plugin(uint8_t address) {
    _address      = address;
    _ax = _ay = _az = 0.0;
    _gx = _gy = _gz = 0.0;
    _temp         = 0.0;
    _pitch = _roll = 0.0;
    _accel_scale  = 16384.0;  // ±2g default
    _gyro_scale   = 131.0;    // ±250dps default
    _last_update  = 0;
    _updated      = false;
}

bool MPU6050_Plugin::begin() {
    delay(100);

    // ตรวจสอบว่าเชื่อมต่อได้
    Wire.beginTransmission(_address);
    if (Wire.endTransmission() != 0) return false;

    // Wake up (clear sleep bit)
    writeRegister(MPU6050_REG_PWR_MGMT_1, 0x00);
    delay(50);

    // ตั้งค่า Accel ±2g, Gyro ±250dps (default)
    writeRegister(MPU6050_REG_ACCEL_CONFIG, 0x00);
    writeRegister(MPU6050_REG_GYRO_CONFIG,  0x00);
    delay(10);

    return true;
}

bool MPU6050_Plugin::isConnected() {
    Wire.beginTransmission(_address);
    return (Wire.endTransmission() == 0);
}

void MPU6050_Plugin::setAccelRange(AccelRange range) {
    writeRegister(MPU6050_REG_ACCEL_CONFIG, (uint8_t)(range << 3));
    switch (range) {
        case ACCEL_2G:  _accel_scale = 16384.0; break;
        case ACCEL_4G:  _accel_scale = 8192.0;  break;
        case ACCEL_8G:  _accel_scale = 4096.0;  break;
        case ACCEL_16G: _accel_scale = 2048.0;  break;
    }
}

void MPU6050_Plugin::setGyroRange(GyroRange range) {
    writeRegister(MPU6050_REG_GYRO_CONFIG, (uint8_t)(range << 3));
    switch (range) {
        case GYRO_250DPS:  _gyro_scale = 131.0;  break;
        case GYRO_500DPS:  _gyro_scale = 65.5;   break;
        case GYRO_1000DPS: _gyro_scale = 32.8;   break;
        case GYRO_2000DPS: _gyro_scale = 16.4;   break;
    }
}

void MPU6050_Plugin::update(uint16_t interval_ms) {
    _updated = false;
    if ((unsigned long)(millis() - _last_update) >= interval_ms) {
        _last_update = millis();

        uint8_t buffer[14];

        // อ่าน Accel + Temp + Gyro (14 bytes ติดกัน)
        readRegisters(MPU6050_REG_ACCEL_XOUT_H, buffer, 14);

        int16_t raw_ax = (int16_t)((buffer[0]  << 8) | buffer[1]);
        int16_t raw_ay = (int16_t)((buffer[2]  << 8) | buffer[3]);
        int16_t raw_az = (int16_t)((buffer[4]  << 8) | buffer[5]);
        int16_t raw_t  = (int16_t)((buffer[6]  << 8) | buffer[7]);
        int16_t raw_gx = (int16_t)((buffer[8]  << 8) | buffer[9]);
        int16_t raw_gy = (int16_t)((buffer[10] << 8) | buffer[11]);
        int16_t raw_gz = (int16_t)((buffer[12] << 8) | buffer[13]);

        _ax = raw_ax / _accel_scale;
        _ay = raw_ay / _accel_scale;
        _az = raw_az / _accel_scale;

        _gx = raw_gx / _gyro_scale;
        _gy = raw_gy / _gyro_scale;
        _gz = raw_gz / _gyro_scale;

        _temp = raw_t / 340.0 + 36.53;

        // คำนวณมุม Pitch และ Roll จาก Accelerometer
        _pitch = atan2(_ay, sqrt(_ax * _ax + _az * _az)) * 180.0 / PI;
        _roll  = atan2(-_ax, _az) * 180.0 / PI;

        _updated = true;
    }
}

bool MPU6050_Plugin::isUpdated() {
    return _updated;
}

void MPU6050_Plugin::writeRegister(uint8_t reg, uint8_t value) {
    Wire.beginTransmission(_address);
    Wire.write(reg);
    Wire.write(value);
    Wire.endTransmission();
    delay(2);
}

uint8_t MPU6050_Plugin::readRegister(uint8_t reg) {
    Wire.beginTransmission(_address);
    Wire.write(reg);
    Wire.endTransmission(false);
    Wire.requestFrom(_address, (uint8_t)1);
    return Wire.available() ? Wire.read() : 0;
}

void MPU6050_Plugin::readRegisters(uint8_t reg, uint8_t* buffer, uint8_t len) {
    Wire.beginTransmission(_address);
    Wire.write(reg);
    Wire.endTransmission(false);
    Wire.requestFrom(_address, len);
    uint8_t timeout = 20;
    while (Wire.available() < len && timeout--) delay(1);
    for (uint8_t i = 0; i < len; i++) {
        buffer[i] = Wire.available() ? Wire.read() : 0;
    }
}
