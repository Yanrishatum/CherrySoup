// Not sure why that's here.
var toCopy = null;
document.addEventListener('copy', function(e) {
  if (toCopy)
  {
    e.clipboardData.setData('text/plain', toCopy);
    e.clipboardData.setData('text/html', toCopy);
    e.preventDefault();
  }
});

function localSet(name, data)
{
  localStorage.setItem(name, JSON.stringify(data));
}

function localGet(name, callback)
{
  var data = localStorage.getItem(name);
  if (data) callbakc(JSON.parse(data));
  else callback(null);
};

var storageSet;
var storageGet;
// Firefox
if (window.browser && browser.runtime && browser.runtime.id)
{
  storageSet = function (name, data)
  {
    var obj = {};
    obj[name] = data;
    browser.storage.sync.set(obj);
  };
  
  storageGet = function (name, callback)
  {
    browser.storage.sync.get(name).then(
      (data) => callback(data[name]),
       ()    => callback(null));
  };
}
// Chrome
else if (window.chrome && chrome.runtime && chrome.runtime.id)
{
  storageSet = function (name, data)
  {
    var obj = {};
    obj[name] = data;
    chrome.storage.sync.set(obj);
  };
  
  storageGet = function (name, callback)
  {
    chrome.storage.sync.get(name, (data) => callback(data[name]));
  };
}
// Regular browser page
else
{
  storageSet = function (name, data)
  {
    localStorage.setItem(name, JSON.stringify(data));
  };
  
  storageGet = function (name, callback)
  {
    var data = localStorage.getItem(name);
    if (data) callbakc(JSON.parse(data));
    else callback(null);
  };
}

var defaultMemes = ["https://i.imgur.com/V14f5b3.png", "https://i.imgur.com/pFh3N72.png"];
var memes = defaultMemes;
var moveMode = false;
var moving = null;
var bufferImages = false;
var imageCache;

function saveMemes()
{
  storageSet("memes", memes);
}

function loadMemes()
{
  storageGet("memes", (data) => 
  {
    memes = data || defaultMemes;
    invokeMemes();
  });
}

function invokeMemes()
{
  for (meme of memes) appendMeme(meme);
}

function addNewMemeKeyboard(ev)
{
  if (ev.key == "Enter")
  {
    addNewMeme();
  }
}

function addNewMeme()
{
  var input = document.getElementById("newMeme");
  var text = input.value;
  if (text && text.length > 1 && memes.indexOf(text) == -1)
  {
    // if (text.indexOf('"le_memes": [') == 0)
    // {
    //   memes = JSON.parse(text.substr(12));
    //   saveMemes();
    //   for (meme of memes) appendMeme(meme);
    // }
    // else
    // {
    memes.push(text);
    saveMemes();
    if (text.indexOf("http") == 0)
      cacheImg(text);
    appendMeme(text);
    // }
  }
  input.value = "";
}

function updateImageBuffer()
{
  bufferImages = document.getElementById("bufferImagesCheckbox").checked;
  if (!imageCache) return;
  if (bufferImages)
  {
    var imgs = [];
    for (var meme of memes)
    {
      if (meme.indexOf("http") == 0) imgs.push(meme);
    }
    imageCache.addAll(imgs);
  }
  else
  {
    caches.delete("memes-cache").then(() =>
    {
      caches.open("memes-cache").then((cache) => imageCache = cache);
    });
  }
  storageSet("image_buffer", bufferImages);
}

function cacheImg(url)
{
  if (imageCache && bufferImages)
  {
    imageCache.add(url);
  }
}

function exportMemes()
{
  var str = JSON.stringify(memes);
  
  var tf = document.getElementById("exportImportText");
  tf.value = str;
  tf.select();
  // document.execCommand("copy");
}

function importMemes()
{
  var tf = document.getElementById("exportImportText");
  var res = JSON.parse(tf.value);
  if (res && Array.isArray(res) && (memes.length == 0 || confirm("Overwrite meme database?")))
  {
    
    memes = res;
    saveMemes();
    var base = document.getElementById("memeList");
    while (base.children.length) base.children[0].remove();
    base = document.getElementById("imageList");
    while (base.children.length) base.children[0].remove();
    for (meme of memes) appendMeme(meme);
  }
}

function copyMeme(ev)
{
  if (ev.ctrlKey)
  {
    var memeIdx = memes.indexOf(ev.currentTarget.getAttribute("meme"));
    if (memeIdx != -1)
    {
      memes.splice(memeIdx, 1);
      saveMemes();
      ev.currentTarget.remove();
    }
    return;
  }
  if (moveMode)
  {
    var me = ev.currentTarget;
    var swapTo = me.classList.contains("left") ? me.previousElementSibling : me.nextElementSibling;
    if (swapTo)
    {
      // Fail-proof? Nah.
      var theirIdx = memes.indexOf(swapTo.getAttribute("meme"));
      var myIdx = memes.indexOf(me.getAttribute("meme"));
      // Swap in-memory
      var tmp = memes[theirIdx];
      memes[theirIdx] = memes[myIdx];
      memes[myIdx] = tmp;
      saveMemes();
      
      if (me.nextElementSibling == swapTo)
      {
        me.parentNode.insertBefore(swapTo, me);
      }
      else if (swapTo.nextElementSibling == me)
      {
        swapTo.parentNode.insertBefore(me, swapTo);
      }
      else
      {
        tmp = me.nextElementSibling;
        swapTo.parentNode.insertBefore(me, swapTo);
        if (tmp) me.parentNode.insertBefore(swapTo, tmp);
        else me.parentNode.appendChild(swapTo);
      }
      
      return;
    }
  }
  var tf = document.getElementById("copyMeme");
  tf.value = ev.currentTarget.getAttribute("meme");
  tf.select();
  document.execCommand("copy");
}

function appendMeme(meme)
{
  var el = document.createElement("div");
  var container;
  if (meme.indexOf("http") == 0)
  {
    // Probably image meme
    var img = new Image();
    img.src = meme;
    img.alt = meme;
    el.appendChild(img);
    container = "imageList";
  }
  else
  {
    el.textContent = meme;
    container = "memeList";
  }
  el.setAttribute("meme", meme);
  el.classList.add("meme");
  el.addEventListener("click", copyMeme);
  el.addEventListener("mousemove", moveModeHandler);
  el.addEventListener("mouseenter", moveModeHandler);
  el.addEventListener("mouseleave", moveModeHandler);
  document.getElementById(container).appendChild(el);
}

function moveModeHandler(e)
{
  if (e.type == "mouseleave")
  {
    e.currentTarget.classList.value = "meme";
    return;
  }
  var meme = e.currentTarget;
  if (moveMode)
  {
    // console.log(e.clientX, meme.offsetWidth
    if (e.clientX < meme.offsetLeft + meme.offsetWidth / 2) meme.classList.value = "meme left";
    else meme.classList.value = "meme right";
  }
  else
  {
    if (meme.classList.value != "meme")
    {
      meme.classList.value = "meme";
    }
  }
}

/**
  * @param e {KeyboardEvent}
  */
function keyboardHandler(e)
{
  if (e.key == "Control")
  {
    var l = document.body;
    if (e.type == "keyup")
    {
      if (l.classList.contains("delete-mode")) l.classList.remove("delete-mode");
    }
    else if (!l.classList.contains("delete-mode")) l.classList.add("delete-mode");
  }
  else if (e.key == "Shift")
  {
    var l = document.body;
    if (e.type == "keyup")
    {
      if (l.classList.contains("move-mode")) l.classList.remove("move-mode");
      moveMode = false;
    }
    else
    {
      if (!l.classList.contains("move-mode")) l.classList.add("move-mode");
      moveMode = true;
    }
  }
}

function toggleOptions(e)
{
  document.querySelector(".options-container").classList.toggle("shown");
}

document.addEventListener("keyup", keyboardHandler);
document.addEventListener("keydown", keyboardHandler);

document.addEventListener("DOMContentLoaded", function()
{
  storageGet("image_buffer", function (v)
  {
    bufferImages = !!v;
    function nextChain(cache)
    {
      if (cache && cache.name == "SecurityError")
      {
        cache = null; // thanks FF.
      }
      imageCache = cache;
      document.getElementById("bufferImagesCheckbox").checked = bufferImages;
      loadMemes();
    }
    caches.open("memes-cache").then(nextChain, nextChain);
  } );
  // I can only wish
  /* inline */function listen(id, ev, callback)
  {
    document.getElementById(id).addEventListener(ev, callback);
  }
  listen("addMeme", "click", addNewMeme);
  listen("newMeme", "keyup", addNewMemeKeyboard);
  listen("exportMemes", "click", exportMemes);
  listen("importMemes", "click", importMemes);
  listen("closeButton", "click", toggleOptions);
  listen("showOptions", "click", toggleOptions);
  listen("bufferImagesCheckbox", "change", updateImageBuffer);
});