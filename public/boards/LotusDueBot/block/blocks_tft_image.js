// TFT Image block for LotusDueBot (ported from LotusMegaBotPlus)
// Uses Blockly.FieldImage — the LotusDueBot original used a custom
// FieldImagePicker subclass of FieldTextInput, which mis-reported its size
// to Blockly v10's flyout layout and caused the TFT category blocks to
// visually overlap each other.
// RGB565 data stored in block.imgData_ = {w, h, data: base64}
module.exports = function(Blockly){
  'use strict';
  var TFT_COLOUR = 200;

  var SIZE_OPTIONS = [
    ['32 px (icon)',                     '32'],
    ['48 px',                            '48'],
    ['64 px',                            '64'],
    ['80 px',                            '80'],
    ['96 px',                            '96'],
    ['112 px',                           '112'],
    ['Fit Portrait 128x160',             'fit'],
    ['Fit Landscape 160x128',            'fit_l'],
    ['Full Portrait 128x160 (stretch)',  'full'],
    ['Full Landscape 160x128 (stretch)', 'full_l']
  ];

  var PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0Ij48cmVjdCB4PSIyIiB5PSIzIiB3aWR0aD0iMjAiIGhlaWdodD0iMTgiIGZpbGw9IiNGQUZBRkEiIHN0cm9rZT0iIzE5NzZEMiIgc3Ryb2tlLXdpZHRoPSIxLjIiIHJ4PSIyIi8+PGNpcmNsZSBjeD0iNyIgY3k9IjkiIHI9IjEuNiIgZmlsbD0iI0ZGQTcyNiIvPjxwYXRoIGQ9Ik0gNCAxOCBMIDkgMTMgTCAxMiAxNiBMIDE2IDExIEwgMjAgMTggWiIgZmlsbD0iIzY2QkI2QSIvPjxjaXJjbGUgY3g9IjE4IiBjeT0iNiIgcj0iNC41IiBmaWxsPSIjMTk3NkQyIi8+PHBhdGggZD0iTSAxOCAzLjUgTCAxOCA4LjUgTSAxNS41IDYgTCAxOCAzLjUgTCAyMC41IDYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==';

  function resolveTarget(srcW, srcH, opt) {
    if (opt === 'fit') {
      var s = Math.min(128 / srcW, 160 / srcH);
      return { w: Math.max(1, Math.floor(srcW * s)), h: Math.max(1, Math.floor(srcH * s)) };
    }
    if (opt === 'fit_l') {
      var s = Math.min(160 / srcW, 128 / srcH);
      return { w: Math.max(1, Math.floor(srcW * s)), h: Math.max(1, Math.floor(srcH * s)) };
    }
    if (opt === 'full')   return { w: 128, h: 160 };
    if (opt === 'full_l') return { w: 160, h: 128 };
    var n = Number(opt) || 80;
    var sc = Math.min(n / srcW, n / srcH, 1);
    return { w: Math.max(1, Math.floor(srcW * sc)), h: Math.max(1, Math.floor(srcH * sc)) };
  }

  function toRgb565Base64(canvas) {
    var w = canvas.width, h = canvas.height;
    var px = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    var buf = new Uint8Array(w * h * 2);
    for (var i = 0; i < w * h; i++) {
      var r = px[i*4]   >> 3;
      var g = px[i*4+1] >> 2;
      var b = px[i*4+2] >> 3;
      var rgb = ((r << 11) | (g << 5) | b) & 0xFFFF;
      buf[i*2]   = rgb & 0xFF;
      buf[i*2+1] = (rgb >> 8) & 0xFF;
    }
    var bin = '';
    for (var k = 0; k < buf.length; k++) bin += String.fromCharCode(buf[k]);
    return btoa(bin);
  }

  Blockly.Blocks['tft_draw_image'] = {
    imgData_: null,  // {w, h, data: base64} RGB565

    init: function() {
      this.appendDummyInput()
          .appendField('TFT image  (click to upload)');
      this.appendDummyInput('IMAGE_ROW')
          .appendField(new Blockly.FieldImage(PLACEHOLDER, 64, 64, 'click to upload', function() {
            var field = this;
            var block = this.sourceBlock_;
            (async function() {
              if (!window.lotusAPI) return;
              var paths = await window.lotusAPI.fs.openDialog({
                filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }]
              });
              if (!paths || !paths[0]) return;
              var result = await window.lotusAPI.fs.readFileBase64(paths[0]);
              if (!result || result.error || !result.content) return;
              var img = new Image();
              img.onload = function() {
                var sizeOpt = block.getFieldValue('SIZE') || '80';
                var t = resolveTarget(img.width, img.height, sizeOpt);
                var canvas = document.createElement('canvas');
                canvas.width = t.w; canvas.height = t.h;
                var ctx = canvas.getContext('2d');
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, t.w, t.h);
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, t.w, t.h);
                block.imgData_ = { w: t.w, h: t.h, data: toRgb565Base64(canvas) };
                field.setValue(canvas.toDataURL('image/png'));
                var sl = block.getField('size_label');
                if (sl) sl.setValue(t.w + ' x ' + t.h + ' px');
              };
              img.src = result.content;
            })();
          }, true), 'preview_image');
      this.appendDummyInput()
          .appendField('size')
          .appendField(new Blockly.FieldDropdown(SIZE_OPTIONS), 'SIZE')
          .appendField('  ', 'size_label');
      this.appendValueInput('X').setCheck('Number').appendField('at x');
      this.appendValueInput('Y').setCheck('Number').appendField('y');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(TFT_COLOUR);
      this.setTooltip('Click the image to pick a PNG/JPG. Choose size first for best quality.');
    },

    saveExtraState: function() {
      var f = this.getField('preview_image');
      return { imgData: this.imgData_, dataUrl: f ? f.getValue() : '' };
    },

    loadExtraState: function(state) {
      this.imgData_ = state.imgData || null;
      if (state.dataUrl) {
        var f = this.getField('preview_image');
        if (f) f.setValue(state.dataUrl);
      }
      if (state.imgData) {
        var sl = this.getField('size_label');
        if (sl) sl.setValue(state.imgData.w + ' x ' + state.imgData.h + ' px');
      }
    }
  };
};
