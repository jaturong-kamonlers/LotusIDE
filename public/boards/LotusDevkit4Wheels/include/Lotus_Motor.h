
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

// ledcWrite() target: pin in arduino-esp32 3.x, channel in 2.x.
// PWM pin map: M1=D13(ch2), M2=D4(ch3), M3=D14(ch5), M4=D23(ch4)
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  #define LOTUS_M1_PWM 13
  #define LOTUS_M2_PWM 4
  #define LOTUS_M3_PWM 14
  #define LOTUS_M4_PWM 23
#else
  #define LOTUS_M1_PWM 2
  #define LOTUS_M2_PWM 3
  #define LOTUS_M3_PWM 5
  #define LOTUS_M4_PWM 4
#endif

void motor(int ch, int speed) {
  int pwm = (int)(abs(speed) * 2.55f);
  if (pwm > 255) pwm = 255;

  if (speed > 0) {
    if      (ch == 1) { digitalWrite(2,  LOW);  digitalWrite(15, HIGH); ledcWrite(LOTUS_M1_PWM, pwm); }
    else if (ch == 2) { digitalWrite(16, LOW);  digitalWrite(17, HIGH); ledcWrite(LOTUS_M2_PWM, pwm); }
    else if (ch == 3) { digitalWrite(25, HIGH); digitalWrite(26, LOW);  ledcWrite(LOTUS_M3_PWM, pwm); }
    else if (ch == 4) { digitalWrite(5,  LOW);  digitalWrite(19, HIGH); ledcWrite(LOTUS_M4_PWM, pwm); }
  } else if (speed < 0) {
    if      (ch == 1) { digitalWrite(2,  HIGH); digitalWrite(15, LOW);  ledcWrite(LOTUS_M1_PWM, pwm); }
    else if (ch == 2) { digitalWrite(16, HIGH); digitalWrite(17, LOW);  ledcWrite(LOTUS_M2_PWM, pwm); }
    else if (ch == 3) { digitalWrite(25, LOW);  digitalWrite(26, HIGH); ledcWrite(LOTUS_M3_PWM, pwm); }
    else if (ch == 4) { digitalWrite(5,  HIGH); digitalWrite(19, LOW);  ledcWrite(LOTUS_M4_PWM, pwm); }
  } else {
    if      (ch == 1) { digitalWrite(2,  HIGH); digitalWrite(15, HIGH); ledcWrite(LOTUS_M1_PWM, 0); }
    else if (ch == 2) { digitalWrite(16, HIGH); digitalWrite(17, HIGH); ledcWrite(LOTUS_M2_PWM, 0); }
    else if (ch == 3) { digitalWrite(25, HIGH); digitalWrite(26, HIGH); ledcWrite(LOTUS_M3_PWM, 0); }
    else if (ch == 4) { digitalWrite(5,  HIGH); digitalWrite(19, HIGH); ledcWrite(LOTUS_M4_PWM, 0); }
  }
}

void ao() {
  motor(1, 0);
  motor(2, 0);
  motor(3, 0);
  motor(4, 0);
}
