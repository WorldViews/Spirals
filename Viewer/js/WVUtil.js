
function report(str)
{
    console.log(str);
}

WV.toDMYHMS = function(t)
{
    var tm = new Date(t*1000);
    var mdy = (tm.getMonth()+1)+"/"+
               tm.getDate()+"/"+
               tm.getFullYear();
    var hms =  tm.getHours()+":"+
               tm.getMinutes()+":"+
               tm.getSeconds();
    return mdy +" "+ hms;
}

WV.toHMS = function(t)
{
    var tm = new Date(t*1000);
    var hms =  tm.getHours()+":"+
               tm.getMinutes()+":"+
               tm.getSeconds();
    return hms;
}

WV.toTimeStr = function(t)
{
    var tm0 = new Date();
    var tm = new Date(t*1000);
    var h = ""+tm.getHours();
    if (h.length == 1)
	h = " "+h;
    var m = ""+tm.getMinutes();
    if (m.length == 1)
	m = "0"+m;
    var s = ""+tm.getSeconds();
    if (s.length == 1)
	s = "0"+s;
    var hms =  h+":"+m+":"+s;
    var dt = tm0 - tm;
    if (dt < 24*60*60*1000 && tm0.getDate() == tm.getDate()) {
	return hms;
    }
    var mdy = (tm.getMonth()+1)+"/"+
               tm.getDate()+"/"+
               tm.getFullYear();
    return mdy +" "+ hms;
}

WV.toJSON = function(obj) { return JSON.stringify(obj, null, 3); }

WV.getUniqueId = function(name)
{
    if (!name)
	name = "obj";
    var id = name+"_"+ new Date().getTime()+"_"+Math.floor(10000*Math.random());
    return id;
}

WV.getRecords = function(v)
{
    if (v instanceof Array)
	return v;
    return v.records;
}

