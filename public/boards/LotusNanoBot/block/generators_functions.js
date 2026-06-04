module.exports = function(Blockly){
  'use strict';

  // =============================================
  // TYPE 1: ไม่รับค่า / ไม่ส่งกลับ
  // → void myFunction() { ... }
  // =============================================
  Blockly.JavaScript['func_define_void'] = function(block) {
    var funcname = block.getFieldValue('FUNCNAME') || 'myFunction';
    var body = Blockly.JavaScript.statementToCode(block, 'BODY') || '';
    var code = `void ${funcname}() {\n${body}}\n\n`;
    return code;
  };

  Blockly.JavaScript['func_call_void'] = function(block) {
    var funcname = block.getFieldValue('FUNCNAME') || 'myFunction';
    return `${funcname}();\n`;
  };

  // =============================================
  // TYPE 2: รับค่า / ไม่ส่งกลับ
  // → void myFunction(int x) { ... }
  // =============================================
  Blockly.JavaScript['func_define_param'] = function(block) {
    var funcname   = block.getFieldValue('FUNCNAME')   || 'myFunction';
    var paramtype  = block.getFieldValue('PARAMTYPE')  || 'int';
    var paramname  = block.getFieldValue('PARAMNAME')  || 'x';
    var body = Blockly.JavaScript.statementToCode(block, 'BODY') || '';
    var code = `void ${funcname}(${paramtype} ${paramname}) {\n${body}}\n\n`;
    return code;
  };

  Blockly.JavaScript['func_call_param'] = function(block) {
    var funcname = block.getFieldValue('FUNCNAME') || 'myFunction';
    var arg = Blockly.JavaScript.valueToCode(block, 'ARG', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return `${funcname}(${arg});\n`;
  };

  // =============================================
  // TYPE 3: ไม่รับค่า / ส่งค่ากลับ
  // → int myFunction() { ... return val; }
  // =============================================
  Blockly.JavaScript['func_define_return'] = function(block) {
    var funcname    = block.getFieldValue('FUNCNAME')    || 'myFunction';
    var returntype  = block.getFieldValue('RETURNTYPE')  || 'int';
    var body = Blockly.JavaScript.statementToCode(block, 'BODY') || '';
    var retval = Blockly.JavaScript.valueToCode(block, 'RETURN_VAL', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var code = `${returntype} ${funcname}() {\n${body}  return ${retval};\n}\n\n`;
    return code;
  };

  Blockly.JavaScript['func_call_return'] = function(block) {
    var funcname = block.getFieldValue('FUNCNAME') || 'myFunction';
    return [`${funcname}()`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // =============================================
  // TYPE 4: รับค่า + ส่งค่ากลับ
  // → int myFunction(int x) { ... return val; }
  // =============================================
  Blockly.JavaScript['func_define_param_return'] = function(block) {
    var funcname    = block.getFieldValue('FUNCNAME')    || 'myFunction';
    var paramtype   = block.getFieldValue('PARAMTYPE')   || 'int';
    var paramname   = block.getFieldValue('PARAMNAME')   || 'x';
    var returntype  = block.getFieldValue('RETURNTYPE')  || 'int';
    var body = Blockly.JavaScript.statementToCode(block, 'BODY') || '';
    var retval = Blockly.JavaScript.valueToCode(block, 'RETURN_VAL', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var code = `${returntype} ${funcname}(${paramtype} ${paramname}) {\n${body}  return ${retval};\n}\n\n`;
    return code;
  };

  Blockly.JavaScript['func_call_param_return'] = function(block) {
    var funcname = block.getFieldValue('FUNCNAME') || 'myFunction';
    var arg = Blockly.JavaScript.valueToCode(block, 'ARG', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return [`${funcname}(${arg})`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // =============================================
  // RETURN STATEMENT (ใช้แทรกกลาง body)
  // =============================================
  Blockly.JavaScript['func_return_statement'] = function(block) {
    var value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return `return ${value};\n`;
  };

  // =============================================
  // PARAM VALUE (อ่านชื่อ parameter ภายใน body)
  // =============================================
  Blockly.JavaScript['func_get_param'] = function(block) {
    var paramname = block.getFieldValue('PARAMNAME') || 'x';
    return [paramname, Blockly.JavaScript.ORDER_ATOMIC];
  };

};
