var autosave = true;
var autosaveCallback;

function checkClass(el, cl, bool)
{
  if (bool) { if (!el.classList.contains(cl)) { el.classList.add(cl); } }
  else if (el.classList.contains(cl)) { el.classList.remove(cl); }
}

function Branch()
{
  if (!this) return new Branch();
  
  this.label = "choice";
  this.children = [];
  this.finished = false;
  this.folded = false;
  
  var node = document.importNode(document.getElementById("node_template").content, true).firstElementChild;
  this.node = node;
  node.querySelector("#collapse").addEventListener("click", onFoldClick.bind(this));
  node.querySelector("#label_edit").addEventListener("change", onLabelChange.bind(this));
  node.querySelector("#label_edit").addEventListener("keyup", labelEnterHandler.bind(this));
  node.querySelector("#delete").addEventListener("click", onDeleteClick.bind(this));
  node.querySelector("#add").addEventListener("click", onAddClick.bind(this));
  node.querySelector("#checkbox").addEventListener("change", onFinishedChange.bind(this));
  node.querySelector("#label").addEventListener("click", toggleEditMode.bind(this));
  node.querySelector("#label_edit").addEventListener("click", toggleEditMode.bind(this));
  node.querySelector("#label_edit").value = node.querySelector("#label").textContent = this.label;
  
}

//{ Callbacks

function onFoldClick()
{
  this.folded = !this.folded;
  if (this.folded)
  {
    this.node.classList.add("collapsed");
  }
  else
  {
    this.node.classList.remove("collapsed");
  }
  this.invalidate();
  tree.invalidate();
  if (autosave && autosaveCallback) autosaveCallback();
}

function toggleEditMode(event, force)
{
  if (force || event.shiftKey)
  {
    if (this.node.classList.contains("edit"))
    {
      this.node.classList.remove("edit");
      if (autosave && autosaveCallback) autosaveCallback();
    }
    else
    {
      this.node.classList.add("edit");
      var n = this.node.querySelector("#label_edit"), p = this.label.length;
      requestAnimationFrame(function(){
        n.focus();
        n.setSelectionRange(p, p);
      });
    }
  } 
}

function onLabelChange()
{
  this.node.querySelector("#label").textContent = this.label = this.node.querySelector("#label_edit").value;
}

/** @param {KeyboardEvent} event */
function labelEnterHandler(event)
{
  // console.log(event);
  if (event.key == "Enter")
  {
    toggleEditMode.call(this, event, true);
  }
}

function onDeleteClick()
{
  if (this.children.length == 0 || confirm("Delete whole tree?"))
  {
    if (this.parent) this.parent.removeChild(this);
    else tree.remove(this);
    if (autosave && autosaveCallback) autosaveCallback();
  }
}

function onAddClick()
{
  this.addChild();
  if (autosave && autosaveCallback) autosaveCallback();
  
  // TODO: Scroll into view.
}

function onFinishedChange(event)
{
  var check = this.node.querySelector("#checkbox");
  if (this.node.classList.contains("edit") && this.finished != check.checked) check.checked = this.finished;
  else
  {
    this.finished = check.checked;
    this.invalidate();
  }
  this.findRoot().checkFinished();
  if (autosave && autosaveCallback) autosaveCallback();
  // this.invalidate();
}


//}

Branch.prototype.addChild = function()
{
  var child = new Branch();
  // child.parent = this;
  child.parent = this;
  this.children.push(child);
  if (this.children.length == 1) this.invalidate();
  this.findRoot().checkFinished();
  tree.invalidate();
  tree.scrollTo(child);
  return child;
}

Branch.prototype.removeChild = function(child)
{
  var idx = this.children.indexOf(child);
  if (idx != -1)
  {
    this.children.splice(idx, 1);
  }
  if (this.children.length == 0) this.invalidate();
  this.findRoot().checkFinished();
  tree.removeNode(child);
}

Branch.prototype.findRoot = function()
{
  var c = this;
  while (c.parent) c = c.parent;
  return c;
}

Branch.prototype.checkFinished = function()
{
  if (this.children.length > 0)
  {
    var finished = 0;
    var partial = 0;
    
    var state;
    for (var child of this.children)
    {
      state = child.checkFinished();
      if (state != 0) partial++;
      if (state == 2) finished++;
    }
    finished = finished == this.children.length;
    partial = partial != 0 && !finished;
    var invalid = false;
    if (this.finished != finished) { this.finished = finished; invalid = true; }
    if (this.partial != partial) { this.partial = partial; invalid = true; }
    if (invalid) this.invalidate();
  }
  else this.partial = false;
  return this.finished ? 2 : (this.partial ? 1 : 0);
}

Branch.prototype.export = function()
{
  var data = {
    label: this.label,
    children: [],
    finished: this.finished,
    folded: this.folded
  };
  for (var child of this.children)
  {
    data.children.push(child.export());
  }
  return data;
}

Branch.prototype.import = function(data)
{
  this.label = data.label;
  this.children = [];
  this.finished = data.finished;
  this.folded = data.folded;
  for (var item of data.children)
  {
    var child = new Branch();
    child.parent = this;
    child.import(item);
    // child.parent = this;
    this.children.push(child);
  }
  this.invalidate();
  tree.invalidate();
}

Branch.prototype.invalidate = function()
{
  var c = this.node.querySelector("#checkbox");
  c.checked = this.finished;
  c.indeterminate = this.partial && !this.finished;
  c.disabled = this.children.length != 0;
  this.node.querySelector("#label").textContent = this.node.querySelector("#label_edit").value = this.label;
  c = this.node;
  checkClass(this.node, "collapsed", this.folded);
  checkClass(this.node, "finished", this.finished);
  checkClass(this.node, "partial", this.partial);
}