// ============================================================
// Move4ch — Mecanum 4-wheel precise motion for LotusDueBot
// Supports: Encoder-only, IMU-only, Encoder+IMU modes
//
// Wheel / Motor / Encoder mapping (confirmed by shield datasheet):
//   FL (Front-Left)  = motor_single(1) [M1A=37,M1B=36,PWM1=3]  Enc1 [A=46,B=47]
//   FR (Front-Right) = motor_single(2) [M2A=35,M2B=34,PWM2=2]  Enc2 [A=48,B=49]
//   RL (Rear-Left)   = motor_single(3) [M3A=40,M3B=41,PWM3=6]  Enc3 [A=50,B=51]
//   RR (Rear-Right)  = motor_single(4) [M4A=39,M4B=38,PWM4=5]  Enc4 [A=52,B=53]
//
// Mecanum kinematics (+ = wheel rolling forward):
//   FL =  vy + vx + vθ     FR =  vy - vx - vθ
//   RL =  vy - vx + vθ     RR =  vy + vx - vθ
//   where vy=fwd, vx=strafe-right, vθ=spin-CCW (left)
//
// Requires nano_motor.h and nano_encoder.h to be included first.
// MPU6050 on I2C SDA=D20, SCL=D21 (Wire.h already included by LotusDueBot.h)
// ============================================================
#ifndef _MOVE4CH_H_
#define _MOVE4CH_H_

// ---- Mode bit flags ----
#define M4CH_ENC  0x01   // encoder closed-loop
#define M4CH_IMU  0x02   // MPU6050 gyro heading

// ---- MPU6050 registers (I2C addr 0x68) ----
#define _M4_MPU_ADDR   0x68
#define _M4_MPU_PWR    0x6B
#define _M4_MPU_GCFG   0x1B
#define _M4_MPU_GZ_H   0x47
#define _M4_GYRO_SENS  131.0f   // LSB/(°/s) at ±250°/s range

// ---- State ----
static uint8_t _m4_mode        = M4CH_ENC;
static float   _m4_yaw         = 0.0f;
static float   _m4_gz_off      = 0.0f;
static unsigned long _m4_imu_us = 0;

// ---- Tunable parameters (adjust via move4ch_set_kp / move4ch_set_tpd) ----
static float _m4_kp  = 1.0f;   // heading P-gain (0.5=soft, 1.0=default, 2.0=aggressive)
static float _m4_tpd = 5.0f;   // ticks per degree for encoder-only spin (measure on real hardware)

// ---- Low-level IMU helpers ----
static void _m4_mpu_write(uint8_t reg, uint8_t val) {
    Wire.beginTransmission(_M4_MPU_ADDR);
    Wire.write(reg);
    Wire.write(val);
    Wire.endTransmission();
}

static int16_t _m4_mpu_gz() {
    Wire.beginTransmission(_M4_MPU_ADDR);
    Wire.write(_M4_MPU_GZ_H);
    Wire.endTransmission(false);
    Wire.requestFrom((int)_M4_MPU_ADDR, 2);
    return ((int16_t)Wire.read() << 8) | Wire.read();
}

// Integrate gyro Z → yaw (call every loop tick)
static void _m4_imu_tick() {
    unsigned long now = micros();
    float dt = (now - _m4_imu_us) * 1e-6f;
    _m4_imu_us = now;
    if (dt <= 0.0f || dt > 0.1f) dt = 0.01f;
    float rate = (_m4_mpu_gz() - _m4_gz_off) / _M4_GYRO_SENS;
    _m4_yaw += rate * dt;   // CCW = positive
}

// ---- Low-level motor helpers ----
static inline void _m4_set(int fl, int fr, int rl, int rr) {
    motor_single(1, fl);
    motor_single(2, fr);
    motor_single(3, rl);
    motor_single(4, rr);
}
static inline void _m4_brake() { _m4_set(0, 0, 0, 0); }

static inline long  _m4_absl(long v) { return v < 0 ? -v : v; }
static inline int   _m4_clamp(int v, int lo, int hi) {
    return v < lo ? lo : (v > hi ? hi : v);
}

// ---- Heading correction (Mecanum kinematics, vθ component) ----
// Returns correction value for vθ; caller adds/subtracts per wheel:
//   FL += corr   FR -= corr   RL += corr   RR -= corr
static int _m4_heading_corr(float target, int maxAdj) {
    if (_m4_mode & M4CH_IMU) {
        _m4_imu_tick();
        float err = target - _m4_yaw;
        return _m4_clamp((int)(err * _m4_kp), -maxAdj, maxAdj);
    }
    return 0;
}

// ============================================================
//  PUBLIC API
// ============================================================

// -- Init / calibrate --

void move4ch_init(uint8_t mode) {
    _m4_mode = mode;
    if (mode & M4CH_ENC) {
        encoder_init(0x0F);     // all 4 encoders
        encoder_reset(0xFF);
    }
    if (mode & M4CH_IMU) {
        Wire.begin();
        _m4_mpu_write(_M4_MPU_PWR,  0x00);   // wake up
        _m4_mpu_write(_M4_MPU_GCFG, 0x00);   // ±250°/s
        delay(150);
        // flush first noisy reads
        for (int i = 0; i < 20; i++) { _m4_mpu_gz(); delay(5); }
        _m4_yaw    = 0.0f;
        _m4_imu_us = micros();
    }
}

void move4ch_calibrate_imu() {
    // Call while robot is completely still — measures gyro zero-rate offset
    float sum = 0.0f;
    for (int i = 0; i < 200; i++) {
        sum += _m4_mpu_gz();
        delay(5);
    }
    _m4_gz_off = sum / 200.0f;
    _m4_yaw    = 0.0f;
    _m4_imu_us = micros();
}

// -- Motion --

void move4ch_stop() { _m4_brake(); }

void move4ch_set_wheels(int fl, int fr, int rl, int rr) {
    _m4_set(fl, fr, rl, rr);
}

// Forward — encoder sync on all 4 wheels + IMU heading hold
// Each wheel stops individually when it reaches ticks.
void move4ch_forward(long ticks, int speed) {
    if (ticks <= 0 || speed <= 0) return;
    if (speed > 100) speed = 100;
    if (_m4_mode & M4CH_ENC) encoder_reset(0xFF);

    float tgt_hdg  = _m4_yaw;
    unsigned long t0 = millis();
    int adj = speed / 2;

    while (millis() - t0 < 30000UL) {
        long c[4];
        for (int i = 0; i < 4; i++) c[i] = _m4_absl(encoder_read(i + 1));
        bool done = c[0] >= ticks && c[1] >= ticks && c[2] >= ticks && c[3] >= ticks;
        if (done) break;

        // Heading correction via IMU vθ component
        int corr = _m4_heading_corr(tgt_hdg, adj);

        // Encoder-only balance: compare (FL+RL) vs (FR+RR) average
        if (!(_m4_mode & M4CH_IMU) && (_m4_mode & M4CH_ENC)) {
            long avgL = (c[0] + c[2]) / 2;
            long avgR = (c[1] + c[3]) / 2;
            corr = _m4_clamp((int)((avgL - avgR) / 2), -adj, adj);
        }

        // vy=+1 vθ=corr: FL=+corr FR=-corr RL=+corr RR=-corr
        _m4_set(
            (c[0] < ticks) ? _m4_clamp(speed + corr, 0, 100) : 0,
            (c[1] < ticks) ? _m4_clamp(speed - corr, 0, 100) : 0,
            (c[2] < ticks) ? _m4_clamp(speed + corr, 0, 100) : 0,
            (c[3] < ticks) ? _m4_clamp(speed - corr, 0, 100) : 0
        );
        delay(5);
    }
    _m4_brake();
}

// Backward — same logic, negative
void move4ch_backward(long ticks, int speed) {
    if (ticks <= 0 || speed <= 0) return;
    if (speed > 100) speed = 100;
    if (_m4_mode & M4CH_ENC) encoder_reset(0xFF);

    float tgt_hdg = _m4_yaw;
    unsigned long t0 = millis();
    int adj = speed / 2;

    while (millis() - t0 < 30000UL) {
        long c[4];
        for (int i = 0; i < 4; i++) c[i] = _m4_absl(encoder_read(i + 1));
        if (c[0] >= ticks && c[1] >= ticks && c[2] >= ticks && c[3] >= ticks) break;

        int corr = _m4_heading_corr(tgt_hdg, adj);

        if (!(_m4_mode & M4CH_IMU) && (_m4_mode & M4CH_ENC)) {
            long avgL = (c[0] + c[2]) / 2;
            long avgR = (c[1] + c[3]) / 2;
            corr = _m4_clamp((int)((avgL - avgR) / 2), -adj, adj);
        }

        // vy=-1: all negative, vθ correction same sign
        _m4_set(
            (c[0] < ticks) ? -_m4_clamp(speed + corr, 0, 100) : 0,
            (c[1] < ticks) ? -_m4_clamp(speed - corr, 0, 100) : 0,
            (c[2] < ticks) ? -_m4_clamp(speed + corr, 0, 100) : 0,
            (c[3] < ticks) ? -_m4_clamp(speed - corr, 0, 100) : 0
        );
        delay(5);
    }
    _m4_brake();
}

// Spin Left (CCW) — IMU primary; encoder rough fallback
// Mecanum spin-left: FL- FR+ RL- RR+
void move4ch_spin_left(float degrees, int speed) {
    if (degrees <= 0 || speed <= 0) return;
    if (speed > 100) speed = 100;

    float tgt = _m4_yaw - degrees;   // CCW = decreasing yaw
    if (_m4_mode & M4CH_ENC) encoder_reset(0xFF);
    _m4_imu_us = micros();
    unsigned long t0 = millis();

    while (millis() - t0 < 30000UL) {
        if (_m4_mode & M4CH_IMU) {
            _m4_imu_tick();
            if (_m4_yaw <= tgt) break;
        } else {
            // encoder rough: average all 4 absolute ticks
            long avg = (_m4_absl(encoder_read(1)) + _m4_absl(encoder_read(2)) +
                        _m4_absl(encoder_read(3)) + _m4_absl(encoder_read(4))) / 4;
            if (avg >= (long)(degrees * _m4_tpd)) break;
        }
        _m4_set(-speed, speed, -speed, speed);
        delay(5);
    }
    _m4_brake();
}

// Spin Right (CW) — IMU primary; encoder rough fallback
// Mecanum spin-right: FL+ FR- RL+ RR-
void move4ch_spin_right(float degrees, int speed) {
    if (degrees <= 0 || speed <= 0) return;
    if (speed > 100) speed = 100;

    float tgt = _m4_yaw + degrees;
    if (_m4_mode & M4CH_ENC) encoder_reset(0xFF);
    _m4_imu_us = micros();
    unsigned long t0 = millis();

    while (millis() - t0 < 30000UL) {
        if (_m4_mode & M4CH_IMU) {
            _m4_imu_tick();
            if (_m4_yaw >= tgt) break;
        } else {
            long avg = (_m4_absl(encoder_read(1)) + _m4_absl(encoder_read(2)) +
                        _m4_absl(encoder_read(3)) + _m4_absl(encoder_read(4))) / 4;
            if (avg >= (long)(degrees * 5L)) break;
        }
        _m4_set(speed, -speed, speed, -speed);
        delay(5);
    }
    _m4_brake();
}

// Go to absolute heading (uses spin_left/right internally)
void move4ch_set_heading(float target_deg, int speed) {
    if (speed <= 0 || speed > 100) speed = 50;
    float diff = target_deg - _m4_yaw;
    while (diff >  180.0f) diff -= 360.0f;
    while (diff < -180.0f) diff += 360.0f;
    if      (diff >  1.0f) move4ch_spin_right( diff, speed);
    else if (diff < -1.0f) move4ch_spin_left(-diff, speed);
}

// Strafe Left (vx=-1) + heading hold via IMU
// Pattern: FL- FR+ RL+ RR-
// Correction (vθ): FL+=c FR-=c RL+=c RR-=c
void move4ch_strafe_left(long ticks, int speed) {
    if (ticks <= 0 || speed <= 0) return;
    if (speed > 100) speed = 100;
    if (_m4_mode & M4CH_ENC) encoder_reset(0xFF);

    float tgt_hdg = _m4_yaw;
    unsigned long t0 = millis();
    int adj = speed / 2;

    while (millis() - t0 < 30000UL) {
        long avg = (_m4_absl(encoder_read(1)) + _m4_absl(encoder_read(2)) +
                    _m4_absl(encoder_read(3)) + _m4_absl(encoder_read(4))) / 4;
        if (avg >= ticks) break;

        int corr = _m4_heading_corr(tgt_hdg, adj);

        // vx=-1 base: FL=-S FR=+S RL=+S RR=-S  + vθ: FL+c FR-c RL+c RR-c
        _m4_set(
            _m4_clamp(-speed + corr, -100, 0),
            _m4_clamp( speed - corr,    0, 100),
            _m4_clamp( speed + corr,    0, 100),
            _m4_clamp(-speed - corr, -100, 0)
        );
        delay(5);
    }
    _m4_brake();
}

// Strafe Right (vx=+1) + heading hold via IMU
// Pattern: FL+ FR- RL- RR+
void move4ch_strafe_right(long ticks, int speed) {
    if (ticks <= 0 || speed <= 0) return;
    if (speed > 100) speed = 100;
    if (_m4_mode & M4CH_ENC) encoder_reset(0xFF);

    float tgt_hdg = _m4_yaw;
    unsigned long t0 = millis();
    int adj = speed / 2;

    while (millis() - t0 < 30000UL) {
        long avg = (_m4_absl(encoder_read(1)) + _m4_absl(encoder_read(2)) +
                    _m4_absl(encoder_read(3)) + _m4_absl(encoder_read(4))) / 4;
        if (avg >= ticks) break;

        int corr = _m4_heading_corr(tgt_hdg, adj);

        // vx=+1 base: FL=+S FR=-S RL=-S RR=+S  + vθ: FL+c FR-c RL+c RR-c
        _m4_set(
            _m4_clamp( speed + corr,    0, 100),
            _m4_clamp(-speed - corr, -100, 0),
            _m4_clamp(-speed + corr, -100, 0),
            _m4_clamp( speed - corr,    0, 100)
        );
        delay(5);
    }
    _m4_brake();
}

// -- Read --

float move4ch_heading()              { return _m4_yaw; }
long  move4ch_enc_read(uint8_t w)   { return encoder_read(w); }
void  move4ch_enc_reset()           { encoder_reset(0xFF); }

void  move4ch_reset_heading() {
    _m4_yaw    = 0.0f;
    _m4_imu_us = micros();
}

// -- Tuning --

// Set heading P-gain. Start at 1.0; increase if slow to correct, decrease if oscillating.
void move4ch_set_kp(float kp) {
    if (kp < 0.1f) kp = 0.1f;
    if (kp > 5.0f) kp = 5.0f;
    _m4_kp = kp;
}

// Set ticks per degree for encoder-only spin. Measure: spin 360° and divide total ticks by 360.
void move4ch_set_tpd(float tpd) {
    if (tpd < 0.1f) tpd = 0.1f;
    _m4_tpd = tpd;
}

#endif // _MOVE4CH_H_
