// ============================================================
// Quadrature encoder helpers for LotusDueBot — 4 channels
// On Arduino Due every digital pin can attach an interrupt, so all 4
// encoders can run simultaneously without conflicts.
//   Encoder 1: A=D46, B=D47   (paired with motor 1)
//   Encoder 2: A=D48, B=D49   (paired with motor 2)
//   Encoder 3: A=D50, B=D51   (paired with motor 3)
//   Encoder 4: A=D52, B=D53   (paired with motor 4)
// ============================================================
#ifndef _LDB_NANO_ENCODER_H_
#define _LDB_NANO_ENCODER_H_

volatile long _enc1_count = 0;
volatile long _enc2_count = 0;
volatile long _enc3_count = 0;
volatile long _enc4_count = 0;

// Read direction from B pin at rising edge of A
void _enc1_isr() { if (digitalRead(_ENC1_B) == LOW) _enc1_count++; else _enc1_count--; }
void _enc2_isr() { if (digitalRead(_ENC2_B) == LOW) _enc2_count++; else _enc2_count--; }
void _enc3_isr() { if (digitalRead(_ENC3_B) == LOW) _enc3_count++; else _enc3_count--; }
void _enc4_isr() { if (digitalRead(_ENC4_B) == LOW) _enc4_count++; else _enc4_count--; }

// Initialize one or more encoders.
// mask: bit0=enc1, bit1=enc2, bit2=enc3, bit3=enc4
//   1=Enc1 only, 3=Enc1+2, 7=Enc1+2+3, 15=all four
void encoder_init(uint8_t mask) {
    if (mask & 0x01) {
        pinMode(_ENC1_A, INPUT_PULLUP);
        pinMode(_ENC1_B, INPUT_PULLUP);
        _enc1_count = 0;
        attachInterrupt(digitalPinToInterrupt(_ENC1_A), _enc1_isr, RISING);
    }
    if (mask & 0x02) {
        pinMode(_ENC2_A, INPUT_PULLUP);
        pinMode(_ENC2_B, INPUT_PULLUP);
        _enc2_count = 0;
        attachInterrupt(digitalPinToInterrupt(_ENC2_A), _enc2_isr, RISING);
    }
    if (mask & 0x04) {
        pinMode(_ENC3_A, INPUT_PULLUP);
        pinMode(_ENC3_B, INPUT_PULLUP);
        _enc3_count = 0;
        attachInterrupt(digitalPinToInterrupt(_ENC3_A), _enc3_isr, RISING);
    }
    if (mask & 0x08) {
        pinMode(_ENC4_A, INPUT_PULLUP);
        pinMode(_ENC4_B, INPUT_PULLUP);
        _enc4_count = 0;
        attachInterrupt(digitalPinToInterrupt(_ENC4_A), _enc4_isr, RISING);
    }
}

long encoder_read(uint8_t which) {
    long v = 0;
    noInterrupts();
    switch (which) {
        case 1: v = _enc1_count; break;
        case 2: v = _enc2_count; break;
        case 3: v = _enc3_count; break;
        case 4: v = _enc4_count; break;
    }
    interrupts();
    return v;
}

void encoder_reset(uint8_t which) {
    noInterrupts();
    switch (which) {
        case 1: _enc1_count = 0; break;
        case 2: _enc2_count = 0; break;
        case 3: _enc3_count = 0; break;
        case 4: _enc4_count = 0; break;
        case 0xFF: _enc1_count = _enc2_count = _enc3_count = _enc4_count = 0; break;
    }
    interrupts();
}

// ============================================================
// Closed-loop motion using encoders 1+2 (paired with motors M1+M2).
//   encoder_drive  : both wheels same direction, equal distance
//   encoder_spin   : wheels opposite direction (spin in place)
// dir : +1 = forward / spin right, -1 = backward / spin left
// Simple proportional sync — slow the leader, speed the follower.
// Each wheel stops individually when its own tick target is reached.
// 30-second safety timeout to prevent infinite loops if a wheel stalls.
// ============================================================
inline long _abs_long(long v) { return v < 0 ? -v : v; }

void encoder_drive(int dir, long target_ticks, int base_speed) {
    if (target_ticks < 0) target_ticks = -target_ticks;
    if (base_speed   < 0) base_speed   = -base_speed;
    if (base_speed > 100) base_speed = 100;
    if (dir == 0) return;
    dir = (dir > 0) ? 1 : -1;

    encoder_init(0x03);
    encoder_reset(1);
    encoder_reset(2);

    unsigned long t0 = millis();
    while (true) {
        long c1 = encoder_read(1) * dir;
        long c2 = encoder_read(2) * dir;
        long abs1 = _abs_long(c1);
        long abs2 = _abs_long(c2);
        if (abs1 >= target_ticks && abs2 >= target_ticks) break;

        long diff = c1 - c2;
        int  cap  = base_speed / 2;
        int  adj  = (int)diff;
        if (adj >  cap) adj =  cap;
        if (adj < -cap) adj = -cap;

        int spL = (base_speed - adj) * dir;
        int spR = (base_speed + adj) * dir;
        if (spL >  100) spL =  100;  if (spL < -100) spL = -100;
        if (spR >  100) spR =  100;  if (spR < -100) spR = -100;

        if (abs1 >= target_ticks) spL = 0;
        if (abs2 >= target_ticks) spR = 0;

        motor_single(1, spL);
        motor_single(2, spR);

        if (millis() - t0 > 30000UL) break;
        delay(5);
    }
    motor_single(1, 0);
    motor_single(2, 0);
}

void encoder_spin(int dir, long target_ticks, int base_speed) {
    if (target_ticks < 0) target_ticks = -target_ticks;
    if (base_speed   < 0) base_speed   = -base_speed;
    if (base_speed > 100) base_speed = 100;
    if (dir == 0) return;
    dir = (dir > 0) ? 1 : -1;

    encoder_init(0x03);
    encoder_reset(1);
    encoder_reset(2);

    unsigned long t0 = millis();
    while (true) {
        long abs1 = _abs_long(encoder_read(1));
        long abs2 = _abs_long(encoder_read(2));
        if (abs1 >= target_ticks && abs2 >= target_ticks) break;

        int spL = (abs1 < target_ticks) ? ( base_speed * dir) : 0;
        int spR = (abs2 < target_ticks) ? (-base_speed * dir) : 0;

        motor_single(1, spL);
        motor_single(2, spR);

        if (millis() - t0 > 30000UL) break;
        delay(5);
    }
    motor_single(1, 0);
    motor_single(2, 0);
}

#endif // _LDB_NANO_ENCODER_H_
