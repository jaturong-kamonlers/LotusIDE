#ifndef LOTUS_LINE_PID2_H
#define LOTUS_LINE_PID2_H

#include <Arduino.h>

#define LINEPID_MAX_SENSORS 16

// ─── Sensor Mode ────────────────────────────────────────────────
typedef enum {
    MODE_DIGITAL   = 0,   // digitalRead() บนขาปกติ
    MODE_ANALOG    = 1,   // analogRead()  บนขาปกติ
    MODE_QTR_A     = 2,   // QTR-8A  (analog,  1-2 บอร์ด)
    MODE_QTR_RC    = 3,   // QTR-8RC (digital RC-charge, 1-2 บอร์ด)
    MODE_MUX4067   = 4    // CD74HC4067 16-ch analog mux
} SensorMode;

class LotusLinePID {
private:
    // ── Config ──────────────────────────────────────────────────
    uint8_t    _pins[LINEPID_MAX_SENSORS];   // ขา sensor (Digital/Analog/QTR)
    uint8_t    _count;                        // จำนวน sensor จริง
    SensorMode _mode;

    // QTR-RC timeout (microseconds)
    uint16_t   _rc_timeout;

    // CD74HC4067 mux pins
    uint8_t    _mux_s0, _mux_s1, _mux_s2, _mux_s3;  // select pins
    uint8_t    _mux_sig;                               // SIG (analog in)
    uint8_t    _mux_en;                                // EN pin (255=unused)

    // ── Calibration ─────────────────────────────────────────────
    int        _cal_min[LINEPID_MAX_SENSORS];
    int        _cal_max[LINEPID_MAX_SENSORS];
    bool       _calibrated;

    // ── Values ──────────────────────────────────────────────────
    int        _raw[LINEPID_MAX_SENSORS];
    int        _norm[LINEPID_MAX_SENSORS];   // 0=white 1000=black
    float      _position;                    // 0.0~1.0
    bool       _on_line;

    // ── PID ─────────────────────────────────────────────────────
    float      _kp, _ki, _kd;
    float      _setpoint;
    float      _last_error;
    float      _integral;
    float      _output;
    unsigned long _last_time;

    // ── Private helpers ─────────────────────────────────────────
    int  readOne(uint8_t idx);
    void normalize();
    void calcPosition();

public:
    LotusLinePID();

    // ── Setup methods (เรียกตาม mode) ───────────────────────────

    // Digital: กำหนดขาแต่ละตัว
    void beginDigital(uint8_t* pins, uint8_t count);

    // Analog: กำหนดขาแต่ละตัว
    void beginAnalog(uint8_t* pins, uint8_t count);

    // QTR-8A (analog): pins[0..7] หรือ pins[0..15] (1-2 บอร์ด)
    void beginQTR_A(uint8_t* pins, uint8_t count);

    // QTR-8RC (RC timing): pins[0..7] หรือ pins[0..15] (1-2 บอร์ด)
    void beginQTR_RC(uint8_t* pins, uint8_t count, uint16_t timeout_us = 2500);

    // CD74HC4067: s0,s1,s2,s3 = select pins, sig = analog pin, en = enable pin (255=skip)
    void beginMux4067(uint8_t s0, uint8_t s1, uint8_t s2, uint8_t s3,
                      uint8_t sig, uint8_t en = 255);

    // ── Calibration ─────────────────────────────────────────────
    void calibrateStart();
    void calibrateSample();
    void calibrateEnd();

    // ── Read ────────────────────────────────────────────────────
    void  readSensors();
    int   getRaw(uint8_t idx)  { return (idx < _count) ? _raw[idx]  : 0; }
    int   getNorm(uint8_t idx) { return (idx < _count) ? _norm[idx] : 0; }
    bool  onLine()             { return _on_line; }
    float getPosition()        { return _position; }

    // ── PID ─────────────────────────────────────────────────────
    void  setGains(float kp, float ki, float kd) { _kp=kp; _ki=ki; _kd=kd; }
    void  setKp(float v) { _kp = v; }
    void  setKi(float v) { _ki = v; }
    void  setKd(float v) { _kd = v; }
    void  setSetpoint(float sp) { _setpoint = sp; }
    void  resetPID();
    float compute();
    float getOutput() { return _output; }
    float getError()  { return _position - _setpoint; }
};

#endif
