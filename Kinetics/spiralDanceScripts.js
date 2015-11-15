
new SCRIPT.Script("Reset", [
	{action: function () { ANIM.gotoView("Home"); }},
	{action: function () { PLAYER.stopPlaying(); }},
        {action: function () { AUDIO.stop();   }},
]);

script1 = new SCRIPT.Script("spiralDanceScript1", [
    {t: 2,
     foo: "bar",
     action: function() {
	    ANIM.gotoView("Home", 2);	     
	}},
    {t: 4, action: function() {
	     ANIM.gotoView("Closer", 2);
         }}
    {t: 8, action: function() {
	     ANIM.gotoView("Look at 2", 2);
         }}
    {t: 12, action: function() {
	     ANIM.gotoView("2 Looking Out", 2);
         }}
    {t: 16, action: function() {
	     ANIM.gotoView("3 Looking Out", 2);
         }}
]);


new SCRIPT.Script("Silk Road", [
    {t: 0, foo: "bar"},
    {t: 5, foo: "bar", action: function() {
	    PLAYER.loadMelody("NewAge/silkroad", true);
	}},
    {delay: 10, foo: "bar", action: function() {
	    ANIM.gotoView("Above", 6);	     
	}},
    {delay: 10, foo: "bar", action: function() {
	     ANIM.gotoView("PhotoHead", 6);
	}},
    {delay: 10, foo: "bar", action: function() {
 	     PLAYER.stopPlaying();
         }}
]);

new SCRIPT.Script("Minute Waltz", [
    {t: 0, foo: "bar"},
    {t: 5, foo: "bar", action: function() {
	    //PLAYER.playMelody("NewAge/silkroad");
	    PLAYER.loadMelody("Classical/minute_waltz", true);
	}},
    {delay: 10, foo: "bar", action: function() {
	    ANIM.gotoView("Above", 6);	     
	}},
    {delay: 10, foo: "bar", action: function() {
	     ANIM.gotoView("PhotoHead", 6);
	}},
    {delay: 10, foo: "bar", action: function() {
 	     PLAYER.stopPlaying();
         }}
]);

new SCRIPT.Script("Chakra Tour", [
    {delay: 2, action: function() { ANIM.gotoView("Home", 2);	}},
    {delay: 2, action: function() {
	    //PLAYER.loadMelody("NewAge/silkroad");
	    //PLAYER.loadMelody("NewAge/sail-away");
	    //PLAYER.loadMelody("Classical/minute_waltz", true);
	    PLAYER.loadMelody("Bach/wtc0", true);
	}},
    {delay: 4, action: function() {   PLAYER.startPlaying();	}},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 1", 6);  }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 2", 6);  }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 3", 6);  }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 4", 6);  }},
    {delay: 15, action: function() { PLAYER.stopPlaying(); }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 5", 6);  }},
    {           action: function() { AUDIO.play("AsCleanAsFire");   }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 6", 6);  }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 7", 6);  }},
    {delay: 10, action: function() { ANIM.gotoView("Above",    8);  }},
    {delay: 10, action: function() { ANIM.gotoView("Hurricane", 6); }},
    {delay: 10, action: function() { PLAYER.stopPlaying(); }},
]);

