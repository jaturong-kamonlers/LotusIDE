/**
 * menu/config.group.ble.js
 * LotusDevkit - BLE Menu Group
 */
module.exports = {
  name: "BLE",
  index: 45,
  color: "#0082FC",
  icon: '/icons/ble.svg',
  blocks: [
    {
      xml: `<block type="lotus_ble_begin">
              <value name="NAME">
                <shadow type="text">
                  <field name="TEXT">LotusDevkit</field>
                </shadow>
              </value>
            </block>`
    },
    "lotus_ble_advertise_start",
    "lotus_ble_advertise_stop",
    {
      xml: `<block type="lotus_ble_send_string">
              <value name="DATA">
                <shadow type="text">
                  <field name="TEXT">Hello</field>
                </shadow>
              </value>
            </block>`
    },
    {
      xml: `<block type="lotus_ble_send_number">
              <value name="DATA">
                <shadow type="math_number">
                  <field name="NUM">0</field>
                </shadow>
              </value>
            </block>`
    },
    "lotus_ble_received_string",
    "lotus_ble_is_connected",
    "lotus_ble_has_data",
    "lotus_ble_on_received",
    "lotus_ble_clear"
  ]
};
