function binded(thisObj, fnName, ...args)
{
  var bName = "__" + fnName;
  return thisObj[bName] || (thisObj[bName] = thisObj[fnName].bind(thisObj, ...args));
}

function pointInRect(px, py, rx, ry, rw, rh)
{
  return (px >= rx && px < rx + rw && py >= ry && py < ry + rh);
}

var cardOffset = 35;
var stackOffset = -2;

/**
 * Shuffles array in place.
 * @param {Array} a items The array containing the items.
 */
function shuffle(a)
{
  var j, x, i;
  for (i = a.length; i; i--)
  {
    j = Math.floor(Math.random() * i);
    x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
}

function getCookie(name, def)
{
  var cooks = document.cookie.split(";");
  for (var cook of cooks)
  {
    var idx = cook.indexOf(name + "=");
    if (idx != -1) return cook.substr(idx + name.length + 1);
  }
  return def;
}

function setCookie(name, value)
{
  var d = new Date();
  d.setTime(d.getTime() + 1000*60*60*24*365*2);
  document.cookie = name + "=" + value + ";expires=" + d.toUTCString();
}