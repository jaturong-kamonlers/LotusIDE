
//Block from IKB1  & NanoBot

/*
module.exports = function(Blockly) {


Blockly.JavaScript['Lotus_sound'] = function(block) {
  var value_soundfe = Blockly.JavaScript.valueToCode(block, 'soundfe', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var value_soundms = Blockly.JavaScript.valueToCode(block, 'soundms', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var code = '';

  code += 'soundmega(1,  ' + value_soundfe + ');\t';
  code += 'soundmega(2,  ' + value_soundms + ');\n';

  return code;
};

}
*/
module.exports = function(Blockly) {
  Blockly.JavaScript['Lotus_sound'] = function(block) {
    var value_soundfe = Blockly.JavaScript.valueToCode(block, 'soundfe', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var value_soundms = Blockly.JavaScript.valueToCode(block, 'soundms', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var code = 'soundmega(' + value_soundfe + ', ' + value_soundms + ');\n';
    return code;
  };
}
