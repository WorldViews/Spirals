
new SCRIPT.Script("Reset", [
	{action: function () { ANIM.gotoView("Home"); }},
	{action: function () { PLAYER.stopPlaying(); }},
        {action: function () { AUDIO.stop();   }},
]);

script1 = new SCRIPT.Script("SacredSpiral", [
    {t: 0,
     action: function() { AUDIO.play("Unconditional.mp3");   }},
    {t: 2,
     foo: "bar",
     action: function() {
	    ANIM.gotoView("Home", 2);	     
	}},
    {t: 20, action: function() {
	     ANIM.gotoView("Closer", 6);
	}},
    {t: 30, action: function() {
	     ANIM.gotoView("Look at 2", 8);
	}},
    {t: 50, action: function() {
	     ANIM.gotoView("2 Looking Out", 9);
	}},
    {t: 70, action: function() {
	     ANIM.gotoView("3 Looking Out", 20);
	}},
    {t: 130, action: function() { // begin transition
	     ANIM.gotoView("3 Looking Down", 20);
	}},
    {t: 200, action: function() {
	     ANIM.gotoView("Above Head Looking Down", 20);
	}},
    {t: 300, action: function() {
	     ANIM.gotoView("Above", 20);
	}},
    {t: 360, action: function() {
	     ANIM.gotoView("Hurricane Base", 20);
	}},
    {t: 420, action: function() {
	     ANIM.gotoView("Hurricane", 30);
	}},
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

