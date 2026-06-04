#ifndef LIQUIDCRYSTAL_I2C_H
#define LIQUIDCRYSTAL_I2C_H

#include <Arduino.h>
#include <Wire.h>
#include <Print.h>

// Commands
#define LCD_CLEARDISPLAY    0x01
#define LCD_RETURNHOME      0x02
#define LCD_ENTRYMODESET    0x04
#define LCD_DISPLAYCONTROL  0x08
#define LCD_CURSORSHIFT     0x10
#define LCD_FUNCTIONSET     0x20
#define LCD_SETCGRAMADDR    0x40
#define LCD_SETDDRAMADDR    0x80

// Flags
#define LCD_ENTRYLEFT       0x02
#define LCD_DISPLAYON       0x04
#define LCD_CURSORON        0x02
#define LCD_BLINKON         0x01
#define LCD_8BITMODE        0x10
#define LCD_4BITMODE        0x00
#define LCD_2LINE           0x08
#define LCD_1LINE           0x00
#define LCD_5x8DOTS         0x00

// PCF8574 bits
#define LCD_BACKLIGHT       0x08
#define LCD_NOBACKLIGHT     0x00
#define En                  0x04
#define Rw                  0x02
#define Rs                  0x01

class LiquidCrystal_I2C : public Print {
public:
    LiquidCrystal_I2C(uint8_t addr=0x27, uint8_t cols=16, uint8_t rows=2)
        : _addr(addr), _cols(cols), _rows(rows),
          _backlight(LCD_BACKLIGHT), _wire(&Wire) {}

    void init(TwoWire &wirePort = Wire) {
        _wire = &wirePort;
        _displayFunc   = LCD_4BITMODE | LCD_2LINE | LCD_5x8DOTS;
        _displayCtrl   = LCD_DISPLAYON;
        _displayMode   = LCD_ENTRYLEFT;
        delay(50);
        expanderWrite(0);
        delay(100);
        write4bits(0x03 << 4);  delay(5);
        write4bits(0x03 << 4);  delay(5);
        write4bits(0x03 << 4);  delayMicroseconds(150);
        write4bits(0x02 << 4);
        command(LCD_FUNCTIONSET | _displayFunc);
        command(LCD_DISPLAYCONTROL | _displayCtrl);
        clear();
        command(LCD_ENTRYMODESET | _displayMode);
        home();
    }

    void begin(uint8_t cols=16, uint8_t rows=2) {
        _cols = cols; _rows = rows;
        init();
    }

    void clear()   { command(LCD_CLEARDISPLAY); delayMicroseconds(2000); }
    void home()    { command(LCD_RETURNHOME);   delayMicroseconds(2000); }

    void setCursor(uint8_t col, uint8_t row) {
        static const uint8_t offsets[] = {0x00,0x40,0x14,0x54};
        if(row >= _rows) row = _rows-1;
        command(LCD_SETDDRAMADDR | (col + offsets[row]));
    }

    void backlight()   { _backlight = LCD_BACKLIGHT;   expanderWrite(0); }
    void noBacklight() { _backlight = LCD_NOBACKLIGHT;  expanderWrite(0); }

    void display()  { _displayCtrl |=  LCD_DISPLAYON;  command(LCD_DISPLAYCONTROL|_displayCtrl); }
    void noDisplay(){ _displayCtrl &= ~LCD_DISPLAYON;  command(LCD_DISPLAYCONTROL|_displayCtrl); }

    virtual size_t write(uint8_t val) override {
        send(val, Rs);
        return 1;
    }
    using Print::write;

private:
    uint8_t  _addr, _cols, _rows;
    uint8_t  _backlight, _displayFunc, _displayCtrl, _displayMode;
    TwoWire* _wire;

    void command(uint8_t val) { send(val, 0); }

    void send(uint8_t val, uint8_t mode) {
        write4bits((val & 0xF0) | mode);
        write4bits(((val << 4) & 0xF0) | mode);
    }

    void write4bits(uint8_t val) {
        expanderWrite(val);
        pulseEnable(val);
    }

    void pulseEnable(uint8_t data) {
        expanderWrite(data | En);   delayMicroseconds(1);
        expanderWrite(data & ~En);  delayMicroseconds(50);
    }

    void expanderWrite(uint8_t data) {
        _wire->beginTransmission(_addr);
        _wire->write(data | _backlight);
        _wire->endTransmission();
    }
};

#endif // LIQUIDCRYSTAL_I2C_H
