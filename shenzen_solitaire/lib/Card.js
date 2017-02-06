// Dragon types:
//   white
//   green
//   red
// Card types:
//   bamboo
//   coins
//   char
// Special: flower

// Text colors
var colors = { "bamboo": "#126e4b", "coins": "#ae2c14", "char": "#000" };

function Card(type, color)
{
  this.color = color;
  this.isSlot = false;
  
  this.isDragon = type === "dragon";
  this.isFlower = type === "flower";
  if (!this.isDragon && !this.isFlower)
  {
    this.isCard = true;
    this.id = type;
  }
  binded(this, "onFlyEnd");
  binded(this, "onReleased");
  binded(this, "onMouseMove");
  binded(this, "applyMouseMove");
  binded(this, "reset");
  
  binded(this, "onHover");
  binded(this, "onPressed");
  var root = document.createElement("div");
  root.classList.add("card");
  
  var shadow = document.createElement("img");
  shadow.classList.add("card-icon");
  shadow.src = "card_shadow.png";
  shadow.style.top = "2px";
  root.appendChild(shadow);
  this.shadow = shadow;
  
  root.addEventListener("mouseenter", binded(this, "onHover"));
  root.addEventListener("mousedown", binded(this, "onPressed"));
  root.addEventListener("touchstart", this.__onPressed);
  root.card = this;
  
  this.root = root;
  this.stack = createStack(root);
  this.front = createFront(root, this.isDragon, this.isFlower, this.color, this.id);
  this.back = createBack(root);
  this.isFace = false;
  
  this.stackSize = 0;
  
  // Nesting
  this.children = null;
  this.parent = null;
  this.slot = null;
  
  // Positioning
  this.x = 0;
  this.y = 0;
  
  // Mouse drag
  this.dragMode = false;
  this.tx = 0;
  this.ty = 0;
  this.flip();
  this.tweener = null;
}

function createStack(root)
{
  var stack = document.createElement("div");
  stack.classList.add("card-stack");
  stack.style.display = "none";
  root.appendChild(stack);
  return stack;
}

function createFront(root, isDragon, isFlower, color, id)
{
  var face = document.createElement("div");
  face.classList.add("face");
  root.appendChild(face);
  
  var large = document.createElement("img");
  var smallTop = document.createElement("img");
  var smallBot = document.createElement("img");
  large.classList.add("card-icon", "large");
  smallTop.classList.add("card-icon", "small-top");
  smallBot.classList.add("card-icon", "small-bottom");
  face.appendChild(large);
  face.appendChild(smallTop);
  face.appendChild(smallBot);
  
  var name, smallName, className;
  if (isFlower)
  {
    name = smallName = "flower.png";
    className = 'full';
  }
  else if (isDragon)
  {
    name = smallName = "dragon_" + color + ".png";
    className = 'full';
  }
  else
  {
    name = color + "_" + id + ".png";
    smallName = color === "char" ? "characters.png" : color + ".png";
    className = "part";
    
    var digitTop = document.createElement("div");
    var digitBot = document.createElement("div");
    digitBot.innerHTML = digitTop.innerHTML = id;
    digitBot.style.color = digitTop.style.color = colors[color];
    digitTop.classList.add("card-icon", "small-top", "digit");
    digitBot.classList.add("card-icon", "small-bottom", "digit");
    face.appendChild(digitTop);
    face.appendChild(digitBot);
  }
  
  large.src = "large_icons/" + name;
  smallBot.src = smallTop.src = "small_icons/" + smallName;
  smallTop.classList.add(className);
  smallBot.classList.add(className);
  
  var texture = document.createElement("img");
  texture.classList.add("card-icon");
  texture.src = "card_texture.png";
  face.appendChild(texture);
  
  return face;
}

function createBack(root)
{
  var face = document.createElement("div");
  face.classList.add("back");
  root.appendChild(face);
  return face;
}

Card.prototype.reset = function()
{
  if (this.children) this.children.reset();
  
  if (this.stackSize > 1) this.setStackSize(0);
  this.parent = null;
  this.children = null;
  this.slot = null;
  this.isFace = false;
  this.dragMode = false;
  this.root.classList.remove("dragged");
  this.root.classList.remove("dragable");
  this.locked = false;
  this.x = 0;
  this.y = 0;
  this.flip();
  this.root.remove();
  this.shadow.style.display = "";
  this.tweener = null;
}

// Just visuals
Card.prototype.syncPosition = function()
{
  var child = this.children;
  var offset = cardOffset;
  while (child)
  {
    child.setPos(this.x, this.y + offset);
    offset += cardOffset;
    child = child.children;
  }
}

Card.prototype.setPos = function(x, y)
{
  this.root.style.left = (this.x = x) + "px";
  this.root.style.top = (this.y = y) + "px";
  this.syncPosition();
}

Card.prototype.snapTo = function(card)
{
  this.setPos(card.x, card.y);
}

Card.prototype.setStackSize = function(size)
{
  if (size > 1)
  {
    this.stack.style.display = "";
    this.root.style.transform = "translateY(-" + ((size / (183+55))*100) + "%)";
    this.stack.style.top = (178 + size) + "px";
  }
  else
  {
    this.stack.style.display = "none";
    this.root.style.transform = "";
  }
  this.stackSize = size;
}

Card.prototype.flip = function()
{
  this.isFace = !this.isFace;
  if (this.isFace)
  {
    this.back.style.display = "none";
    this.front.style.display = "";
  }
  else
  {
    this.back.style.display = "";
    this.front.style.display = "none";
  }
}

// Technical Nesting
Card.prototype.canPlace = function(card)
{
  if (card.locked) return false;
  
  if (card.isSlot)
  {
    if (card.isFlowerSlot) return false;
    else if (card.isDragonSlot) return card.children === null && this.children === null;
    else if (card.isCardSlot) return !card.children && this.id === 1;
    else return !card.children;
  }
  else
  {
    if (card.children) return false;
    // No dragons, flowers, or placing at occupied dragon slots.
    if (this.isDragon || this.isFlower || card.isDragon || card.slot.isDragonSlot) return false;
    // Should be different color & one step higher.
    if (card.slot.isCardSlot) return card.color === this.color && card.id + 1 === this.id;
    return card.color !== this.color && card.id - 1 === this.id;
  }
}

Card.prototype.isNear = function(card)
{
  return pointInRect(card.x + 61, card.y + 118.5, this.x, this.y, 122, 237);
}

Card.prototype.isInteractable = function()
{
  if (!Game.interactable || !Game.started || !this.slot || this.locked) return false;
  
  if (this.children == null) // Card slots disable movement.
  {
    return !this.slot.isCardSlot;
  }
  else
  {
    if (this.isDragon) return false; // Dragon can't be moved when something on top
    
    var valid = true;
    var next = this.id - 1;
    var child = this.children;
    var color = this.color;
    do
    {
      // Should be Number - 1 and have different color (Bamboo4-Bamboo3 case)
      valid = (child.id == next && child.color != color);
      next--;
      color = child.color;
      child = child.children;
    }
    while (valid && child);
    
    return valid;
  }
}

// Unsafe
Card.prototype.unstuck = function()
{
  // Remove self from parent.
  if (this.parent)
  {
    this.parent.children = null;
    this.parent = null;
  }
  
  // Remove slot mentions and recalculate top card on slot stack.
  if (this.slot)
  {
    this.slot.updateTop();
    this.slot = null;
    var child = this.children;
    while (child)
    {
      child.slot = null;
      child = child.children;
    }
  }
}

Card.prototype.stuck = function(card)
{
  // Add self to parent
  this.parent = card;
  card.children = this;
  // Add slot mentions and put top card to the slot stack.
  if (card.isSlot) this.updateSlot(card);
  else this.updateSlot(card.slot);
}

Card.prototype.updateSlot = function(slot)
{
  this.shadow.style.display = slot.isStandartSlot || this.parent.isSlot ? "" : "none";
  this.slot = slot;
  var top = this;
  var child = this.children;
  while (child)
  {
    // Add slot to children and find the highest card.
    top = child;
    child.slot = slot;
    child = child.children;
  }
  slot.top = top;
}

// Safe
Card.prototype.placeAt = function(card, changePos)
{
  log(this);
  this.unstuck();
  this.stuck(card);
  if (changePos)
  {
    if (card.isSlot) this.setPos(card.x, card.y);
    else this.setPos(card.x, card.y + (card.isCardSlot ? stackOffset : cardOffset));
  }
  
}

// Animated
Card.prototype.flyTo = function(card, speed)
{
  this.placeAt(card, false);
  var t = new Tweener(this, card, speed ? speed : 100, false);
  this.updateZOrder(1000);
  Game.interactable = false;
  t.onComplete.push(this.__onFlyEnd);
  return t;
}

Card.prototype.flipTo = function(card, speed)
{
  this.placeAt(card, false);
  var t = new Tweener(this, card, speed ? speed : 100, true);
  this.updateZOrder(1000);
  Game.interactable = false;
  t.onComplete.push(this.__onFlyEnd);
  return t;
}

Card.prototype.onFlyEnd = function()
{
  Game.interactable = true;
  this.slot.updateZOrder();
  if (this.dragMode) this.updateZOrder();
  //checkAutofill();
}

Card.prototype.updateZOrder = function(forceIndex)
{
  if (!forceIndex) forceIndex = this.dragMode ? 1000 : 0;
  this.root.style.zIndex = forceIndex++;
  var child = this.children;
  while (child)
  {
    child.root.style.zIndex = forceIndex++;
    child = child.children;
  }
}

// Events
Card.prototype.onHover = function(e)
{
  this.updateDragable();
}

Card.prototype.updateDragable = function()
{
  if (this.isInteractable()) this.root.classList.add("dragable");
  else this.root.classList.remove("dragable");
}

Card.prototype.onPressed = function(e)
{
  e.preventDefault();
  if (this.dragMode) return;
  if (this.isInteractable())
  {
    if (e.touches) e = e.touches[0];
    this.tx = -(e.clientX - this.x);
    this.ty = -(e.clientY - this.y);
    
    this.dragMode = true;
    this.root.classList.add("dragged");
    document.body.addEventListener("mouseup", this.__onReleased);
    document.body.addEventListener("touchend", this.__onReleased);
    document.body.addEventListener("mousemove", this.__onMouseMove);
    document.body.addEventListener("touchmove", this.__onMouseMove);
    this.slot.updateZOrder();
    this.updateZOrder();
    sfxPickup.play();
  }
}

Card.prototype.applyMouseMove = function()
{
  this.mouseMoveId = null;
  this.setPos(this.mx, this.my);
}

Card.prototype.onMouseMove = function(e)
{
  e.preventDefault();
  if (e.touches) e = e.touches[0];
  this.mx = e.clientX + this.tx;
  this.my = e.clientY + this.ty;
  if (!this.mouseMoveId) this.mouseMoveId = requestAnimationFrame(this.__applyMouseMove);
}

Card.prototype.onReleased = function(e)
{
  e.preventDefault();
  if (!this.dragMode) return;
  if (e.touches) e = e.touches[0];
  document.body.removeEventListener("mouseup", this.__onReleased);
  document.body.removeEventListener("touchend", this.__onReleased);
  document.body.removeEventListener("mousemove", this.__onMouseMove);
  document.body.removeEventListener("touchmove", this.__onMouseMove);
  this.dragMode = false;
  this.root.classList.remove("dragged");
  sfxPlace.play();
  
  for (var slot of Game.slots)
  {
    var top = slot.top ? slot.top : slot;
    if (top.isNear(this) && this.canPlace(top))
    {
      var t = this.flyTo(top, 100);
      // Game.interactable = false;
      t.onComplete.push(this.__onFlyEnd);
      t.onComplete.push(Game.autofill);
      return;
    }
  }
  
  var t = new Tweener(this, this.parent, 100, false);
  // Game.interactable = false;
  t.onComplete.push(this.__onFlyEnd);
}
