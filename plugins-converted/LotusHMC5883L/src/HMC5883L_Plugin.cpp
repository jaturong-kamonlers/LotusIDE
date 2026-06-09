#include "HMC5883L_Plugin.h"

HMC5883L_Plugin::HMC5883L_Plugin(int sda, int scl) {
    _x_offset = _y_offset = _z_offset = 0;
    _x_scale = _y_scale = _z_scale = 1.0;
    _sda_pin = sda;
    _scl_pin = scl;
    _heading = 0;
    _declination = 0.0;
    _last_update = 0;
    _updated = false;
    _x_raw = _y_raw = _z_raw = 0;
    _chip = CHIP_NONE;
    _address = 0;
}

bool HMC5883L_Plugin::begin() {
    // รอให้ I2C bus นิ่งก่อน (RTC และ OLED อาจเพิ่ง init)
    delay(100);

    // ลอง HMC5883L (0x1E) ก่อน
    Wire.beginTransmission(ADDR_HMC5883L);
    uint8_t err1 = Wire.endTransmission();
    delay(5);

    if (err1 == 0) {
        _chip = CHIP_HMC5883;
        _address = ADDR_HMC5883L;
        writeRegister(0x00, 0x70);
        delay(5);
        writeRegister(0x01, 0x20);
        delay(5);
        writeRegister(0x02, 0x00);
        delay(67);
        return true;
    }

    // ลอง QMC5883L (0x0D)
    Wire.beginTransmission(ADDR_QMC5883L);
    uint8_t err2 = Wire.endTransmission();
    delay(5);

    if (err2 == 0) {
        _chip = CHIP_QMC5883;
        _address = ADDR_QMC5883L;
        writeRegister(0x0B, 0x01);
        delay(10);
        writeRegister(0x09, 0x1D);
        delay(10);
        return true;
    }

    return false;
}

void HMC5883L_Plugin::readRaw() {
    if (_chip == CHIP_NONE) return;

    uint8_t buffer[6] = {0};

    if (_chip == CHIP_HMC5883) {
        readRegisters(0x03, buffer, 6);
        int16_t rx = (int16_t)((buffer[0] << 8) | buffer[1]);
        int16_t rz = (int16_t)((buffer[2] << 8) | buffer[3]);
        int16_t ry = (int16_t)((buffer[4] << 8) | buffer[5]);
        if (rx == -4096 || ry == -4096 || rz == -4096) return;
        _x_raw = rx; _y_raw = ry; _z_raw = rz;
    } else {
        readRegisters(0x00, buffer, 6);
        _x_raw = (int16_t)((buffer[1] << 8) | buffer[0]);
        _y_raw = (int16_t)((buffer[3] << 8) | buffer[2]);
        _z_raw = (int16_t)((buffer[5] << 8) | buffer[4]);
    }

    applyCalibration(_x_raw, _y_raw, _z_raw);
}

float HMC5883L_Plugin::getHeading() {
    readRaw();
    float heading = atan2((float)_y_raw, (float)_x_raw) * 180.0 / PI;
    heading += _declination;
    if (heading < 0) heading += 360;
    if (heading >= 360) heading -= 360;
    _heading = heading;
    return _heading;
}

void HMC5883L_Plugin::update(uint16_t interval_ms) {
    _updated = false;
    if ((unsigned long)(millis() - _last_update) >= interval_ms) {
        _last_update = millis();
        getHeading();
        _updated = true;
    }
}

bool HMC5883L_Plugin::isUpdated() {
    return _updated;
}

void HMC5883L_Plugin::applyCalibration(int16_t &x, int16_t &y, int16_t &z) {
    x = (int16_t)((x - _x_offset) * _x_scale);
    y = (int16_t)((y - _y_offset) * _y_scale);
    z = (int16_t)((z - _z_offset) * _z_scale);
}

void HMC5883L_Plugin::calibrate(uint16_t samples) {
    int16_t x_min = 32767, x_max = -32768;
    int16_t y_min = 32767, y_max = -32768;
    int16_t z_min = 32767, z_max = -32768;
    for (uint16_t i = 0; i < samples; i++) {
        readRaw();
        x_min = min(x_min, _x_raw); x_max = max(x_max, _x_raw);
        y_min = min(y_min, _y_raw); y_max = max(y_max, _y_raw);
        z_min = min(z_min, _z_raw); z_max = max(z_max, _z_raw);
        delay(10);
    }
    _x_offset = (x_max + x_min) / 2;
    _y_offset = (y_max + y_min) / 2;
    _z_offset = (z_max + z_min) / 2;
    float avg_radius = ((x_max - x_min) + (y_max - y_min) + (z_max - z_min)) / 6.0;
    _x_scale = avg_radius / ((x_max - x_min) / 2.0);
    _y_scale = avg_radius / ((y_max - y_min) / 2.0);
    _z_scale = avg_radius / ((z_max - z_min) / 2.0);
}

void HMC5883L_Plugin::setCalibrationOffsets(int16_t x, int16_t y, int16_t z) {
    _x_offset = x; _y_offset = y; _z_offset = z;
}

void HMC5883L_Plugin::setCalibrationScales(float x, float y, float z) {
    _x_scale = x; _y_scale = y; _z_scale = z;
}

void HMC5883L_Plugin::writeRegister(uint8_t reg, uint8_t value) {
    Wire.beginTransmission(_address);
    Wire.write(reg);
    Wire.write(value);
    Wire.endTransmission();
    delay(2); // รอให้ bus ว่างก่อน write ครั้งต่อไป
}

void HMC5883L_Plugin::readRegisters(uint8_t reg, uint8_t* buffer, uint8_t len) {
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
