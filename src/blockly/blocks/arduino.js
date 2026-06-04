import * as Blockly from 'blockly'

Blockly.Blocks['lotus_setup'] = {
  init() {
    this.appendStatementInput('code')
      .setCheck(null)
      .appendField('setup')
    this.setColour('#3949AB')
    this.setTooltip('Code here runs once at startup (void setup)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_loop'] = {
  init() {
    this.appendStatementInput('code')
      .setCheck(null)
      .appendField('loop')
    this.setColour('#3949AB')
    this.setTooltip('Code here runs repeatedly (void loop)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_forever'] = {
  init() {
    this.appendStatementInput('HANDLER')
      .setCheck(null)
      .appendField('forever')
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#8E24AA')
    this.setTooltip('Repeat forever (infinite loop inside loop)')
    this.setHelpUrl('')
  }
}
