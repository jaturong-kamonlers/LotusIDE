module.exports = {
  name: "Buzzer",
  index: 30,
  color: "230",
  icon: "/static/icons/icons8_musical_notes_96px.png",
  blocks: [
    //"music_begin",
    "music_buzzer_note",
    // "music_duration_opt",
    // 'music_buzzer_frequency'
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
    'music_song_cannon_rock',
	'WIT_beep',
    {
                    xml : 
                    `<block type="WIT_beep_delay">
                        <value name="_delay">
                            <shadow type="math_number">
                                <field name="NUM">500</field>
                            </shadow>
                        </value>
                    </block>`
    },
                
    'WIT_beep_on',
    'WIT_beep_off'
				
    // 'music_set_volume'
    // 'music_get_volume'
	
  ]
};
