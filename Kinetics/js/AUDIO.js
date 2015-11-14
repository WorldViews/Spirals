
AUDIO = {}

AUDIO.player = null;
AUDIO.choices = {};
AUDIO.choices[""] = 1;
AUDIO.choices["AsCleanAsFire"] = 1;
AUDIO.choices["Unconditional.mp3"] = 1;
AUDIO.choices["Unconditional.ogg"] = 1;
AUDIO.choices["MBBSound/lowthunder.mp3"] = 1;
AUDIO.choices["MBBSound/rain.mp3"] = 1;
AUDIO.choices["MBBSound/Shepardupndown.mp3"] = 1;

AUDIO.play = function(name)
{
    report("AUDIO.play "+name);
    if (name) {
	if (name.indexOf(".") < 0) {
	    name = name+".ogg";
	}
	var url = "../data/"+name;
	report("url: "+url);
	//$("#audioPlayer").src = url;
	AUDIO.player.src = url;
    }
    else {
	AUDIO.stop();
    }
}

AUDIO.stop = function()
{
    AUDIO.player.pause();
}


AUDIO.selectionChanged = function()
{
    report("selectionChanged");
    var name = $("#audioSelect").val();
    AUDIO.play(name);
}

AUDIO.setupButtons = function()
{
    hstr = 'Audio &nbsp';
    hstr += '<audio id="audioPlayer" controls autoplay loop>\n';
    hstr += 'Your browser sucks\n';
    hstr += '</audio>\n';
    hstr += '<select id="audioSelect"></select>';
    hstr += '&nbsp;';
    $("#audioControl").html(hstr);
    $("#audioSelect").change(AUDIO.selectionChanged);
    AUDIO.player = document.getElementById("audioPlayer");
}

AUDIO.updateSelect = function()
{
    report("AUDIO.updateSelect");
    $("#audioSelect").html("");
    //for (var name in ANIM.views) {
    var names = Object.keys(AUDIO.choices);
    names.sort();
    for (var i=0; i<names.length; i++) {
	var name = names[i];
        $("#audioSelect").append($('<option>', { value: name, text: name}));
    }
}

AUDIO.setupHTML = function()
{
    if ($("#audioControl").length == 0) {
	report("**** No audio controls ****");
    }
    AUDIO.setupButtons();
    AUDIO.updateSelect();
}

$(document).ready(function(e) {
	AUDIO.setupHTML();
});



