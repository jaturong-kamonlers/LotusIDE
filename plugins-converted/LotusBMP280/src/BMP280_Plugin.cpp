#include "BMP280_Plugin.h"

BMP280_Plugin::BMP280_Plugin(uint8_t address) {
    _address       = address;
    _temperature   = 0.0;
    _pressure      = 0.0;
    _altitude      = 0.0;
    _sea_level_hpa = 1013.25;
    _t_fine        = 0;
    _last_update   = 0;
    _updated       = false;
    _found         = false;
}

bool BMP280_Plugin::begin() {
    delay(100);

    Wire.beginTransmission(_address);
    if (Wire.endTransmission() != 0) {
        // ลอง address สำรอง
        _address = (_address == BMP280_ADDR_DEFAULT) ? BMP280_ADDR_ALT : BMP280_ADDR_DEFAULT;
        Wire.beginTransmission(_address);
        if (Wire.endTransmission() != 0) return false;
    }

    uint8_t chip_id = readRegister(BMP280_REG_ID);
    if (chip_id != BMP280_CHIP_ID && chip_id != BME280_CHIP_ID) return false;

    // Reset
    writeRegister(BMP280_REG_RESET, 0xB6);
    delay(10);

    // อ่าน Calibration data
    readCalibration();

    // Normal mode, oversampling x2 temp, x16 pressure
    writeRegister(BMP280_REG_CTRL_MEAS, 0xB7);
    // Filter x4, standby 62.5ms
    writeRegister(BMP280_REG_CONFIG, 0x10);
    delay(10);

    _found = true;
    return true;
}

bool BMP280_Plugin::isConnected() {
    Wire.beginTransmission(_address);
    return (Wire.endTransmission() == 0);
}

void BMP280_Plugin::readCalibration() {
    uint8_t buf[24];
    readRegisters(BMP280_REG_CALIB00, buf, 24);

    _dig_T1 = (uint16_t)((buf[1]  << 8) | buf[0]);
    _dig_T2 = (int16_t) ((buf[3]  << 8) | buf[2]);
    _dig_T3 = (int16_t) ((buf[5]  << 8) | buf[4]);
    _dig_P1 = (uint16_t)((buf[7]  << 8) | buf[6]);
    _dig_P2 = (int16_t) ((buf[9]  << 8) | buf[8]);
    _dig_P3 = (int16_t) ((buf[11] << 8) | buf[10]);
    _dig_P4 = (int16_t) ((buf[13] << 8) | buf[12]);
    _dig_P5 = (int16_t) ((buf[15] << 8) | buf[14]);
    _dig_P6 = (int16_t) ((buf[17] << 8) | buf[16]);
    _dig_P7 = (int16_t) ((buf[19] << 8) | buf[18]);
    _dig_P8 = (int16_t) ((buf[21] << 8) | buf[20]);
    _dig_P9 = (int16_t) ((buf[23] << 8) | buf[22]);
}

int32_t BMP280_Plugin::compensateTemp(int32_t adc_T) {
    int32_t var1 = ((((adc_T >> 3) - ((int32_t)_dig_T1 << 1))) * ((int32_t)_dig_T2)) >> 11;
    int32_t var2 = (((((adc_T >> 4) - ((int32_t)_dig_T1)) * ((adc_T >> 4) - ((int32_t)_dig_T1))) >> 12) * ((int32_t)_dig_T3)) >> 14;
    _t_fine = var1 + var2;
    return (_t_fine * 5 + 128) >> 8;
}

uint32_t BMP280_Plugin::compensatePress(int32_t adc_P) {
    // ใช้ double แทน int64_t เพื่อให้รองรับ AVR (ATmega328P)
    double var1, var2, p;
    var1 = ((double)_t_fine / 2.0) - 64000.0;
    var2 = var1 * var1 * ((double)_dig_P6) / 32768.0;
    var2 = var2 + var1 * ((double)_dig_P5) * 2.0;
    var2 = (var2 / 4.0) + (((double)_dig_P4) * 65536.0);
    var1 = (((double)_dig_P3) * var1 * var1 / 524288.0 + ((double)_dig_P2) * var1) / 524288.0;
    var1 = (1.0 + var1 / 32768.0) * ((double)_dig_P1);
    if (var1 == 0.0) return 0;
    p = 1048576.0 - (double)adc_P;
    p = (p - (var2 / 4096.0)) * 6250.0 / var1;
    var1 = ((double)_dig_P9) * p * p / 2147483648.0;
    var2 = p * ((double)_dig_P8) / 32768.0;
    p = p + (var1 + var2 + ((double)_dig_P7)) / 16.0;
    return (uint32_t)p;
}

void BMP280_Plugin::update(uint16_t interval_ms) {
    _updated = false;
    if (!_found) return;
    if ((unsigned long)(millis() - _last_update) >= interval_ms) {
        _last_update = millis();

        uint8_t buf[6];
        readRegisters(BMP280_REG_PRESS_MSB, buf, 6);

        int32_t adc_P = ((int32_t)buf[0] << 12) | ((int32_t)buf[1] << 4) | (buf[2] >> 4);
        int32_t adc_T = ((int32_t)buf[3] << 12) | ((int32_t)buf[4] << 4) | (buf[5] >> 4);

        // Temperature
        int32_t temp_raw = compensateTemp(adc_T);
        _temperature = temp_raw / 100.0;

        // Pressure
        uint32_t press_raw = compensatePress(adc_P);
        _pressure = press_raw / 25600.0;

        // Altitude
        _altitude = 44330.0 * (1.0 - pow(_pressure / _sea_level_hpa, 0.1903));

        _updated = true;
    }
}

bool BMP280_Plugin::isUpdated() {
    return _updated;
}

void BMP280_Plugin::writeRegister(uint8_t reg, uint8_t value) {
    Wire.beginTransmission(_address);
    Wire.write(reg);
    Wire.write(value);
    Wire.endTransmission();
    delay(2);
}

uint8_t BMP280_Plugin::readRegister(uint8_t reg) {
    Wire.beginTransmission(_address);
    Wire.write(reg);
    Wire.endTransmission(true);   // stop bit — AVR safe
    delay(1);
    Wire.requestFrom(_address, (uint8_t)1);
    uint8_t timeout = 10;
    while (!Wire.available() && timeout--) delay(1);
    return Wire.available() ? Wire.read() : 0;
}

void BMP280_Plugin::readRegisters(uint8_t reg, uint8_t* buf, uint8_t len) {
    Wire.beginTransmission(_address);
    Wire.write(reg);
    Wire.endTransmission(true);   // stop bit — AVR safe
    delay(1);
    Wire.requestFrom(_address, len);
    uint8_t timeout = 30;
    while (Wire.available() < len && timeout--) delay(1);
    for (uint8_t i = 0; i < len; i++) {
        buf[i] = Wire.available() ? Wire.read() : 0;
    }
}
