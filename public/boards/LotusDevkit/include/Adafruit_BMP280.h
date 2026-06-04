#ifndef ADAFRUIT_BMP280_H
#define ADAFRUIT_BMP280_H

#include <Arduino.h>
#include <Wire.h>

#define BMP280_ADDR_PRIMARY   0x76
#define BMP280_ADDR_SECONDARY 0x77
#define BMP280_REG_CHIPID     0xD0
#define BMP280_REG_CONTROL    0xF4
#define BMP280_REG_CONFIG     0xF5
#define BMP280_REG_PRES_MSB   0xF7
#define BMP280_REG_CALIB00    0x88

class Adafruit_BMP280 {
public:
    Adafruit_BMP280(uint8_t addr = BMP280_ADDR_PRIMARY)
        : _addr(addr), _wire(&Wire) {}

    bool begin(uint8_t addr = BMP280_ADDR_PRIMARY, TwoWire &wirePort = Wire) {
        _wire = &wirePort;

        // ── Auto-scan: ลอง 0x76 ก่อน ถ้าไม่ได้ลอง 0x77 ──────────────
        uint8_t candidates[2] = {BMP280_ADDR_PRIMARY, BMP280_ADDR_SECONDARY};
        bool found = false;
        for (int i = 0; i < 2; i++) {
            _addr = candidates[i];
            uint8_t id = readByte(BMP280_REG_CHIPID);
            // BMP280 chip id: 0x56, 0x57, 0x58, 0x60 (BME280)
            if (id >= 0x56 && id <= 0x60) {
                found = true;
                Serial.printf("[BMP280] Found at 0x%02X (chip_id=0x%02X)\n", _addr, id);
                break;
            }
        }
        if (!found) {
            Serial.println("[BMP280] Not found at 0x76 or 0x77!");
            return false;
        }

        readCalibration();
        writeByte(BMP280_REG_CONTROL, 0xB7); // normal mode, osrs_t x2, osrs_p x16
        writeByte(BMP280_REG_CONFIG,  0x10); // filter x4, standby 125ms
        delay(100);
        return true;
    }

    float readTemperature() {
        readRawData();
        return _temp;
    }

    float readPressure() {
        readRawData();
        return _pressure; // Pa
    }

    // pressure (hPa) = readPressure()/100
    float readPressureHPa() {
        return readPressure() / 100.0f;
    }

    float readAltitude(float seaLevelHPa = 1013.25f) {
        float p = readPressure() / 100.0f;
        return 44330.0f * (1.0f - pow(p / seaLevelHPa, 0.1903f));
    }

private:
    uint8_t  _addr;
    TwoWire* _wire;
    float    _temp = 0, _pressure = 0;

    uint16_t _dig_T1, _dig_P1;
    int16_t  _dig_T2, _dig_T3;
    int16_t  _dig_P2, _dig_P3, _dig_P4, _dig_P5;
    int16_t  _dig_P6, _dig_P7, _dig_P8, _dig_P9;
    int32_t  _t_fine = 0;

    void readCalibration() {
        uint8_t buf[24];
        _wire->beginTransmission(_addr);
        _wire->write(BMP280_REG_CALIB00);
        _wire->endTransmission(false);
        _wire->requestFrom(_addr, (uint8_t)24);
        for (int i = 0; i < 24; i++) buf[i] = _wire->read();

        _dig_T1 = (buf[1]<<8)|buf[0];
        _dig_T2 = (buf[3]<<8)|buf[2];
        _dig_T3 = (buf[5]<<8)|buf[4];
        _dig_P1 = (buf[7]<<8)|buf[6];
        _dig_P2 = (buf[9]<<8)|buf[8];
        _dig_P3 = (buf[11]<<8)|buf[10];
        _dig_P4 = (buf[13]<<8)|buf[12];
        _dig_P5 = (buf[15]<<8)|buf[14];
        _dig_P6 = (buf[17]<<8)|buf[16];
        _dig_P7 = (buf[19]<<8)|buf[18];
        _dig_P8 = (buf[21]<<8)|buf[20];
        _dig_P9 = (buf[23]<<8)|buf[22];
    }

    void readRawData() {
        _wire->beginTransmission(_addr);
        _wire->write(BMP280_REG_PRES_MSB);
        _wire->endTransmission(false);
        _wire->requestFrom(_addr, (uint8_t)6);

        int32_t praw = ((int32_t)_wire->read()<<12)|((int32_t)_wire->read()<<4)|(_wire->read()>>4);
        int32_t traw = ((int32_t)_wire->read()<<12)|((int32_t)_wire->read()<<4)|(_wire->read()>>4);

        // Temperature (datasheet formula)
        int32_t v1 = ((((traw>>3)-((int32_t)_dig_T1<<1)))*((int32_t)_dig_T2))>>11;
        int32_t v2 = (((((traw>>4)-((int32_t)_dig_T1))*((traw>>4)-((int32_t)_dig_T1)))>>12)*((int32_t)_dig_T3))>>14;
        _t_fine = v1+v2;
        _temp = (_t_fine*5+128)/256.0f/100.0f;

        // Pressure (datasheet formula)
        int64_t p1 = ((int64_t)_t_fine)-128000;
        int64_t p2 = p1*p1*(int64_t)_dig_P6;
        p2 = p2+((p1*(int64_t)_dig_P5)<<17);
        p2 = p2+(((int64_t)_dig_P4)<<35);
        p1 = ((p1*p1*(int64_t)_dig_P3)>>8)+((p1*(int64_t)_dig_P2)<<12);
        p1 = (((((int64_t)1)<<47)+p1))*((int64_t)_dig_P1)>>33;
        if (p1==0){_pressure=0;return;}
        int64_t p = 1048576-praw;
        p = (((p<<31)-p2)*3125)/p1;
        p1 = (((int64_t)_dig_P9)*(p>>13)*(p>>13))>>25;
        p2 = (((int64_t)_dig_P8)*p)>>19;
        p = ((p+p1+p2)>>8)+(((int64_t)_dig_P7)<<4);
        _pressure = (float)p/256.0f;
    }

    void writeByte(uint8_t reg, uint8_t val) {
        _wire->beginTransmission(_addr);
        _wire->write(reg); _wire->write(val);
        _wire->endTransmission();
    }

    uint8_t readByte(uint8_t reg) {
        _wire->beginTransmission(_addr);
        _wire->write(reg);
        _wire->endTransmission(false);
        _wire->requestFrom(_addr, (uint8_t)1);
        return _wire->available() ? _wire->read() : 0xFF;
    }
};

#endif // ADAFRUIT_BMP280_H
