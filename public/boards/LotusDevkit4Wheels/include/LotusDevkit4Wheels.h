#include <FS.h>                   //this needs to be first, or it all crashes and burns...
#include <SPIFFS.h>
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiAP.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <memory>
#include <Wire.h>  
#include <esp_wifi.h>
#include <SPI.h>
#include "BLE_Plugin.h"

#include "SSD1306Wire.h"
#include "SH1106.h"
#include "Lotus_Motor.h"
#include "Lotus_Servo_lib.h"
//#include "WIT_IO.h"
#include "Adafruit_TCS34725.h"
#include "vector"
#include "Adafruit_BMP280.h"
#include "Adafruit_MLX90614.h"

// ===== PWM Channel Definitions =====
#define TONE_CHANNEL 1
#define SOUND_PWM_CHANNEL 0
#define SOUND_RESOLUTION 8
#define SOUND_ON (1 << (SOUND_RESOLUTION - 1))
#define SOUND_OFF 0

// ===== Pin Definitions =====
static const uint8_t KB_BUZZER = 18;
#define BUZZER_PIN 18
#define _knob 35
#define _button 27

// ===== I2C Definitions =====
#define I2C_SDA 21
#define I2C_SCL 22

// ===== Objects =====
unsigned long timeElapsed;

// I2C Devices - ใช้ Wire object เดียวกันทั้งหมด
SSD1306Wire display(0x3c, I2C_SDA, I2C_SCL);
Adafruit_TCS34725 tcs = Adafruit_TCS34725(TCS34725_INTEGRATIONTIME_50MS, TCS34725_GAIN_1X);
Adafruit_BMP280 bmp280;
Adafruit_MLX90614 mlx90614;  // MLX90614 object

// ===== Function Prototypes =====
void wait();
void beep();
void beep(int _delay);
void beep_on();
void beep_off();
int TCS_Read(int C=1);
int _Knob();
void scanI2CDevices();

// ===== Music Class =====
class KB_music
{
 public:
  void begin(void);
  void tone(unsigned int frequency, unsigned long duration = 0);
  void noTone();
  void song(std::vector<int> notes,int duration);

 protected:
  uint16_t channel;
  uint16_t bit;

 private:
};

void KB_music::begin(void) {
    //ledcSetup(TONE_CHANNEL, 5000, 13);
}

void KB_music::tone(unsigned int frequency, unsigned long duration)
{
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcAttach(KB_BUZZER, frequency, 13);
    ledcWriteTone(KB_BUZZER, frequency);
#else
    if (ledcRead(TONE_CHANNEL)) {
        log_e("Tone channel %d is already in use", ledcRead(TONE_CHANNEL));
        return;
    }
    ledcAttachPin(KB_BUZZER, TONE_CHANNEL);
    ledcWriteTone(TONE_CHANNEL, frequency);
#endif
    if (duration) {
        delay(duration);
        noTone();
    }
}

void KB_music::noTone()
{
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcWrite(KB_BUZZER, 0);
    ledcDetach(KB_BUZZER);
#else
    ledcDetachPin(KB_BUZZER);
    ledcWrite(TONE_CHANNEL, 0);
#endif
}

void KB_music::song(std::vector<int>notes,int duration)
{
    for(int freq : notes){
        if(freq == -1){
            noTone();
            delay(duration);
        }else{
            tone(freq,duration);
        }
    }
}

KB_music music = KB_music();

void tone(int pin, int frequency, int duration) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(pin, frequency, 8);
  ledcWrite(pin, SOUND_ON);
  delay(duration);
  ledcWrite(pin, SOUND_OFF);
  ledcDetach(pin);
#else
  ledcSetup(SOUND_PWM_CHANNEL, frequency, 8);
  ledcAttachPin(pin, SOUND_PWM_CHANNEL);
  ledcWrite(SOUND_PWM_CHANNEL, SOUND_ON);
  delay(duration);
  ledcWrite(SOUND_PWM_CHANNEL, SOUND_OFF);
  ledcDetachPin(pin);
#endif
}

// ===== I2C Scanner Function =====
void scanI2CDevices() {
  Serial.println("Scanning I2C devices...");
  byte error, address;
  int nDevices = 0;
  
  for(address = 1; address < 127; address++ ) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.print(" (");
      
      // แสดงชื่ออุปกรณ์ตาม address
      switch(address) {
        case 0x3C: Serial.print("OLED Display"); break;
        case 0x48: Serial.print("ADS1115"); break;
        case 0x29: Serial.print("TCS34725 Color"); break;
        case 0x76: Serial.print("BMP280"); break;
        case 0x77: Serial.print("BMP280 Alt"); break;
        case 0x5A: Serial.print("MLX90614"); break;
        default: Serial.print("Unknown"); break;
      }
      Serial.println(")");
      nDevices++;
    }
  }
  
  if (nDevices == 0) {
    Serial.println("No I2C devices found!");
  } else {
    Serial.printf("Found %d I2C device(s)\n", nDevices);
  }
}

// ===== Setup Function =====
void LotusDevkit4Wheels() {
  music.begin();

  // 12-bit ADC → knob maps to 0-4095 → then _Knob() maps to 0-120
  analogReadResolution(12);

  // Force MLX90614 out of factory-default PWM mode into SMBus mode by holding
  // SCL LOW for >2ms before Wire init. Without this, MLX NACKs every read and
  // returns -999. Datasheet §8.3.3.1.
  pinMode(I2C_SCL, OUTPUT);
  digitalWrite(I2C_SCL, LOW);
  delay(5);
  pinMode(I2C_SCL, INPUT_PULLUP);
  delay(50);

  // Initialize I2C - ทำครั้งเดียว
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(50000);  // 50kHz — SMBus-friendly for MLX90614 (was 100kHz)
  delay(100);

  // Initialize pins
  pinMode(_knob, INPUT);     // knob
  pinMode(_button, INPUT);   // start button

  // ===== Motor pins (4 channels) =====
  // M1: AIN1=D2, AIN2=D15, PWM=D13 (LEDC ch2) — Left Front
  pinMode(2,  OUTPUT); pinMode(15, OUTPUT);
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(13, 5000, 8);
#else
  ledcSetup(2, 5000, 8); ledcAttachPin(13, 2);
#endif

  // M2: BIN1=D16, BIN2=D17, PWM=D4 (LEDC ch3) — Right Front
  pinMode(16, OUTPUT); pinMode(17, OUTPUT);
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(4, 5000, 8);
#else
  ledcSetup(3, 5000, 8); ledcAttachPin(4, 3);
#endif

  // M3: AIN1=D5, AIN2=D19, PWM=D23 (LEDC ch4) — Left Rear
  pinMode(5,  OUTPUT); pinMode(19, OUTPUT);
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(23, 5000, 8);
#else
  ledcSetup(4, 5000, 8); ledcAttachPin(23, 4);
#endif

  // M4: BIN1=D25, BIN2=D26, PWM=D14 (LEDC ch5) — Right Rear
  pinMode(25, OUTPUT); pinMode(26, OUTPUT);
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(14, 5000, 8);
#else
  ledcSetup(5, 5000, 8); ledcAttachPin(14, 5);
#endif

  // Probe optional sensors silently (no Serial, no display side-effects)
  tcs.begin();
  bmp280.begin();
  unsigned long mlxStartTime = millis();
  while (millis() - mlxStartTime < 500) {
    if (mlx90614.begin()) break;
    delay(10);
  }

  // ===== Boot splash (persistent) =====
  display.init();
  display.flipScreenVertically();
  display.clear();
  display.setTextAlignment(TEXT_ALIGN_CENTER);
  display.setFont(ArialMT_Plain_24);
  display.drawString(64, 4, "Lotus");
  display.setFont(ArialMT_Plain_16);
  display.drawString(64, 36, "Dev 4Wheels");
  display.display();

  // ===== C major scale (Do Re Mi Fa Sol La Ti Do, 100ms each) =====
  // NOTE: local tone(int,int,int) above is blocking and already detaches the pin
  tone(BUZZER_PIN, 262, 100); delay(10);    // C  Do
  tone(BUZZER_PIN, 294, 100); delay(10);    // D  Re
  tone(BUZZER_PIN, 330, 100); delay(10);    // E  Mi
  tone(BUZZER_PIN, 349, 100); delay(10);    // F  Fa
  tone(BUZZER_PIN, 392, 100); delay(10);    // G  Sol
  tone(BUZZER_PIN, 440, 100); delay(10);    // A  La
  tone(BUZZER_PIN, 494, 100); delay(10);    // B  Ti
  tone(BUZZER_PIN, 523, 100);               // C5 Do

  // SSD1306Wire::init() bumps Wire to 700kHz for fast OLED refresh, which is
  // way too fast for MLX90614 SMBus reads (they then return -999). Restore
  // the slow MLX-safe clock as the LAST thing in board init so MLX wins.
  // Trade-off: OLED redraw is ~14× slower but visually still fine.
  Wire.setClock(50000);
}

// ===== Wait for Start Button =====
void wait() {
  display.clear();
  display.setTextAlignment(TEXT_ALIGN_CENTER);
  display.setFont(ArialMT_Plain_16);
  display.drawString(64, 4,  "Press");
  display.drawString(64, 24, "Start Button");
  display.drawString(64, 44, "GPIO27");
  display.display();
  
  int start_Button = 1;
  do {
    start_Button = digitalRead(_button);
    delay(10);  // ป้องกันการอ่านค่าถี่เกินไป
  } while(start_Button);
  
  display.clear();
  display.display();
}

// ===== Knob Reading (maps 12-bit ADC to 0-120) =====
int _Knob() {
  return map(analogRead(_knob), 0, 4095, 0, 120);
}

// ===== Buzzer Functions =====
void beep() {
  int _buzzer = BUZZER_PIN;
  pinMode(_buzzer, OUTPUT);
  digitalWrite(_buzzer, HIGH);
  delay(200);
  digitalWrite(_buzzer, LOW);
}

void beep(int _delay) {
  int _buzzer = BUZZER_PIN;
  pinMode(_buzzer, OUTPUT);
  digitalWrite(_buzzer, HIGH);
  delay(_delay);
  digitalWrite(_buzzer, LOW);
}

void beep_on() {
  int _buzzer = BUZZER_PIN;
  pinMode(_buzzer, OUTPUT);
  digitalWrite(_buzzer, HIGH);
}

void beep_off() {
  int _buzzer = BUZZER_PIN;
  pinMode(_buzzer, OUTPUT);
  digitalWrite(_buzzer, LOW);
}

// ===== TCS Color Sensor Reading =====
int TCS_Read(int C) {
  uint16_t r, g, b, c;
  tcs.getRawData(&r, &g, &b, &c);
  
  switch(C) {
    case 1: return r;  // Red
    case 2: return g;  // Green
    case 3: return b;  // Blue
    default: return c; // Clear
  }
}