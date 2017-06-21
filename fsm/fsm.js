var Tau = Math.PI*2;

var Defaults = {
  nodeSize: 30,
  snapToPadding: 6,
  hitTargetPadding: 6,
  sizeStep: 5,
  minSize: 10,
  maxSize: 100
}

var Type = {
  standart: 0,
  dashed: 1,
  fat: 2,
  fatDashed: 3,
  
  limit: 4
};

/** @param {number} x @param {number} y */
function Node(x, y)
{
  this.name = "";
  this.x = x;
  this.y = y;
  this.type = Type.standart;
  this.parent = null;
  this.size = Defaults.nodeSize;
  
  this._drag = false;
  this._dragX = 0;
  this._dragY = 0;
}

/** @param {CanvasRenderingContext2D} ctx */
Node.prototype.render = function(ctx)
{
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size,  0, Tau, false);
  ctx.stroke();
  ctx.closePath();
  
  if (this.parent !== null)
  {
    renderText(ctx, this.parent.name, this.x, this.y - this.size * .5, null, false, 12);
  }
  renderText(ctx, this.name, this.x, this.y, null, selectedObject == this);
  
}

/** @param {number} x @param {number} y */
Node.prototype.startDrag = function(x, y)
{
  this._dragX = this.x - x;
  this._dragY = this.y - y;
}

/** @param {number} x @param {number} y */
Node.prototype.setAnchorPoint = function(x, y)
{
  this.x = x + this._dragX;
  this.y = y + this._dragY;
}

/**
 * @param {number} x
 * @param {number} y
 * @returns {bool}
 */
Node.prototype.hitTest = function(x, y)
{
  return (x - this.x)**2 + (y - this.y)**2 < this.size**2;
}

/**
 * @param {number} x
 * @param {number} y
 */
Node.prototype.nearestPointOnBorder = function(x, y)
{
  var dx = x - this.x;
  var dy = y - this.y;
  var scale = Math.sqrt(dx*dx+dy*dy);
  return { x: (this.x + dx * this.size / scale), y: (this.y + dy * this.size / scale) };
}

// Two-node link

/** @param {Node} a @param {Node} b @returns {Link} */
function Link(a, b)
{
  this.nodeA = a;
  this.nodeB = b;
  this.name = "";
  this.lineAngleAdjust = 0;
  this.type = Type.standart;
  
  this.parallelPart = 0.5;
  this.perpendicularPart = 0;
  
}

Link.prototype.getAnchorPoint = function()
{
	var dx = this.nodeB.x - this.nodeA.x;
	var dy = this.nodeB.y - this.nodeA.y;
  var scale = Math.sqrt(dx * dx + dy * dy);
  return {
    x: this.nodeA.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
    y: this.nodeA.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
  };
}

/** @param {number} x @param {number} y */
Link.prototype.setAnchorPoint = function(x, y)
{
  var dx = this.nodeB.x - this.nodeA.x;
  var dy = this.nodeB.y - this.nodeA.y;
  var scale = Math.sqrt(dx*dx + dy*dy);
  this.parallelPart =      (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
  this.perpendicularPart = (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
  // snap to a straight line
  if(this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < Defaults.snapToPadding)
  {
    this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
    this.perpendicularPart = 0;
  }
}

Link.prototype.getEndPoints = function()
{
  if(this.perpendicularPart == 0) {
    var midX = (this.nodeA.x + this.nodeB.x) / 2;
    var midY = (this.nodeA.y + this.nodeB.y) / 2;
    var start = this.nodeA.nearestPointOnBorder(midX, midY);
    var end = this.nodeB.nearestPointOnBorder(midX, midY);
    return {
      hasCircle: false,
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
    };
  }
  var anchor = this.getAnchorPoint();
  var circle = circleFromThreePoints(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y, anchor.x, anchor.y);
  var isReversed = (this.perpendicularPart > 0);
  var reverseScale = isReversed ? 1 : -1;
  var startAngle = Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) - reverseScale * this.nodeA.size / circle.radius;
  var endAngle =   Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) + reverseScale * this.nodeB.size / circle.radius;
  var startX = circle.x + circle.radius * Math.cos(startAngle);
  var startY = circle.y + circle.radius * Math.sin(startAngle);
  var endX = circle.x + circle.radius * Math.cos(endAngle);
  var endY = circle.y + circle.radius * Math.sin(endAngle);
  return {
    hasCircle: true,
    startX: startX,
    startY: startY,
    endX: endX,
    endY: endY,
    startAngle: startAngle,
    endAngle: endAngle,
    circleX: circle.x,
    circleY: circle.y,
    circleRadius: circle.radius,
    reverseScale: reverseScale,
    isReversed: isReversed
  };
}

/** @param {CanvasRenderingContext2D} ctx */
Link.prototype.render = function(ctx)
{
  var data = this.getEndPoints();
  
  ctx.beginPath();
  if (data.hasCircle)
  {
    ctx.arc(data.circleX, data.circleY, data.circleRadius, data.startAngle, data.endAngle, data.isReversed);
  }
  else
  {
    ctx.moveTo(data.startX, data.startY);
    ctx.lineTo(data.endX, data.endY);
  }
  ctx.stroke();
  // Arrow
  if (data.hasCircle)
  {
    renderArrow(ctx, data.endX, data.endY, data.endAngle - data.reverseScale * (Math.PI / 2));
  }
  else
  {
    renderArrow(ctx, data.endX, data.endY, Math.atan2(data.endY - data.startY, data.endX - data.startX));
  }
  // Draw text
  if (data.hasCircle)
  {
    var startAngle = data.startAngle;
    var endAngle = data.endAngle;
    if (endAngle < startAngle) endAngle += Tau;
    var textAngle = (startAngle + endAngle) / 2 + data.isReversed * Math.PI;
    var textX = data.circleX + data.circleRadius * Math.cos(textAngle);
    var textY = data.circleY + data.circleRadius * Math.sin(textAngle);
    renderText(ctx, this.name, textX, textY, textAngle, selectedObject === this);
  }
  else
  {
    var textX = (data.startX + data.endX) / 2;
    var textY = (data.startY + data.endY) / 2;
    var textAngle = Math.atan2(data.endX - data.startX, data.startY - data.endY);
    renderText(ctx, this.name, textX, textY, textAngle + this.lineAngleAdjust, selectedObject === this);
  }
  
}

Link.prototype.hitTest = function(x, y)
{
  var data = this.getEndPoints();
  if (data.hasCircle) return this.hitTestCircle(x, y, data);
  else return this.hitTestStraight(x, y, data);
}

Link.prototype.hitTestCircle = function(x, y, data)
{
  var dx = x - data.circleX;
  var dy = y - data.circleY;
  var dist = Math.sqrt(dx*dx + dy*dy) - data.circleRadius;
  if (Math.abs(dist) < Defaults.hitTargetPadding)
  {
    var angle = Math.atan2(dy, dx);
    var startAngle = data.startAngle;
    var endAngle = data.endAngle;
    if (data.isReversed)
    {
      endAngle = startAngle;
      startAngle = data.endAngle;
    }
    if (endAngle < startAngle) endAngle += Tau;
    if (angle < startAngle) angle += Tau;
    else if (angle > endAngle) angle -= Tau;
    return (angle > startAngle && angle < endAngle);
  }
}

Link.prototype.hitTestStraight = function(x, y, data)
{
  var dx = data.endX - data.startX;
  var dy = data.endY - data.startY;
  var len = Math.sqrt(dx*dx + dy*dy);
  var percent = (dx * (x - data.startX) + dy * (y - data.startY)) / (len*len);
  var dist = (dx * (y - data.startY) - dy * (x - data.startX)) / len;
  return (percent > 0 && percent < 1 && Math.abs(dist) < Defaults.hitTargetPadding);
}

// Self link

function SelfLink(node, mouse)
{
  this.node = node;
  this.anchorAngle = 0;
  this.mouseOffsetAngle = 0;
  this.name = "";
  this.type = Type.standart;
  
  if (mouse) this.setAnchorPoint(mouse.x, mouse.y);
}

SelfLink.prototype.startDrag = function(x, y)
{
  this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
}

SelfLink.prototype.setAnchorPoint = function(x, y)
{
  this.anchorAngle = Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
  // 90 degrees
  var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI/2);
  if (Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
  // -pi...pi clamp
  if (this.anchorAngle < -Math.PI) this.anchorAngle += Tau;
  if (this.anchorAngle > Math.PI) this.anchorAngle -= Tau;
}

SelfLink.prototype.getEndPoints = function()
{
  var circleX = this.node.x + 1.5 * this.node.size * Math.cos(this.anchorAngle);
  var circleY = this.node.y + 1.5 * this.node.size * Math.sin(this.anchorAngle);
  var circleRadius = 0.75 * this.node.size;
  var startAngle = this.anchorAngle - Math.PI * 0.8;
  var endAngle = this.anchorAngle + Math.PI * 0.8;
  var startX = circleX + circleRadius * Math.cos(startAngle);
  var startY = circleY + circleRadius * Math.sin(startAngle);
  var endX = circleX + circleRadius * Math.cos(endAngle);
  var endY = circleY + circleRadius * Math.sin(endAngle);
  return {
    hasCircle: true,
    startX: startX,
    startY: startY,
    endX: endX,
    endY: endY,
    startAngle: startAngle,
    endAngle: endAngle,
    circleX: circleX,
    circleY: circleY,
    circleRadius: circleRadius
  };
}

/** @param {CanvasRenderingContext2D} ctx */
SelfLink.prototype.render = function(ctx)
{
  var data = this.getEndPoints();
  ctx.beginPath();
  ctx.arc(data.circleX, data.circleY, data.circleRadius, data.startAngle, data.endAngle, false);
  ctx.stroke();
  
  // text
  var textX = data.circleX + data.circleRadius * Math.cos(this.anchorAngle);
  var textY = data.circleY + data.circleRadius * Math.sin(this.anchorAngle);
  renderText(ctx, this.name, textX, textY, this.anchorAngle, selectedObject == this);
  
  // arrow
  renderArrow(ctx, data.endX, data.endY, data.endAngle + Math.PI * 0.4);
}

SelfLink.prototype.hitTest = function(x, y)
{
  var data = this.getEndPoints();
  var dx = x - data.circleX;
  var dy = y - data.circleY;
  var dist = Math.sqrt(dx*dx+dy*dy) - data.circleRadius;
  return Math.abs(dist) < Defaults.hitTargetPadding;
}

// Start link

function StartLink(node, start)
{
  this.node = node;
  this.deltaX = 0;
  this.deltaY = 0;
  this.name = "";
  this.type = Type.standart;
  
  if (start) this.setAnchorPoint(start.x, start.y);
}

StartLink.prototype.setAnchorPoint = function(x, y)
{
  this.deltaX = x - this.node.x;
  this.deltaY = y - this.node.y;
  
  if (Math.abs(this.deltaX) < Defaults.snapToPadding) this.deltaX = 0;
  if (Math.abs(this.deltaY) < Defaults.snapToPadding) this.deltaY = 0;
}

StartLink.prototype.getEndPoints = function()
{
  var startX = this.node.x + this.deltaX;
  var startY = this.node.y + this.deltaY;
  var end = this.node.nearestPointOnBorder(startX, startY);
  return {
    startX: startX,
    startY: startY,
    endX: end.x,
    endY: end.y
  }
}

/** @param {CanvasRenderingContext2D} ctx */
StartLink.prototype.render = function(ctx)
{
  var data = this.getEndPoints();
  ctx.beginPath();
  ctx.moveTo(data.startX, data.startY);
  ctx.lineTo(data.endX, data.endY);
  ctx.stroke();
  
  // Text
  var textAngle = Math.atan2(data.startY - data.endY, data.startX - data.endX);
  renderText(ctx, this.name, data.startX, data.startY, textAngle, selectedObject == this);
  renderArrow(ctx, data.endX, data.endY, Math.atan2(-this.deltaY, -this.deltaX));
}

StartLink.prototype.hitTestStraight = Link.prototype.hitTestStraight;
StartLink.prototype.hitTest = function(x, y)
{
  return this.hitTestStraight(x, y, this.getEndPoints());
}

// Temporary connection

function TemporaryLink(from, to)
{
  this.from = from;
  this.to = to;
  this.type = Type.standart;
}

/** @param {CanvasRenderingContext2D} ctx */
TemporaryLink.prototype.render = function(ctx)
{
  ctx.beginPath();
  ctx.moveTo(this.to.x, this.to.y);
  ctx.lineTo(this.from.x, this.from.y);
  ctx.stroke();
  
  renderArrow(ctx, this.to.x, this.to.y, Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x));
}

// Main interface

var canvas;
/** @type {CanvasRenderingContext2D} */
var ctx;
var nameInput;
var nodes = [];
var links = [];

var selectedObject = null;
var currentLink = null;
var parentMode = false;
var pressPoint = { x: 0, y: 0 };
var drag = null;

var shift = false;
var control = false;

var cameraX = 0;
var cameraY = 0;
var cameraScale = 1;
var cameraDrag = false;

var drawCaret = true;
var caretId;
function resetCaretTimer()
{
  clearInterval(caretId);
  drawCaret = true;
  caretId = setInterval(toggleCaret, 500);
}
function toggleCaret()
{
  drawCaret = !drawCaret;
  render();
}

function render()
{
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(0.5, 0.5);
  
  ctx.translate(-cameraX, -cameraY);
  ctx.scale(cameraScale, cameraScale);
  
  for (var node of nodes)
  {
    ctx.lineWidth = (node.type & 1) == 1 ? 2 : 1;
    ctx.setLineDash((node.type & 2) == 2 ? [4,2] : []);
    ctx.fillStyle = ctx.strokeStyle = (selectedObject == node) ? "blue" : "black";
    node.render(ctx);
  }
  for (var link of links)
  {
    ctx.lineWidth = (link.type & 1) == 1 ? 2 : 1;
    ctx.setLineDash((link.type & 2) == 2 ? [4,2] : []);
    ctx.fillStyle = ctx.strokeStyle = (selectedObject == link) ? "blue" : "black";
    link.render(ctx);
  }
  if (currentLink !== null)
  {
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.fillStyle = ctx.strokeStyle = "black";
    currentLink.render(ctx);
  }
  
  ctx.restore();
}

// Util

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x @param {number} y @param {number} angle
 */
function renderText(ctx, text, x, y, angle, selection, lineHeight)
{
  if (!lineHeight) lineHeight = 20;
  ctx.font = lineHeight + 'px "Timew New Roman", serif';
  
  var halfHeight = lineHeight / 2;
  var lines = text.split("\n");
  var height = lines.length * lineHeight;
  
  // position the text intelligently if given an angle
  // TODO: Do for every line
  var useAngle = angle !== null;
  var cos, sin, cornerPointX, cornerPointY, slide;
  if (useAngle)
  {
    cos = Math.cos(angle);
    sin = Math.sin(angle);
    // var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
    cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
    // var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
    // x += cornerPointX - sin * slide;
    // y += cornerPointY + cos * slide;
    y += lineHeight * .3;
  }
  else
  {
    y -= height / 2 - lineHeight * .8; // .5 + .3
  }
  var width;
  for (var line of lines)
  {
    width = ctx.measureText(line).width;
    if (useAngle)
    {
      cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
      slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
      ctx.fillText(line, Math.round(x - width / 2 + cornerPointX - sin * slide), Math.round(y + cornerPointY + cos * slide));
    }
    else ctx.fillText(line, Math.round(x - width / 2), Math.round(y));
    y += lineHeight;
  }
  
  if (selection && drawCaret && document.hasFocus())
  {
    if (useAngle)
    {
      x += cornerPointX - sin * slide;
      y += cornerPointY + cos * slide;
    }
    x = Math.round(x + width / 2);
    y = Math.round(y - lineHeight * 1.3);
    ctx.beginPath();
    ctx.moveTo(x, y - halfHeight);
    ctx.lineTo(x, y + halfHeight);
    ctx.stroke();
  }
}

function renderArrow(ctx, x, y, angle)
{
  var dx = Math.cos(angle);
  var dy = Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
  ctx.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
  ctx.fill();
}

function det(a, b, c, d, e, f, g, h, i)
{
  return a*e*i + b*f*g + c*d*h - a*f*h - b*d*i - c*e*g;
}

function circleFromThreePoints(x1, y1, x2, y2, x3, y3)
 {
  var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
  var bx = -det(x1*x1 + y1*y1, y1, 1, x2*x2 + y2*y2, y2, 1, x3*x3 + y3*y3, y3, 1);
  var by = det(x1*x1 + y1*y1, x1, 1, x2*x2 + y2*y2, x2, 1, x3*x3 + y3*y3, x3, 1);
  var c = -det(x1*x1 + y1*y1, x1, y1, x2*x2 + y2*y2, x2, y2, x3*x3 + y3*y3, x3, y3);
  return {
    x: -bx / (2*a),
    y: -by / (2*a),
    radius: Math.sqrt(bx*bx + by*by - 4*a*c) / (2*Math.abs(a))
  };
}
/** @param {number} x @param {number} y */
function selectObject(x, y)
{
  for (var node of nodes)
  {
    if (node.hitTest(x, y)) return node;
  }
  for (var link of links)
  {
    if (link.hitTest(x, y)) return link;
  }
  return null;
}

function snapNode(node)
{
  for (var other of nodes)
  {
    if (node == other) continue;
    if (Math.abs(node.x - other.x) < Defaults.snapToPadding) node.x = other.x;
    if (Math.abs(node.y - other.y) < Defaults.snapToPadding) node.y = other.y;
  }
}

var relMousePosObj = { x:0, y:0 };
/** @param {MouseEvent} e */
function relMousePos(obj, e)
{
  var rect = obj.getBoundingClientRect();
  relMousePosObj.x = (e.clientX - rect.left + cameraX) / cameraScale;
  relMousePosObj.y = (e.clientY - rect.top + cameraY) / cameraScale;
  return relMousePosObj;
}

function copyPos(pos, base)
{
  if (base != null)
  {
    base.x = pos.x;
    base.y = pos.y;
    return base;
  }
  return { x:pos.x, y:pos.y }
}

// UI

/** @param {MouseEvent} e */
function onCanvasMouseDown(e)
{
  if (e.button == 1)
  {
    cameraDrag = true;
    return;
  }
  
  var pos = relMousePos(canvas, e);
  selectedObject = selectObject(pos.x, pos.y);
  pressPoint.x = pos.x;
  pressPoint.y = pos.y;
  
  if (selectedObject !== null)
  {
    resetCaretTimer();
    if ((shift || control) && selectedObject instanceof Node)
    {
      currentLink = new SelfLink(selectedObject, copyPos(pos));
      parentMode = control;
    }
    else
    {
      drag = selectedObject;
      if (drag.startDrag) drag.startDrag(pos.x, pos.y);
    }
  }
  else if (shift)
  {
    currentLink = new TemporaryLink(copyPos(pos), copyPos(pos));
  }
  render();
  e.preventDefault();
}

/** @param {MouseEvent} e */
function onCanvasMouseMove(e)
{
  if (cameraDrag)
  {
    cameraX -= e.movementX;
    cameraY -= e.movementY;
    render();
    return;
  }
  
  var pos = relMousePos(canvas, e);
  
  if (currentLink !== null)
  {
    var targetNode = selectObject(pos.x, pos.y);
    if (!(targetNode instanceof Node)) targetNode = null;
    
    if (selectedObject === null)
    {
      if (targetNode !== null)
      {
        if (currentLink instanceof StartLink) currentLink.node = targetNode;
        else currentLink = new StartLink(targetNode, copyPos(pressPoint));
      }
      else
      {
        if (currentLink instanceof TemporaryLink) currentLink.to = copyPos(pos, currentLink.to);
        else currentLink = new TemporaryLink(copyPos(pressPoint), copyPos(pos));
      }
    }
    else
    {
      if (targetNode === selectedObject)
      {
        if (currentLink instanceof SelfLink) currentLink.setAnchorPoint(pos);
        else currentLink = new SelfLink(selectedObject, pos);
      }
      else if (targetNode !== null)
      {
        if (currentLink instanceof Link) currentLink.nodeB = targetNode;
        else currentLink = new Link(selectedObject, targetNode);
      }
      else
      {
        if (currentLink instanceof TemporaryLink)
        {
          currentLink.from = selectedObject.nearestPointOnBorder(pos.x, pos.y);
          currentLink.to = pos;
        }
        else currentLink = new TemporaryLink(selectedObject.nearestPointOnBorder(pos.x, pos.y), pos);
      }
    }
    if (!drag) render();
  }
  
  if (drag)
  {
    drag.setAnchorPoint(pos.x, pos.y);
    if (drag instanceof Node) snapNode(drag);
    render();
  }
  e.preventDefault();
}

/** @param {MouseEvent} e */
function onCanvasMouseUp(e)
{
  cameraDrag = false;
  
  var pos = relMousePos(canvas, e);
  if (currentLink !== null)
  {
    if (!(currentLink instanceof TemporaryLink))
    {
      if (parentMode && currentLink instanceof Link)
      {
        if (currentLink.nodeB.parent === currentLink.nodeA) currentLink.nodeB.parent = null;
        else currentLink.nodeB.parent = currentLink.nodeA;
      }
      else
      {
        selectedObject = currentLink;
        links.push(currentLink);
        resetCaretTimer();
      }
      if (!drag) saveBackup();
    }
    parentMode = false;
    currentLink = null;
    if (!drag) render();
  }
  
  if (drag)
  {
    if (drag.stopDrag) drag.stopDrag(pos.x, pos.y);
    drag = null;
    saveBackup();
    render();
  }
  e.preventDefault();
}

/** @param {MouseEvent} e */
function onCanvasDoubleClick(e)
{
  var pos = relMousePos(canvas, e);
  selectedObject = selectObject(pos.x, pos.y);
  if (selectedObject === null)
  {
    selectedObject = new Node(pos.x, pos.y);
    nodes.push(selectedObject);
    resetCaretTimer();
    saveBackup();
    render();
  }
  else
  {
    selectedObject.type++;
    if (selectedObject.type == Type.limit) selectedObject.type = 0;
    saveBackup();
    render();
  }
  e.preventDefault();
}

/** @param {WheelEvent} e */
function onCanvasMouseWheel(e)
{
  if (selectedObject !== null && shift)
  {
    if (e.deltaY < 0)
    {
      if (selectedObject.size < Defaults.maxSize)
      {
        selectedObject.size += Defaults.sizeStep;
        render();
        saveBackup();
        e.preventDefault();
      }
    }
    else if (selectedObject.size > Defaults.minSize)
    {
      selectedObject.size -= Defaults.sizeStep;
      render();
      saveBackup();
      e.preventDefault();
    }
  }
  else if (control)
  {
    if (e.deltaY > 0)
    {
      if (cameraScale > 0.3)
      {
        cameraScale -= 0.1;
        render();
      }
    }
    else
    {
      if (cameraScale < 1)
      {
        cameraScale += 0.1;
        render();
      }
    }
    e.preventDefault();
  }
}

/** @param {KeyboardEvent} e */
function onCanvasKeyDown(e)
{
  var prevent = true;
  switch (e.key)
  {
    case "Shift": shift = true; prevent = false; break;
    case "Control": control = true; prevent = false; break;
    case "Backspace":
      if (selectedObject !== null)
      {
        selectedObject.name = selectedObject.name.substr(0, selectedObject.name.length - 1);
        resetCaretTimer();
        saveBackup();
        render();
      }
    default:
      
      prevent = false;
  }
  if (prevent) e.preventDefault();
}

/** @param {KeyboardEvent} e */
function onCanvasKeyPress(e)
{
  if (selectedObject !== null)
  {
    
    var add = e.key;
    if (add == "Enter") add = "\n";
    selectedObject.name += add;
    resetCaretTimer();
    saveBackup();
    render();
  }
}

/** @param {KeyboardEvent} e */
function onCanvasKeyUp(e)
{
  var prevent = true;
  switch (e.key)
  {
    case "Delete":
      if (selectedObject !== null)
      {
        var i;
        for (i = 0; i < nodes.length; i++)
        {
          if (nodes[i] === selectedObject)
          {
            nodes.splice(i, 1);
          }
          else if (nodes[i].parent === selectedObject)
          {
            nodes[i].parent = null;
          }
        }
        for (i = 0; i < links.length; i++)
        {
          var link = links[i];
          if (link === selectedObject || link.node === selectedObject || link.nodeA === selectedObject || link.nodeB === selectedObject)
          {
            links.splice(i--, 1);
          }
        }
        selectedObject = null;
        saveBackup();
        render();
      }
      break;
    case "Shift": shift = false; prevent = false; break;
    case "Control": control = false; prevent = false; break;
    case "Space": break;
    default: prevent = false;
  }
  if (prevent) e.preventDefault();
}

function onWindowResize(e)
{
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  render();
}

// Save/load

function restoreBackup()
{
  try
  {
    var backup = JSON.parse(localStorage.getItem("fsm"));
    importData(backup);
  }
  catch (e)
  {
    console.log("Error occured: " + e + " : " + localStorage.getItem("fsm"));
    localStorage.setItem('fsm', "");
  }
}

function saveBackup()
{
  localStorage.setItem("fsm", JSON.stringify(exportData()));
}

function importData(backup)
{
  var i;
  nodes = [];
  links = [];
  for (i = 0; i < backup.nodes.length; i++)
  {
    var backupNode = backup.nodes[i];
    var node = new Node(backupNode.x, backupNode.y);
    node.name = backupNode.name;
    node.size = backupNode.size;
    if (backupNode.style) node.type = backupNode.style;
    node.parent = backupNode.parent; // Int for now.
    nodes.push(node);
  }
  for (i = 0; i < backup.links.length; i++)
  {
    var backupLink = backup.links[i];
    var link = null;
    if (backupLink.type == "SelfLink")
    {
      link = new SelfLink(nodes[backupLink.node]);
      link.anchorAngle = backupLink.anchorAngle;
    }
    else if (backupLink.type == "StartLink")
    {
      link = new StartLink(nodes[backupLink.node]);
      link.deltaX = backupLink.deltaX;
      link.deltaY = backupLink.deltaY;
    }
    else if (backupLink.type == "Link")
    {
      link = new Link(nodes[backupLink.nodeA], nodes[backupLink.nodeB]);
      link.parallelPart = backupLink.parallelPart;
      link.perpendicularPart = backupLink.perpendicularPart;
      link.lineAngleAdjust = backupLink.lineAngleAdjust;
    }
    
    if (link != null)
    {
      if (backupLink.style) link.type = backupLink.style;
      link.name = backupLink.name;
      links.push(link);
    }
  }
  for (var node of nodes)
  {
    if (node.parent !== null) node.parent = nodes[node.parent];
  }
  render();
}

function exportData()
{
  var backup = {
    nodes: [],
    links: []
  }
  for (var node of nodes)
  {
    backup.nodes.push({
      x: node.x,
      y: node.y,
      name: node.name,
      size: node.size,
      style: node.type,
      parent: (node.parent !== null ? nodes.indexOf(node.parent) : null)
    });
  }
  for (var link of links)
  {
    var backupLink = null;
    if (link instanceof SelfLink)
    {
      backupLink = {
        type: "SelfLink",
        node: nodes.indexOf(link.node),
        anchorAngle: link.anchorAngle
      };
    }
    else if (link instanceof StartLink)
    {
      backupLink = {
        type: "StartLink",
        node: nodes.indexOf(link.node),
        deltaX: link.deltaX,
        deltaY: link.deltaY
      };
    }
    else if (link instanceof Link)
    {
      backupLink = {
        type: "Link",
        nodeA: nodes.indexOf(link.nodeA),
        nodeB: nodes.indexOf(link.nodeB),
        lineAngleAdjust: link.lineAngleAdjust,
        parallelPart: link.parallelPart,
        perpendicularPart: link.perpendicularPart
      };
    }
    
    if (backupLink !== null)
    {
      backupLink.name = link.name;
      backupLink.style = link.type;
      backup.links.push(backupLink);
    }
  }
  return backup;
}

function exportJson()
{
  var data = JSON.stringify(exportData(), null, 2);
  var blob = new Blob([data], { type:"application/octet-stream" });
  var url = URL.createObjectURL(blob);
  // Oh boy, year 2017, and we still have to use this hack
  var anchor = document.createElement("a");
  anchor.style.display = "none";
  anchor.href = url;
  anchor.download = "fsm.json";
  document.body.appendChild(anchor);
  anchor.click();
  URL.revokeObjectURL(url);
  document.removeChild(anchor);
}

function importJson(files)
{
  var reader = new FileReader();
  reader.onload = function()
  {
    try
    {
      nodes = [];
      links = [];
      var json = JSON.parse(reader.result);
      importData(json);
    }
    catch(e)
    {
      alert("Unable to parse json file!");
    }
  }
  reader.readAsText(files[0]);
}

function init()
{
  canvas = document.getElementById("mainCanvas");
  canvas.addEventListener("mousedown", onCanvasMouseDown);
  canvas.addEventListener("mousemove", onCanvasMouseMove);
  canvas.addEventListener("mouseup", onCanvasMouseUp);
  canvas.addEventListener("dblclick", onCanvasDoubleClick);
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  document.body.addEventListener("keyup", onCanvasKeyUp);
  document.body.addEventListener("keydown", onCanvasKeyDown);
  document.body.addEventListener("keypress", onCanvasKeyPress);
  document.body.addEventListener("mousewheel", onCanvasMouseWheel);
  window.addEventListener("resize", onWindowResize);
  ctx = canvas.getContext("2d");
  restoreBackup();
  console.log("init");
}

document.addEventListener("DOMContentLoaded", init);