import * as Blockly from 'blockly'

// Inline SVG data URIs for -/+ buttons
const MINUS_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">' +
  '<circle cx="8" cy="8" r="7.5" fill="rgba(0,0,0,0.22)"/>' +
  '<rect x="3.5" y="7" width="9" height="2" fill="white" rx="1"/>' +
  '</svg>'
)}`

const PLUS_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">' +
  '<circle cx="8" cy="8" r="7.5" fill="rgba(0,0,0,0.22)"/>' +
  '<rect x="3.5" y="7" width="9" height="2" fill="white" rx="1"/>' +
  '<rect x="7" y="3.5" width="2" height="9" fill="white" rx="1"/>' +
  '</svg>'
)}`

// Override standard text_join with an inline horizontal version
Blockly.Blocks['text_join'] = {
  init() {
    this.itemCount_ = 2
    this.appendDummyInput('LABEL')
      .appendField('create text with')
    this.updateShape_()
    this.setOutput(true, 'String')
    this.setColour(160)
    this.setInputsInline(true)
    this.setTooltip('Create text by joining any number of items together')
    this.setHelpUrl('')
  },

  updateShape_() {
    // Remove old ADD inputs and CONTROLS
    let i = 0
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i)
      i++
    }
    if (this.getInput('CONTROLS')) this.removeInput('CONTROLS')

    // Re-add value inputs (inline)
    for (let j = 0; j < this.itemCount_; j++) {
      this.appendValueInput('ADD' + j).setCheck(null)
    }

    // Add -/+ image buttons
    const block = this
    this.appendDummyInput('CONTROLS')
      .appendField(new Blockly.FieldImage(MINUS_SVG, 16, 16, '-', function() {
        if (block.itemCount_ > 1) {
          block.itemCount_--
          block.updateShape_()
        }
      }))
      .appendField(new Blockly.FieldImage(PLUS_SVG, 16, 16, '+', function() {
        block.itemCount_++
        block.updateShape_()
      }))
  },

  saveExtraState() {
    return { itemCount: this.itemCount_ }
  },

  loadExtraState(state) {
    this.itemCount_ = (state && state.itemCount != null) ? state.itemCount : 2
    this.updateShape_()
  },

  // Backwards-compat: support old XML serialization (mutatorContainer format)
  mutationToDom() {
    const container = Blockly.utils.xml.createElement('mutation')
    container.setAttribute('items', this.itemCount_)
    return container
  },

  domToMutation(xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10)
    this.updateShape_()
  },
}
