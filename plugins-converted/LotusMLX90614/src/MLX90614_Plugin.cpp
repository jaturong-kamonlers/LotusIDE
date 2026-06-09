#include "MLX90614_Plugin.h"

MLX90614_Plugin::MLX90614_Plugin(uint8_t address) {
    _address      = address;
    _obj_temp     = 0.0;
    _amb_temp     = 0.0;
    _found        = false;
    _last_update  = 0;
    _updated      = false;
}

bool MLX90614_Plugin::begin() {
    delay(100);

    // ตรวจสอบการเชื่อมต่อ
    Wire.beginTransmission(_address);
    if (Wire.endTransmission(true) != 0) return false;

    // ทดลองอ่านค่าอุณหภูมิ ambient ครั้งแรก
    uint16_t raw = readRaw(MLX90614_REG_TA);
    if (raw == 0xFFFF) return false;

    _found = true;
    return true;
}

bool MLX90614_Plugin::isConnected() {
    Wire.beginTransmission(_address);
    return (Wire.endTransmission(true) == 0);
}

// MLX90614 ใช้ SMBus read word protocol
// ส่ง: START | addr+W | reg | RESTART | addr+R | dataLow | dataHigh | PEC | STOP
uint16_t MLX90614_Plugin::readRaw(uint8_t reg) {
    Wire.beginTransmission(_address);
    Wire.write(reg);
    Wire.endTransmission(false);  // repeated start (SMBus)

    uint8_t timeout = 30;
    Wire.requestFrom(_address, (uint8_t)3);  // dataLow + dataHigh + PEC
    while (Wire.available() < 3 && timeout--) delay(1);

    if (Wire.available() < 3) return 0xFFFF;

    uint8_t lo  = Wire.read();
    uint8_t hi  = Wire.read();
    Wire.read(); // PEC (ignore)

    uint16_t raw = ((uint16_t)hi << 8) | lo;

    // ตรวจสอบ error flag (bit 15)
    if (raw & 0x8000) return 0xFFFF;

    return raw;
}

float MLX90614_Plugin::rawToTemp(uint16_t raw) {
    // raw * 0.02 - 273.15  →  °C
    return (float)raw * 0.02 - 273.15;
}

void MLX90614_Plugin::update(uint16_t interval_ms) {
    _updated = false;
    if (!_found) return;
    if ((unsigned long)(millis() - _last_update) >= interval_ms) {
        _last_update = millis();

        uint16_t raw_obj = readRaw(MLX90614_REG_TOBJ1);
        uint16_t raw_amb = readRaw(MLX90614_REG_TA);

        if (raw_obj != 0xFFFF) _obj_temp = rawToTemp(raw_obj);
        if (raw_amb != 0xFFFF) _amb_temp = rawToTemp(raw_amb);

        _updated = true;
    }
}

bool MLX90614_Plugin::isUpdated() {
    return _updated;
}
