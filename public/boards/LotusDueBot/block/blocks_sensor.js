module.exports = function(Blockly){
  'use strict';
console.log('[LotusDueBot] blocks_sensor.js LOADING');
var sensor_colour= Blockly.Msg.SENSOR_HUE ;

Blockly.Blocks['sw1_press'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Wait for Button Press")
        .appendField(new Blockly.FieldDropdown([
          ["SW1 (D22)", "1"],
          ["SW2 (D23)", "2"]
        ]), "SW");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(sensor_colour);
    this.setTooltip("Wait until the selected start button is pressed and released");
  }
};

Blockly.Blocks['analog_sensor'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Analog Read ")
        .appendField(new Blockly.FieldDropdown([
                                            ["(A0)", "A0"],
                                            ["(A1)", "A1"],
                                            ["(A2)", "A2"],
                                            ["(A3)", "A3"],
                                            ["(A4)", "A4"],
                                            ["(A5)", "A5"],
                                            ["(A6)", "A6"],
                                            ["(A7)", "A7"],
                                            ["(A8)", "A8"],
                                            ["(A9)", "A9"],
                                            ["(A10)","A10"],
                                            ["(A11)Knob", "A11"]]), "pin");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(290);
    this.setTooltip("read analog value from pin (0..1023)");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['nano_beep'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Buzzer beep");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Buzzer beep");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['nano_beep_custom'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Buzzer frequency")
        .appendField(new Blockly.FieldNumber(1000, 1, 10000), "FREQUENCY")
        .appendField("Hz for")
        .appendField(new Blockly.FieldNumber(1000, 1, 10000), "DURATION")
        .appendField("ms");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Buzzer beep with custom frequency and duration");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['knob_read'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Knob (A11)");
    this.setOutput(true, "Number");
    this.setColour(290);
    this.setTooltip("Read potentiometer at A11 (0..1023)");
    this.setHelpUrl("");
  }
};

// ====== Encoder x4 (Enc1..Enc4 paired with M1..M4) ======
Blockly.Blocks['encoder_init'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Encoder init")
        .appendField(new Blockly.FieldDropdown([
          ["Enc1 (D46,D47)", "1"],
          ["Enc2 (D48,D49)", "2"],
          ["Enc3 (D50,D51)", "4"],
          ["Enc4 (D52,D53)", "8"],
          ["Enc1+2",         "3"],
          ["Enc1+2+3",       "7"],
          ["All four",      "15"]
        ]), "MASK");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Attach interrupts and start counting on selected encoders. On Due every digital pin is interrupt-capable, so any combination is fine.");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['encoder_read'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Encoder read")
        .appendField(new Blockly.FieldDropdown([
          ["Enc1", "1"], ["Enc2", "2"], ["Enc3", "3"], ["Enc4", "4"]
        ]), "WHICH");
    this.setOutput(true, "Number");
    this.setColour(290);
    this.setTooltip("Read current encoder count (signed)");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['encoder_reset'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Encoder reset")
        .appendField(new Blockly.FieldDropdown([
          ["Enc1", "1"], ["Enc2", "2"], ["Enc3", "3"], ["Enc4", "4"],
          ["All", "255"]
        ]), "WHICH");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Reset encoder count to 0");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['encoder_drive'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Encoder drive")
        .appendField(new Blockly.FieldDropdown([
          ["Forward",  "1"],
          ["Backward","-1"]
        ]), "DIR");
    this.appendValueInput("TICKS").setCheck("Number").appendField("for");
    this.appendDummyInput().appendField("ticks at");
    this.appendValueInput("SPEED").setCheck("Number");
    this.appendDummyInput().appendField("%");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Drive M1 + M2 the same distance using Enc1 + Enc2 sync. Each wheel runs until it reaches the tick target with proportional speed correction so both wheels track together.");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['encoder_spin'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Encoder spin")
        .appendField(new Blockly.FieldDropdown([
          ["Right (cw)",  "1"],
          ["Left  (ccw)","-1"]
        ]), "DIR");
    this.appendValueInput("TICKS").setCheck("Number").appendField("for");
    this.appendDummyInput().appendField("ticks at");
    this.appendValueInput("SPEED").setCheck("Number");
    this.appendDummyInput().appendField("%");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Spin in place: one wheel forward, the other backward. Uses Enc1 + Enc2.");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['map_func'] = {
  init: function() {
    this.appendValueInput("V1")
      .setCheck("Number")
      .appendField("Map Lotus");
    this.appendDummyInput()
      .appendField("Min")
      .appendField(new Blockly.FieldNumber(0), "V2");
    this.appendDummyInput()
      .appendField("Max")
      .appendField(new Blockly.FieldNumber(0), "V3");
    this.appendDummyInput()
      .appendField("New_Min")
      .appendField(new Blockly.FieldNumber(0), "V4");
    this.appendDummyInput()
      .appendField("New_Max")
      .appendField(new Blockly.FieldNumber(0), "V5");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(20);
    this.setTooltip("Map a sensor value to a new range");
    this.setHelpUrl("");
  }
};

// ====== Serial (Due has Serial, Serial1, Serial2, Serial3) ======
Blockly.Blocks['serial_begin'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Serial init")
        .appendField(new Blockly.FieldDropdown([
          ["Serial (USB)",   "0"],
          ["Serial1 (D18/D19)", "1"],
          ["Serial2 (D16/D17)", "2"]
        ]), "PORT")
        .appendField("baud")
        .appendField(new Blockly.FieldDropdown([
          ["9600","9600"], ["19200","19200"], ["38400","38400"],
          ["57600","57600"], ["115200","115200"]
        ]), "BAUD");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("Initialize a hardware serial port");
  }
};

Blockly.Blocks['serial_print'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Serial print")
        .appendField(new Blockly.FieldDropdown([
          ["Serial",  "0"],
          ["Serial1", "1"],
          ["Serial2", "2"]
        ]), "PORT")
        .appendField(new Blockly.FieldTextInput("hello"), "TXT")
        .appendField("newline")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "NL");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
  }
};

Blockly.Blocks['serial_print_number'] = {
  init: function() {
    this.appendValueInput("N").setCheck("Number")
        .appendField("Serial print number");
    this.appendDummyInput()
        .appendField("on")
        .appendField(new Blockly.FieldDropdown([
          ["Serial",  "0"], ["Serial1", "1"], ["Serial2", "2"]
        ]), "PORT")
        .appendField("newline")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "NL");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
  }
};

// ====== I2C bus (HMC5883L compass + MPU6050 IMU on SDA=D20 / SCL=D21) ======
Blockly.Blocks['i2c_begin'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("I2C init (SDA=D20, SCL=D21)");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(180);
    this.setTooltip("Wire.begin() — call once in setup before any I2C read/write");
  }
};

Blockly.Blocks['i2c_write_byte'] = {
  init: function() {
    this.appendValueInput("ADDR").setCheck("Number").appendField("I2C write addr");
    this.appendValueInput("REG").setCheck("Number").appendField("reg");
    this.appendValueInput("VAL").setCheck("Number").appendField("val");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(180);
    this.setTooltip("Write a byte to a register over I2C");
  }
};

Blockly.Blocks['i2c_read_byte'] = {
  init: function() {
    this.appendValueInput("ADDR").setCheck("Number").appendField("I2C read addr");
    this.appendValueInput("REG").setCheck("Number").appendField("reg");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(180);
    this.setTooltip("Read one byte from a register over I2C");
  }
};

// NOTE: MPU6050 and HMC5883 blocks intentionally NOT defined here -- KBIDE
// already ships plugins for both (blocks_mpu6050.js, blocks_hmc5883.js) which
// load globally regardless of board. Use those plugin blocks. We only keep
// generic i2c_begin / i2c_write_byte / i2c_read_byte for custom devices.

// ====== SD card (CS = D15) ======
Blockly.Blocks['sd_begin'] = {
  init: function() {
    this.appendDummyInput().appendField("SD card init (CS=D15)");
    this.setOutput(true, "Boolean");
    this.setColour(140);
    this.setTooltip("Initialize SD card. Returns 1 if successful, 0 on failure.");
  }
};

Blockly.Blocks['sd_write_line'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("SD append to file")
        .appendField(new Blockly.FieldTextInput("log.txt"), "FN");
    this.appendValueInput("LINE").setCheck(null).appendField("line");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(140);
    this.setTooltip("Append a line of text to a file on the SD card (auto-creates if absent)");
  }
};

};
