#include "LotusLinePID.h"

LotusLinePID::LotusLinePID() {
    _count      = 0;
    _mode       = MODE_DIGITAL;
    _rc_timeout = 2500;
    _mux_s0 = _mux_s1 = _mux_s2 = _mux_s3 = 0;
    _mux_sig = _mux_en = 0;
    _calibrated = false;
    _position   = 0.5;
    _on_line    = false;
    _kp = 1.0; _ki = 0.0; _kd = 0.0;
    _setpoint   = 0.5;
    _last_error = 0.0;
    _integral   = 0.0;
    _output     = 0.0;
    _last_time  = 0;
    for (uint8_t i = 0; i < LINEPID_MAX_SENSORS; i++) {
        _pins[i] = 0; _raw[i] = 0; _norm[i] = 0;
        _cal_min[i] = 0; _cal_max[i] = 1023;
    }
}

// ════════════════════════════════════════════════════════════════
//  BEGIN methods
// ════════════════════════════════════════════════════════════════

void LotusLinePID::beginDigital(uint8_t* pins, uint8_t count) {
    _mode  = MODE_DIGITAL;
    _count = min(count, (uint8_t)LINEPID_MAX_SENSORS);
    for (uint8_t i = 0; i < _count; i++) {
        _pins[i] = pins[i];
        pinMode(_pins[i], INPUT);
        _cal_min[i] = 0; _cal_max[i] = 1;
    }
}

void LotusLinePID::beginAnalog(uint8_t* pins, uint8_t count) {
    _mode  = MODE_ANALOG;
    _count = min(count, (uint8_t)LINEPID_MAX_SENSORS);
    for (uint8_t i = 0; i < _count; i++) {
        _pins[i] = pins[i];
        _cal_min[i] = 0; _cal_max[i] = 1023;
    }
}

void LotusLinePID::beginQTR_A(uint8_t* pins, uint8_t count) {
    _mode  = MODE_QTR_A;
    _count = min(count, (uint8_t)LINEPID_MAX_SENSORS);
    for (uint8_t i = 0; i < _count; i++) {
        _pins[i] = pins[i];
        _cal_min[i] = 0; _cal_max[i] = 1023;
    }
}

void LotusLinePID::beginQTR_RC(uint8_t* pins, uint8_t count, uint16_t timeout_us) {
    _mode       = MODE_QTR_RC;
    _rc_timeout = timeout_us;
    _count      = min(count, (uint8_t)LINEPID_MAX_SENSORS);
    for (uint8_t i = 0; i < _count; i++) {
        _pins[i] = pins[i];
        _cal_min[i] = 0; _cal_max[i] = (int)timeout_us;
    }
}

void LotusLinePID::beginMux4067(uint8_t s0, uint8_t s1, uint8_t s2, uint8_t s3,
                                  uint8_t sig, uint8_t en) {
    _mode    = MODE_MUX4067;
    _count   = 16;
    _mux_s0  = s0; _mux_s1 = s1; _mux_s2 = s2; _mux_s3 = s3;
    _mux_sig = sig;
    _mux_en  = en;
    pinMode(_mux_s0, OUTPUT); pinMode(_mux_s1, OUTPUT);
    pinMode(_mux_s2, OUTPUT); pinMode(_mux_s3, OUTPUT);
    if (_mux_en != 255) { pinMode(_mux_en, OUTPUT); digitalWrite(_mux_en, LOW); }
    for (uint8_t i = 0; i < 16; i++) {
        _pins[i] = i;
        _cal_min[i] = 0; _cal_max[i] = 1023;
    }
}

// ════════════════════════════════════════════════════════════════
//  READ ONE SENSOR
// ════════════════════════════════════════════════════════════════
int LotusLinePID::readOne(uint8_t idx) {
    switch (_mode) {

        case MODE_DIGITAL:
            return digitalRead(_pins[idx]);

        case MODE_ANALOG:
        case MODE_QTR_A:
            return analogRead(_pins[idx]);

        case MODE_QTR_RC: {
            // RC timing: ชาร์จ capacitor แล้วจับเวลาที่ขาลง
            // สีดำ = reflectance ต่ำ = discharge เร็ว = เวลาสั้น
            // สีขาว = reflectance สูง = discharge ช้า  = เวลานาน
            // norm ต่อมา: ดำ=1000 (invert)
            pinMode(_pins[idx], OUTPUT);
            digitalWrite(_pins[idx], HIGH);
            delayMicroseconds(10);
            pinMode(_pins[idx], INPUT);
            unsigned long t = micros();
            while (digitalRead(_pins[idx]) == HIGH) {
                if ((unsigned long)(micros() - t) >= _rc_timeout) {
                    return (int)_rc_timeout;
                }
            }
            return (int)(micros() - t);
        }

        case MODE_MUX4067: {
            // เลือก channel ผ่าน S0-S3
            digitalWrite(_mux_s0, (idx >> 0) & 1);
            digitalWrite(_mux_s1, (idx >> 1) & 1);
            digitalWrite(_mux_s2, (idx >> 2) & 1);
            digitalWrite(_mux_s3, (idx >> 3) & 1);
            delayMicroseconds(2);   // รอ mux settle
            return analogRead(_mux_sig);
        }

        default:
            return 0;
    }
}

// ════════════════════════════════════════════════════════════════
//  CALIBRATION
// ════════════════════════════════════════════════════════════════
void LotusLinePID::calibrateStart() {
    int maxVal = (_mode == MODE_QTR_RC) ? (int)_rc_timeout : 1023;
    for (uint8_t i = 0; i < _count; i++) {
        _cal_min[i] = maxVal;
        _cal_max[i] = 0;
    }
    _calibrated = false;
}

void LotusLinePID::calibrateSample() {
    for (uint8_t i = 0; i < _count; i++) {
        int v = readOne(i);
        if (v < _cal_min[i]) _cal_min[i] = v;
        if (v > _cal_max[i]) _cal_max[i] = v;
    }
}

void LotusLinePID::calibrateEnd() {
    int maxVal = (_mode == MODE_QTR_RC) ? (int)_rc_timeout : 1023;
    for (uint8_t i = 0; i < _count; i++) {
        if (_cal_max[i] <= _cal_min[i]) {
            _cal_min[i] = 0;
            _cal_max[i] = maxVal;
        }
    }
    _calibrated = true;
}

// ════════════════════════════════════════════════════════════════
//  NORMALIZE  →  0 = white,  1000 = black
// ════════════════════════════════════════════════════════════════
void LotusLinePID::normalize() {
    for (uint8_t i = 0; i < _count; i++) {
        int v = _raw[i];
        int norm = 0;

        switch (_mode) {
            case MODE_DIGITAL:
                // ขาว=1, ดำ=0 (active LOW)  → ดำ = norm 1000
                norm = (v == 0) ? 1000 : 0;
                break;

            case MODE_ANALOG:
            case MODE_QTR_A:
            case MODE_MUX4067:
                // QTR-A / Analog: ค่าต่ำ = สะท้อนน้อย = ดำ
                // ดำ = raw ต่ำ → norm สูง  (invert)
                if (_calibrated) {
                    norm = map(v, _cal_min[i], _cal_max[i], 1000, 0);
                } else {
                    norm = map(v, 0, 1023, 1000, 0);
                }
                break;

            case MODE_QTR_RC:
                // RC time: ดำ = discharge เร็ว = เวลาสั้น = raw ต่ำ → norm สูง (invert)
                if (_calibrated) {
                    norm = map(v, _cal_min[i], _cal_max[i], 1000, 0);
                } else {
                    norm = map(v, 0, (int)_rc_timeout, 1000, 0);
                }
                break;
        }
        _norm[i] = constrain(norm, 0, 1000);
    }
}

// ════════════════════════════════════════════════════════════════
//  CALC POSITION  (Weighted Average)
// ════════════════════════════════════════════════════════════════
void LotusLinePID::calcPosition() {
    uint32_t weighted = 0;
    uint32_t total    = 0;
    bool     found    = false;

    for (uint8_t i = 0; i < _count; i++) {
        if (_norm[i] > 200) {
            weighted += (uint32_t)_norm[i] * i * 1000UL;
            total    += _norm[i];
            found     = true;
        }
    }
    _on_line = found;
    if (found && total > 0) {
        float pos = (float)weighted / (float)total;
        _position = pos / (float)(((uint32_t)(_count - 1)) * 1000UL);
        _position = constrain(_position, 0.0f, 1.0f);
    }
    // ถ้าไม่เจอเส้น คง position เดิมไว้
}

// ════════════════════════════════════════════════════════════════
//  READ ALL SENSORS
// ════════════════════════════════════════════════════════════════
void LotusLinePID::readSensors() {
    for (uint8_t i = 0; i < _count; i++) {
        _raw[i] = readOne(i);
    }
    normalize();
    calcPosition();
}

// ════════════════════════════════════════════════════════════════
//  PID
// ════════════════════════════════════════════════════════════════
void LotusLinePID::resetPID() {
    _integral   = 0.0;
    _last_error = 0.0;
    _output     = 0.0;
    _last_time  = millis();
}

float LotusLinePID::compute() {
    unsigned long now = millis();
    float dt = (float)(now - _last_time) / 1000.0f;
    if (dt <= 0.0f) dt = 0.001f;
    _last_time = now;

    float error  = _position - _setpoint;
    _integral   += error * dt;
    _integral    = constrain(_integral, -100.0f, 100.0f);  // anti-windup

    float deriv  = (error - _last_error) / dt;
    _last_error  = error;

    _output = (_kp * error) + (_ki * _integral) + (_kd * deriv);
    return _output;
}
