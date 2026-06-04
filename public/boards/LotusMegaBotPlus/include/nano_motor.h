// ============================================================
// Motor helpers for LotusMegaBot++
// 6 motors total (TB6612FNG x3 - each has 2 channels)
// Index mapping (matches block "Motor 1..6"):
//   M1 = TB1-A  (M1A=D44, M1B=D45, PWM1=D8)
//   M2 = TB1-B  (M2A=D10, M2B=D11, PWM2=D9)
//   M3 = TB2-A  (M3A=D12, M3B=D13, PWM3=D4)
//   M4 = TB2-B  (M4A=D14, M4B=D15, PWM4=D5)
//   M5 = TB3-A  (M5A=D22, M5B=D23, PWM5=D6)
//   M6 = TB3-B  (M6A=D24, M6B=D25, PWM6=D7)
// ============================================================
#ifndef _LMBP_NANO_MOTOR_H_
#define _LMBP_NANO_MOTOR_H_

inline void _motorWrite(int in1, int in2, int pwm, int speed) {
    int _speed, _dir;
    if (speed < 0)      { _speed = -speed; _dir = -1; }
    else if (speed > 0) { _speed =  speed; _dir =  1; }
    else                { _speed = 0;      _dir =  0; }
    if (_speed > 100) _speed = 100;
    _speed = _speed * 2.55;
    if (_dir == 1) {
        digitalWrite(in1, 1); digitalWrite(in2, 0); analogWrite(pwm, _speed);
    } else if (_dir == -1) {
        digitalWrite(in1, 0); digitalWrite(in2, 1); analogWrite(pwm, _speed);
    } else {
        digitalWrite(in1, 1); digitalWrite(in2, 1);   // short brake
    }
}

// 6-channel: drive all 6 motors as left/right pairs
// Left  side  = M1 + M3 + M5 (channel-A of each TB6612)
// Right side  = M2 + M4 + M6 (channel-B of each TB6612)
void motor(int side, int speed) {
    if (side == 1) {              // LEFT
        _motorWrite(M1A, M1B, PWM1, speed);
        _motorWrite(M3A, M3B, PWM3, speed);
        _motorWrite(M5A, M5B, PWM5, speed);
    } else if (side == 2) {       // RIGHT
        _motorWrite(M2A, M2B, PWM2, speed);
        _motorWrite(M4A, M4B, PWM4, speed);
        _motorWrite(M6A, M6B, PWM6, speed);
    }
}

// 4-channel: drive TB6612 #1 + #2 only (M1..M4)
void motor_4ch(int speedL, int speedR) {
    _motorWrite(M1A, M1B, PWM1, speedL);
    _motorWrite(M3A, M3B, PWM3, speedL);
    _motorWrite(M2A, M2B, PWM2, speedR);
    _motorWrite(M4A, M4B, PWM4, speedR);
}

// 2-channel: drive TB6612 #1 only (M1, M2)
void motor_2ch(int speedL, int speedR) {
    _motorWrite(M1A, M1B, PWM1, speedL);
    _motorWrite(M2A, M2B, PWM2, speedR);
}

// Single motor by index 1..6
void motor_single(int idx, int speed) {
    switch (idx) {
        case 1: _motorWrite(M1A, M1B, PWM1, speed); break;
        case 2: _motorWrite(M2A, M2B, PWM2, speed); break;
        case 3: _motorWrite(M3A, M3B, PWM3, speed); break;
        case 4: _motorWrite(M4A, M4B, PWM4, speed); break;
        case 5: _motorWrite(M5A, M5B, PWM5, speed); break;
        case 6: _motorWrite(M6A, M6B, PWM6, speed); break;
    }
}

// Stop / brake all 6 motors
void ao() {
    digitalWrite(M1A, 1); digitalWrite(M1B, 1);
    digitalWrite(M2A, 1); digitalWrite(M2B, 1);
    digitalWrite(M3A, 1); digitalWrite(M3B, 1);
    digitalWrite(M4A, 1); digitalWrite(M4B, 1);
    digitalWrite(M5A, 1); digitalWrite(M5B, 1);
    digitalWrite(M6A, 1); digitalWrite(M6B, 1);
}

// All-motor direction helpers (used by Lotus_all_motor block)
void fd(int s) { motor(1,  s); motor(2,  s); }   // forward
void bk(int s) { motor(1, -s); motor(2, -s); }   // backward
void sl(int s) { motor(1, -s); motor(2,  s); }   // spin left
void sr(int s) { motor(1,  s); motor(2, -s); }   // spin right
void tl(int s) { motor(1,  s/2); motor(2,  s); } // turn left
void tr(int s) { motor(1,  s); motor(2,  s/2); } // turn right

#endif // _LMBP_NANO_MOTOR_H_
