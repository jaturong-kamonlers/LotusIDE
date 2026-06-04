#ifndef ESP32_SERVO_H
#define ESP32_SERVO_H

// ── ESP32Servo.h ──────────────────────────────────────────────────────────────
// Wrapper สำหรับ KBIDE Lotus — Servo class จริงอยู่ใน Lotus_Servo.h
// ซึ่ง include ผ่าน LotusDevkit.h → Lotus_Servo_lib.h → Lotus_Servo.h แล้ว
//
// ESP32PWM และ setPeriodHertz ถูกเพิ่มเข้าไปใน Lotus_Servo.h โดยตรง
// ไฟล์นี้มีไว้เพื่อไม่ให้ #include <ESP32Servo.h> ใน user_app.cpp error
// ─────────────────────────────────────────────────────────────────────────────

// Lotus_Servo.h ถูก include ผ่าน LotusDevkit.h แล้ว ไม่ต้อง include ซ้ำ
// (include ซ้ำจะทำให้ class Servo ซ้ำ)

#endif // ESP32_SERVO_H
