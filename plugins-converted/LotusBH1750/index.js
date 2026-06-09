// BH1750 light sensor plugin for Lotus IDE.
//
// Ported from the KBIDE-style plugin shipped under
// C:\LotusIDE\plugins\LotusBH1750. The block definitions and tooltips are
// the same; the generators now use the `board` arg (passed by the loader)
// instead of Vue.prototype.$global.board.board_info.name, and they emit
// LotusIDE's marker syntax (#VARIABLE) so the BH1750 instance lives at
// global scope and stays visible across setup() and loop().
//
// C++ sources for the BH1750 class live in src/ next to this file. The
// arduino.js compile pipeline copies that src/ into the build's libraries/
// tree so #include <BH1750.h> resolves automatically.

lotus.register({
  toolbox: {
    name: 'BH1750',
    color: '#4FC3F7',
  },
  includes: ['BH1750.h', 'Wire.h'],
  blocks: [
    {
      type: 'bh1750_begin',
      message0: 'BH1750 begin at %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'address',
          options: [['0x23', '0x23'], ['0x5C', '0x5C']],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#4FC3F7',
      tooltip: 'Config BH1750 to Continuously H-Resolution Mode and setup I2C',
      helpUrl: 'https://github.com/maxpromer/BH1750_Arduino',
    },
    {
      type: 'bh1750_read',
      message0: 'BH1750 read light level (lx)',
      output: 'Number',
      colour: '#4FC3F7',
      tooltip: 'Read and measure data from BH1750',
      helpUrl: 'https://github.com/maxpromer/BH1750_Arduino',
    },
  ],
  generators: {
    bh1750_begin: `
      var address = block.getFieldValue('address');
      var code = '';
      // The BH1750 instance lives at global scope so both setup() and loop()
      // can call methods on it. #VARIABLE is LotusIDE's marker for top-of-
      // sketch declarations.
      code += '#VARIABLE\\nBH1750 bh(' + address + ', &Wire);\\n#END\\n';
      if (board.platform === 'arduino-avr') {
        // ATmega328P pins are hardwired (A4=SDA, A5=SCL); Wire.begin() takes
        // no arguments on AVR.
        code += 'Wire.begin();\\n';
      } else {
        // ESP32 / SAM let us pick pins. board.i2cSda / board.i2cScl are
        // supplied by the host's makeBoardCtx().
        code += 'Wire.begin(' + (board.i2cSda || 21) + ', ' + (board.i2cScl || 22) + ');\\n';
      }
      code += 'bh.begin();\\n';
      return code;
    `,
    bh1750_read: `
      return ['bh.read()', generator.ORDER_NONE || 0];
    `,
  },
})
