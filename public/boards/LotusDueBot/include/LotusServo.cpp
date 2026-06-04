/*
  Servo.cpp - SAM3X8E (Arduino Due) implementation for LotusDueBot
  Uses TC1 Channel 0 (ID_TC3, TC3_IRQn) as a 40 Hz frame timer.
  Every 25 ms the ISR fires and pulses each attached servo sequentially
  using delayMicroseconds(), then returns.  With up to 9 servos at
  average 1.5 ms each the total blocking is ~13.5 ms, well within 25 ms.
*/
#include "Arduino.h"
#include "LotusServo.h"

#define SERVO_MIN() (MIN_PULSE_WIDTH - this->min * 4)
#define SERVO_MAX() (MAX_PULSE_WIDTH - this->max * 4)

/* MCK/32 = 84 MHz/32 = 2 625 000 Hz; 25 ms = 65 625 ticks. */
#define SERVO_TC_ID      ID_TC3          /* TC1 channel 0 peripheral clock */
#define SERVO_TC_IRQ     TC3_IRQn
#define SERVO_TC_INST    TC1
#define SERVO_TC_CH      0
#define SERVO_RC_TICKS   65625UL         /* 25 ms period */

static servo_t _servos[MAX_SERVOS];
uint8_t ServoCount = 0;
static bool _timerRunning = false;

/* ---- timer helpers ---- */
static void timerStart() {
    PMC->PMC_PCER0 = (1u << SERVO_TC_ID);
    SERVO_TC_INST->TC_CHANNEL[SERVO_TC_CH].TC_CCR = TC_CCR_CLKDIS;
    SERVO_TC_INST->TC_CHANNEL[SERVO_TC_CH].TC_CMR =
        TC_CMR_WAVE | TC_CMR_WAVSEL_UP_RC | TC_CMR_TCCLKS_TIMER_CLOCK3;
    SERVO_TC_INST->TC_CHANNEL[SERVO_TC_CH].TC_RC  = SERVO_RC_TICKS;
    SERVO_TC_INST->TC_CHANNEL[SERVO_TC_CH].TC_IER = TC_IER_CPCS;
    SERVO_TC_INST->TC_CHANNEL[SERVO_TC_CH].TC_IDR = ~TC_IER_CPCS;
    NVIC_EnableIRQ(SERVO_TC_IRQ);
    SERVO_TC_INST->TC_CHANNEL[SERVO_TC_CH].TC_CCR = TC_CCR_CLKEN | TC_CCR_SWTRG;
    _timerRunning = true;
}

static void timerStop() {
    SERVO_TC_INST->TC_CHANNEL[SERVO_TC_CH].TC_CCR = TC_CCR_CLKDIS;
    NVIC_DisableIRQ(SERVO_TC_IRQ);
    _timerRunning = false;
}

static bool anyActive() {
    for (uint8_t i = 0; i < ServoCount; i++)
        if (_servos[i].Pin.isActive) return true;
    return false;
}

/* ---- ISR ---- */
extern "C" void TC3_Handler(void) {
    SERVO_TC_INST->TC_CHANNEL[SERVO_TC_CH].TC_SR; /* clear flag */
    for (uint8_t i = 0; i < ServoCount; i++) {
        if (!_servos[i].Pin.isActive) continue;
        uint32_t pw = _servos[i].ticks;
        if (pw < MIN_PULSE_WIDTH) pw = MIN_PULSE_WIDTH;
        if (pw > MAX_PULSE_WIDTH) pw = MAX_PULSE_WIDTH;
        digitalWrite(_servos[i].Pin.nbr, HIGH);
        delayMicroseconds(pw);
        digitalWrite(_servos[i].Pin.nbr, LOW);
    }
}

/* ---- Servo class ---- */
Servo::Servo() {
    if (ServoCount < MAX_SERVOS) {
        this->servoIndex = ServoCount++;
        _servos[this->servoIndex].ticks     = DEFAULT_PULSE_WIDTH;
        _servos[this->servoIndex].Pin.isActive = 0;
        _servos[this->servoIndex].Pin.nbr   = 0;
    } else {
        this->servoIndex = INVALID_SERVO;
    }
    this->min = 0;   /* encodes MIN_PULSE_WIDTH */
    this->max = 0;   /* encodes MAX_PULSE_WIDTH */
}

uint8_t Servo::attach(int pin) {
    return attach(pin, MIN_PULSE_WIDTH, MAX_PULSE_WIDTH);
}

uint8_t Servo::attach(int pin, int min, int max) {
    if (this->servoIndex >= MAX_SERVOS) return INVALID_SERVO;
    this->min = (int8_t)((MIN_PULSE_WIDTH - min) / 4);
    this->max = (int8_t)((MAX_PULSE_WIDTH - max) / 4);
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    _servos[this->servoIndex].Pin.nbr      = (uint8_t)pin;
    _servos[this->servoIndex].Pin.isActive = 1;
    if (!_timerRunning) timerStart();
    return this->servoIndex;
}

void Servo::detach() {
    if (this->servoIndex >= MAX_SERVOS) return;
    _servos[this->servoIndex].Pin.isActive = 0;
    if (!anyActive()) timerStop();
}

void Servo::write(int value) {
    if (value < MIN_PULSE_WIDTH) {
        value = constrain(value, 0, 180);
        value = map(value, 0, 180, SERVO_MIN(), SERVO_MAX());
    }
    writeMicroseconds(value);
}

void Servo::writeMicroseconds(int value) {
    if (this->servoIndex >= MAX_SERVOS) return;
    value = constrain(value, SERVO_MIN(), SERVO_MAX());
    _servos[this->servoIndex].ticks = (unsigned int)value;
}

int Servo::read() {
    return map(readMicroseconds(), SERVO_MIN(), SERVO_MAX(), 0, 180);
}

int Servo::readMicroseconds() {
    if (this->servoIndex >= MAX_SERVOS) return 0;
    return (int)_servos[this->servoIndex].ticks;
}

bool Servo::attached() {
    if (this->servoIndex >= MAX_SERVOS) return false;
    return _servos[this->servoIndex].Pin.isActive != 0;
}
