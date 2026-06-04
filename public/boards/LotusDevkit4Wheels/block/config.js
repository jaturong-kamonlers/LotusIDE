let display = require("./menu/config.group.display");
let ble = require("./menu/config.group.ble");
let neopixel = require("./menu/config.group.neopixel");
let buzzer = require("./menu/config.group.buzzer");
// let common = require("./menu/config.group.common");
let gpio = require("./menu/config.group.gpio");
let iot = require("./menu/config.group.iot");
let sensor = require("./menu/config.group.sensor");
const dirIcon = Vue.prototype.$global.board.board_info.dir; 
module.exports = {
          
		  
  blocks: [

    display,
	{
            name : 'Module',
            color : '230',
			icon: `file:///${dirIcon}/static/icons/lotus.png`,
            blocks : [
				'sw1_press',
                'Knob_status',
               { 
                    xml : 
                    `<block type="WIT_servo">
                        <field name="ch">1</field>
                        <value name="angle">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                    </block>`
                },
                'WIT_servo_detach',              

                'WIT_motor_stop',
                {
                    xml :
                    `<block type="WIT_motor_forward2">
                        <value name="speed1">
                            <shadow type="math_number"><field name="NUM">50</field></shadow>
                        </value>
                        <value name="speed2">
                            <shadow type="math_number"><field name="NUM">50</field></shadow>
                        </value>
                    </block>`
                },
                {
                    xml :
                    `<block type="motor4w_set">
                        <value name="SPEED">
                            <shadow type="math_number"><field name="NUM">50</field></shadow>
                        </value>
                    </block>`
                },
                {
                    xml :
                    `<block type="motor_front">
                        <value name="SPEEDL">
                            <shadow type="math_number"><field name="NUM">50</field></shadow>
                        </value>
                        <value name="SPEEDR">
                            <shadow type="math_number"><field name="NUM">50</field></shadow>
                        </value>
                    </block>`
                },
                {
                    xml :
                    `<block type="motor_rear">
                        <value name="SPEEDL">
                            <shadow type="math_number"><field name="NUM">50</field></shadow>
                        </value>
                        <value name="SPEEDR">
                            <shadow type="math_number"><field name="NUM">50</field></shadow>
                        </value>
                    </block>`
                },
 {
      xml:
        `<block type="music_buzzer_frequency">
                        <value name="FREQUENCY">    
                            <shadow type="math_number">
                                <field name="NUM">262</field>
                            </shadow>
                        </value>
                        <value name="DURATION">                    
                            <shadow type="math_number">
                                <field name="NUM">500</field>
                            </shadow>
                        </value>
                    </block>`
    },
	'music_song_mario_underworld',
    'music_song_jingle_bell',
    'math_map',
//	'WIT_beep',
 			
            ]
        },
	
		gpio,
		sensor,
		ble,
		iot,
  ],
};
