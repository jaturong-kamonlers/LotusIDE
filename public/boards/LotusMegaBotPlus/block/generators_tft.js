// TFT 1.8" code generators for LotusMegaBot++
module.exports = function(Blockly) {

  Blockly.JavaScript['tft_color'] = function(block) {
    return [block.getFieldValue('C'), Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['tft_clear'] = function(block) {
    var c = Blockly.JavaScript.valueToCode(block, 'C', Blockly.JavaScript.ORDER_ATOMIC) || 'COLOR_BLACK';
    return 'tft.fillScreen(' + c + ');\n';
  };

  Blockly.JavaScript['tft_set_rotation'] = function(block) {
    return 'tft.setRotation(' + block.getFieldValue('R') + ');\n';
  };

  Blockly.JavaScript['tft_print_at'] = function(block) {
    // Escape the user's text for safe C string literal:
    //   backslash -> \\, double-quote -> \", newline -> \n
    var rawText = block.getFieldValue('TXT') || '';
    var safe = rawText.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');
    var x  = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var y  = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var c  = Blockly.JavaScript.valueToCode(block, 'C', Blockly.JavaScript.ORDER_ATOMIC) || 'COLOR_WHITE';
    var sz = block.getFieldValue('SZ');
    return 'tft.setCursor(' + x + ', ' + y + '); tft.setTextColor(' + c + '); tft.setTextSize(' + sz + '); tft.print(F("' + safe + '"));\n';
  };

  Blockly.JavaScript['tft_print_number_at'] = function(block) {
    var n  = Blockly.JavaScript.valueToCode(block, 'N',  Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var x  = Blockly.JavaScript.valueToCode(block, 'X',  Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var y  = Blockly.JavaScript.valueToCode(block, 'Y',  Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var c  = Blockly.JavaScript.valueToCode(block, 'C',  Blockly.JavaScript.ORDER_ATOMIC) || 'COLOR_WHITE';
    var sz = block.getFieldValue('SZ');
    return 'tft.setCursor(' + x + ', ' + y + '); tft.setTextColor(' + c + '); tft.setTextSize(' + sz + '); tft.print(' + n + ');\n';
  };

  Blockly.JavaScript['tft_draw_pixel'] = function(block) {
    var x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var c = Blockly.JavaScript.valueToCode(block, 'C', Blockly.JavaScript.ORDER_ATOMIC) || 'COLOR_WHITE';
    return 'tft.drawPixel(' + x + ', ' + y + ', ' + c + ');\n';
  };

  Blockly.JavaScript['tft_draw_line'] = function(block) {
    var x0 = Blockly.JavaScript.valueToCode(block, 'X0', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var y0 = Blockly.JavaScript.valueToCode(block, 'Y0', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var x1 = Blockly.JavaScript.valueToCode(block, 'X1', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var y1 = Blockly.JavaScript.valueToCode(block, 'Y1', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var c  = Blockly.JavaScript.valueToCode(block, 'C',  Blockly.JavaScript.ORDER_ATOMIC) || 'COLOR_WHITE';
    return 'tft.drawLine(' + x0 + ', ' + y0 + ', ' + x1 + ', ' + y1 + ', ' + c + ');\n';
  };

  Blockly.JavaScript['tft_draw_rect'] = function(block) {
    var x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var w = Blockly.JavaScript.valueToCode(block, 'W', Blockly.JavaScript.ORDER_ATOMIC) || '10';
    var h = Blockly.JavaScript.valueToCode(block, 'H', Blockly.JavaScript.ORDER_ATOMIC) || '10';
    var c = Blockly.JavaScript.valueToCode(block, 'C', Blockly.JavaScript.ORDER_ATOMIC) || 'COLOR_WHITE';
    var fill = block.getFieldValue('FILL') === 'TRUE';
    var fn = fill ? 'fillRect' : 'drawRect';
    return 'tft.' + fn + '(' + x + ', ' + y + ', ' + w + ', ' + h + ', ' + c + ');\n';
  };

  Blockly.JavaScript['tft_draw_circle'] = function(block) {
    var x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var r = Blockly.JavaScript.valueToCode(block, 'R', Blockly.JavaScript.ORDER_ATOMIC) || '10';
    var c = Blockly.JavaScript.valueToCode(block, 'C', Blockly.JavaScript.ORDER_ATOMIC) || 'COLOR_WHITE';
    var fill = block.getFieldValue('FILL') === 'TRUE';
    var fn = fill ? 'fillCircle' : 'drawCircle';
    return 'tft.' + fn + '(' + x + ', ' + y + ', ' + r + ', ' + c + ');\n';
  };

};
