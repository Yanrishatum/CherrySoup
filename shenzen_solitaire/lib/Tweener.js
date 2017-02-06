/**
 * @param {Card} card
 * @param {(Card|Slot)} target
 * @param {number} time
 * @param {boolean} flip
 */
function Tweener(card, target, time, flip)
{
  /** @param {Card} */
  this.card = card;
  this.target = target;
  this.time = time;
  this.flip = flip;
  
  this.sx = card.x;
  this.sy = card.y;
  var tx = target.x;
  var ty = target.y;
  
  if (target instanceof Card)
  {
    // Check for dragon slot for dragons stack.
    if (target.slot.isCardSlot || target.slot.isDragonSlot) ty += stackOffset;
    else ty += cardOffset;
  }
  this.mx = tx - card.x;
  this.my = ty - card.y;
  
  if (flip) this.flipSign = tx > card.x ? 1 : -1;
  
  this.percent = 0;
  this.onComplete = [];
  //this.stamp
  this.id = requestAnimationFrame(binded(this, "update"));
  Tweener.active.push(this);
  
  this.delay = 0;
  this.easing = quadInOut;
}

/**
 * @param {number} x
 * @param {number} y
 */
Tweener.prototype.overrideTargetPosition = function(x, y)
{
  this.mx = x - this.sx;
  this.my = y - this.sy;
}

Tweener.active = [];
Tweener.stopAll = function()
{
  for (var active of Tweener.active)
  {
    active.inerrupt();
  }
}

function quadInOut(t)
{
  return t <= .5 ? t * t * 2 : 1 - (--t) * t * 2;
}

function quintInOut(t)
{
  return ((t *= 2) < 1) ? (t * t * t * t * t) / 2 : ((t -= 2) * t * t * t * t + 2) / 2;
}

function easer(t)
{
	t--;
	return (t*t*t*t*t + 1);
}

Tweener.prototype.inerrupt = function()
{
  cancelAnimationFrame(this.id);
  Tweener.active.splice(Tweener.active.indexOf(this), 1);
}

Tweener.prototype.update = function(elapsed)
{
  
  if (!this.stamp) this.stamp = elapsed;
  var t = elapsed - this.stamp;
  this.stamp = elapsed;
  if (this.delay > 0)
  {
    this.delay -= t;
    if (this.delay < 0)
    {
      t = -this.delay;
    }
    else
    {
      this.id = requestAnimationFrame(this.__update);
      return;
    }
  }
  this.percent += t / this.time;
  
  if (this.percent > 1) this.percent = 1; // Disable overextending
  
  var eased = this.easing ? this.easing(this.percent) : this.percent;
  
  this.card.setPos(this.sx + this.mx * eased,
                   this.sy + this.my * eased);
  if (this.flip)
  {
    var value = this.percent * 180;
    if (this.percent > .5)
    {
      value = 90 - (value % 90); // Uh. +180 instead?
      if (!this.flipDone)
      {
        this.card.flip();
        this.flipDone = true;
      }
    }
    value *= this.flipSign;
    this.card.root.style.transform = "rotateY(" + value + "deg)"; // TODO: Support for stack flips?
  }
  
  if (this.percent < 1) this.id = requestAnimationFrame(this.__update);
  else
  {
    this.card.setPos(this.sx + this.mx, this.sy + this.my);
    if (this.flip) this.card.root.style.transform = "";
    
    Tweener.active.splice(Tweener.active.indexOf(this), 1);
    
    if (this.onComplete)
    {
      if (typeof this.onComplete === "function") this.onComplete();
      else if (Array.isArray(this.onComplete))
      {
        for (var fn of this.onComplete) fn();
      }
    }
  }
}

function Timer(callback, delay)
{
  this.callback = callback;
  this.delay = delay;
  this.active = false;
  this.repeat = false;
  this.frameId = 0;
  this.time = delay;
  this.limiter = 0;
  binded(this, "update");
}

Timer.prototype.setLimiter = function(limit)
{
  this.limiter = limit;
}

Timer.prototype.update = function(timestamp)
{
  if (!this.stamp) this.stamp = timestamp;
  var delta = timestamp - this.stamp;
  if (this.limiter && delta > this.limiter) delta = this.limiter;
  this.stamp = timestamp;
  
  this.time -= delta;
  if (this.time <= 0)
  {
    this.time += this.delay;
    var interrupt = !this.repeat;
    if (this.callback() === true)
    {
      interrupt = true;
    }
    
    if (interrupt) this.frameId = 0;
    else this.frameId = requestAnimationFrame(this.__update);
    
  }
  else this.frameId = requestAnimationFrame(this.__update);
}

Timer.prototype.setParams = function(callback, delay)
{
  this.callback = callback;
  this.delay = delay;
}

Timer.prototype.interval = function()
{
  if (!this.frameId) requestAnimationFrame(this.__update);
  this.active = true;
  this.repeat = true;
  this.time = this.delay;
}

Timer.prototype.stop = function()
{
  if (this.frameId) cancelAnimationFrame(this.__update);
  this.active = false;
}