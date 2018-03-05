var editor;
var engine;
var values = {};

var graphs = {
  "isCompatible": {"id":"graphParser@0.1.0","nodes":{"2":{"id":2,"data":{"reg":"","ignoreCase":true},"group":null,"inputs":[{"connections":[{"node":3,"output":0}]}],"outputs":[{"connections":[{"node":5,"input":0}]}],"position":[523,134],"title":"Regex test"},"3":{"id":3,"data":{},"group":null,"inputs":[],"outputs":[{"connections":[{"node":2,"input":0}]}],"position":[255,134],"title":"Get Feed URL"},"5":{"id":5,"data":{},"group":null,"inputs":[{"connections":[{"node":2,"output":0}]}],"outputs":[],"position":[839,132],"title":"Is Compatible"},"6":{"id":6,"data":{},"group":null,"inputs":[],"outputs":[{"connections":[]}],"position":[256,233],"title":"Get Feed Document"}},"groups":{}},
  "getRoot": {"id":"graphParser@0.1.0","nodes":{"2":{"id":2,"data":{},"group":null,"inputs":[],"outputs":[{"connections":[{"node":3,"input":0}]}],"position":[202,227],"title":"Get Feed Document"},"3":{"id":3,"data":{},"group":null,"inputs":[{"connections":[{"node":2,"output":0}]}],"outputs":[],"position":[718,230],"title":"Set Root Item"}},"groups":{}},
  "getFeedTitle": {"id":"graphParser@0.1.0","nodes":{"4":{"id":4,"data":{},"group":null,"inputs":[],"outputs":[{"connections":[{"node":5,"input":0}]}],"position":[220,156],"title":"Get Feed Root"},"5":{"id":5,"data":{"query":"head title"},"group":null,"inputs":[{"connections":[{"node":4,"output":0}]}],"outputs":[{"connections":[{"node":7,"input":0}]},{"connections":[]}],"position":[429,156],"title":"Query Selector"},"6":{"id":6,"data":{},"group":null,"inputs":[{"connections":[{"node":7,"output":0}]}],"outputs":[],"position":[899,156],"title":"Set Feed Title"},"7":{"id":7,"data":{},"group":null,"inputs":[{"connections":[{"node":5,"output":0}]}],"outputs":[{"connections":[{"node":6,"input":0}]}],"position":[685,156],"title":"Get Text Content"}},"groups":{}},
  "getFeedURL": {"id":"graphParser@0.1.0","nodes":{"9":{"id":9,"data":{},"group":null,"inputs":[],"outputs":[{"connections":[{"node":10,"input":0}]}],"position":[347,25],"title":"Get Feed URL"},"10":{"id":10,"data":{},"group":null,"inputs":[{"connections":[{"node":9,"output":0}]}],"outputs":[],"position":[592,25],"title":"Set Feed URL"}},"groups":{}},
  "getItems": {"id":"graphParser@0.1.0","nodes":{"11":{"id":11,"data":{},"group":null,"inputs":[],"outputs":[{"connections":[]}],"position":[335,47],"title":"Get Feed Root"},"12":{"id":12,"data":{},"group":null,"inputs":[{"connections":[]}],"outputs":[],"position":[848,53],"title":"Set Items"}},"groups":{}},
  "getInfo": {"id":"graphParser@0.1.0","nodes":{"13":{"id":13,"data":{},"group":null,"inputs":[],"outputs":[{"connections":[]}],"position":[334,43],"title":"Get Feed Item"},"14":{"id":14,"data":{},"group":null,"inputs":[{"connections":[]},{"connections":[]},{"connections":[]},{"connections":[]}],"outputs":[],"position":[870,-14],"title":"Set Item"}},"groups":{}}
};
var activeGraph;

var grid = document.getElementById("nodeEditor");
var dat = initNodeEngine(grid, document.getElementById("customNode").innerHTML, values);
editor = dat.editor;
editor.eventListener.on("transform", (ts) =>
{
  grid.style.backgroundPositionX = ts.x + "px";
  grid.style.backgroundPositionY = ts.y + "px";
  var sz = ts.k > 0.5 ? 20 * ts.k : 100 * ts.k;
  grid.style.backgroundSize = sz + "px " + sz + "px";
  // console.log(ts);
});
engine = dat.engine;
showGraph();


document.getElementById("loadSampleURL").addEventListener("click", loadSample);
document.getElementById("export").addEventListener("click", exportJson);
document.getElementById("import").addEventListener("click", importJson);
document.getElementById("exportButton").addEventListener("click", confirmExport);
document.getElementById("graphSelect").addEventListener("change", changeGraph);
document.getElementById("validate").addEventListener("click", validate);

function loadSample(e, type)
{
  var url = document.getElementById("sampleURL").value;
  
  var xhttp = new XMLHttpRequest();
  xhttp.open("GET", url);
  xhttp.responseType = type || "document";
  xhttp.onreadystatechange = function ()
  {
    if (xhttp.readyState == xhttp.DONE)
    {
      if (xhttp.status != 200) alert("Could not load sample url! Status: " + xhttp.status);
      else
      {
        values.defURL = url;
        if (xhttp.response == null)
        {
          loadSample(null, "text");
          return;
        }
        values.xml = xhttp.response;
        graphs._validateURL = url;
      }
    }
  }
  xhttp.send();
}

function changeGraph()
{
  // TODO: Save
  graphs[activeGraph] = editor.toJSON();
  showGraph();
}

async function showGraph()
{
  activeGraph = document.getElementById("graphSelect").value;
  await engine.abort()
  var g = graphs[activeGraph];
  await editor.fromJSON(g);
  editor.view.zoomAt(editor.nodes);
  editor.eventListener.trigger("change");
  editor.view.resize();
}

function exportJson()
{
  var ei = document.getElementById("exportInput");
  ei.readOnly = true;
  graphs[activeGraph] = editor.toJSON();
  ei.value = JSON.stringify(graphs);
  var panel = document.getElementById("exportPanel");
  if (!panel.classList.contains("show")) panel.classList.add("show");
}

function importJson()
{
  var ei = document.getElementById("exportInput");
  ei.readOnly = false;
  ei.value = "";
  var panel = document.getElementById("exportPanel");
  if (!panel.classList.contains("show")) panel.classList.add("show");
}

function confirmExport()
{
  var panel = document.getElementById("exportPanel");
  if (panel.classList.contains("show")) panel.classList.remove("show");
  
  var ei = document.getElementById("exportInput");
  if (!ei.readOnly)
  {
    graphs = JSON.parse(ei.value);
    if (graphs._validateURL)
    {
      document.getElementById("sampleURL").value = graphs._validateURL;
      loadSample();
    }
    showGraph();
  }
}

async function validate()
{
  graphs[activeGraph] = editor.toJSON();
  var warn = "";
  var vals;
  
  await engine.process(graphs.isCompatible, null, vals = { xml: values.xml, defURL: values.defURL });
  var compat = vals.compatible;
  if (!assert(compat, true, "isCompatible")) return;
  
  await engine.process(graphs.getRoot, null, vals = { xml: values.xml });
  var root = vals.root;
  if (!assertNotNull(root, "getRoot")) return;
  
  await engine.process(graphs.getFeedTitle, null, vals = { root: root });
  var title = vals.title;
  if (!assertNotNull(title, "getFeedTitle")) return;
  
  await engine.process(graphs.getFeedURL, null, vals = { root: root, defURL: values.defURL });
  var url = vals.url;
  if (!assertNotNull(url, "getFeedURL")) return;
  
  await engine.process(graphs.getItems, null, vals = { root: root });
  var items = vals.items;
  if (!assertNotNull(items, "getItems")) return;
  
  
  if (items.length > 0)
  {
    await engine.process(graphs.getInfo, null, vals = { item: items[0] });
    var item = vals.result;
    values.item = items[0];
    if (!assertNotNull(item, "getInfo")) return;
  }
  else
  {
    warn += "\ngetItems returned empty array. Should it be empty?";
  }
  
  alert("Validation complete!" + (warn ? "Warnings:" + warn : ""));
  
}

function assertNotNull(value, name)
{
  if (value == null)
  {
    alert("Failed at " + name + ": Expected non-null");
    return false;
  }
  return true;
}

function assert(value, expected, name)
{
  if (value !== expected)
  {
    alert("Failed at " + name + ": Expected `" + expected + "`, got `" + value + "`");
    return false;
  }
  return true;
}

// var engine = initNodeEngine(document.getElementById("nodeEditor"), document.getElementById("customNode").innerHTML, { xml: });