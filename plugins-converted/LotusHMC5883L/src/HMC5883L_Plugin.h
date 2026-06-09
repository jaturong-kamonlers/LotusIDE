#ifndef HMC5883L_PLUGIN_H
#define HMC5883L_PLUGIN_H

#include <Arduino.h>
#include <Wire.h>

#define ADDR_HMC5883L 0x1E
#define ADDR_QMC5883L 0x0D

typedef enum {
    CHIP_NONE    = 0,
    CHIP_HMC5883 = 1,
    CHIP_QMC5883 = 2
} ChipType;

class HMC5883L_Plugin {
private:
    int16_t _x_offset, _y_offset, _z_offset;
    float _x_scale, _y_scale, _z_scale;
    int16_t _x_raw, _y_raw, _z_raw;
    float _heading;
    float _declination;
    int _sda_pin, _scl_pin;
    unsigned long _last_update;
    bool _updated;
    ChipType _chip;       // ชนิด chip ที่ตรวจพบ
    uint8_t _address;     // address ที่ใช้งานจริง

    void writeRegister(uint8_t reg, uint8_t value);
    void readRegisters(uint8_t reg, uint8_t* buffer, uint8_t len);

public:
    HMC5883L_Plugin(int sda = -1, int scl = -1);
    bool begin();         // auto-detect chip
    ChipType getChip() { return _chip; }

    void readRaw();
    float getHeading();
    void update(uint16_t interval_ms = 500);
    bool isUpdated();

    int16_t getX() { return _x_raw; }
    int16_t getY() { return _y_raw; }
    int16_t getZ() { return _z_raw; }
    float getCachedHeading() { return _heading; }

    void setDeclination(float deg) { _declination = deg; }
    void calibrate(uint16_t samples = 500);
    void setCalibrationOffsets(int16_t x, int16_t y, int16_t z);
    void setCalibrationScales(float x, float y, float z);
    void applyCalibration(int16_t &x, int16_t &y, int16_t &z);
};

#endif
