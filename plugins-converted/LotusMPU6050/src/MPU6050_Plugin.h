#ifndef MPU6050_PLUGIN_H
#define MPU6050_PLUGIN_H

#include <Arduino.h>
#include <Wire.h>

#define MPU6050_ADDR_DEFAULT  0x68
#define MPU6050_ADDR_ALT      0x69

// Register map
#define MPU6050_REG_PWR_MGMT_1   0x6B
#define MPU6050_REG_ACCEL_CONFIG 0x1C
#define MPU6050_REG_GYRO_CONFIG  0x1B
#define MPU6050_REG_ACCEL_XOUT_H 0x3B
#define MPU6050_REG_GYRO_XOUT_H  0x43
#define MPU6050_REG_TEMP_OUT_H   0x41
#define MPU6050_REG_WHO_AM_I     0x75

// Accelerometer scale
typedef enum {
    ACCEL_2G  = 0,
    ACCEL_4G  = 1,
    ACCEL_8G  = 2,
    ACCEL_16G = 3
} AccelRange;

// Gyroscope scale
typedef enum {
    GYRO_250DPS  = 0,
    GYRO_500DPS  = 1,
    GYRO_1000DPS = 2,
    GYRO_2000DPS = 3
} GyroRange;

class MPU6050_Plugin {
private:
    uint8_t  _address;
    float    _ax, _ay, _az;       // Accelerometer (g)
    float    _gx, _gy, _gz;       // Gyroscope (deg/s)
    float    _temp;                // Temperature (°C)
    float    _pitch, _roll;        // Tilt angles
    float    _accel_scale;
    float    _gyro_scale;
    unsigned long _last_update;
    bool     _updated;

    void writeRegister(uint8_t reg, uint8_t value);
    uint8_t readRegister(uint8_t reg);
    void readRegisters(uint8_t reg, uint8_t* buffer, uint8_t len);

public:
    MPU6050_Plugin(uint8_t address = MPU6050_ADDR_DEFAULT);

    bool begin();
    bool isConnected();

    void update(uint16_t interval_ms = 50);
    bool isUpdated();

    void setAccelRange(AccelRange range);
    void setGyroRange(GyroRange range);

    // Accelerometer (g)
    float getAccelX() { return _ax; }
    float getAccelY() { return _ay; }
    float getAccelZ() { return _az; }

    // Gyroscope (deg/s)
    float getGyroX() { return _gx; }
    float getGyroY() { return _gy; }
    float getGyroZ() { return _gz; }

    // Temperature
    float getTemperature() { return _temp; }

    // Tilt angles
    float getPitch() { return _pitch; }
    float getRoll()  { return _roll; }
};

#endif
