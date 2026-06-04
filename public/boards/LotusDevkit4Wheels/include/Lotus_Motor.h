
// ============================================================
// Lotus_Motor.h — 4-channel DC motor driver
// LotusDevkit4Wheels (TB6612FNG / BTS7960B)
//
// M1: PWM=D13 (LEDC ch2), AIN1=D2,  AIN2=D15  — Left  Front
// M2: PWM=D4  (LEDC ch3), BIN1=D16, BIN2=D17  — Right Front
// M3: PWM=D14 (LEDC ch5), BIN1=D25, BIN2=D26  — Left  Rear
// M4: PWM=D23 (LEDC ch4), AIN1=D5,  AIN2=D19  — Right Rear
//
// motor(ch, speed)  ch=1-4, speed=-100..+100 (%)
// ao()              stop all motors
// ============================================================

void motor(int ch, int speed) {
  int pwm = (int)(abs(speed) * 2.55f);
  if (pwm > 255) pwm = 255;

  if (speed > 0) {
    if      (ch == 1) { digitalWrite(2,  LOW);  digitalWrite(15, HIGH); ledcWrite(2, pwm); }
    else if (ch == 2) { digitalWrite(16, LOW);  digitalWrite(17, HIGH); ledcWrite(3, pwm); }
    else if (ch == 3) { digitalWrite(25, HIGH); digitalWrite(26, LOW);  ledcWrite(5, pwm); }
    else if (ch == 4) { digitalWrite(5,  LOW);  digitalWrite(19, HIGH); ledcWrite(4, pwm); }
  } else if (speed < 0) {
    if      (ch == 1) { digitalWrite(2,  HIGH); digitalWrite(15, LOW);  ledcWrite(2, pwm); }
    else if (ch == 2) { digitalWrite(16, HIGH); digitalWrite(17, LOW);  ledcWrite(3, pwm); }
    else if (ch == 3) { digitalWrite(25, LOW);  digitalWrite(26, HIGH); ledcWrite(5, pwm); }
    else if (ch == 4) { digitalWrite(5,  HIGH); digitalWrite(19, LOW);  ledcWrite(4, pwm); }
  } else {
    if      (ch == 1) { digitalWrite(2,  HIGH); digitalWrite(15, HIGH); ledcWrite(2, 0); }
    else if (ch == 2) { digitalWrite(16, HIGH); digitalWrite(17, HIGH); ledcWrite(3, 0); }
    else if (ch == 3) { digitalWrite(25, HIGH); digitalWrite(26, HIGH); ledcWrite(5, 0); }
    else if (ch == 4) { digitalWrite(5,  HIGH); digitalWrite(19, HIGH); ledcWrite(4, 0); }
  }
}

void ao() {
  motor(1, 0);
  motor(2, 0);
  motor(3, 0);
  motor(4, 0);
}
