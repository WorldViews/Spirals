
var inputNames = [];

function getObjAndId(id)
{
    var i = id.indexOf(".");
    if (i < 0)
        i = id.indexOf("_");
    if (i < 0)
        return {'obj': 'P', id: id};
    var objName = id.slice(0,i);
    id = id.slice(i+1);
    return {'obj': objName, 'id': id};
}

function setObjVal(id, val)
{
   var objAndId = getObjAndId(id);
   report("objAndId: "+JSON.stringify(objAndId));
   var id_ = objAndId.id;
   var objName = objAndId.obj;
   var obj = eval(objName);
   obj[id_] = val;
}

function getObjVal(id)
{
   var objAndId = getObjAndId(id);
   report("objAndId: "+JSON.stringify(objAndId));
   var id_ = objAndId.id;
   var objName = objAndId.obj;
   var obj = eval(objName);
   return obj[id_];
}

function getValFromForm(id)
{
   var s = $("#"+id).val();
   report("got "+id+" "+s);
   setObjVal(id, eval(s));
}

function getValsFromForm(e)
{
    for (var i=0; i<inputNames.length; i++) {
        getValFromForm(inputNames[i]);
    }
}

function getVals()
{
    report("******* PLEASE replace getVals by getValsFromForm ******");
    getValsFromForm();
}

function addInput(id)
{
   var gid = id.replace(".", "_");
   inputNames.push(gid);
   var pd = $("#params");
   report("add input for "+id);
   pd.append("<br>\n");
   var val = getObjVal(gid);
   pd.append("&nbsp;"+id+": <input id='"+gid+"' value='"+val+"'>\n");
}


function setFun(id)
{
    addInput(id);
    $("#"+id).keypress(function (e) {
       if(e.which == 13)  // the enter key code
           getValsFromForm();
    });
}

function toggleParams()
{
    report("toggleParams");
    if ($("#showParams").prop("checked"))
        $("#params").show();
    else
        $("#params").hide();
}

function handleReset(e)
{
   getValsFromForm();
    if (reset) {
        report("reset: "+reset);
        report("typeof reset: "+typeof reset);
        reset(e);
    }
    else {
        report("No reset function defined");
    }
}

function setupGUI(names)
{
    $("#reset").click(handleReset);
    $("#showParams").click(toggleParams);
    if (!names)
	return;
    for (var i=0; i<names.length; i++) {
	setFun(names[i]);
    }
}

