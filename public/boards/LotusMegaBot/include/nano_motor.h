void motor(int pin, int speed){
	int _speed;
	int _dir;
	//digitalWrite(STBY, 1);
	
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
	
	if(pin == 1){  //// สถานะมอเตอร์ซ้าย
		if(_dir == 1){
			//มอเตอร์ A
			digitalWrite(AIN1, 1);
			digitalWrite(AIN2, 0);
			analogWrite(PWMA, _speed);
			//มอเตอร์ B
			digitalWrite(AIN1b, 1);
			digitalWrite(AIN2b, 0);
			analogWrite(PWMAb, _speed);	
			//มอเตอร์ C
			digitalWrite(AIN1c, 1);
			digitalWrite(AIN2c, 0);
			analogWrite(PWMAc, _speed);					
		}else if(_dir == -1){
			//มอเตอร์ A
			digitalWrite(AIN1, 0);
			digitalWrite(AIN2, 1);
			analogWrite(PWMA, _speed);
			//มอเตอร์ B
			digitalWrite(AIN1b, 0);
			digitalWrite(AIN2b, 1);
			analogWrite(PWMAb, _speed);
			//มอเตอร์ C
			digitalWrite(AIN1c, 0);
			digitalWrite(AIN2c, 1);
			analogWrite(PWMAc, _speed);
		}else if(_dir == 0){
			//มอเตอร์ A
			digitalWrite(AIN1, 1);
			digitalWrite(AIN2, 1);
			//มอเตอร์ B
			digitalWrite(AIN1b, 1);
			digitalWrite(AIN2b, 1);
			//มอเตอร์ C
			digitalWrite(AIN1c, 1);
			digitalWrite(AIN2c, 1);
		}
	}else if(pin == 2){//// สถานะมอเตอร์ขวา
		if(_dir == 1){
			//มอเตอร์ A
			digitalWrite(BIN1, 1);
			digitalWrite(BIN2, 0);
			analogWrite(PWMB, _speed);
			//มอเตอร์ B
			digitalWrite(BIN1b, 1);
			digitalWrite(BIN2b, 0);
			analogWrite(PWMBb, _speed);
			//มอเตอร์ C
			digitalWrite(BIN1c, 1);
			digitalWrite(BIN2c, 0);
			analogWrite(PWMBc, _speed);
		}else if(_dir == -1){
			//มอเตอร์ A
			digitalWrite(BIN1, 0);
			digitalWrite(BIN2, 1);
			analogWrite(PWMB, _speed);
			//มอเตอร์B
			digitalWrite(BIN1b, 0);
			digitalWrite(BIN2b, 1);
			analogWrite(PWMBb, _speed);
			//มอเตอร์ C
			digitalWrite(BIN1c, 0);
			digitalWrite(BIN2c, 1);
			analogWrite(PWMBc, _speed);
		}else if(_dir == 0){
			//มอเตอร์ A
			digitalWrite(BIN1, 1);
			digitalWrite(BIN2, 1);
			//มอเตอร์ B
			digitalWrite(BIN1b, 1);
			digitalWrite(BIN2b, 1);
			//มอเตอร์ C
			digitalWrite(BIN1c, 1);
			digitalWrite(BIN2c, 1);
		}
	}
	
}

// ===== Per-channel helpers for 4Ch / 2Ch / single motor blocks =====
// Index mapping for motor_single():
//   1=TB1-A  2=TB1-B  3=TB2-A  4=TB2-B  5=TB3-A  6=TB3-B
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
		digitalWrite(in1, 1); digitalWrite(in2, 1);
	}
}

// 4-channel: drive TB6612 #1 + #2 (4 motors)
void motor_4ch(int speedL, int speedR) {
	_motorWrite(AIN1,  AIN2,  PWMA,  speedL);
	_motorWrite(AIN1b, AIN2b, PWMAb, speedL);
	_motorWrite(BIN1,  BIN2,  PWMB,  speedR);
	_motorWrite(BIN1b, BIN2b, PWMBb, speedR);
}

// 2-channel: drive TB6612 #1 only (2 motors)
void motor_2ch(int speedL, int speedR) {
	_motorWrite(AIN1, AIN2, PWMA, speedL);
	_motorWrite(BIN1, BIN2, PWMB, speedR);
}

// Single motor by index 1..6
void motor_single(int idx, int speed) {
	switch (idx) {
		case 1: _motorWrite(AIN1,  AIN2,  PWMA,  speed); break;
		case 2: _motorWrite(BIN1,  BIN2,  PWMB,  speed); break;
		case 3: _motorWrite(AIN1b, AIN2b, PWMAb, speed); break;
		case 4: _motorWrite(BIN1b, BIN2b, PWMBb, speed); break;
		case 5: _motorWrite(AIN1c, AIN2c, PWMAc, speed); break;
		case 6: _motorWrite(BIN1c, BIN2c, PWMBc, speed); break;
	}
}

void ao() {
	// มอเตอร์ A
	digitalWrite(AIN1, 1);
	digitalWrite(AIN2, 1);
	analogWrite(PWMA, 0); 
	digitalWrite(BIN1, 1);
	digitalWrite(BIN2, 1);
	analogWrite(PWMB, 0);
	// มอเตอร์ B
	digitalWrite(AIN1b, 1);
	digitalWrite(AIN2b, 1);
	analogWrite(PWMAb, 0); 
	digitalWrite(BIN1b, 1);
	digitalWrite(BIN2b, 1);
	analogWrite(PWMBb, 0);
	// มอเตอร์ C
	digitalWrite(AIN1c, 1);
	digitalWrite(AIN2c, 1);
	analogWrite(PWMAc, 0); 
	digitalWrite(BIN1c, 1);
	digitalWrite(BIN2c, 1);
	analogWrite(PWMBc, 0);
}
void fd(int speed=100) {
	speed = abs(speed) * 2.55;
	if(speed > 255) speed = 255;
	/// มอเตอร์ A
	digitalWrite(AIN1, 1);
	digitalWrite(AIN2, 0);
	analogWrite(PWMA, speed);
	digitalWrite(BIN1, 1);
	digitalWrite(BIN2, 0);
	analogWrite(PWMB, speed);
	/// มอเตอร์ B
	digitalWrite(AIN1b, 1);
	digitalWrite(AIN2b, 0);
	analogWrite(PWMAb, speed);
	digitalWrite(BIN1b, 1);
	digitalWrite(BIN2b, 0);
	analogWrite(PWMBb, speed);
	/// มอเตอร์ C
	digitalWrite(AIN1c, 1);
	digitalWrite(AIN2c, 0);
	analogWrite(PWMAc, speed);
	digitalWrite(BIN1c, 1);
	digitalWrite(BIN2c, 0);
	analogWrite(PWMBc, speed);
}
void bk(int speed=100) {
	speed = abs(speed) * 2.55;
	if(speed > 255) speed = 255;
	/// มอเตอร์ A
	digitalWrite(AIN1, 0);
	digitalWrite(AIN2, 1);
	digitalWrite(BIN1, 0);
	digitalWrite(BIN2, 1);
	analogWrite(PWMA, speed);
	analogWrite(PWMB, speed);
	/// มอเตอร์ B
	digitalWrite(AIN1b, 0);
	digitalWrite(AIN2b, 1);
	digitalWrite(BIN1b, 0);
	digitalWrite(BIN2b, 1);
	analogWrite(PWMAb, speed);
	analogWrite(PWMBb, speed);
	/// มอเตอร์ C
	digitalWrite(AIN1c, 0);
	digitalWrite(AIN2c, 1);
	digitalWrite(BIN1c, 0);
	digitalWrite(BIN2c, 1);
	analogWrite(PWMAc, speed);
	analogWrite(PWMBc, speed);
}
void tl(int speed=100) {
	speed = abs(speed) * 2.55;
	if(speed > 255) speed = 255;
	/// มอเตอร์ A
	digitalWrite(AIN1, 0);
	digitalWrite(AIN2, 0);
	digitalWrite(BIN1, 1);
	digitalWrite(BIN2, 0);
	analogWrite(PWMA, speed);  
	analogWrite(PWMB, speed);
	/// มอเตอร์ B
	digitalWrite(AIN1b, 0);
	digitalWrite(AIN2b, 0);
	digitalWrite(BIN1b, 1);
	digitalWrite(BIN2b, 0);
	analogWrite(PWMAb, speed);  
	analogWrite(PWMBb, speed);
	/// มอเตอร์C
	digitalWrite(AIN1c, 0);
	digitalWrite(AIN2c, 0);
	digitalWrite(BIN1c, 1);
	digitalWrite(BIN2c, 0);
	analogWrite(PWMAc, speed);  
	analogWrite(PWMBc, speed);
}
void tr(int speed=100) {
	speed = abs(speed) * 2.55;
	if(speed > 255) speed = 255;
	/// มอเตอร์ A	
	digitalWrite(AIN1, 1);
	digitalWrite(AIN2, 0);
	digitalWrite(BIN1, 0);
	digitalWrite(BIN2, 0);
	analogWrite(PWMA, speed);
	analogWrite(PWMB, speed);
	/// มอเตอร์ B
	digitalWrite(AIN1b, 1);
	digitalWrite(AIN2b, 0);
	digitalWrite(BIN1b, 0);
	digitalWrite(BIN2b, 0);
	analogWrite(PWMAb, speed);
	analogWrite(PWMBb, speed);
	/// มอเตอร์ C	
	digitalWrite(AIN1c, 1);
	digitalWrite(AIN2c, 0);
	digitalWrite(BIN1c, 0);
	digitalWrite(BIN2c, 0);
	analogWrite(PWMAc, speed);
	analogWrite(PWMBc, speed);
}
void sl(int speed=100) {
	speed = abs(speed) * 2.55;
	if(speed > 255) speed = 255;
	/// มอเตอร์ A	
	digitalWrite(AIN1, 0);
	digitalWrite(AIN2, 1);
	digitalWrite(BIN1, 1);
	digitalWrite(BIN2, 0);
	analogWrite(PWMA, speed);
	analogWrite(PWMB, speed);
	/// มอเตอร์ B
	digitalWrite(AIN1b, 0);
	digitalWrite(AIN2b, 1);
	digitalWrite(BIN1b, 1);
	digitalWrite(BIN2b, 0);
	analogWrite(PWMAb, speed);
	analogWrite(PWMBb, speed);
	/// มอเตอร์ C	
	digitalWrite(AIN1c, 0);
	digitalWrite(AIN2c, 1);
	digitalWrite(BIN1c, 1);
	digitalWrite(BIN2c, 0);
	analogWrite(PWMAc, speed);
	analogWrite(PWMBc, speed);
}
void sr(int speed=100) {
	speed = abs(speed) * 2.55;
	if(speed > 255) speed = 255;
	/// มอเตอร์ A	
	digitalWrite(AIN1, 1);
	digitalWrite(AIN2, 0);
	digitalWrite(BIN1, 0);
	digitalWrite(BIN2, 1);
	analogWrite(PWMA, speed);
	analogWrite(PWMB, speed);
	/// มอเตอร์ B	
	digitalWrite(AIN1b, 1);
	digitalWrite(AIN2b, 0);
	digitalWrite(BIN1b, 0);
	digitalWrite(BIN2b, 1);
	analogWrite(PWMAb, speed);
	analogWrite(PWMBb, speed);
	/// มอเตอร์ C
	digitalWrite(AIN1c, 1);
	digitalWrite(AIN2c, 0);
	digitalWrite(BIN1c, 0);
	digitalWrite(BIN2c, 1);
	analogWrite(PWMAc, speed);
	analogWrite(PWMBc, speed);
}
////////////////////////////////////////////////////