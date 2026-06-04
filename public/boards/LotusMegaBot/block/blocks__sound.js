
//Block from IKB1 & NanoBot
/*
module.exports = function(Blockly){
  'use strict';



Blockly.Blocks['Lotus_sound'] = {
  init: function() {
    this.appendValueInput("soundfe")
      .setCheck("Number")
      .appendField("frequency");
    this.appendDummyInput()
      .appendField("Hz");
      this.appendValueInput("soundms")
      .setCheck("Number")
      .appendField("duration");
    this.appendDummyInput()
      .appendField("ms");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("");
  }
};

}
*/
module.exports = function(Blockly) {
  'use strict';

  Blockly.Blocks['Lotus_sound'] = {
    init: function() {
      this.appendValueInput("soundfe")
        .setCheck("Number")
        .appendField("frequency");
      this.appendDummyInput()
        .appendField("Hz");
      this.appendValueInput("soundms")
        .setCheck("Number")
        .appendField("duration");
      this.appendDummyInput()
        .appendField("ms");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("");
    }
  };
}
