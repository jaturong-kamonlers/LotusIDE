// ============================================================
// Servo helpers for LotusDueBot (9 servos on D24..D32)
// ============================================================
#ifndef _LDB_NANO_SERVO_H_
#define _LDB_NANO_SERVO_H_

#ifndef ALL
#define ALL 100
#endif

Servo servo1, servo2, servo3, servo4, servo5, servo6, servo7, servo8, servo9;

static inline void _servoSet(Servo &s, int pin, int16_t angle) {
    if (angle == -1) { s.detach(); return; }
    if (!s.attached()) s.attach(pin);
    s.write(angle);
}

void servo(uint8_t ch, int16_t angle) {
    if (ch == ALL) {
        if (angle == -1) {
            servo1.detach(); servo2.detach(); servo3.detach();
            servo4.detach(); servo5.detach(); servo6.detach();
            servo7.detach(); servo8.detach(); servo9.detach();
            return;
        }
        _servoSet(servo1, _servo1, angle);
        _servoSet(servo2, _servo2, angle);
        _servoSet(servo3, _servo3, angle);
        _servoSet(servo4, _servo4, angle);
        _servoSet(servo5, _servo5, angle);
        _servoSet(servo6, _servo6, angle);
        _servoSet(servo7, _servo7, angle);
        _servoSet(servo8, _servo8, angle);
        _servoSet(servo9, _servo9, angle);
        return;
    }
    switch (ch) {
        case 1: _servoSet(servo1, _servo1, angle); break;
        case 2: _servoSet(servo2, _servo2, angle); break;
        case 3: _servoSet(servo3, _servo3, angle); break;
        case 4: _servoSet(servo4, _servo4, angle); break;
        case 5: _servoSet(servo5, _servo5, angle); break;
        case 6: _servoSet(servo6, _servo6, angle); break;
        case 7: _servoSet(servo7, _servo7, angle); break;
        case 8: _servoSet(servo8, _servo8, angle); break;
        case 9: _servoSet(servo9, _servo9, angle); break;
    }
}

#endif // _LDB_NANO_SERVO_H_
