#ifndef LOTUS_GY87_H
#define LOTUS_GY87_H

#include <Arduino.h>
#include <Wire.h>
#include <math.h>

// ─── I2C Addresses ───────────────────────────────────────────────
#define MPU6050_ADDR    0x68
#define HMC5883L_ADDR   0x1E
#define BMP180_ADDR     0x77

// ─── MPU6050 Registers ───────────────────────────────────────────
#define MPU_PWR_MGMT_1   0x6B
#define MPU_SMPLRT_DIV   0x19
#define MPU_CONFIG       0x1A
#define MPU_GYRO_CFG     0x1B
#define MPU_ACCEL_CFG    0x1C
#define MPU_INT_PIN_CFG  0x37
#define MPU_ACCEL_XOUT_H 0x3B
#define MPU_TEMP_OUT_H   0x41
#define MPU_GYRO_XOUT_H  0x43
#define MPU_USER_CTRL    0x6A

// ─── HMC5883L Registers ──────────────────────────────────────────
#define HMC_CONFIG_A  0x00
#define HMC_CONFIG_B  0x01
#define HMC_MODE      0x02
#define HMC_DATA_XH   0x03

// ─── BMP180 ──────────────────────────────────────────────────────
#define BMP180_CAL_AC1  0xAA
#define BMP180_CTRL     0xF4
#define BMP180_DATA     0xF6
#define BMP180_OSS      3    // oversampling 0-3

// ─── Accel/Gyro ranges ───────────────────────────────────────────
typedef enum { ACCEL_2G=0, ACCEL_4G=1, ACCEL_8G=2, ACCEL_16G=3 } AccelRange;
typedef enum { GYRO_250=0, GYRO_500=1, GYRO_1000=2, GYRO_2000=3 } GyroRange;

class LotusGY87 {
private:
    // ── Raw sensor data ──────────────────────────────────────────
    float _ax, _ay, _az;          // m/s² (calibrated)
    float _gx, _gy, _gz;          // deg/s (calibrated)
    float _mx, _my, _mz;          // gauss
    float _mpuTemp;               // °C from MPU6050

    // ── Calibration offsets ──────────────────────────────────────
    float _ax0, _ay0, _az0;
    float _gx0, _gy0, _gz0;

    // ── Scale factors ────────────────────────────────────────────
    float _accelScale;            // LSB → m/s²
    float _gyroScale;             // LSB → deg/s

    // ── Madgwick filter state ────────────────────────────────────
    float _q0, _q1, _q2, _q3;    // quaternion
    float _madgwickBeta;          // filter gain (default 0.1)
    unsigned long _lastUpdate;

    // ── Attitude output ──────────────────────────────────────────
    float _pitch, _roll, _yaw;    // degrees

    // ── BMP180 calibration ───────────────────────────────────────
    int16_t  _AC1, _AC2, _AC3;
    uint16_t _AC4, _AC5, _AC6;
    int16_t  _B1,  _B2;
    int16_t  _MB,  _MC,  _MD;
    float    _bmpTemp;
    float    _pressure;
    float    _altitude;
    float    _seaLevelPa;

    // ── Private helpers ──────────────────────────────────────────
    void    mpuWrite(uint8_t reg, uint8_t val);
    uint8_t mpuRead(uint8_t reg);
    void    mpuReadBytes(uint8_t reg, uint8_t* buf, uint8_t len);

    void    hmcWrite(uint8_t reg, uint8_t val);
    void    hmcReadBytes(uint8_t reg, uint8_t* buf, uint8_t len);

    uint8_t bmpRead(uint8_t reg);
    void    bmpReadCal();
    int32_t bmpReadRawTemp();
    int32_t bmpReadRawPressure();

    void    madgwickUpdate(float dt);

public:
    LotusGY87();

    // ── Setup ────────────────────────────────────────────────────
    bool begin();

    // ── Configuration ────────────────────────────────────────────
    void setAccelRange(AccelRange r);
    void setGyroRange(GyroRange r);
    void setMadgwickBeta(float beta) { _madgwickBeta = beta; }
    void setSeaLevel(float hPa)      { _seaLevelPa = hPa * 100.0f; }

    // ── Calibrate (collect N samples at rest, compute offsets) ───
    void calibrate(uint16_t samples = 500);

    // ── Update (call once per loop) ──────────────────────────────
    void update();

    // ── MPU6050 data ─────────────────────────────────────────────
    float accelX()   { return _ax; }
    float accelY()   { return _ay; }
    float accelZ()   { return _az; }
    float gyroX()    { return _gx; }
    float gyroY()    { return _gy; }
    float gyroZ()    { return _gz; }
    float mpuTemp()  { return _mpuTemp; }

    // ── Madgwick attitude ────────────────────────────────────────
    float pitch()    { return _pitch; }
    float roll()     { return _roll; }
    float yaw()      { return _yaw; }

    // ── HMC5883L ─────────────────────────────────────────────────
    float magX()     { return _mx; }
    float magY()     { return _my; }
    float magZ()     { return _mz; }
    float heading();

    // ── BMP180 ───────────────────────────────────────────────────
    float bmpTemperature() { return _bmpTemp; }
    float bmpPressure()    { return _pressure; }
    float bmpAltitude()    { return _altitude; }
};

#endif
