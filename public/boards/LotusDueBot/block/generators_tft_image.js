// ============================================================
// Generator for tft_draw_image (ported from LotusMegaBotPlus)
// Reads RGB565 data from block.imgData_ = {w, h, data: base64}
// (matched to the FieldImage-based blocks_tft_image.js), emits:
//   const uint16_t _img_<id>[] PROGMEM = { ... };   (via definitions_)
//   tft.drawRGBBitmap(x, y, _img_<id>, w, h);
// ============================================================
module.exports = function(Blockly) {
  function _b64ToBytes(b64) {
    if (typeof atob === 'function') {
      var bin = atob(b64);
      var out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }

  Blockly.JavaScript['tft_draw_image'] = function(block) {
    var parsed = block.imgData_ || null;
    var sizeOpt = (block.getFieldValue && block.getFieldValue('SIZE')) || '';
    var xExpr = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var yExpr = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';

    if (!parsed || !parsed.data || !parsed.w || !parsed.h) {
      return '// TFT image block: no image selected\n';
    }

    var bytes = _b64ToBytes(parsed.data);
    var w = parsed.w, h = parsed.h;

    // For fit/full modes, auto-center on the screen (ignore x/y inputs).
    var xCode, yCode;
    if (sizeOpt === 'fit' || sizeOpt === 'full') {
      xCode = String(Math.max(0, Math.floor((128 - w) / 2)));
      yCode = String(Math.max(0, Math.floor((160 - h) / 2)));
    } else if (sizeOpt === 'fit_l' || sizeOpt === 'full_l') {
      xCode = String(Math.max(0, Math.floor((160 - w) / 2)));
      yCode = String(Math.max(0, Math.floor((128 - h) / 2)));
    } else {
      xCode = xExpr;
      yCode = yExpr;
    }
    var pixels = w * h;
    var arr = new Array(pixels);
    for (var i = 0; i < pixels; i++) {
      var lo = bytes[i*2];
      var hi = bytes[i*2 + 1];
      var v = ((hi << 8) | lo) & 0xFFFF;
      arr[i] = '0x' + v.toString(16).toUpperCase().padStart(4, '0');
    }

    var safeId = (block.id || ('img_' + Math.random().toString(36).slice(2,8))).replace(/[^a-zA-Z0-9_]/g, '_');
    var varName = '_img_' + safeId;

    // SAM/Due has unified memory so PROGMEM is a no-op, but keep the qualifier
    // so the same sketch could in principle target an AVR board. The 32K-array
    // size limit comes from AVR-GCC; we apply the same split heuristic so very
    // large images stay portable.
    var MAX_BYTES_PER_ARRAY = 32000;
    var totalBytes = pixels * 2;
    var parts;
    if (totalBytes <= MAX_BYTES_PER_ARRAY) {
      parts = [{ startRow: 0, rows: h }];
    } else {
      var maxRowsPerPart = Math.max(1, Math.floor(MAX_BYTES_PER_ARRAY / (w * 2)));
      var numParts = Math.ceil(h / maxRowsPerPart);
      var baseRows = Math.floor(h / numParts);
      var extraRows = h - baseRows * numParts;
      parts = [];
      var startRow = 0;
      for (var p = 0; p < numParts; p++) {
        var partRows = baseRows + (p < extraRows ? 1 : 0);
        parts.push({ startRow: startRow, rows: partRows });
        startRow += partRows;
      }
    }

    function formatArrayBody(slice) {
      var ls = [];
      for (var j = 0; j < slice.length; j += 16) {
        ls.push('  ' + slice.slice(j, j + 16).join(', '));
      }
      return ls.join(',\n');
    }

    var code = '';

    if (parts.length === 1) {
      Blockly.JavaScript.definitions_[varName] =
        'const uint16_t ' + varName + '[] PROGMEM = {\n' + formatArrayBody(arr) + '\n};';
      code = 'tft.drawRGBBitmap(' + xCode + ', ' + yCode + ', ' + varName + ', ' + w + ', ' + h + ');\n';
    } else {
      for (var p2 = 0; p2 < parts.length; p2++) {
        var partVar = varName + '_p' + p2;
        var sliceStart = parts[p2].startRow * w;
        var partSlice = arr.slice(sliceStart, sliceStart + parts[p2].rows * w);
        Blockly.JavaScript.definitions_[partVar] =
          'const uint16_t ' + partVar + '[] PROGMEM = {\n' + formatArrayBody(partSlice) + '\n};';
      }
      for (var p3 = 0; p3 < parts.length; p3++) {
        var partVar2 = varName + '_p' + p3;
        var sRow2 = parts[p3].startRow;
        var pRows2 = parts[p3].rows;
        var yExpr2 = (sRow2 === 0) ? yCode : '((' + yCode + ') + ' + sRow2 + ')';
        code += 'tft.drawRGBBitmap(' + xCode + ', ' + yExpr2 + ', ' + partVar2 + ', ' + w + ', ' + pRows2 + ');\n';
      }
    }

    return code;
  };
};
