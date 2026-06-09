#include "LotusGY87.h"

#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif
#define DEG2RAD (M_PI / 180.0f)
#define RAD2DEG (180.0f / M_PI)

// ════════════════════════════════════════════════════════════════
//  CONSTRUCTOR
// ════════════════════════════════════════════════════════════════
LotusGY87::LotusGY87() {
    _ax=_ay=_az=0; _gx=_gy=_gz=0; _mx=_my=_mz=0;
    _ax0=_ay0=_az0=0; _gx0=_gy0=_gz0=0;
    _accelScale = 16384.0f;   // ±2g default
    _gyroScale  = 131.0f;     // ±250dps default
    _q0=1; _q1=_q2=_q3=0;
    _madgwickBeta = 0.1f;
    _lastUpdate   = 0;
    _pitch=_roll=_yaw=0;
    _bmpTemp=_pressure=_altitude=0;
    _seaLevelPa = 101325.0f;
    _mpuTemp = 0;
}

// ════════════════════════════════════════════════════════════════
//  MPU6050 LOW-LEVEL
// ════════════════════════════════════════════════════════════════
void LotusGY87::mpuWrite(uint8_t reg, uint8_t val) {
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(reg); Wire.write(val);
    Wire.endTransmission(true);
}
uint8_t LotusGY87::mpuRead(uint8_t reg) {
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(reg);
    Wire.endTransmission(true);
    Wire.requestFrom((uint8_t)MPU6050_ADDR, (uint8_t)1);
    return Wire.available() ? Wire.read() : 0;
}
void LotusGY87::mpuReadBytes(uint8_t reg, uint8_t* buf, uint8_t len) {
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(reg);
    Wire.endTransmission(true);
    Wire.requestFrom((uint8_t)MPU6050_ADDR, len);
    for (uint8_t i = 0; i < len && Wire.available(); i++) buf[i] = Wire.read();
}

// ════════════════════════════════════════════════════════════════
//  HMC5883L LOW-LEVEL  (via I2C bypass of MPU6050)
// ════════════════════════════════════════════════════════════════
void LotusGY87::hmcWrite(uint8_t reg, uint8_t val) {
    Wire.beginTransmission(HMC5883L_ADDR);
    Wire.write(reg); Wire.write(val);
    Wire.endTransmission(true);
}
void LotusGY87::hmcReadBytes(uint8_t reg, uint8_t* buf, uint8_t len) {
    Wire.beginTransmission(HMC5883L_ADDR);
    Wire.write(reg);
    Wire.endTransmission(true);
    Wire.requestFrom((uint8_t)HMC5883L_ADDR, len);
    for (uint8_t i = 0; i < len && Wire.available(); i++) buf[i] = Wire.read();
}

// ════════════════════════════════════════════════════════════════
//  BMP180 LOW-LEVEL
// ════════════════════════════════════════════════════════════════
uint8_t LotusGY87::bmpRead(uint8_t reg) {
    Wire.beginTransmission(BMP180_ADDR);
    Wire.write(reg);
    Wire.endTransmission(true);
    Wire.requestFrom((uint8_t)BMP180_ADDR, (uint8_t)1);
    return Wire.available() ? Wire.read() : 0;
}

void LotusGY87::bmpReadCal() {
    // Read 22 bytes calibration data from 0xAA
    Wire.beginTransmission(BMP180_ADDR);
    Wire.write(BMP180_CAL_AC1);
    Wire.endTransmission(true);
    Wire.requestFrom((uint8_t)BMP180_ADDR, (uint8_t)22);
    uint8_t buf[22] = {0};
    for (uint8_t i = 0; i < 22 && Wire.available(); i++) buf[i] = Wire.read();

    _AC1 = (int16_t) ((buf[0]  << 8) | buf[1]);
    _AC2 = (int16_t) ((buf[2]  << 8) | buf[3]);
    _AC3 = (int16_t) ((buf[4]  << 8) | buf[5]);
    _AC4 = (uint16_t)((buf[6]  << 8) | buf[7]);
    _AC5 = (uint16_t)((buf[8]  << 8) | buf[9]);
    _AC6 = (uint16_t)((buf[10] << 8) | buf[11]);
    _B1  = (int16_t) ((buf[12] << 8) | buf[13]);
    _B2  = (int16_t) ((buf[14] << 8) | buf[15]);
    _MB  = (int16_t) ((buf[16] << 8) | buf[17]);
    _MC  = (int16_t) ((buf[18] << 8) | buf[19]);
    _MD  = (int16_t) ((buf[20] << 8) | buf[21]);
}

int32_t LotusGY87::bmpReadRawTemp() {
    Wire.beginTransmission(BMP180_ADDR);
    Wire.write(BMP180_CTRL); Wire.write(0x2E);
    Wire.endTransmission(true);
    delay(5);
    Wire.beginTransmission(BMP180_ADDR);
    Wire.write(BMP180_DATA);
    Wire.endTransmission(true);
    Wire.requestFrom((uint8_t)BMP180_ADDR, (uint8_t)2);
    uint8_t a = Wire.available() ? Wire.read() : 0;
    uint8_t b = Wire.available() ? Wire.read() : 0;
    return (int32_t)((a << 8) | b);
}

int32_t LotusGY87::bmpReadRawPressure() {
    Wire.beginTransmission(BMP180_ADDR);
    Wire.write(BMP180_CTRL);
    Wire.write(0x34 + (BMP180_OSS << 6));
    Wire.endTransmission(true);
    delay(26);  // OSS=3 → 25.5ms
    Wire.beginTransmission(BMP180_ADDR);
    Wire.write(BMP180_DATA);
    Wire.endTransmission(true);
    Wire.requestFrom((uint8_t)BMP180_ADDR, (uint8_t)3);
    uint8_t msb  = Wire.available() ? Wire.read() : 0;
    uint8_t lsb  = Wire.available() ? Wire.read() : 0;
    uint8_t xlsb = Wire.available() ? Wire.read() : 0;
    return (int32_t)(((uint32_t)msb << 16 | (uint32_t)lsb << 8 | xlsb) >> (8 - BMP180_OSS));
}

// ════════════════════════════════════════════════════════════════
//  BEGIN
// ════════════════════════════════════════════════════════════════
bool LotusGY87::begin() {
    Wire.begin();
    delay(100);

    // ── MPU6050: wake up, set clock source ──────────────────────
    mpuWrite(MPU_PWR_MGMT_1, 0x00);   // clear sleep
    delay(10);
    mpuWrite(MPU_PWR_MGMT_1, 0x01);   // PLL with X gyro
    mpuWrite(MPU_SMPLRT_DIV, 0x07);   // 1kHz / (7+1) = 125Hz
    mpuWrite(MPU_CONFIG,     0x06);   // DLPF 5Hz
    mpuWrite(MPU_GYRO_CFG,   0x00);   // ±250dps
    mpuWrite(MPU_ACCEL_CFG,  0x00);   // ±2g

    // ── Enable I2C bypass so HMC5883L is visible ─────────────────
    mpuWrite(MPU_USER_CTRL,  0x00);   // disable I2C master
    mpuWrite(MPU_INT_PIN_CFG,0x02);   // bypass enable
    delay(10);

    // ── HMC5883L init ────────────────────────────────────────────
    hmcWrite(HMC_CONFIG_A, 0x70);  // 8 samples, 15Hz
    hmcWrite(HMC_CONFIG_B, 0x20);  // gain 1090 LSB/gauss
    hmcWrite(HMC_MODE,     0x00);  // continuous measurement

    // ── BMP180 calibration ───────────────────────────────────────
    bmpReadCal();

    _lastUpdate = micros();
    return true;
}

// ════════════════════════════════════════════════════════════════
//  CONFIG
// ════════════════════════════════════════════════════════════════
void LotusGY87::setAccelRange(AccelRange r) {
    mpuWrite(MPU_ACCEL_CFG, (uint8_t)(r << 3));
    float scales[] = {16384.0f, 8192.0f, 4096.0f, 2048.0f};
    _accelScale = scales[r];
}
void LotusGY87::setGyroRange(GyroRange r) {
    mpuWrite(MPU_GYRO_CFG, (uint8_t)(r << 3));
    float scales[] = {131.0f, 65.5f, 32.8f, 16.4f};
    _gyroScale = scales[r];
}

// ════════════════════════════════════════════════════════════════
//  CALIBRATE  (บอร์ดต้องนิ่ง)
// ════════════════════════════════════════════════════════════════
void LotusGY87::calibrate(uint16_t samples) {
    float sax=0,say=0,saz=0,sgx=0,sgy=0,sgz=0;
    for (uint16_t i = 0; i < samples; i++) {
        uint8_t buf[14];
        mpuReadBytes(MPU_ACCEL_XOUT_H, buf, 14);
        sax += (int16_t)((buf[0]<<8)|buf[1]);
        say += (int16_t)((buf[2]<<8)|buf[3]);
        saz += (int16_t)((buf[4]<<8)|buf[5]);
        sgx += (int16_t)((buf[8]<<8)|buf[9]);
        sgy += (int16_t)((buf[10]<<8)|buf[11]);
        sgz += (int16_t)((buf[12]<<8)|buf[13]);
        delay(2);
    }
    float n = (float)samples;
    _ax0 = sax/n/_accelScale;
    _ay0 = say/n/_accelScale;
    _az0 = saz/n/_accelScale - 1.0f;  // subtract gravity 1g
    _gx0 = sgx/n/_gyroScale;
    _gy0 = sgy/n/_gyroScale;
    _gz0 = sgz/n/_gyroScale;
}

// ════════════════════════════════════════════════════════════════
//  MADGWICK AHRS UPDATE
//  Based on Madgwick's open-source algorithm (gradient descent)
// ════════════════════════════════════════════════════════════════
void LotusGY87::madgwickUpdate(float dt) {
    float q0=_q0, q1=_q1, q2=_q2, q3=_q3;
    float beta = _madgwickBeta;

    // Normalize accelerometer
    float norm = sqrtf(_ax*_ax + _ay*_ay + _az*_az);
    if (norm < 0.001f) return;
    float ax = _ax/norm, ay = _ay/norm, az = _az/norm;

    // Normalize magnetometer
    float mn = sqrtf(_mx*_mx + _my*_my + _mz*_mz);
    if (mn < 0.001f) mn = 1.0f;
    float mx = _mx/mn, my = _my/mn, mz = _mz/mn;

    // Gyro in rad/s
    float gx = _gx * DEG2RAD;
    float gy = _gy * DEG2RAD;
    float gz = _gz * DEG2RAD;

    // Reference direction of Earth's magnetic field
    float hx = 2.0f*(mx*(0.5f-q2*q2-q3*q3) + my*(q1*q2-q0*q3) + mz*(q1*q3+q0*q2));
    float hy = 2.0f*(mx*(q1*q2+q0*q3) + my*(0.5f-q1*q1-q3*q3) + mz*(q2*q3-q0*q1));
    float bx = sqrtf(hx*hx + hy*hy);
    float bz = 2.0f*(mx*(q1*q3-q0*q2) + my*(q2*q3+q0*q1) + mz*(0.5f-q1*q1-q2*q2));

    // Gradient descent step
    float s0 = -2.0f*q2*(2.0f*q1*q3-2.0f*q0*q2-ax)
               +2.0f*q1*(2.0f*q0*q1+2.0f*q2*q3-ay)
               -4.0f*q0*(1.0f-2.0f*q1*q1-2.0f*q2*q2-az)
               +(-4.0f*bz*q2*(bx*(0.5f-q2*q2-q3*q3)+bz*(q1*q3-q0*q2)-mx)
               +(-2.0f*bx*q3+2.0f*bz*q1)*(bx*(q1*q2-q0*q3)+bz*(q2*q3+q0*q1)-my)
               +(2.0f*bx*q2)*(bx*(q1*q3+q0*q2)+bz*(0.5f-q1*q1-q2*q2)-mz));
    float s1 = 2.0f*q3*(2.0f*q1*q3-2.0f*q0*q2-ax)
               +2.0f*q0*(2.0f*q0*q1+2.0f*q2*q3-ay)
               -4.0f*q1*(1.0f-2.0f*q1*q1-2.0f*q2*q2-az)
               +2.0f*bz*q3*(bx*(0.5f-q2*q2-q3*q3)+bz*(q1*q3-q0*q2)-mx)
               +(2.0f*bx*q2+2.0f*bz*q0)*(bx*(q1*q2-q0*q3)+bz*(q2*q3+q0*q1)-my)
               +(2.0f*bx*q3-4.0f*bz*q1)*(bx*(q1*q3+q0*q2)+bz*(0.5f-q1*q1-q2*q2)-mz);
    float s2 = -2.0f*q0*(2.0f*q1*q3-2.0f*q0*q2-ax)
               +2.0f*q3*(2.0f*q0*q1+2.0f*q2*q3-ay)
               -4.0f*q2*(1.0f-2.0f*q1*q1-2.0f*q2*q2-az)
               +(-4.0f*bx*q2-2.0f*bz*q0)*(bx*(0.5f-q2*q2-q3*q3)+bz*(q1*q3-q0*q2)-mx)
               +(2.0f*bx*q1+2.0f*bz*q3)*(bx*(q1*q2-q0*q3)+bz*(q2*q3+q0*q1)-my)
               +(2.0f*bx*q0-4.0f*bz*q2)*(bx*(q1*q3+q0*q2)+bz*(0.5f-q1*q1-q2*q2)-mz);
    float s3 = 2.0f*q1*(2.0f*q1*q3-2.0f*q0*q2-ax)
               -2.0f*q2*(2.0f*q0*q1+2.0f*q2*q3-ay)
               +(-2.0f*bx*q3+2.0f*bz*q1)*(bx*(0.5f-q2*q2-q3*q3)+bz*(q1*q3-q0*q2)-mx)
               +(-2.0f*bx*q0+2.0f*bz*q2)*(bx*(q1*q2-q0*q3)+bz*(q2*q3+q0*q1)-my)
               +(2.0f*bx*q1)*(bx*(q1*q3+q0*q2)+bz*(0.5f-q1*q1-q2*q2)-mz);

    norm = sqrtf(s0*s0+s1*s1+s2*s2+s3*s3);
    if (norm > 0.001f) { s0/=norm; s1/=norm; s2/=norm; s3/=norm; }

    // Integrate quaternion rate
    _q0 += (-q1*gx - q2*gy - q3*gz) * 0.5f*dt - beta*s0*dt;
    _q1 += ( q0*gx + q2*gz - q3*gy) * 0.5f*dt - beta*s1*dt;
    _q2 += ( q0*gy - q1*gz + q3*gx) * 0.5f*dt - beta*s2*dt;
    _q3 += ( q0*gz + q1*gy - q2*gx) * 0.5f*dt - beta*s3*dt;

    // Normalize quaternion
    norm = sqrtf(_q0*_q0+_q1*_q1+_q2*_q2+_q3*_q3);
    if (norm > 0.001f) { _q0/=norm; _q1/=norm; _q2/=norm; _q3/=norm; }

    // Quaternion to Euler
    _roll  =  atan2f(2.0f*(_q0*_q1+_q2*_q3), 1.0f-2.0f*(_q1*_q1+_q2*_q2)) * RAD2DEG;
    float sinP = 2.0f*(_q0*_q2-_q3*_q1);
    sinP = constrain(sinP, -1.0f, 1.0f);
    _pitch = asinf(sinP) * RAD2DEG;
    _yaw   =  atan2f(2.0f*(_q0*_q3+_q1*_q2), 1.0f-2.0f*(_q2*_q2+_q3*_q3)) * RAD2DEG;
    if (_yaw < 0) _yaw += 360.0f;
}

// ════════════════════════════════════════════════════════════════
//  UPDATE  — call once per loop
// ════════════════════════════════════════════════════════════════
void LotusGY87::update() {
    unsigned long now = micros();
    float dt = (float)(now - _lastUpdate) / 1000000.0f;
    if (dt <= 0.0f || dt > 1.0f) dt = 0.01f;
    _lastUpdate = now;

    // ── MPU6050: read Accel + Temp + Gyro (14 bytes) ─────────────
    uint8_t buf[14];
    mpuReadBytes(MPU_ACCEL_XOUT_H, buf, 14);
    int16_t rawAx = (int16_t)((buf[0]<<8)|buf[1]);
    int16_t rawAy = (int16_t)((buf[2]<<8)|buf[3]);
    int16_t rawAz = (int16_t)((buf[4]<<8)|buf[5]);
    int16_t rawT  = (int16_t)((buf[6]<<8)|buf[7]);
    int16_t rawGx = (int16_t)((buf[8]<<8)|buf[9]);
    int16_t rawGy = (int16_t)((buf[10]<<8)|buf[11]);
    int16_t rawGz = (int16_t)((buf[12]<<8)|buf[13]);

    _ax = (float)rawAx / _accelScale - _ax0;
    _ay = (float)rawAy / _accelScale - _ay0;
    _az = (float)rawAz / _accelScale - _az0;
    _gx = (float)rawGx / _gyroScale  - _gx0;
    _gy = (float)rawGy / _gyroScale  - _gy0;
    _gz = (float)rawGz / _gyroScale  - _gz0;
    _mpuTemp = (float)rawT / 340.0f + 36.53f;

    // ── HMC5883L: read 6 bytes ────────────────────────────────────
    uint8_t hbuf[6];
    hmcReadBytes(HMC_DATA_XH, hbuf, 6);
    // HMC byte order: X_H X_L Z_H Z_L Y_H Y_L
    int16_t rawMx = (int16_t)((hbuf[0]<<8)|hbuf[1]);
    int16_t rawMz = (int16_t)((hbuf[2]<<8)|hbuf[3]);
    int16_t rawMy = (int16_t)((hbuf[4]<<8)|hbuf[5]);
    _mx = (float)rawMx / 1090.0f;
    _my = (float)rawMy / 1090.0f;
    _mz = (float)rawMz / 1090.0f;

    // ── Madgwick AHRS ─────────────────────────────────────────────
    madgwickUpdate(dt);

    // ── BMP180: read temp + pressure ─────────────────────────────
    int32_t UT = bmpReadRawTemp();
    int32_t UP = bmpReadRawPressure();

    // BMP180 temperature compensation
    int32_t X1 = ((UT - (int32_t)_AC6) * (int32_t)_AC5) >> 15;
    int32_t X2 = ((int32_t)_MC << 11) / (X1 + _MD);
    int32_t B5 = X1 + X2;
    _bmpTemp = (float)((B5 + 8) >> 4) / 10.0f;

    // BMP180 pressure compensation
    int32_t B6 = B5 - 4000;
    X1 = (_B2 * (B6 * B6 >> 12)) >> 11;
    X2 = _AC2 * B6 >> 11;
    int32_t X3 = X1 + X2;
    int32_t B3 = (((int32_t)_AC1 * 4 + X3) << BMP180_OSS) + 2;
    B3 >>= 2;
    X1 = _AC3 * B6 >> 13;
    X2 = (_B1 * (B6 * B6 >> 12)) >> 16;
    X3 = ((X1 + X2) + 2) >> 2;
    uint32_t B4 = (uint32_t)_AC4 * (uint32_t)(X3 + 32768) >> 15;
    uint32_t B7 = ((uint32_t)UP - B3) * (50000 >> BMP180_OSS);
    int32_t  p;
    if (B7 < 0x80000000UL) p = (int32_t)((B7 * 2) / B4);
    else                   p = (int32_t)((B7 / B4) * 2);
    X1 = (p >> 8) * (p >> 8);
    X1 = (X1 * 3038) >> 16;
    X2 = (-7357 * p) >> 16;
    _pressure = (float)(p + ((X1 + X2 + 3791) >> 4));

    // Altitude (ISA standard atmosphere)
    _altitude = 44330.0f * (1.0f - powf(_pressure / _seaLevelPa, 0.1903f));
}

// ════════════════════════════════════════════════════════════════
//  HEADING  (tilt-compensated using pitch/roll)
// ════════════════════════════════════════════════════════════════
float LotusGY87::heading() {
    float pitchR = _pitch * DEG2RAD;
    float rollR  = _roll  * DEG2RAD;
    float cosP = cosf(pitchR), sinP = sinf(pitchR);
    float cosR = cosf(rollR),  sinR = sinf(rollR);
    float xh = _mx * cosP + _mz * sinP;
    float yh = _mx * sinR * sinP + _my * cosR - _mz * sinR * cosP;
    float h  = atan2f(yh, xh) * RAD2DEG;
    if (h < 0) h += 360.0f;
    return h;
}
