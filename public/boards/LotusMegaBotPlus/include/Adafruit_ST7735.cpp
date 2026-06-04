// Minimal Adafruit_ST7735 implementation (Green tab 128x160, HW SPI)
#include "Adafruit_ST7735.h"

// Init sequence (Green tab 1.8") -- run via commandList().
// Format per group:  count, {cmd, arg-count|0x80(=delay-after), [args..], [delay_ms]}
// 0x80 bit on arg count means: after sending args, delay by next byte (ms).
static const uint8_t PROGMEM
    Bcmd[] = {                  // Init sequence
        21,                     // 21 commands
        ST77XX_SWRESET, 0x80, 150,
        ST77XX_SLPOUT,  0x80, 255,
        ST7735_FRMCTR1, 3,      0x01, 0x2C, 0x2D,
        ST7735_FRMCTR2, 3,      0x01, 0x2C, 0x2D,
        ST7735_FRMCTR3, 6,      0x01, 0x2C, 0x2D, 0x01, 0x2C, 0x2D,
        ST7735_INVCTR,  1,      0x07,
        ST7735_PWCTR1,  3,      0xA2, 0x02, 0x84,
        ST7735_PWCTR2,  1,      0xC5,
        ST7735_PWCTR3,  2,      0x0A, 0x00,
        ST7735_PWCTR4,  2,      0x8A, 0x2A,
        ST7735_PWCTR5,  2,      0x8A, 0xEE,
        ST7735_VMCTR1,  1,      0x0E,
        ST77XX_INVOFF,  0,
        ST77XX_MADCTL,  1,      0xC8,                     // RGB, default rot
        ST77XX_COLMOD,  1,      0x05,                     // 16-bit color
        ST77XX_CASET,   4,      0x00, 0x00, 0x00, 0x7F,
        ST77XX_RASET,   4,      0x00, 0x00, 0x00, 0x9F,
        ST7735_GMCTRP1, 16,     0x02, 0x1c, 0x07, 0x12,
                                0x37, 0x32, 0x29, 0x2d,
                                0x29, 0x25, 0x2B, 0x39,
                                0x00, 0x01, 0x03, 0x10,
        ST7735_GMCTRN1, 16,     0x03, 0x1d, 0x07, 0x06,
                                0x2E, 0x2C, 0x29, 0x2D,
                                0x2E, 0x2E, 0x37, 0x3F,
                                0x00, 0x00, 0x02, 0x10,
        ST77XX_NOP,     0,
        ST77XX_DISPON,  0x80,   100
    };

void Adafruit_ST7735::commandList(const uint8_t *addr) {
    uint8_t numCommands = pgm_read_byte(addr++);
    while (numCommands--) {
        uint8_t cmd      = pgm_read_byte(addr++);
        uint8_t numArgs  = pgm_read_byte(addr++);
        uint8_t delay_ms = numArgs & 0x80;
        numArgs &= ~0x80;
        sendCommand(cmd, addr, numArgs);
        addr += numArgs;
        if (delay_ms) {
            uint16_t d = pgm_read_byte(addr++);
            if (d == 255) d = 500;
            delay(d);
        }
    }
}

void Adafruit_ST7735::begin(uint32_t freq) {
    if (!freq) freq = 8000000;
    initSPI(freq);
    commandList(Bcmd);
    setRotation(0);
}

void Adafruit_ST7735::setRotation(uint8_t m) {
    uint8_t madctl = 0;
    rotation = m & 3;
    switch (rotation) {
        case 0:
            madctl  = MADCTL_MX | MADCTL_MY | MADCTL_RGB;
            _height = ST7735_TFTHEIGHT;
            _width  = ST7735_TFTWIDTH;
            _colstart = 0; _rowstart = 0;
            break;
        case 1:
            madctl  = MADCTL_MY | MADCTL_MV | MADCTL_RGB;
            _height = ST7735_TFTWIDTH;
            _width  = ST7735_TFTHEIGHT;
            _colstart = 0; _rowstart = 0;
            break;
        case 2:
            madctl  = MADCTL_RGB;
            _height = ST7735_TFTHEIGHT;
            _width  = ST7735_TFTWIDTH;
            _colstart = 0; _rowstart = 0;
            break;
        case 3:
            madctl  = MADCTL_MX | MADCTL_MV | MADCTL_RGB;
            _height = ST7735_TFTWIDTH;
            _width  = ST7735_TFTHEIGHT;
            _colstart = 0; _rowstart = 0;
            break;
    }
    sendCommand(ST77XX_MADCTL, &madctl, 1);
}

void Adafruit_ST7735::invertDisplay(bool i) {
    sendCommand(i ? ST77XX_INVON : ST77XX_INVOFF);
}

void Adafruit_ST7735::setAddrWindow(uint16_t x, uint16_t y, uint16_t w, uint16_t h) {
    x += _colstart;
    y += _rowstart;
    uint32_t xa = ((uint32_t)x << 16) | (x + w - 1);
    uint32_t ya = ((uint32_t)y << 16) | (y + h - 1);

    writeCommand(ST77XX_CASET);
    SPI_WRITE32(xa);
    writeCommand(ST77XX_RASET);
    SPI_WRITE32(ya);
    writeCommand(ST77XX_RAMWR);
}
