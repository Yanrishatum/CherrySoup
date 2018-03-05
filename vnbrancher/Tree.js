function Tree(container)
{
  this.container = container;
  this.canvas = document.createElement("canvas");
  this.canvas.classList.add("background-canvas");
  this.container.appendChild(this.canvas);
  window.addEventListener("resize", onTreeResize.bind(this));
  this.bindInvalidate = this.invalidate.bind(this, true);
  /** @type {CanvasRenderingContext2D} */
  this.ctx = this.canvas.getContext("2d");
  this.roots = [];
  this.nodes = [];
  this.nodeWidth = 200;
  this.nodeHeight = 30;
  this.vspacer = 15;
  this.hspacer = 20;
}

function onTreeResize()
{
  requestAnimationFrame(this.bindInvalidate);
}

Tree.prototype.destroy = function()
{
  for (var node of this.nodes) this.container.removeChild(node);
  this.roots = [];
  this.nodes = [];
}

Tree.prototype.export = function()
{
  var data = [];
  for (var root of this.roots) data.push(root.export());
  return data;
}

Tree.prototype.import = function(data)
{
  this.destroy();
  if (!Array.isArray(data))
  {
    var root = new Branch();
    root.import(data);
    this.add(root);
  }
  else
  {
    for (var info of data)
    {
      var root = new Branch();
      root.import(info);
      this.add(root);
    }
  }
  this.invalidate();
  // TODO: Remove all nodes;
}

/** @param {Branch} branch */
Tree.prototype.add = function(branch)
{
  this.roots.push(branch);
  this.invalidate();
}

Tree.prototype.remove = function(branch)
{
  var idx = this.roots.indexOf(branch);
  this.removeNode(branch);
  if (idx != -1) this.roots.splice(idx, 1);
  this.invalidate();
}

Tree.prototype.removeNode = function(branch)
{
  var idx = this.nodes.indexOf(branch.node);
  if (idx != -1) this.nodes.splice(idx, 1);
  this.container.removeChild(branch.node);
  for (var child of branch.children) this.removeNode(child);
  this.invalidate();
}

Tree.prototype.ensureAdded = function(node, hidden)
{
  if (this.nodes.indexOf(node.node) == -1)
  {
    this.nodes.push(node.node);
    this.container.appendChild(node.node);
  }
  if (hidden)
  {
    if (!node.node.classList.contains("hidden")) node.node.classList.add("hidden");
  }
  else if (node.node.classList.contains("hidden")) node.node.classList.remove("hidden");
  for (var child of node.children) this.ensureAdded(child, hidden || node.folded);
}

Tree.prototype.scrollTo = function(branch)
{
  // TODO: Scroll smart
  this.container.scrollLeft = this.container.scrollWidth - this.container.offsetWidth;
}

Tree.prototype.invalidate = function(force)
{
  if (!force)
  {
    if (!this.requested)
    {
      this.requested = true;
      requestAnimationFrame(this.bindInvalidate);
    }
    return;
  }
  this.depthHeights = [];
  this.requested = false;
  var y = 30;
  for (var root of this.roots)
  {
    this.ensureAdded(root, false);
    var h = this.positionSubnodes(root, 1, y, 30);
    root.node.style.left = '0px';
    root.node.style.top = (y + (h - this.nodeHeight) / 2) + 'px';
    y += h;
    // y += this.positionNode(root, 0, y);
  }
  if (this.canvas.width != this.container.scrollWidth || this.canvas.height != this.container.scrollHeight)
  {
    this.canvas.width = this.container.scrollWidth;
    this.canvas.height = this.container.scrollHeight;
  }
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.drawnDepth = -1;
  this.drawDepth(0);
  for (var root of this.roots)
  {
    if (!root.folded) this.drawLinesFor(root, 0);
  }
  
}

Tree.prototype.drawDepth = function(depth)
{
  if (this.drawnDepth >= depth) return;
  this.drawnDepth = depth;
  
  var x = (depth * (this.nodeWidth + this.hspacer))+.5;
  var ctx = this.ctx;
  ctx.beginPath();
  ctx.moveTo(x, 15.5);
  ctx.lineTo(x, 2.5);
  x += this.nodeWidth;
  ctx.lineTo(x, 2.5);
  ctx.lineTo(x, 15.5);
  ctx.stroke();
  var txt = (depth == 0 ? "Root" : (depth).toString());
  var size = ctx.measureText(txt).width;
  ctx.fillText(txt, x - this.nodeWidth + (this.nodeWidth - size) / 2, 16);
}

Tree.prototype.drawLinesFor = function(node, depth)
{
  var sx = node.node.offsetLeft + node.node.offsetWidth;
  var sy = node.node.offsetTop + ((node.node.offsetHeight/2)|0);
  var ex, ey;
  depth++;
  for (var child of node.children)
  {
    this.line(sx, sy, child.node.offsetLeft, child.node.offsetTop + ((child.node.offsetHeight/2)|0));
    this.drawDepth(depth);
    if (!child.folded) this.drawLinesFor(child, depth);
    
  }
}

Tree.prototype.line = function(sx, sy, ex, ey)
{
  var ctx = this.ctx;
  ctx.beginPath();
  sy += .5;
  ey += .5;
  sx = (sx|0);
  ex = (ex|0);
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx+.5+(((ex-sx)/2)|0), sy);
  ctx.lineTo(sx+.5+(((ex-sx)/2)|0), ey);
  ctx.lineTo(ex, ey);
  ctx.stroke();
}

Tree.prototype.positionSubnodes = function(node, depth, y, minSelfPos)
{
  if (node.children.length == 0 || node.folded) return this.nodeHeight;
  var h = 0;
  // y = _y;
  // y = this.depthHeights[depth];
  // if (!y) this.depthHeights[depth] = y = 30;
  if (!this.depthHeights[depth]) this.depthHeights[depth] = 30;
  for (var child of node.children)
  {
    var nodeSpace = this.positionSubnodes(child, depth+1, y + h);
    child.node.style.left = (depth * (this.nodeWidth + this.hspacer)) + 'px';
    child.node.style.top = (y + h + (nodeSpace - this.nodeHeight) / 2) + 'px';
    h += nodeSpace + this.vspacer;
  }
  this.depthHeights[depth] = y;
  if (minSelfPos)
  {
  }
  return h - this.vspacer;
}

Tree.prototype.positionNode = function(node, depth, minimumY)
{
  var top = minimumY;
  var bottom = minimumY;
  if (node.children.length != 0 && !node.folded)
  {
    if (!this.depthHeights[depth+1]) this.depthHeights[depth+1] = 30;
    top = 0;
    bottom = top;
    for (var child of node.children)
    {
      bottom = this.positionNode(child, depth+1, this.depthHeights[depth+1]);
      if (!top) top = parseInt(child.node.style.top);
    }
    bottom -= this.vspacer + this.nodeHeight;
    // console.log(`Depth: ${depth}, minY: ${minimumY}, top: ${top}, bottom: ${bottom} | ${(bottom - top) / 2}`);
  }
  node.node.style.left = (depth * (this.nodeWidth + this.hspacer)) + 'px';
  var y = (bottom - top) / 2 + top;
  if (y < minimumY) y = minimumY;
    
  node.node.style.top = y + 'px';
  var bottom = y + this.nodeHeight + this.vspacer
  this.depthHeights[depth] = bottom;
  
  if (node.children.length && !node.folded)
  {
    for (var child of node.children) this.shift(child, y);
  }
  
  return bottom;
}

Tree.prototype.shift = function(node, y)
{
  
}