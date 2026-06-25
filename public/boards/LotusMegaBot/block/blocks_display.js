module.exports = function(Blockly) {
  'use strict';
  var basic_colour = Blockly.Msg.BASIC_HUE;

  function floydSteinberg(data, width, height) {
    var i, y, x, idx, old, nw, err, ri;
    for (i = 0; i < data.length; i += 4) {
      var g = Math.round(data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
      data[i] = data[i+1] = data[i+2] = g;
    }
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        idx = (y * width + x) * 4;
        old = data[idx]; nw = old < 128 ? 0 : 255; err = old - nw;
        data[idx] = data[idx+1] = data[idx+2] = nw;
        if (x + 1 < width) { ri = (y * width + x + 1) * 4; data[ri] = Math.min(255, Math.max(0, data[ri] + err * 7 / 16)); }
        if (y + 1 < height) {
          if (x > 0) { ri = ((y+1) * width + x - 1) * 4; data[ri] = Math.min(255, Math.max(0, data[ri] + err * 3 / 16)); }
          ri = ((y+1) * width + x) * 4; data[ri] = Math.min(255, Math.max(0, data[ri] + err * 5 / 16));
          if (x + 1 < width) { ri = ((y+1) * width + x + 1) * 4; data[ri] = Math.min(255, Math.max(0, data[ri] + err * 1 / 16)); }
        }
      }
    }
  }

  // Row-major MSB-first format for Adafruit GFX drawBitmap
  function toBitmapHex(data, width, height) {
    var rowBytes = Math.ceil(width / 8);
    var buf = new Uint8Array(rowBytes * height);
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (data[(y * width + x) * 4] > 127) {
          buf[y * rowBytes + Math.floor(x / 8)] |= (0x80 >> (x % 8));
        }
      }
    }
    var hex = '';
    for (var i = 0; i < buf.length; i++) {
      hex += (buf[i] < 16 ? '0x0' : '0x') + buf[i].toString(16) + ',';
      if ((i + 1) % 16 === 0) hex += '\n';
    }
    return hex.replace(/,\s*$/, '');
  }

  var PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABACAIAAABdtOgoAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJ/SURBVHhe7ZbbdQIxDES3LgraeqiGZiiG2JLWHhmbx08Gkrk/kWU9GR/IdhNUJAAZCUBGApCRAGQkABkJQEYCkJEAZCQAGQlARgKQkQBkJAAZCUBGApCRAGQkABkJQEYCkJEAZCQAGQlARgKQkQBkJACZFwW47Nu2nc7XOP4ZbK9tv8SRgASQAP+bhQDX86k+jYo9jxDgbA+mAG/GH5GDEs393dtLQLNRZL9qTnwHs/oeHpUh18xjfHzvkBAxF/NUirf16DnQts+KsxTiwos7PXZgKkDesxrRweZw20dCGxZe+aHw9bzH33obC9p92A4WhfRF/VTszj+UrkBCxKT4sVfxm+s+8a492pO9GjMB+p6N5OqHHOk96/Ghv18U0pzTSWfdVvVTte5GMwMJKSYVyt2CPAymQbW2iUW3EzIRYMg10gztkGaGi5X/MB3rAOfGMGiqalWW9dPoEJX8CFykoikBxh/m7cUH65W9nKUA0TDAGeCQ3DD1yn/QW+TIORaznU5tu2X91Kk3mUwQwAWEDwmtG3r7CO4NjqFe2cuYfQWlUeA3YFIc/fPx0F+s8PV7s45VF7QVI/tJX7fd9CAMScCFm5OavZl5PcKrD04EJnnI9Ef4GKAC/Y4u6dAjC9Bv7gdvj/VZG5OhIw3XXPVtxeIfGsvx4GVhu3AzWqQE2LePuu/FHJ1Ga/N8r8JCgE8DPoNPI422VHrJdwjgb+mdvX6N/JG/P+g3COA7fubnX8lfNW+O+SVfQX8XCUBGApCRAGQkABkJQEYCkJEAZCQAGQlARgKQkQBkJAAZCUBGApCRAGQkABkJQEYCkJEAZCQAGQlARgKQkQBkJACV2+0HImEfdtax+UEAAAAASUVORK5CYII=';

  Blockly.Blocks['i2c128x64_create_image'] = {
    bitmapHex_: '',
    imgW_: 128,
    imgH_: 64,

    init: function() {
      this.appendDummyInput()
          .appendField('create image from PNG file');
      this.appendDummyInput('IMAGE_ROW')
          .appendField(new Blockly.FieldImage(PLACEHOLDER, 128, 64, 'click to upload', function() {
            var field = this;
            var block = this.sourceBlock_;
            ;(async function() {
              if (!window.lotusAPI) return;
              var paths = await window.lotusAPI.fs.openDialog({
                filters: [{ name: 'Images PNG', extensions: ['png'] }]
              });
              if (!paths || !paths[0]) return;
              var result = await window.lotusAPI.fs.readFileBase64(paths[0]);
              if (!result || result.error || !result.content) return;
              var img = new Image();
              img.onload = function() {
                var w = img.width, h = img.height;
                if (w > 128) { h = Math.round(h * 128 / w); w = 128; }
                if (h > 64)  { w = Math.round(w * 64 / h);  h = 64;  }
                var canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                var imgData = ctx.getImageData(0, 0, w, h);
                floydSteinberg(imgData.data, w, h);
                ctx.putImageData(imgData, 0, 0);
                block.bitmapHex_ = toBitmapHex(imgData.data, w, h);
                block.imgW_ = w;
                block.imgH_ = h;
                field.setValue(canvas.toDataURL('image/png'));
                var sizeField = block.getField('size_label');
                if (sizeField) sizeField.setValue('image size ' + w + ' x ' + h);
              };
              img.src = result.content;
            })();
          }, true), 'preview_image');
      this.appendDummyInput('SIZE_ROW')
          .appendField('image size 128 x 64', 'size_label');
      this.setOutput(true, 'BitmapData');
      this.setColour(basic_colour);
      this.setTooltip('create image from PNG file (max 128x64 pixels, auto-resized and dithered)');
      this.setHelpUrl('');
    },

    saveExtraState: function() {
      var f = this.getField('preview_image');
      return { bitmapHex: this.bitmapHex_, imgW: this.imgW_, imgH: this.imgH_, dataUrl: f ? f.getValue() : '' };
    },

    loadExtraState: function(state) {
      this.bitmapHex_ = state.bitmapHex || '';
      this.imgW_ = state.imgW || 128;
      this.imgH_ = state.imgH || 64;
      if (state.dataUrl) { var f = this.getField('preview_image'); if (f) f.setValue(state.dataUrl); }
      if (state.imgW && state.imgH) { var sl = this.getField('size_label'); if (sl) sl.setValue('image size ' + state.imgW + ' x ' + state.imgH); }
    },
  };

  Blockly.Blocks['i2c128x64_display_image'] = {
    init: function() {
      this.appendValueInput('img')
          .setCheck('BitmapData')
          .appendField('draw image');
      this.appendValueInput('x')
          .setCheck('Number')
          .appendField(' at (X');
      this.appendValueInput('y')
          .setCheck('Number')
          .appendField(',Y');
      this.appendValueInput('width')
          .setCheck('Number')
          .appendField(') width');
      this.appendValueInput('height')
          .setCheck('Number')
          .appendField('height');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(basic_colour);
      this.setTooltip('display image to OLED');
      this.setHelpUrl('');
    }
  };

Blockly.Blocks['i2c128x64_display_clear'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("clear display");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("clear display");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_display'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Show display");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("display everything to screen");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_print'] = {
  init: function() {
    this.appendValueInput("text")
        .setCheck("String")
        .appendField("display text");
    this.appendValueInput("x")
        .setCheck("Number")
        .appendField("at (X");
    this.appendValueInput("y")
        .setCheck("Number")
        .appendField(", Y");
    this.appendDummyInput()
        .appendField(")  size")
        .appendField(new Blockly.FieldDropdown([["1 (10pt)","1"], ["2 (16pt)","2"], ["3 (24pt)","3"]]), "font");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("display string at x,y");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_hilight_text'] = {
  init: function() {
    this.appendValueInput("text")
        .setCheck("String")
        .appendField("display hilight text");
    this.appendValueInput("x")
        .setCheck("Number")
        .appendField("at (X");
    this.appendValueInput("y")
        .setCheck("Number")
        .appendField(", Y");
    this.appendDummyInput()
        .appendField(")  size")
        .appendField(new Blockly.FieldDropdown([["1 (10pt)","1"], ["2 (16pt)","2"], ["3 (24pt)","3"]]), "font");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("display hilight string at x,y");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_print_display'] = {
  init: function() {
    this.appendValueInput("text")
        .setCheck("String")
        .appendField("Full display text");
    this.appendValueInput("x")
        .setCheck("Number")
        .appendField("at (X");
    this.appendValueInput("y")
        .setCheck("Number")
        .appendField(", Y");
    this.appendDummyInput()
        .appendField(")  font")
        .appendField(new Blockly.FieldDropdown([["1 (10pt)","ArialMT_Plain_10"], ["2 (16pt)","ArialMT_Plain_16"], ["3 (24pt)","ArialMT_Plain_24"]]), "font");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("display string at x,y");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_print_display_center'] = {
  init: function() {
    this.appendValueInput("text")
        .setCheck("String")
        .appendField("display center text");

    this.appendValueInput("y")
        .setCheck("Number")
        .appendField("at (Y");
    this.appendDummyInput()
        .appendField(")  font")
        .appendField(new Blockly.FieldDropdown([["1 (10pt)","ArialMT_Plain_10"], ["2 (16pt)","ArialMT_Plain_16"], ["3 (24pt)","ArialMT_Plain_24"]]), "font");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("display string center at y position");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_print_display_center_one'] = {
  init: function() {
    this.appendValueInput("text")
        .setCheck("String")
        .appendField("Center middle text");

    this.appendDummyInput()
        .appendField(" font")
        .appendField(new Blockly.FieldDropdown([["1 (10pt)","ArialMT_Plain_10"], ["2 (16pt)","ArialMT_Plain_16"], ["3 (24pt)","ArialMT_Plain_24"]]), "font");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("display string at center screen");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_print_scroll_left'] = {
  init: function() {
    this.appendValueInput("text")
        .setCheck("String")
        .appendField("scroll text ");
    this.appendValueInput("step")
        .setCheck("Number")
        .appendField(" by step ");
    this.appendValueInput("x")
        .setCheck("Number")
        .appendField(" at X");
	this.appendDummyInput()
        .appendField(" direction")
        .appendField(new Blockly.FieldDropdown([["UP","UP"], ["DOWN","DOWN"]]), "dir");
    this.appendDummyInput()
        .appendField(" size")
        .appendField(new Blockly.FieldDropdown([["1 (10pt)","1"], ["2 (16pt)","2"], ["3 (24pt)","3"]]), "font");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("display  scrolling text at X");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_print_number'] = {
  init: function() {
    this.appendValueInput("number")
        .setCheck("Number")
        .appendField("display number");
    this.appendValueInput("x")
        .setCheck("Number")
        .appendField("at (X");
    this.appendValueInput("y")
        .setCheck("Number")
        .appendField(", Y");
    this.appendDummyInput()
        .appendField(")  font")
        .appendField(new Blockly.FieldDropdown([["1 (10pt)","1"], ["2 (16pt)","2"], ["3 (24pt)","3"]]), "font");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("display string at x,y");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_print_number_display'] = {
  init: function() {
    this.appendValueInput("number")
        .setCheck("Number")
        .appendField("Full display number");
    this.appendValueInput("x")
        .setCheck("Number")
        .appendField("at (X");
    this.appendValueInput("y")
        .setCheck("Number")
        .appendField(", Y");
    this.appendDummyInput()
        .appendField(")  font")
        .appendField(new Blockly.FieldDropdown([["1 (10pt)","ArialMT_Plain_10"], ["2 (16pt)","ArialMT_Plain_16"], ["3 (24pt)","ArialMT_Plain_24"]]), "font");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("display string at x,y");
 this.setHelpUrl("");
  }
};


Blockly.Blocks['i2c128x64_display_draw_line'] = {
  init: function() {
    this.appendValueInput("x0")
        .setCheck("Number")
        .appendField("draw line from (X");
    this.appendValueInput("y0")
        .setCheck("Number")
        .appendField(",Y");
    this.appendValueInput("x1")
        .setCheck("Number")
        .appendField(")  to  (X");
    this.appendValueInput("y1")
        .setCheck("Number")
        .appendField(",Y");
    this.appendDummyInput()
        .appendField(")");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("draw line from (x0,y0) to (x1,y1)");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_draw_rect'] = {
  init: function() {
    this.appendValueInput("x")
        .setCheck("Number")
        .appendField("draw rectangle at (X");
    this.appendValueInput("y")
        .setCheck("Number")
        .appendField(", Y");
    this.appendValueInput("width")
        .setCheck("Number")
        .appendField(")  width");
    this.appendValueInput("height")
        .setCheck("Number")
        .appendField(" height");
    this.appendDummyInput()
        .appendField(" fill ")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "fill");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("draw rectangle to display");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_draw_circle'] = {
  init: function() {
    this.appendValueInput("x")
        .setCheck("Number")
        .appendField("draw circle at (X");
    this.appendValueInput("y")
        .setCheck("Number")
        .appendField(",Y");
    this.appendValueInput("r")
        .setCheck("Number")
        .appendField(")  radius");
    this.appendDummyInput()
        .appendField(" fill")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "fill");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("draw circle on screen");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_draw_progress_bar'] = {
  init: function() {
    this.appendValueInput("x")
        .setCheck("Number")
        .appendField("draw round rect at (X");
    this.appendValueInput("y")
        .setCheck("Number")
        .appendField(",Y");
    this.appendValueInput("width")
        .setCheck("Number")
        .appendField(")  width");
    this.appendValueInput("height")
        .setCheck("Number")
        .appendField("  height");
	this.appendValueInput("progress")
        .setCheck("Number")
        .appendField("  radius");
    this.appendDummyInput()
        .appendField(" fill")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "fill");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("draw round rect on the screen");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_draw_pixel'] = {
  init: function() {
    this.appendValueInput("x")
        .setCheck("Number")
        .appendField("set pixel (X");
    this.appendValueInput("y")
        .setCheck("Number")
        .appendField(",Y");
    this.appendDummyInput()
        .appendField(")  white color")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "color");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("set pixel color");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_string_width'] = {
  init: function() {
    this.appendValueInput("text")
        .setCheck("String")
        .appendField("get pixel width of string");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(basic_colour);
 this.setTooltip("get pixel width from given string");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_width'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("get screen width");
    this.setOutput(true, "Number");
    this.setColour(basic_colour);
 this.setTooltip("get screen size width in pixel");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['i2c128x64_display_height'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("get screen height");
    this.setOutput(true, "Number");
    this.setColour(basic_colour);
 this.setTooltip("get display screen height in pixel");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['led_green_on'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("LED Green On");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("trun on green LED");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['led_green_off'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("LED Green Off");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("trun off green LED");
 this.setHelpUrl("");
  }
};


Blockly.Blocks['led_select_display'] = {
  init: function() {

    this.appendDummyInput()
        .appendField("LED Color ")
        .appendField(new Blockly.FieldDropdown([["Green","green"], ["Yellow","yellow"], ["Red","red"], ["Blue","blue"], ["RGB","rgb"]]), "color");
	this.appendDummyInput()
		.appendField(" Status ")
		.appendField(new Blockly.FieldDropdown([["On","on"], ["Off","off"]]), "status");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(basic_colour);
 this.setTooltip("turn LED color on/off");
 this.setHelpUrl("");
  }
};

}
