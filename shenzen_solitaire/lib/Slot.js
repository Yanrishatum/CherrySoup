function Slot(type, x, y)
{
  this.isSlot = true;
  this.isDragonSlot   = type === "dragon";
  this.isCardSlot     = type === "card";
  this.isFlowerSlot   = type === "flower";
  this.isStandartSlot = type === "standart";
  this.children = null;
  this.top = null;
  this.x = x;
  this.y = y;
  this.locked = false;
  binded(this, "updateZOrder");
}

Slot.prototype.isNear = function(card)
{
  return pointInRect(card.x + 61, card.y + 118.5, this.x, this.y, 122, 237);
}

Slot.prototype.reset = function()
{
  if (this.children) this.children.reset();
  this.children = null;
  this.top = null;
  this.locked = false;
}

Slot.prototype.updateTop = function()
{
  this.top = this.children;
  if (this.top)
  {
    while (this.top.children)
    {
      this.top = this.top.children;
    }
  }
}

Slot.prototype.updateZOrder = function()
{
  var i = 0;
  var child = this.children;
  while (child)
  {
    child.root.style.zIndex = i++;
    child = child.children;
  }
}