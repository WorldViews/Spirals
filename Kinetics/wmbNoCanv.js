
function report(str)
{
    console.log(str);
}


var nn = 20;
function playScale()
{
    report("nn: "+nn);
    MIDI.noteOn(  0, nn, 100);
    MIDI.noteOff( 0, nn,  .1);
    nn += 1;
}

var dc;
//var nbrPoints=8;
var nbrPoints=96;
//var cycleLength=60*3;
var cycleLength=60*3;
var dur = .4;
var gw=800;
var gh=800;
var cx=gw/2;
var cy=gh/2;
var circleRadius=(gw/2)*0.95;
var maxRad=(gw/2-circleRadius)*.5;
var minRad=maxRad*.2;
var startTime=(new Date()).getTime();
var PI=3.1415927;
var PI2=PI*2;
var tines=[];
var lastSound=[];
var speed=(2*PI*nbrPoints)/cycleLength;

function clearCanvas()
{
    return;
   dc.clearRect(0,0,gw,gh);
   dc.lineWidth=3;
   dc.strokeStyle='#333';
   dc.beginPath();
   dc.moveTo(cx,cy);
   dc.lineTo(gw,cy);
   dc.stroke();
}

refreshMidi=function(){
   clearCanvas();
   var ms=(new Date()).getTime();
   var timer=(ms-startTime)*.001*speed;
   for(var i=0;i<nbrPoints;++i){
      var r=(i+1)/nbrPoints;
      var a=timer*r;
      var len=circleRadius*(1+1.0/nbrPoints-r);
      if(Math.floor(a/PI2)!==Math.floor(tines[i]/PI2)){
          MIDI.noteOn( 0, i+21,    100,0);
          MIDI.noteOn( 0, i+21+36, 100,0);
          MIDI.noteOff(0, i+21,     dur);
          MIDI.noteOff(0, i+21+36,  dur);
          lastSound[i]=ms;
      }
      var x=(cx+Math.cos(a)*len);
      var y=(cy+Math.sin(a)*len);
      var radv=minRad+(maxRad-minRad)*(1-r);
      radv=Math.max((radv+6)-6*(ms-lastSound[i])/500.0,radv);
      var huev=r*360;
      var satv=Math.round(100*Math.min(1,(ms-lastSound[i])/1000.0));
      var lumv=Math.round(100*Math.max(0.5,1-(ms-lastSound[i])/1000.0));
      tines[i]=a;
   }
};

window.onload=function(){
    MIDI.loader=new sketch.ui.Timer;
    MIDI.loadPlugin({
        soundfontUrl: "./soundfont/",
        instrument:"acoustic_grand_piano",
        onprogress:function(state,progress){
           MIDI.loader.setValue(progress*100);
        },
        onsuccess:function(){
           for(var i=0;i<nbrPoints;++i){
               if(i%7===0) MIDI.noteOn(0,i+21,100,0);
               lastSound[i]=0;
               tines[i]=0;
           }
           startTime=(new Date()).getTime();
           setInterval(refreshMidi,1000/30);
        }
    });
}

