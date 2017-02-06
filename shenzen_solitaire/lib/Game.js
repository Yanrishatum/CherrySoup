function Game()
{
  
}

Game.interactable = true;

// Slots
Game.dragonSlots =
[
  new Slot("dragon", 46, 19),
  new Slot("dragon", 198, 19),
  new Slot("dragon", 351, 19)
];
Game.flowerSlot = new Slot("flower", 614, 19);
Game.cardSlots = 
[
  new Slot("card", 807, 19),
  new Slot("card", 958, 19),
  new Slot("card", 1110, 19),
];
Game.standartSlots =
[
  new Slot("standart", 45, 283),
  new Slot("standart", 45 + 152, 283),
  new Slot("standart", 45 + 152 * 2, 283),
  new Slot("standart", 45 + 152 * 3, 283),
  new Slot("standart", 45 + 152 * 4, 283),
  new Slot("standart", 45 + 152 * 5, 283),
  new Slot("standart", 45 + 152 * 6, 283),
  new Slot("standart", 45 + 152 * 7, 283),
];
Game.slots = Game.dragonSlots.concat(Game.flowerSlot, Game.cardSlots, Game.standartSlots);

// Cards
Game.dragons = { red:[], green:[], white:[] };
Game.flower = new Card("flower");
Game.bamboo = [];
Game.coins = [];
Game.chars = [];
Game.cards = [Game.flower];
// Dealer stack
Game.stack = new Card("flower");
Game.stack.flip();
Game.stack.snapTo(Game.flowerSlot);

// Completion flags
Game.flowerSet = false;
Game.dragonsSet = { red:false, green:false, white:false };
Game.cardsSet = { bamboo: 0, coins: 0, chars: 0, min: 1 };

// Cheevos :D
Game.victories = 0;
Game.clumbTheMountain = false;
Game.metTheDragon = false;
Game.becameImmortal = false;

// Tech shit
Game.container = null;
Game.dragonButtons = { red:null, green:null, white:null };
Game.instructionsButton = null;
Game.instructions = null;
Game.newGameButton = null;
Game.sfxButton = null;
Game.musicButton = null;
Game.volumeSlider = null;

Game.init = function()
{
  var i, c;
  for (i = 0; i < 4; i++)
  {
    c = new Card("dragon", "red");
    Game.dragons.red.push(c);
    Game.cards.push(c);
    c = new Card("dragon", "green");
    Game.dragons.green.push(c);
    Game.cards.push(c);
    c = new Card("dragon", "white");
    Game.dragons.white.push(c);
    Game.cards.push(c);
  }
  
  for (i = 1; i < 10; i++)
  {
    c = new Card(i, "bamboo");
    Game.bamboo.push(c);
    Game.cards.push(c);
    c = new Card(i, "coins");
    Game.coins.push(c);
    Game.cards.push(c);
    c = new Card(i, "char");
    Game.chars.push(c);
    Game.cards.push(c);
  }
  
  Game.container = document.getElementById("container");
  Game.dragonButtons.red   = document.getElementById("buttonRed");
  Game.dragonButtons.green = document.getElementById("buttonGreen");
  Game.dragonButtons.white = document.getElementById("buttonWhite");
  Game.dragonButtons.red.ofType = "red";
  Game.dragonButtons.green.ofType = "green";
  Game.dragonButtons.white.ofType = "white";
  Game.dragonButtons.red.addEventListener("click", Game.onDragonClick);
  Game.dragonButtons.green.addEventListener("click", Game.onDragonClick);
  Game.dragonButtons.white.addEventListener("click", Game.onDragonClick);
  
  Game.instructions = document.getElementById("instructions");
  Game.instructionsButton = document.getElementById("instructionsButton");
  Game.instructionsButton.addEventListener("click", Game.onInstructionsClick);
  
  Game.newGameButton = document.getElementById("newGameButton");
  Game.newGameButton.addEventListener("click", Game.newGame);
  
  Game.sfxButton = document.getElementById("sfxButton");
  Game.sfxButton.addEventListener("click", Game.onSfxClick);
  
  Game.musicButton = document.getElementById("musicButton");
  Game.musicButton.classList.add("off");
  Game.musicButton.addEventListener("click", Game.onMusicClick);
  
  Game.volumeSlider = document.getElementById("volumeSlider");
  Game.volumeSlider.addEventListener("mousedown", Sfx.volumePressed);
  Game.volumeSlider.addEventListener("touchstart", Sfx.volumePressed);
  Sfx.setMusicVolume(1);
  
  victories = parseInt(getCookie("victories", "0"));
  
  Game.clumbTheMountain = victories >= 1;
  Game.metTheDragon = victories >= 10;
  Game.becameImmortal = victories >= 100;
  if (Game.clumbTheMountain)
  {
    document.addEventListener("keyup", handleUndo);
  }
  if (Game.metTheDragon)
  {
    
  }
  if (Game.becameImmortal) document.body.classList.add("dragon-mode");
}

Game.dealCaret = 0;
Game.dealSlot = 0;
Game.started = false;

Game.newGame = function()
{
  if (newGameButton.classList.contains("disabled")) return;
  resetLog();
  for (var card of Game.cards) card.reset();
  for (var slot of Game.slots) slot.reset();
  Tweener.stopAll();
  
  shuffle(Game.cards);
  Game.stack.setStackSize(49);
  Game.container.appendChild(Game.stack.root);
  
  Game.dealCaret = 0;
  Game.dealSlot = 0;
  
  Game.flowerSet = false;
  Game.dragonsSet.red = false;
  Game.dragonsSet.green = false;
  Game.dragonsSet.white = false;
  Game.cardsSet.bamboo = 0;
  Game.cardsSet.coins = 0;
  Game.cardsSet.chars = 0;
  Game.cardsSet.min = 2;
  
  Game.dragonButtons.red.classList.remove("disabled");
  Game.dragonButtons.green.classList.remove("disabled");
  Game.dragonButtons.white.classList.remove("disabled");
  Game.started = false;
  Game.interactable = false;
  if (Game.dealer.active) Game.dealer.stop();
  Game.dealer.setParams(Game.dealCard, 150);
  Game.dealer.interval();
}

Game.dealer = new Timer();
Game.dealer.setLimiter(30);

Game.dealCard = function()
{
  Game.interactable = false;
  var card = Game.cards[Game.dealCaret];
  var slot = Game.standartSlots[Game.dealSlot];
  
  Game.container.appendChild(card.root);
  card.setPos(Game.flowerSlot.x, Game.flowerSlot.y - (Game.cards.length - Game.dealCaret));
  sfxDeal.play();
  ignoreLogger = true;
  // card.flip();
  // var tween = card.flipTo(slot.top ? slot.top : slot, 200);
  var tween = card.flyTo(slot.top ? slot.top : slot, 200);
  ignoreLogger = false;
  Game.dealCaret++;
  if (++Game.dealSlot === 8) Game.dealSlot = 0;
  if (Game.dealCaret === Game.cards.length)
  {
    Game.stack.root.remove();
    tween.onComplete.push(Game.start);
    return true;
  }
  else
  {
    Game.stack.setStackSize(Game.cards.length - Game.dealCaret);
    // tween.onComplete.push(Game.dealCard);
  }
  // sfxDeal.play();
}

Game.autofill = function()
{
  
  var interrupt = false;
  if (!Game.flowerSet && Game.flower.children === null)
  {
    var t = Game.flower.flyTo(Game.flowerSlot, 200);
    Game.flowerSet = true;
    // Game.flowerSlot.locked = true;
    Game.flower.locked = true;
    Game.interactable = false;
    t.onComplete.push(Game.autofill);
    interrupt = true;
    sfxSweep.play();
  }
  
  if (!interrupt && Game.cardsSet.bamboo < 9) interrupt = Game.checkCardStack(Game.bamboo, "bamboo");
  if (!interrupt && Game.cardsSet.coins < 9) interrupt = Game.checkCardStack(Game.coins, "coins");
  if (!interrupt && Game.cardsSet.chars < 9) interrupt = Game.checkCardStack(Game.chars, "char");
  
  // Dragon buttons
  if (!Game.dragonsSet.white) Game.checkDragonButton(Game.dragonButtons.white, Game.dragons.white);
  if (!Game.dragonsSet.green) Game.checkDragonButton(Game.dragonButtons.green, Game.dragons.green);
  if (!Game.dragonsSet.red) Game.checkDragonButton(Game.dragonButtons.red, Game.dragons.red);
  
  if (!interrupt) Game.checkVictory();
}

Game.checkCardStack = function(cards, name)
{
  // They are ordered 1,2,3,4,5,6,7,8,9
  
  var onHold = 0;
  for (var card of cards)
  {
    if (card.slot.isCardSlot)
    {
      onHold++; // We alraedy put it here.
      continue;
    }
    if (!card.children && card.id <= Game.cardsSet.min)
    {
      var slot = Game.findFreeSlot(Game.cardSlots, name);
      var t = card.flyTo(slot.top ? slot.top : slot, 200);
      t.onComplete.push(Game.autofill);
      onHold++;
      if (name === "char") name += "s"; /// HAAAAACKS
      Game.cardsSet[name] = onHold;
      Game.cardsSet.min = Math.max(2, Math.min(Game.cardsSet.bamboo, Game.cardsSet.coins, Game.cardsSet.chars) + 1);
      sfxSweep.play();
      return true;
    }
    break;
  }
  if (name === "char") name += "s";
  Game.cardsSet[name] = onHold;
  return false;
}

Game.checkDragonButton = function(btn, dragonList)
{
  var exposed = true;
  for (var d of dragonList)
  {
    if (d.children != null)
    {
      exposed = false;
      break;
    }
  }
  if (exposed && Game.findFreeSlot(Game.dragonSlots, btn.ofType)) btn.classList.add("enabled");
  else btn.classList.remove("enabled");
}

Game.findFreeSlot = function(slots, ignoreColor)
{
  for (var slot of slots)
  {
    // if (slot.locked) continue;
    if (slot.children === null || slot.children.color === ignoreColor) return slot;
  }
  return null;
}

Game.onDragonClick = function(e)
{
  var btn = e.currentTarget;
  var name = btn.ofType;
  if (!Game.dragonsSet[name] && btn.classList.contains("enabled"))
  {
    var slot = Game.findFreeSlot(Game.dragonSlots, name);
    if (slot == null) return; // Why it's even unlocked?
    
    var ignore = slot.children;
    
    var dragons = Game.dragons[name];
    // HAAACKS time
    var target = ignore ? ignore : slot;
    var t;
    var y = slot.y;
    Game.interactable = false;
    
    for (var dragon of dragons)
    {
      if (dragon !== ignore)
      {
        t = dragon.flipTo(target, 200);
        t.overrideTargetPosition(slot.x, y);
        t.flipSign = -1;
        target = dragon;
      }
      else dragon.flip();
      chainLog = true;
      y += stackOffset;
      dragon.locked = true;
    }
    Game.dragonsSet[name] = true;
    chainLog = false;
    // slot.locked = true;
    sfxSweep.play();
    btn.classList.remove("enabled");
    btn.classList.add("disabled");
    t.onComplete.push(Game.autofill);
  }
}

Game.onInstructionsClick = function()
{
  if (Game.instructions.classList.contains("shown"))
  {
    Game.instructions.classList.remove("shown");
    Game.newGameButton.classList.remove("disabled");
  }
  else
  {
    Game.instructions.classList.add("shown");
    Game.newGameButton.classList.add("disabled");
  }
}

Game.onSfxClick = function()
{
  Sfx.enabled = !Sfx.enabled;
  if (Sfx.enabled)
  {
    Game.sfxButton.classList.remove("off");
  }
  else
  {
    Game.sfxButton.classList.add("off");
  }
}

Game.onMusicClick = function()
{
  if (Sfx.toggleMusic())
  {
    Game.musicButton.classList.remove("off");
  }
  else
  {
    Game.musicButton.classList.add("off");
  }
}

Game.checkVictory = function()
{
  if (Game.dragonsSet.red && Game.dragonsSet.green && Game.dragonsSet.white && Game.flowerSet && Game.cardsSet.bamboo === 9 && Game.cardsSet.coins === 9 && Game.cardsSet.chars === 9)
  {
    Game.started = false;
    victories++;
    setCookie("victories", victories);
    
    Game.dealSlot = 0;
    if (Game.dealer.active) Game.dealer.stop();
    Game.dealer.setParams(Game.sendCard, 75);
    Game.dealer.interval();
    Game.sendCard();
    
    // Game.onVictoryFinish();
  }
}

Game.sendCard = function()
{
  
  var card = Game.slots[Game.dealSlot].top;
  
  if (card)
  {
    var t = new Tweener(card, card.slot, 1000, false);
    t.overrideTargetPosition(card.x, 1300);
    t.onComplete.push(card.__reset);
    card.children = null;
    if (card.parent.isSlot)
    {
      Game.slots[Game.dealSlot].top = null;
      if (Game.dealSlot === 6)
      {
        t.onComplete.push(Game.onVictoryFinish);
        return true;
      }
    }
    else Game.slots[Game.dealSlot].top = card.parent;
    sfxDeal.play();
  }
  
  if (++Game.dealSlot === 7) Game.dealSlot = 0;
  
  if (!card)
  {
    Game.sendCard();
  }
}

Game.onVictoryFinish = function()
{
  if (!Game.clumbTheMountain)
  {
    Game.clumbTheMountain = victories >= 1;
    if (Game.clumbTheMountain) document.body.addEventListener("Keyup", handleUndo);
  }
  if (!Game.metTheDragon) Game.metTheDragon = victories >= 10;
  if (!Game.becameImmortal)
  {
    Game.becameImmortal = victories >= 100;
    if (Game.becameImmortal) document.body.classList.add("dragon-mode");
  }
    // alert("Victory!");
}

Game.start = function()
{
  Game.interactable = true;
  for (var card of Game.cards) card.updateDragable();
  Game.autofill();
  Game.started = true;
}

document.addEventListener("DOMContentLoaded", function()
{
  Game.init();
});

window.addEventListener("load", function()
{
  document.body.classList.add('loaded');
  // document.getElementById("preloading").remove();
  Game.newGame();
});