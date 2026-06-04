module.exports = function(Blockly){
  'use strict';
  var basic_colour = Blockly.Msg.BASIC_HUE;

  // =============================================
  // TYPE 1: ไม่รับค่า / ไม่ส่งกลับ  →  void myFunc() {}
  // =============================================
  Blockly.Blocks['func_define_void'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("define function")
          .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCNAME")
          .appendField("()");
      this.appendStatementInput("BODY")
          .appendField("do");
      this.setColour(basic_colour);
      this.setTooltip("ฟังก์ชันที่ไม่รับค่า และไม่ส่งค่ากลับ  →  void myFunction() { }");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['func_call_void'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("call")
          .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCNAME")
          .appendField("()");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(basic_colour);
      this.setTooltip("เรียกใช้ฟังก์ชันที่ไม่รับค่า ไม่ส่งค่ากลับ");
      this.setHelpUrl("");
    }
  };

  // =============================================
  // TYPE 2: รับค่า / ไม่ส่งกลับ  →  void myFunc(int x) {}
  // =============================================
  Blockly.Blocks['func_define_param'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("define function")
          .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCNAME")
          .appendField("( param:")
          .appendField(new Blockly.FieldDropdown([
            ["int","int"],
            ["float","float"],
            ["String","String"],
            ["bool","bool"]
          ]), "PARAMTYPE")
          .appendField(new Blockly.FieldTextInput("x"), "PARAMNAME")
          .appendField(")");
      this.appendStatementInput("BODY")
          .appendField("do");
      this.setColour(basic_colour);
      this.setTooltip("ฟังก์ชันที่รับค่า แต่ไม่ส่งค่ากลับ  →  void myFunction(int x) { }");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['func_call_param'] = {
    init: function() {
      this.appendValueInput("ARG")
          .appendField("call")
          .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCNAME")
          .appendField("( value");
      this.appendDummyInput()
          .appendField(")");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(basic_colour);
      this.setTooltip("เรียกใช้ฟังก์ชันที่รับค่า แต่ไม่ส่งค่ากลับ");
      this.setHelpUrl("");
    }
  };

  // =============================================
  // TYPE 3: ไม่รับค่า / ส่งค่ากลับ  →  int myFunc() { return ...; }
  // =============================================
  Blockly.Blocks['func_define_return'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("define function")
          .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCNAME")
          .appendField("()  return type:")
          .appendField(new Blockly.FieldDropdown([
            ["int","int"],
            ["float","float"],
            ["String","String"],
            ["bool","bool"]
          ]), "RETURNTYPE");
      this.appendStatementInput("BODY")
          .appendField("do");
      this.appendValueInput("RETURN_VAL")
          .appendField("return");
      this.setColour(basic_colour);
      this.setTooltip("ฟังก์ชันที่ไม่รับค่า แต่ส่งค่ากลับ  →  int myFunction() { return val; }");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['func_call_return'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("call")
          .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCNAME")
          .appendField("()");
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour(basic_colour);
      this.setTooltip("เรียกใช้ฟังก์ชันที่ส่งค่ากลับ (ไม่รับ parameter)");
      this.setHelpUrl("");
    }
  };

  // =============================================
  // TYPE 4: รับค่า + ส่งค่ากลับ  →  int myFunc(int x) { return ...; }
  // =============================================
  Blockly.Blocks['func_define_param_return'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("define function")
          .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCNAME")
          .appendField("( param:")
          .appendField(new Blockly.FieldDropdown([
            ["int","int"],
            ["float","float"],
            ["String","String"],
            ["bool","bool"]
          ]), "PARAMTYPE")
          .appendField(new Blockly.FieldTextInput("x"), "PARAMNAME")
          .appendField(")  return:")
          .appendField(new Blockly.FieldDropdown([
            ["int","int"],
            ["float","float"],
            ["String","String"],
            ["bool","bool"]
          ]), "RETURNTYPE");
      this.appendStatementInput("BODY")
          .appendField("do");
      this.appendValueInput("RETURN_VAL")
          .appendField("return");
      this.setColour(basic_colour);
      this.setTooltip("ฟังก์ชันที่รับค่า และส่งค่ากลับ  →  int myFunction(int x) { return val; }");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['func_call_param_return'] = {
    init: function() {
      this.appendValueInput("ARG")
          .appendField("call")
          .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCNAME")
          .appendField("( value");
      this.appendDummyInput()
          .appendField(")");
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour(basic_colour);
      this.setTooltip("เรียกใช้ฟังก์ชันที่รับค่า และส่งค่ากลับ");
      this.setHelpUrl("");
    }
  };

  // =============================================
  // RETURN STATEMENT (ใช้ภายใน body ของ Type 3, 4 แทรกกลางโปรแกรม)
  // =============================================
  Blockly.Blocks['func_return_statement'] = {
    init: function() {
      this.appendValueInput("VALUE")
          .appendField("return");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setColour(basic_colour);
      this.setTooltip("ส่งค่ากลับออกจากฟังก์ชัน (ใช้ได้เฉพาะภายในฟังก์ชัน)");
      this.setHelpUrl("");
    }
  };

  // =============================================
  // PARAM VALUE (อ่านค่า parameter ภายใน body)
  // =============================================
  Blockly.Blocks['func_get_param'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("param")
          .appendField(new Blockly.FieldTextInput("x"), "PARAMNAME");
      this.setOutput(true, null);
      this.setColour(basic_colour);
      this.setTooltip("ดึงค่า parameter ที่ส่งเข้ามาในฟังก์ชัน ชื่อต้องตรงกับที่กำหนดไว้");
      this.setHelpUrl("");
    }
  };

};
