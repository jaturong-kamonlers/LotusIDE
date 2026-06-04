module.exports = function(Blockly) {
  'use strict';

  // Size dropdown (1/2/3) → SSD1306Wire font constant + pixel height
  function sizeToFont(size) {
    if (size === '1') return 'ArialMT_Plain_10';
    if (size === '2') return 'ArialMT_Plain_16';
    return 'ArialMT_Plain_24';
  }
  function sizeToHeight(size) {
    if (size === '1') return 10;
    if (size === '2') return 16;
    return 24;
  }
  function fontToHeight(font) {
    if (font === 'ArialMT_Plain_10') return 10;
    if (font === 'ArialMT_Plain_16') return 16;
    return 24;
  }

  Blockly.JavaScript['i2c128x64_create_image'] = function(block) {
    var hex    = block.bitmapHex_ || '';
    var safeId = block.id.replace(/[^a-zA-Z0-9]/g, '_');
    var name   = 'bmp_' + safeId;
    Blockly.JavaScript.definitions_[name] =
      'static const uint8_t ' + name + '[] = {\n' + hex + '\n};';
    return [name, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // Walk the chain (possibly through variables_set/variables_get) back to the
  // i2c128x64_create_image block that produced this bitmap, so we can emit
  // drawFastImage with the bitmap's native width/height instead of whatever
  // shadow default the display_image block carries (a 128x64 shadow on a 64x64
  // image renders garbage past column 64).
  function findBitmapSource(startBlock, seen) {
    if (!startBlock) return null;
    seen = seen || new Set();
    if (seen.has(startBlock.id)) return null;
    seen.add(startBlock.id);
    if (startBlock.type === 'i2c128x64_create_image') return startBlock;
    if (startBlock.type === 'variables_get') {
      var varField = startBlock.getField('VAR');
      if (!varField) return null;
      var varId = varField.getValue();
      var ws = startBlock.workspace;
      if (!ws) return null;
      var sets = ws.getAllBlocks(false).filter(function(b) {
        if (b.type !== 'variables_set') return false;
        var vf = b.getField('VAR');
        return vf && vf.getValue() === varId;
      });
      for (var i = 0; i < sets.length; i++) {
        var src = findBitmapSource(sets[i].getInputTargetBlock('VALUE'), seen);
        if (src) return src;
      }
    }
    return null;
  }

  Blockly.JavaScript['i2c128x64_display_image'] = function(block) {
    var img = Blockly.JavaScript.valueToCode(block, 'img', Blockly.JavaScript.ORDER_ATOMIC) || 'nullptr';
    var x   = Blockly.JavaScript.valueToCode(block, 'x',   Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var y   = Blockly.JavaScript.valueToCode(block, 'y',   Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var w, h;
    var source = findBitmapSource(block.getInputTargetBlock('img'));
    if (source && source.imgW_) {
      w = String(source.imgW_);
      h = String(source.imgH_);
    } else {
      w = Blockly.JavaScript.valueToCode(block, 'width',  Blockly.JavaScript.ORDER_ATOMIC) || '128';
      h = Blockly.JavaScript.valueToCode(block, 'height', Blockly.JavaScript.ORDER_ATOMIC) || '64';
    }
    return 'display.drawFastImage(' + x + ', ' + y + ', ' + w + ', ' + h + ', ' + img + ');\n';
  };

  Blockly.JavaScript['i2c128x64_display_clear'] = function(block) {
    return 'display.clear();\n';
  };

  Blockly.JavaScript['i2c128x64_display_display'] = function(block) {
    return 'display.display();\n';
  };

  Blockly.JavaScript['i2c128x64_display_print'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'text', Blockly.JavaScript.ORDER_ATOMIC);
    var value_x    = Blockly.JavaScript.valueToCode(block, 'x',    Blockly.JavaScript.ORDER_ATOMIC);
    var value_y    = Blockly.JavaScript.valueToCode(block, 'y',    Blockly.JavaScript.ORDER_ATOMIC);
    var font       = sizeToFont(block.getFieldValue('font'));
    return `
display.setFont(${font});
display.drawString(${value_x}, ${value_y}, String(${value_text}));
`;
  };

  Blockly.JavaScript['i2c128x64_hilight_text'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'text', Blockly.JavaScript.ORDER_ATOMIC);
    var value_x    = Blockly.JavaScript.valueToCode(block, 'x',    Blockly.JavaScript.ORDER_ATOMIC);
    var value_y    = Blockly.JavaScript.valueToCode(block, 'y',    Blockly.JavaScript.ORDER_ATOMIC);
    var size       = block.getFieldValue('font');
    var font       = sizeToFont(size);
    var h          = sizeToHeight(size);
    return `
{
  display.setFont(${font});
  display.fillRect(${value_x}, ${value_y}, display.getStringWidth(String(${value_text})), ${h});
  display.setColor(BLACK);
  display.drawString(${value_x}, ${value_y}, String(${value_text}));
  display.setColor(WHITE);
}
`;
  };

  Blockly.JavaScript['i2c128x64_display_print_scroll_left'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'text', Blockly.JavaScript.ORDER_ATOMIC);
    var value_x    = Blockly.JavaScript.valueToCode(block, 'x',    Blockly.JavaScript.ORDER_ATOMIC);
    var value_step = Blockly.JavaScript.valueToCode(block, 'step', Blockly.JavaScript.ORDER_ATOMIC);
    var dir        = block.getFieldValue('dir');
    var size       = block.getFieldValue('font');
    var font       = sizeToFont(size);
    var strH       = -sizeToHeight(size);

    if (dir === 'UP') {
      return `
{
  int _txtH = ${strH};
  int _scrH = display.getHeight();
  display.setFont(${font});
  for (int iy = _scrH; iy >= _txtH; iy -= ${value_step}) {
    display.clear();
    display.drawString(${value_x}, iy, String(${value_text}));
    display.display();
    delay(100);
  }
}
`;
    }
    // DOWN
    return `
{
  int _txtH = ${strH};
  int _scrH = display.getHeight();
  display.setFont(${font});
  for (int iy = _txtH; iy <= _scrH; iy += ${value_step}) {
    display.clear();
    display.drawString(${value_x}, iy, String(${value_text}));
    display.display();
    delay(100);
  }
}
`;
  };

  Blockly.JavaScript['i2c128x64_display_print_display'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'text', Blockly.JavaScript.ORDER_ATOMIC);
    var value_x    = Blockly.JavaScript.valueToCode(block, 'x',    Blockly.JavaScript.ORDER_ATOMIC);
    var value_y    = Blockly.JavaScript.valueToCode(block, 'y',    Blockly.JavaScript.ORDER_ATOMIC);
    var font       = block.getFieldValue('font');
    return `
display.clear();
display.setFont(${font});
display.drawString(${value_x}, ${value_y}, String(${value_text}));
display.display();
`;
  };

  Blockly.JavaScript['i2c128x64_display_print_display_center'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'text', Blockly.JavaScript.ORDER_ATOMIC);
    var value_y    = Blockly.JavaScript.valueToCode(block, 'y',    Blockly.JavaScript.ORDER_ATOMIC);
    var font       = block.getFieldValue('font');
    return `
display.setFont(${font});
display.drawString((display.getWidth() - display.getStringWidth(String(${value_text}))) / 2, ${value_y}, String(${value_text}));
`;
  };

  Blockly.JavaScript['i2c128x64_display_print_display_center_one'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'text', Blockly.JavaScript.ORDER_ATOMIC);
    var font       = block.getFieldValue('font');
    var h          = fontToHeight(font);
    return `
display.setFont(${font});
display.drawString((display.getWidth() - display.getStringWidth(String(${value_text}))) / 2, (display.getHeight() - ${h}) / 2, String(${value_text}));
`;
  };

  Blockly.JavaScript['i2c128x64_display_print_number'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'number', Blockly.JavaScript.ORDER_ATOMIC);
    var value_x    = Blockly.JavaScript.valueToCode(block, 'x',      Blockly.JavaScript.ORDER_ATOMIC);
    var value_y    = Blockly.JavaScript.valueToCode(block, 'y',      Blockly.JavaScript.ORDER_ATOMIC);
    var font       = sizeToFont(block.getFieldValue('font'));
    return `
display.setFont(${font});
display.drawString(${value_x}, ${value_y}, String(${value_text}));
`;
  };

  Blockly.JavaScript['i2c128x64_display_print_number_display'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'number', Blockly.JavaScript.ORDER_ATOMIC);
    var value_x    = Blockly.JavaScript.valueToCode(block, 'x',      Blockly.JavaScript.ORDER_ATOMIC);
    var value_y    = Blockly.JavaScript.valueToCode(block, 'y',      Blockly.JavaScript.ORDER_ATOMIC);
    var font       = block.getFieldValue('font');
    return `
display.clear();
display.setFont(${font});
display.drawString(${value_x}, ${value_y}, String(${value_text}));
display.display();
`;
  };

  Blockly.JavaScript['i2c128x64_display_draw_line'] = function(block) {
    var x0 = Blockly.JavaScript.valueToCode(block, 'x0', Blockly.JavaScript.ORDER_ATOMIC);
    var y0 = Blockly.JavaScript.valueToCode(block, 'y0', Blockly.JavaScript.ORDER_ATOMIC);
    var x1 = Blockly.JavaScript.valueToCode(block, 'x1', Blockly.JavaScript.ORDER_ATOMIC);
    var y1 = Blockly.JavaScript.valueToCode(block, 'y1', Blockly.JavaScript.ORDER_ATOMIC);
    return `display.drawLine(${x0}, ${y0}, ${x1}, ${y1});\n`;
  };

  Blockly.JavaScript['i2c128x64_display_draw_rect'] = function(block) {
    var x  = Blockly.JavaScript.valueToCode(block, 'x',      Blockly.JavaScript.ORDER_ATOMIC);
    var y  = Blockly.JavaScript.valueToCode(block, 'y',      Blockly.JavaScript.ORDER_ATOMIC);
    var w  = Blockly.JavaScript.valueToCode(block, 'width',  Blockly.JavaScript.ORDER_ATOMIC);
    var h  = Blockly.JavaScript.valueToCode(block, 'height', Blockly.JavaScript.ORDER_ATOMIC);
    var fn = block.getFieldValue('fill') === 'TRUE' ? 'fillRect' : 'drawRect';
    return `display.${fn}(${x}, ${y}, ${w}, ${h});\n`;
  };

  Blockly.JavaScript['i2c128x64_display_draw_circle'] = function(block) {
    var x  = Blockly.JavaScript.valueToCode(block, 'x', Blockly.JavaScript.ORDER_ATOMIC);
    var y  = Blockly.JavaScript.valueToCode(block, 'y', Blockly.JavaScript.ORDER_ATOMIC);
    var r  = Blockly.JavaScript.valueToCode(block, 'r', Blockly.JavaScript.ORDER_ATOMIC);
    var fn = block.getFieldValue('fill') === 'TRUE' ? 'fillCircle' : 'drawCircle';
    return `display.${fn}(${x}, ${y}, ${r});\n`;
  };

  // SSD1306Wire has no native drawRoundRect; map to drawProgressBar (rounded shell
  // with inner fill based on the "radius/progress" value 0-100) when not filled,
  // and plain fillRect when filled.
  Blockly.JavaScript['i2c128x64_display_draw_progress_bar'] = function(block) {
    var x        = Blockly.JavaScript.valueToCode(block, 'x',        Blockly.JavaScript.ORDER_ATOMIC);
    var y        = Blockly.JavaScript.valueToCode(block, 'y',        Blockly.JavaScript.ORDER_ATOMIC);
    var w        = Blockly.JavaScript.valueToCode(block, 'width',    Blockly.JavaScript.ORDER_ATOMIC);
    var h        = Blockly.JavaScript.valueToCode(block, 'height',   Blockly.JavaScript.ORDER_ATOMIC);
    var progress = Blockly.JavaScript.valueToCode(block, 'progress', Blockly.JavaScript.ORDER_ATOMIC);
    var fill     = block.getFieldValue('fill') === 'TRUE';
    if (fill) {
      return `display.fillRect(${x}, ${y}, ${w}, ${h});\n`;
    }
    return `display.drawProgressBar(${x}, ${y}, ${w}, ${h}, ${progress});\n`;
  };

  Blockly.JavaScript['i2c128x64_display_draw_pixel'] = function(block) {
    var x     = Blockly.JavaScript.valueToCode(block, 'x', Blockly.JavaScript.ORDER_ATOMIC);
    var y     = Blockly.JavaScript.valueToCode(block, 'y', Blockly.JavaScript.ORDER_ATOMIC);
    var color = block.getFieldValue('color') === 'TRUE' ? 'WHITE' : 'BLACK';
    return `
display.setColor(${color});
display.setPixel(${x}, ${y});
display.setColor(WHITE);
`;
  };

  Blockly.JavaScript['i2c128x64_display_string_width'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'text', Blockly.JavaScript.ORDER_ATOMIC);
    return [`display.getStringWidth(String(${value_text}))`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['i2c128x64_display_width']  = function(block) { return ['display.getWidth()',  Blockly.JavaScript.ORDER_ATOMIC]; };
  Blockly.JavaScript['i2c128x64_display_height'] = function(block) { return ['display.getHeight()', Blockly.JavaScript.ORDER_ATOMIC]; };

  Blockly.JavaScript['led_green_on']  = function(block) { return 'botton.digitalWrite(P3, HIGH);\n'; };
  Blockly.JavaScript['led_green_off'] = function(block) { return 'botton.digitalWrite(P3, LOW);\n';  };

  Blockly.JavaScript['led_select_display'] = function(block) {
    var color  = block.getFieldValue('color');
    var status = block.getFieldValue('status');
    var pinMap = { green: 'P3', yellow: 'P4', red: 'P5', blue: 'P6', rgb: 'P7' };
    var pin    = pinMap[color] || 'P3';
    var level  = status === 'on' ? 'HIGH' : 'LOW';
    return `botton.digitalWrite(${pin}, ${level});\n`;
  };
};
