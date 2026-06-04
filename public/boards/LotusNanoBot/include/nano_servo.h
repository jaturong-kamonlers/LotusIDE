#ifndef NANO_SERVO_H
#define NANO_SERVO_H

#ifndef ALL
#define ALL 100
#endif

// ใช้ static เพื่อจำกัดขอบเขตตัวแปร
static Servo s1, s2, s3, s4, s5, s6;

inline void servo(uint8_t ch, int16_t angle) {
    if (ch == 1) {
        if (angle == -1) s1.detach();
        else { if (!s1.attached()) s1.attach(_servo1); s1.write(angle); }
    }
    if (ch == 2) {
        if (angle == -1) s2.detach();
        else { if (!s2.attached()) s2.attach(_servo2); s2.write(angle); }
    }
    if (ch == 3) {
        if (angle == -1) s3.detach();
        else { if (!s3.attached()) s3.attach(_servo3); s3.write(angle); }
    }
    // เพิ่ม ch อื่นๆ ตามโครงสร้างนี้
}
#endif