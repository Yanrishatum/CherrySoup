/** @type Tree */
var tree;
var disp;

function cleanTree()
{
  if (!tree) tree = new Tree(document.getElementById("treeDisplay"));
  else tree.destroy();
}

function newVN()
{
  cleanTree();
  tree.add(new Branch());
}

function importVN()
{
  cleanTree();
  tree.import(JSON.parse($("#vnJSON").val()));
}

function exportVN()
{
  if (tree != null) $("#vnJSON").val(JSON.stringify(tree.export()));
}

function addSub()
{
  if (!tree) newVN();
  else
  {
    tree.add(new Branch());
  }
}

function saveVN()
{
  if (tree == null) return;
  var name = $("#vnName").val();
  if (name != "")
  {
    localStorage.setItem("vn_" + name, JSON.stringify(tree.export()));
    localStorage.setItem("last_vn", name);
  }
  
}

function loadVN()
{
  var name = $("#vnName").val();
  if (name != "")
  {
    var data = localStorage.getItem("vn_" + name);
    
    if (data)
    {
      cleanTree();
      tree.import(JSON.parse(data));
      localStorage.setItem("last_vn", name);
    }
  }
}

function updateVisual()
{
  if (disp == null) disp = document.querySelector("#treeDisplay");
  disp.scrollLeft = disp.scrollWidth - disp.offsetWidth;
}

autosaveCallback = saveVN;