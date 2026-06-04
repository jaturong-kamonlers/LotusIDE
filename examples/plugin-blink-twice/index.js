// Lotus IDE example plugin: adds a single "blink twice" block.
// To package: zip the contents of this folder (not the folder itself) into
// blink-twice.zip and install via Lotus → Plugins → Install from .zip.

lotus.register({
  toolbox: {
    name: 'Example',
    color: '#FF6F00',
  },
  blocks: [
    {
      type: 'example_blink_twice',
      message0: 'blink pin %1 for %2 ms',
      args0: [
        { type: 'input_value', name: 'PIN',  check: 'Number' },
        { type: 'input_value', name: 'MS',   check: 'Number' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#FF6F00',
      tooltip: 'Blink the given pin twice with the specified delay',
    },
  ],
  generators: {
    example_blink_twice: `
      const pin = generator.valueToCode(block, 'PIN', 0) || '13';
      const ms  = generator.valueToCode(block, 'MS',  0) || '200';
      return [
        'pinMode(' + pin + ', OUTPUT);',
        'digitalWrite(' + pin + ', HIGH); delay(' + ms + ');',
        'digitalWrite(' + pin + ', LOW);  delay(' + ms + ');',
        'digitalWrite(' + pin + ', HIGH); delay(' + ms + ');',
        'digitalWrite(' + pin + ', LOW);  delay(' + ms + ');',
        '',
      ].join('\\n');
    `,
  },
})
