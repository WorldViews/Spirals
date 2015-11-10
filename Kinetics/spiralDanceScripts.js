
new SCRIPT.Script("Reset", [
	{action: function () { ANIM.gotoView("Home"); }},
	{action: function () { PLAYER.stopPlaying(); }},
]);

script1 = new SCRIPT.Script("spiralDanceScript1", [
    {t: 0, foo: "bar"},
    {t: 5, foo: "bar"},
    {t: 10, foo: "bar", action: function() {
	    ANIM.gotoView("Above", 6);	     
	}},
    {t: 20, foo: "bar", action: function() {
	     ANIM.gotoView("PhotoHead", 6);
         }}
]);

script1 = new SCRIPT.Script("spiralDanceScript1", [
    {t: 0, foo: "bar"},
    {t: 5, foo: "bar"},
    {t: 10, foo: "bar", action: function() {
	    ANIM.gotoView("Above", 6);	     
	}},
    {t: 20, foo: "bar", action: function() {
	     ANIM.gotoView("PhotoHead", 6);
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
	    //PLAYER.playMelody("NewAge/silkroad");
	    PLAYER.loadMelody("Classical/minute_waltz", true);
	}},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 1", 6); }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 2", 6); }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 3", 6); }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 4", 6); }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 5", 6); }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 6", 6); }},
    {delay: 10, action: function() { ANIM.gotoView("Chakra 7", 6); }},
    {delay: 10, action: function() { ANIM.gotoView("Above", 6);	}},
    {delay: 10, action: function() { PLAYER.stopPlaying(); }},
]);

