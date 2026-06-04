#ifndef NANO_MOTOR_H
#define NANO_MOTOR_H

inline void motor(int pin, int speed){
    int _speed;
    int _dir;
    if(speed < 0){
        _speed = abs(speed);
        _dir = -1;
    }else if(speed > 0){
        _speed = speed;
        _dir = 1;
    }else{
        _speed = 0;
        _dir = 0;
    }
    
    if(_speed > 100) _speed = 100;
    _speed = _speed * 2.55;
    
    if(pin == 1){
        if(_dir == 1){
            digitalWrite(AIN1, 1); digitalWrite(AIN2, 0); analogWrite(PWMA, _speed);
        }else if(_dir == -1){
            digitalWrite(AIN1, 0); digitalWrite(AIN2, 1); analogWrite(PWMA, _speed);
        }else{
            digitalWrite(AIN1, 1); digitalWrite(AIN2, 1);
        }
    }else if(pin == 2){
        if(_dir == 1){
            digitalWrite(BIN1, 1); digitalWrite(BIN2, 0); analogWrite(PWMB, _speed);
        }else if(_dir == -1){
            digitalWrite(BIN1, 0); digitalWrite(BIN2, 1); analogWrite(PWMB, _speed);
        }else{
            digitalWrite(BIN1, 1); digitalWrite(BIN2, 1);
        }
    }
}

inline void ao() {
    digitalWrite(AIN1, 1); digitalWrite(AIN2, 1); analogWrite(PWMA, 0);
    digitalWrite(BIN1, 1); digitalWrite(BIN2, 1); analogWrite(PWMB, 0);
}

inline void fd(int speed=100) {
    motor(1, speed);
    motor(2, speed);
}

inline void bk(int speed=100) {
    motor(1, -speed);
    motor(2, -speed);
}

inline void tl(int speed=100) {
    motor(1, -speed);
    motor(2, speed);
}

inline void tr(int speed=100) {
    motor(1, speed);
    motor(2, -speed);
}

#endif