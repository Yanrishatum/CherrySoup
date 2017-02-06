// TODO: Several sounds at once?
function Sfx(src, volume)
{
  this.src = src;
  this.volume = volume ? volume : 1;
  this.cache = [this.create()];
}

Sfx.prototype.create = function()
{
  var a = document.createElement("audio");
  a.preload = "auto";
  a.volume = this.volume;
  a.src = this.src;
  return a;
}

Sfx.prototype.findFree = function()
{
  for (var a of this.cache)
  {
    if (a.paused) return a;
  }
  var a = this.create();
  this.cache.push(a);
  return a;
}

Sfx.prototype.play = function()
{
  if (!Sfx.enabled) return;
  var a = this.findFree();
  if (!a.paused) a.pause();
  a.currentTime = 0;
  a.play();
}

Sfx.enabled = true;

var sfxPickup = new Sfx("card_pickup.wav");
var sfxPlace = new Sfx("card_place.wav");
var sfxDeal = new Sfx("card_deal.wav", 0.2);
var sfxSweep = new Sfx("card_sweep.wav", 0.2);

Sfx.getMusicVolume = function()
{
  return Sfx.musicVolume;
}

Sfx.musicVolume = 1;
Sfx.setMusicVolume = function(volume)
{
  Sfx.musicVolume = volume;
  if (Sfx.music) Sfx.music.volume = volume;
  Game.volumeSlider.style.left = (volume * 101) + "px";
}

Sfx.toggleMusic = function()
{
  if (!Sfx.music)
  {
    var music = document.createElement("audio");
    music.src = "Solitaire.ogg";
    music.loop = true;
    music.volume = Sfx.musicVolume;
    Sfx.music = music;
    Sfx.musicEnabled = true;
  }
  else Sfx.musicEnabled = !Sfx.musicEnabled;
  
  if (Sfx.musicEnabled) Sfx.music.play();
  else Sfx.music.pause();
  
  return Sfx.musicEnabled;
}

Sfx.volumePressed = function(e)
{
  e.preventDefault();
  if (Sfx.adjustingVolume) return;
  
  if (e.touches) e = e.touches[0];
  Sfx.mx = e.clientX - (Sfx.musicVolume * 101);
  console.log(e);
  // console.log(e.clientX, Game.volumeSlider.style.left);
  Sfx.adjustingVolume = true;
  document.body.addEventListener("mousemove", Sfx.updateVolume);
  document.body.addEventListener("touchmove", Sfx.updateVolume);
  document.body.addEventListener("mouseup", Sfx.volumeReleased);
  document.body.addEventListener("touchend", Sfx.volumeReleased);
}

Sfx.updateVolume = function(e)
{
  e.preventDefault();
  if (!Sfx.adjustingVolume) return;
  if (e.touches) e = e.touches[0];
  var x = (e.clientX - Sfx.mx) / 101;
  // console.log(e.clientX, Sfx.mx);
  if (x < 0) x = 0;
  else if (x > 1) x = 1;
  Sfx.setMusicVolume(x);
}

Sfx.volumeReleased = function(e)
{
  Sfx.updateVolume(e);
  if (!Sfx.adjustingVolume) return;
  Sfx.adjustingVolume = false;
  document.body.removeEventListener("mousemove", Sfx.updateVolume);
  document.body.removeEventListener("touchmove", Sfx.updateVolume);
  document.body.removeEventListener("mouseup", Sfx.volumeReleased);
  document.body.removeEventListener("touchend", Sfx.volumeReleased);
}