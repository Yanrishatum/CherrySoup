/**
 * @param {card} card
 */
function Undo(card)
{
  this.card = card;
  this.slot = card.slot;
  this.cardFace = card.isFace;
  this.cardLock = card.locked;
  if (card.isDragon)
  {
    this.stateCheck = "dragon";
    this.stateCheckKey = card.color;
    this.stateCheckValue = Game.dragonsSet[card.color];
  }
  else if (card.isFlower)
  {
    this.stateCheck = "flower";
    this.stateCheckValue = Game.flowerSet;
  }
  else
  {
    this.stateCheck = "suit";
    this.stateCheckKey = card.color;
    this.stateCheckValue = Game.cardsSet[card.color];
    this.stateCheckValue2 = Game.cardsSet.min;
  }
}

Undo.prototype.restore = function()
{
  var currentSlot = this.card.slot;
  this.card.locked = this.cardLock;
  if (this.card.isFace != this.cardFace)
  {
    this.card.flipTo(this.slot.top ? this.slot.top : this.slot, 400);
  }
  else
  {
    this.card.flyTo(this.slot.top ? this.slot.top : this.slot, 400);
  }
  switch (this.stateCheck)
  {
    case "dragon":
      Game.dragonsSet[this.stateCheckKey] = this.stateCheckValue;
      if (!this.stateCheckValue) Game.dragonButtons[this.stateCheckKey].classList.remove("disabled");
      break;
    case "flower":
      Game.flowerSet = this.stateCheckValue;
      break;
    case "suit":
      Game.cardsSet[this.stateCheckKey] = this.stateCheckValue;
      Game.cardsSet.min = this.stateCheckValue2;
      break;
  }
}

var undoLog = [];
var undoEnabled = true;
var ignoreLogger = false;
var chainLog = false;

function log(card)
{
  if (!ignoreLogger)
  {
    var action = new Undo(card);
    action.chain = chainLog;
    undoLog.push(action);
  }
}

function undo()
{
  if (!undoEnabled || undoLog.length === 0) return;
  if (victories < 50) alert("She says she doesn't think it need undo, because it is actually quite easy once you develop some skill.");
  var action;
  ignoreLogger = true;
  do
  {
    action = undoLog.pop();
    action.restore();
  }
  while (action.chain);
  sfxSweep.play();
  ignoreLogger = false;
  
}

function resetLog()
{
  undoLog = [];
}

/** @param {KeyboardEvent} e */
function handleUndo(e)
{
  if (e.ctrlKey && e.keyCode === 90)
  {
    undo();
  }
}