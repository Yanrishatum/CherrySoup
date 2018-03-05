// TODO: Figure out how to do it event-page. Not now, now it's way too complicated to do.

/**
 * @typedef {{ id:string, type:string, title:string, date:string, content:string, link:string, state:number, read:bool }} FeedItem
 * @typedef {{ id:string, items:FeedItem[], type:string, title:string, url:string, link:string, parserType:string }} Feed
 */

function saveState()
{
  console.info("Saving to local storage...");
  chrome.storage.local.set({ rss:rss });
}

var rss;
var tags;
var updateQueue = [];
var updateCurrent = [];

var iconBusy = false;
// TODO: Move to settings
var updateLimit = 4;
var maxPerFeed = 30;

// Find RSS bookmarks root by string path.
function findBookmarkNode(path, callback)
{
  // TODO: Just remember ID
  var split = path.replace("\\", "/").split("/");
  if (split[0] == "") split.shift();
  if (split[split.length-1] == "") split.pop();
  chrome.bookmarks.getTree(function(tree)
  {
    tree = tree[0];
    var i, found;
    while (split.length)
    {
      found = false;
      for (i = 0; i < tree.children.length; i++)
      {
        if (tree.children[i].title == split[0])
        {
          split.shift();
          tree = tree.children[i];
          found = true;
          break;
        }
      }
      if (!found)
      {
        callback(null);
        return;
      }
    }
    callback(tree);
  });
}

// Traverses bookmark node list to create new index.
function traverse(node, index, newIndex)
{
  var item = index[node.id];
  if (node.children)
  {
    // Is folder
    if (item)
    {
      item.title = node.title;
      item.id = node.id;
    }
    else
    {
      item = {
        type: "folder",
        title: node.title,
        id: node.id,
        items: null
      };
    }
    item.items = [];
    for (var child of node.children)
    {
      item.items.push(traverse(child, index, newIndex));
    }
  }
  else
  {
    if (item)
    {
      item.title = node.title;
      item.url = node.url;
      item.id = node.id;
    }
    else
    {
      item = {
        type: "feed",
        title: node.title,
        url: node.url,
        customRate: 0,
        id: node.id,
        showDesc: true,
        items: []
      };
      updateFeed(item);
    }
  }
  item.id = node.id;
  item.parent = node.parentId;
  newIndex[node.id] = item;
  return item;
}

// Rebuilds index and tree according to bookmarks.
function buildRSSList()
{
  chrome.storage.sync.get("settings", function(sett)
  {
    findBookmarkNode(sett.settings.path, function(tree)
    {
      // TODO: Just listen events and not rebuild from scratch every time
      if (!tree) return;
      if (!rss) rss = { tree:[], index:{} };
      else rss.tree.splice(0, rss.tree.length);
      var newIndex = {};
      for (var child of tree.children) rss.tree.push(traverse(child, rss.index, newIndex));
      rss.index = newIndex;
    });
  });
}

// Updating action button

function updateButton()
{
  var cnew = 0;
  var error = 0;
  for (var k in rss.index)
  {
    var o = rss.index[k];
    if (o.type == "feed")
    {
      if (o.error) error++;
      for (var i of o.items)
      {
        if (i.state == 0)
        {
          cnew++; break;
        }
      }
    }
  }
  chrome.browserAction.setBadgeBackgroundColor({ color: (error === 0 ? "#f00" : "#fd7f00") });
  chrome.browserAction.setBadgeText({ text: cnew === 0 ? "" : cnew.toString() });
}

// Updating

async function nextInQueue(ev)
{
  /** @type {XMLHttpRequest} */
  var req = ev.currentTarget;
  var item = req.userData;
  if (req.readyState == req.DONE)
  {
    if (req.status == 200)
    {
      if (req.response == null) // Is not an XML
      {
        var req = new XMLHttpRequest();
        req.responseType = "text";
        req.addEventListener("readystatechange", nextInQueue);
        req.userData = item;
        req.open("GET", item.url);
        req.send();
        return;
      }
      
      try
      {
        await parse(item, req.response, maxPerFeed);
        item.error = null;
      }
      catch (e)
      {
        item.error = e.toString();
        console.log("Encountered error during parsing: ", e);
      }
    }
    else
    {
      item.error = "Error with Http status: " + req.status;
      console.warn("Error on loading RSS feed: " + req.status);
    }
    var data = { type: "update", id: item.id };
    updateCurrent.splice(updateCurrent.indexOf(item), 1);
    if (updateQueue.length && updateCurrent.length < updateLimit)
    {
      item = updateQueue.shift();
      updateFeed(item, true);
    }
    data.count = updateQueue.length + updateCurrent.length;
    sendMessage(data);
    updateButton();
    if (updateCurrent.length == 0) saveState();
  }
}

function updateFeed(item, force, supressMessage)
{
  if (!force) console.log("Scheduled update: " + item.title, item.id, item.url);
  if (!item.url)
  {
    if (!force && item.items) for (var child of item.items) updateFeed(child, false, supressMessage);
    if (!supressMessage)
      sendMessage({ type: "update", count: updateQueue.length + updateCurrent.length });
    return;
  }
  if (!force && updateCurrent.length >= updateLimit)
  {
    if (updateQueue.indexOf(item) == -1 && updateCurrent.indexOf(item) == -1) updateQueue.push(item);
    if (!supressMessage)
      sendMessage({ type: "update", count: updateQueue.length + updateCurrent.length });
    return;
  }
  
  updateCurrent.push(item);
  var req = new XMLHttpRequest();
  req.responseType = "document";
  req.addEventListener("readystatechange", nextInQueue);
  req.userData = item;
  req.open("GET", item.url);
  req.send();
}

function ttlUpdate(items, tag, defaultTag)
{
  if (!defaultTag) defaultTag = "TTL";
  for (var item of items)
  {
    if (item.url)
    {
      if (tag == null || (item.tag != null ? item.tag == tag : defaultTag == tag))
        updateFeed(item);
    }
    else if (item.type == "folder") ttlUpdate(item.items, tag, item.tag || defaultTag);
  }
}

function ensureAlarm(name, rate, defRate)
{
  chrome.alarms.get(name, function(a) {
    if (!a || a.periodInMinutes != rate)
    {
      chrome.alarms.create(name, { delayInMinutes: defRate ? defRate : 1, periodInMinutes: rate });
    }
  });
}
/*
chrome.runtime.onInstalled.addListener(function(details)
{
  chrome.storage.sync.get("settings", function(data) {
    if (!data.settings)
    {
      chrome.storage.sync.set({"settings": { path:"Other bookmarks/RSS", rate: 15 } }, buildRSSList);
      buildRSSList();
      ensureAlarm("TTL", 15);
    }
  });
});
*/
chrome.alarms.onAlarm.addListener(function(alarm)
{
  ttlUpdate(rss.tree, alarm.name);
});

var stateDirty = false;
function handleMessage(message)
{
  if (message.type == "reload")
  {
    var item = rss.index[message.id];
    if (item) updateFeed(item);
  }
  else if (message.type == "reload_all")
  {
    ttlUpdate(rss.tree);
  }
  else if (message.type == "rebuild")
  {
    ensureAlarm("TTL", message.data.rate, message.data.rate);
    if (message.tags)
    {
      for (var tag of message.tags)
      {
        ensureAlarm(tag.name, tag.rate, tag.rate);
      }
      tags = message.tags;
    }
    if (message.matchers)
    {
      cleanupRegParsers();
      for (var matcher of message.matchers)
      {
        addParser(new GraphParser(matcher, message["_" + matcher]));
        // else addParser(new RegexParser(matcher.name, matcher));
      }
    }
    buildRSSList();
  }
  else if (message.type == "invalidate")
  {
    var item = rss.index[message.id];
    item.parserType = null;
    item.items = [];
    updateFeed(item);
  }
  else if (message.type == "update_button")
  {
    updateButton();
    stateDirty = true;
  }
  else if (message.type == "save")
  {
    saveState();
    updateButton();
    stateDirty = false;
  }
}

var ports = [];
function sendMessage(msg)
{
  for (var port of ports) port.postMessage(msg);
}

chrome.runtime.onConnect.addListener(function (port)
{
  port.onDisconnect.addListener(function ()
  {
    // if (stateDirty)
    // {
    saveState();
    updateButton();
    //   stateDirty = false;
    // }
    ports.splice(ports.indexOf(port));
  });
  port.onMessage.addListener(handleMessage);
  ports.push(port);
});
chrome.runtime.onMessage.addListener(handleMessage);

chrome.storage.sync.get(function(data){
  if (!data.settings) 
  {
    data.settings = { path:"Other bookrmarks/RSS", rate: 15 };
    chrome.storage.sync.set({ "settings":data.settings });
  }
  if (data.matchers)
  {
    for (var matcher of data.matchers)
    {
      addParser(new GraphParser(matcher, data["_" + matcher]));
      // addParser(new RegexParser(matcher.name, matcher));
    }
  }
  if (data.tags)
  {
    for (var tag of data.tags)
    {
      ensureAlarm(tag.name, tag.rate, tag.rate);
    }
    tags = data.tags;
  }
  
  ensureAlarm("TTL", data.settings.rate, data.settings.rate);
  chrome.storage.local.get("rss", function(data) {
    if (data.rss) rss = data.rss;
    buildRSSList();
    // ttlUpdate(rss.tree);
    updateButton();
  });
});
