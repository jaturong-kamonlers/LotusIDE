#ifndef BMP280_PLUGIN_H
#define BMP280_PLUGIN_H

#include <Arduino.h>
#include <Wire.h>
#include <math.h>

#define BMP280_ADDR_DEFAULT  0x76
#define BMP280_ADDR_ALT      0x77

// Register map
#define BMP280_REG_ID         0xD0
#define BMP280_REG_RESET      0xE0
#define BMP280_REG_STATUS     0xF3
#define BMP280_REG_CTRL_MEAS  0xF4
#define BMP280_REG_CONFIG     0xF5
#define BMP280_REG_PRESS_MSB  0xF7
#define BMP280_REG_CALIB00    0x88

#define BMP280_CHIP_ID        0x58
#define BME280_CHIP_ID        0x60

class BMP280_Plugin {
private:
    uint8_t  _address;

    // Calibration data
    uint16_t _dig_T1;
    int16_t  _dig_T2, _dig_T3;
    uint16_t _dig_P1;
    int16_t  _dig_P2, _dig_P3, _dig_P4;
    int16_t  _dig_P5, _dig_P6, _dig_P7;
    int16_t  _dig_P8, _dig_P9;
    int32_t  _t_fine;

    float    _temperature;
    float    _pressure;
    float    _altitude;
    float    _sea_level_hpa;

    unsigned long _last_update;
    bool     _updated;
    bool     _found;

    void     writeRegister(uint8_t reg, uint8_t value);
    uint8_t  readRegister(uint8_t reg);
    void     readRegisters(uint8_t reg, uint8_t* buf, uint8_t len);
    void     readCalibration();
    int32_t  compensateTemp(int32_t adc_T);
    uint32_t compensatePress(int32_t adc_P);

public:
    BMP280_Plugin(uint8_t address = BMP280_ADDR_DEFAULT);

    bool  begin();
    bool  isConnected();

    void  update(uint16_t interval_ms = 100);
    bool  isUpdated();

    float getTemperature() { return _temperature; }
    float getPressure()    { return _pressure; }
    float getAltitude()    { return _altitude; }
    void  setSeaLevelPressure(float hpa) { _sea_level_hpa = hpa; }
};

#endif
