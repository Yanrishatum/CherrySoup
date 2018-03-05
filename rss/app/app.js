function openApp()
{
  API.createTab(API.getURL("index.html"), true, true);
}

function callSave()
{
  // API.sendMessage({ type: "save" });
  API.sendMessage({ type: "update_button" });
}

function openSettings()
{
  API.openSettings();
}

function reloadAll()
{
  API.sendMessage({ type:"reload_all" });
}

function reloadGroup()
{
  API.sendMessage({ type: "reload", id: this.id });
}

function openURL(url)
{
  API.createTab(url, false, false);
}

function idToItem(id)
{
  return rss.index[id];
}

function findPath(from, to, out)
{
  var items;
  if (Array.isArray(from)) items = from;
  else items = from.items;
  if (!items) return false;
  for (var item of items)
  {
    out.push(item);
    if (item == to) return true;
    if (findPath(item, to, out)) return true;
    else out.pop();
  }
  return false;
}

function getItemContent()
{
  var c = this.content;
  var idx = 0, idx2 = 0, check, check2;
  while ((idx = c.indexOf("<video", idx2)) != -1)
  {
    idx2 = c.indexOf(">", idx);
    if (idx2 == -1) break; // wat
    check = c.indexOf("controls", idx);
    check2 = c.indexOf("loop");
    var add = null;
    if (check == -1 || check > idx2)
    {
      if (check2 == -1 || check2 > idx2) add = " controls loop ";
      else add = " controls ";
    }
    else if (check2 == -1 || check2 > idx2) add = " loop ";
    c = c.substr(0, idx2) + add + c.substr(idx2);
  }
  return c;
}

// General
var showSettings = false;
function toggleSettings()
{
  if (showSettings == this.id) showSettings = false;
  else showSettings = this.id;
}

function shouldShowSettings()
{
  return (this.id == showSettings)
}

function setSortMethod(val)
{
  if (arguments.length == 0) return this.sortCriteria;
  else
  {
  console.log(val);
    this.sortCriteria = val;
  }
}

var openIds = [];
function toggleDisplay(e)
{
  showSettings = false;
  if (openIds[openIds.length-1] == this.id)
  {
    openIds.pop();
    return;
  }
  var oldIds = openIds.concat();
  var mark = [];
  
  while (openIds.length)
  {
    var id = openIds.pop();
    if (id == this.id)
    {
      break;
    }
    mark.push(id);
  }
  
  var base = rss.tree;
  if (openIds.length) base = idToItem(openIds[openIds.length-1]);
  var items = [];
  findPath(base, this, items);
  
  for (var item of items)
  {
    openIds.push(item.id);
    updateBinds(item);
  }
  for (var id of mark) updateBinds(idToItem(id));
  
  // TODO: Mark state to 1 if 0
  if (this.type == "feed")
  {
    e.currentTarget.scrollIntoView({ hevaior: "smooth", block:"start"});
    requestAnimationFrame(markCurrentSeen.bind(this));
  }
}

function markCurrentSeen()
{
  markState(this, 1, true);
  callSave();
}

function shouldShow()
{
  return openIds.indexOf(this.id) != -1;
}

function findTemplate(name)
{
  var node = document.getElementById("template_" + name);
  if (!node) console.warn("Template " + name + " not found!");
  return document.importNode(node.content, true).firstElementChild;
}

function showItem()
{
  this.read = false;
}

function hideItem()
{
  this.read = true;
  this.state = 2;
  updateWithParents(idToItem(this.feed));
  callSave();
}

function markSeen(e)
{
  markState(this, 1);
  callSave();
}

function markRead(e)
{
  markState(this, 2);
  if (this.type == "feed" && openIds[openIds.length - 1] == this.id) toggleDisplay.call(this);
  callSave();
}

function markState(t, state, supressUpdate)
{
  if (t.type == "rss")
  {
    if (t.state > state) return;
    t.read = state == 2;
    t.state = state;
  }
  else
  {
    for (var item of t.items) markState(item, state, true);
  }
  if (!supressUpdate)
    for (var id of openIds)
    {
      if (id == t.id) break;
      updateBinds(idToItem(id), true);
    }
}

function feedHome(e)
{
  var t = this;
  if (t.link) openURL(t.link);
  else if (t.url) openURL(t.url);
}

function open(e)
{
  var t = this;
  markRead.call(t, e);
  openURL(t.link);
}

function reload(e)
{
  var t = this;
  if (t.type == "feed") API.sendMessage({ type: "reload", id: t.id });
}

function invalidateFeed(e)
{
  var t = this;
  if (t.type == "feed") API.sendMessage({ type: "invalidate", id: t.id });
}

function cancelEvent(e)
{
  e.stopPropagation();
}

// error = italic
// new = red text
// seen = bold
var stateClass = [
  [],
  ["red", "text", "bold"],            // 0001 | 01 |                 New
  ["bold"],                           // 0010 | 02 |            Seen
  ["red", "text", "bold"],            // 0011 | 03 |            Seen New
  [],                                 // 0100 | 04 |       Read
  ["red", "text", "bold"],            // 0101 | 05 |       Read      New
  ["bold"],                           // 0110 | 06 |       Read Seen
  ["red", "text", "bold"],            // 0111 | 07 |       Read Seen New
  ["italic"],                         // 1000 | 08 | Error
  ["italic", "red", "text", "bold"],  // 1001 | 09 | Error           New
  ["italic", "bold"],                 // 1010 | 10 | Error      Seen
  ["italic", "red", "text", "bold"],  // 1011 | 11 | Error      Seen New
  ["italic"],                         // 1100 | 12 | Error Read
  ["italic", "red", "text", "bold"],  // 1101 | 13 | Error Read      New
  ["italic", "bold"],                 // 1110 | 14 | Error Read Seen
  ["italic", "red", "text", "bold"],  // 1111 | 15 | Error Read Seen New
];
function stateToClass(state)
{
  return stateClass[state];
}

function showContent()
{
  // console.log(this);
  if (this.feed)
  {
    var feed = idToItem(this.feed);
    if (feed) return feed.showDesc === true || feed.showDesc === undefined;
  }
  return false;
}

function getStatus(item)
{
  if (item.type == "rss") return item.state == 0 ? 1 : (item.state == 1 ? 2 : 4); // New/Seen/Read
  if (item.type == "feed")
  {
    var state = 0;
    for (var i of item.items)
    {
      state |= (i.state == 0 ? 1 : (i.state == 1 ? 2 : 4));
    }
    return state | (item.error ? 8 : 0);
  }
  // folder
  var state = 0;
  for (var i of item.items)
  {
    state |= getStatus(i);
  }
  return state;
}

function _getCounts(item)
{
  var cnew = 0;
  var seen = 0;
  var err = 0;
  if (item.type == "folder")
  {
    for (var i of item.items)
    {
      var arr = _getCounts(i);
      cnew += arr[0];
      seen += arr[1];
      err += arr[2];
    }
  }
  else
  {
    for (var i of item.items)
    {
      if (i.state == 0) cnew++;
      else if (i.state == 1) seen++;
    }
    if (item.error) err++;
  }
  return [cnew, seen, err];
}

function getCounts(v)
{
  var retval = "";
  var err = 0;
  if (this.type == "folder")
  {
    var cnt = _getCounts(this);
    err = cnt[2];
    var cnew = cnt[0], seen = cnt[1];
    if (seen == 0) { if (cnew > 0) retval += ` (${cnew}`; }
    else if (cnew == 0) retval += ` (${seen}`;
    else retval += ` (${cnew}/${seen}`;
  }
  else
  {
    var cnew = 0;
    var seen = 0;
    for (var i of this.items)
    {
      if (i.state == 0) cnew++;
      else if (i.state == 1) seen++;
    }
    if (seen == 0) { if (cnew > 0) retval += ` (${cnew}`; }
    else if (cnew == 0) retval += ` (${seen}`;
    else retval += ` (${cnew}/${seen}`;
    // err = this.error;
  }
  if (retval)
  {
    if (err) retval += "/err:" + err + ")";
    else retval += ")";
  }
  else if (err) retval = " (err:" + err + ")";
  return retval;
}

function getFeedIcon()
{
  //this.icon != null ? this.icon : 
  // console.log(this.icon, "https://www.google.com/s2/favicons?domain=" + this.url.split("/")[2]);
  return this.icon ? this.icon : ("https://www.google.com/s2/favicons?domain=" + this.url.split("/")[2]);
}

function getFolderStatus(v)
{
  // var s = getStatus(this);
  return stateToClass(getStatus(this));
}

function getFeedStatus(v)
{
  return stateToClass(getStatus(this));
  /*
  var t = this;
  var cl = [];
  if (t.error) cl.push("error");
  
  var hasNew = false;
  var hasSeen = false;
  for (var i of t.items)
  {
    if (!hasNew && i.state == 0)
    {
      hasNew = true;
      break;
    }
    if (!hasSeen && i.state == 1)
    {
      hasSeen = true;
    }
  }
  if (hasNew) cl.push("new");
  if (hasSeen) cl.push("seen");
  return cl;
  */
}

function getRSSStatus(v)
{
  return this.state === 0 ? stateClass[1] : (this.state === 1 ? stateClass[2] : undefined);
}

function sortByTotal(a, b)
{
  var ac = _getCounts(a);
  ac = ac[0] + ac[1];
  var bc = _getCounts(b);
  bc = bc[0] + bc[1];
  return ac > bc ? -1 : (ac < bc ? 1 : 0);
}

function sortByNew(a, b)
{
  var ac = _getCounts(a)[0];
  var bc = _getCounts(b)[0];
  return ac > bc ? -1 : (ac < bc ? 1 : 0);
}

function setTag(v)
{
  if (arguments.length == 0) return this.tag || "TTL";
  this.tag = v;
}

function getTagList()
{
  return tagList;
}

function updateWithParents(item)
{
  while (item)
  {
    updateBinds(item, true);
    item = idToItem(item.parent);
  }
}

API.onMessage(function(message, port) {
  if (message.type == "update")
  {
    if (!rss) return; // We wait for RSS to get here.
    if (message.id !== undefined)
    {
      updateWithParents(idToItem(message.id));
    }
    if (message.count !== undefined)
    {
      if (message.count == 0) setStatus("");
      else setStatus("Updating feeds: " + message.count);
    }
  }
});

function setStatus(text)
{
  statusEl.textContent = text;
}
var statusEl = document.getElementById("status");

var settingsView;
var mainView;
var rss;
var tagList = [];
API.getBackgroundPage(function (bg)
{
  rss = bg.rss;
  if (bg.tags)
  {
    for (var tag of bg.tags)
    {
      tagList.push({ value: tag.name, text: `${tag.name} (${tag.rate}m)` });
    }
  }
  console.log(rss);
  if (rss && rss.tree)
  {
    settingsView = bindTemplate(document.getElementById("settings_panel"), {});
    mainView = bindTemplate(document.getElementById("main_feed"), { items: rss.tree });
    // mainView = rivets.bind(document.getElementById("main_feed"), { items: rss.tree });
  }
});

API.storage.getLocal("rss", function(rss) {
});

function retargetAnchorClicks(ev)
{
  // console.log(ev.target, ev.button);
  if ((ev.button === 0 || ev.button === 1))
  {
    var t = ev.target;
    var d = 4;
    while (t && d-- > 0)
    {
      if (t.tagName === "A" && t.href)
      {
        openURL(t.href);
        ev.stopPropagation();
        ev.preventDefault();
        return;
      }
      t = t.parentElement;
    }
  }
}

function updateScrollMenu(ev)
{
  ev.target.querySelector(".menu").style.top = ev.target.scrollTop + "px";
  return false;
}

document.addEventListener("click", retargetAnchorClicks, true);
document.addEventListener("auxclick", retargetAnchorClicks, true);

// loadAndParse("atom.xml", null, function(data) {
//    mainView = rivets.bind(document.getElementById("main_feed"), { items: [data, folder] });
// });
// loadAndParse("atom.xml");

