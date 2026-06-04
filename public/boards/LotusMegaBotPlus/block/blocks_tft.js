// TFT 1.8" (ST7735) blocks for LotusMegaBot++
// Designed fresh -- supports color, drawing primitives, text at position
module.exports = function(Blockly){
  'use strict';
  var TFT_COLOUR = 200;          // teal-ish

  var COLOR_OPTIONS = [
    ["Black",   "COLOR_BLACK"],
    ["White",   "COLOR_WHITE"],
    ["Red",     "COLOR_RED"],
    ["Green",   "COLOR_GREEN"],
    ["Blue",    "COLOR_BLUE"],
    ["Yellow",  "COLOR_YELLOW"],
    ["Cyan",    "COLOR_CYAN"],
    ["Magenta", "COLOR_MAGENTA"],
    ["Orange",  "COLOR_ORANGE"]
  ];

  // ===== Color literal block (output, plugs into any color slot) =====
  Blockly.Blocks['tft_color'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Color")
          .appendField(new Blockly.FieldDropdown(COLOR_OPTIONS), "C");
      this.setOutput(true, "Number");
      this.setColour(TFT_COLOUR);
      this.setTooltip("RGB565 color constant");
    }
  };

  // ===== Clear screen (fill with color) =====
  Blockly.Blocks['tft_clear'] = {
    init: function() {
      this.appendValueInput("C").setCheck("Number")
          .appendField("TFT clear with color");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(TFT_COLOUR);
      this.setTooltip("Fill the whole screen with the given color");
    }
  };

  // ===== Set rotation =====
  Blockly.Blocks['tft_set_rotation'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("TFT rotation")
          .appendField(new Blockly.FieldDropdown([
            ["0 (Portrait)", "0"],
            ["1 (Landscape)", "1"],
            ["2 (Portrait flip)", "2"],
            ["3 (Landscape flip)", "3"]
          ]), "R");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(TFT_COLOUR);
    }
  };

  // ===== Print text at (x, y) with color and size =====
  Blockly.Blocks['tft_print_at'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("TFT print")
          .appendField(new Blockly.FieldTextInput("Hello world!"), "TXT");
      this.appendValueInput("X").setCheck("Number").appendField("at x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("C").setCheck("Number").appendField("color");
      this.appendDummyInput()
          .appendField("size")
          .appendField(new Blockly.FieldDropdown([
            ["1","1"],["2","2"],["3","3"],["4","4"]
          ]), "SZ");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(TFT_COLOUR);
      this.setTooltip("Print text at position with color and size. Click the text to edit.");
    }
  };

  // ===== Pixel =====
  Blockly.Blocks['tft_draw_pixel'] = {
    init: function() {
      this.appendValueInput("X").setCheck("Number").appendField("TFT pixel at x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("C").setCheck("Number").appendField("color");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(TFT_COLOUR);
    }
  };

  // ===== Line =====
  Blockly.Blocks['tft_draw_line'] = {
    init: function() {
      this.appendValueInput("X0").setCheck("Number").appendField("TFT line from x");
      this.appendValueInput("Y0").setCheck("Number").appendField("y");
      this.appendValueInput("X1").setCheck("Number").appendField("to x");
      this.appendValueInput("Y1").setCheck("Number").appendField("y");
      this.appendValueInput("C").setCheck("Number").appendField("color");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(TFT_COLOUR);
    }
  };

  // ===== Rectangle (outline + filled) =====
  Blockly.Blocks['tft_draw_rect'] = {
    init: function() {
      this.appendValueInput("X").setCheck("Number").appendField("TFT rect x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("W").setCheck("Number").appendField("w");
      this.appendValueInput("H").setCheck("Number").appendField("h");
      this.appendValueInput("C").setCheck("Number").appendField("color");
      this.appendDummyInput()
          .appendField("fill")
          .appendField(new Blockly.FieldCheckbox("FALSE"), "FILL");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(TFT_COLOUR);
    }
  };

  // ===== Circle (outline + filled) =====
  Blockly.Blocks['tft_draw_circle'] = {
    init: function() {
      this.appendValueInput("X").setCheck("Number").appendField("TFT circle x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("R").setCheck("Number").appendField("radius");
      this.appendValueInput("C").setCheck("Number").appendField("color");
      this.appendDummyInput()
          .appendField("fill")
          .appendField(new Blockly.FieldCheckbox("FALSE"), "FILL");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(TFT_COLOUR);
    }
  };

  // ===== Print number at position =====
  Blockly.Blocks['tft_print_number_at'] = {
    init: function() {
      this.appendValueInput("N").setCheck("Number")
          .appendField("TFT print number");
      this.appendValueInput("X").setCheck("Number").appendField("at x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("C").setCheck("Number").appendField("color");
      this.appendDummyInput()
          .appendField("size")
          .appendField(new Blockly.FieldDropdown([
            ["1","1"],["2","2"],["3","3"],["4","4"]
          ]), "SZ");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(TFT_COLOUR);
    }
  };

};
