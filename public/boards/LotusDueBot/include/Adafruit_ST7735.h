// Minimal Adafruit_ST7735 driver for LotusDueBot (1.8" TFT, 128x160).
// Subclass of Adafruit_SPITFT. Supports the common "Green tab" variant.
// Provides both hardware SPI and software (bit-bang) SPI constructors so the
// Lotus shield wiring (D10/D12 on Arduino Due) can drive the panel.
#ifndef _ADAFRUIT_ST7735_H_
#define _ADAFRUIT_ST7735_H_

#include "Adafruit_GFX.h"
#include "Adafruit_SPITFT.h"

// Display dimensions (Green tab 1.8")
#define ST7735_TFTWIDTH   128
#define ST7735_TFTHEIGHT  160

// 16-bit RGB565 colors
#define ST77XX_BLACK   0x0000
#define ST77XX_WHITE   0xFFFF
#define ST77XX_RED     0xF800
#define ST77XX_GREEN   0x07E0
#define ST77XX_BLUE    0x001F
#define ST77XX_CYAN    0x07FF
#define ST77XX_MAGENTA 0xF81F
#define ST77XX_YELLOW  0xFFE0
#define ST77XX_ORANGE  0xFC00

// ST7735 command set (subset)
#define ST77XX_NOP     0x00
#define ST77XX_SWRESET 0x01
#define ST77XX_SLPOUT  0x11
#define ST77XX_INVOFF  0x20
#define ST77XX_INVON   0x21
#define ST77XX_DISPON  0x29
#define ST77XX_CASET   0x2A
#define ST77XX_RASET   0x2B
#define ST77XX_RAMWR   0x2C
#define ST77XX_MADCTL  0x36
#define ST77XX_COLMOD  0x3A

#define ST7735_FRMCTR1 0xB1
#define ST7735_FRMCTR2 0xB2
#define ST7735_FRMCTR3 0xB3
#define ST7735_INVCTR  0xB4
#define ST7735_PWCTR1  0xC0
#define ST7735_PWCTR2  0xC1
#define ST7735_PWCTR3  0xC2
#define ST7735_PWCTR4  0xC3
#define ST7735_PWCTR5  0xC4
#define ST7735_VMCTR1  0xC5
#define ST7735_GMCTRP1 0xE0
#define ST7735_GMCTRN1 0xE1

// MADCTL bits (rotation/order)
#define MADCTL_MY  0x80
#define MADCTL_MX  0x40
#define MADCTL_MV  0x20
#define MADCTL_ML  0x10
#define MADCTL_RGB 0x00
#define MADCTL_BGR 0x08

class Adafruit_ST7735 : public Adafruit_SPITFT {
public:
    // Hardware SPI (default SPI peripheral). cs may be -1.
    Adafruit_ST7735(int8_t cs, int8_t dc, int8_t rst)
        : Adafruit_SPITFT(ST7735_TFTWIDTH, ST7735_TFTHEIGHT, cs, dc, rst) {}

    // Software (bit-bang) SPI. Use this when the shield routes MOSI/SCK
    // through regular digital pins instead of the MCU's hardware SPI block
    // (e.g. LotusDueBot uses D10/D12 on Arduino Due).
    Adafruit_ST7735(int8_t cs, int8_t dc, int8_t mosi, int8_t sck, int8_t rst)
        : Adafruit_SPITFT(ST7735_TFTWIDTH, ST7735_TFTHEIGHT, cs, dc,
                          mosi, sck, rst, -1) {}

    void begin(uint32_t freq = 0);                 // init + default rotation
    void setRotation(uint8_t r);
    void invertDisplay(bool i);

    // GFX hook: set the address window before pixel writes
    void setAddrWindow(uint16_t x, uint16_t y, uint16_t w, uint16_t h);

protected:
    uint8_t _colstart = 0;   // green-tab offset
    uint8_t _rowstart = 0;
    void commandList(const uint8_t *addr);
};

#endif
