
function loadAndParse(url, data, callback)
{
  var req = new XMLHttpRequest();
  req.open("GET", url);
  req.responseType = "document";
  req.onreadystatechange = async function()
  {
    if (req.readyState == req.DONE && req.status == 200)
    {
      var res = await parse(data, req.responseXML);
      callback(res);
    }
  }
  req.send();
}

function findExisting(items, title, content, link, date)
{
  var fitness;
  for (var item of items)
  {
    if (item.link === link) 
    {
      var state = item.state;
      if (item.title != title) { state = 0; item.title = title; }
      if (item.content != content) { state = 0; item.content = content; }
      if (item.date != date) { state = 0; item.date = date; }
      item.state = state;
      return item;
    }
  }
  return null;
}

function getTextContent(xml, name, def)
{
  var els = xml.querySelectorAll(name);
  if (els.length === 0) return def;
  for (var i = 0; i < els.length; i++)
  {
    if (els[i].parentElement === xml) return els[i].textContent;
  }
  return def;
}

function getHref(xml, name, def)
{
  var els = xml.querySelectorAll(name);
  if (els.length === 0) return def;
  for (var i = 0; i < els.length; i++)
  {
    if (els[i].parentElement === xml) return els[i].getAttribute("href");
  }
  return def;
}

/**
 * @param {Feed} data 
 * @param {Document} xml 
 * @param {Parser} parser 
 * @param {number} maxItems
 * @returns {Feed}
 */
async function processFeed(data, xml, parser, maxItems)
{
  var root = await parser.getRoot(xml);
  if (!data)
  {
    data = {
      type: "feed", feedType: await parser.type,
      title: await parser.getFeedTitle(root),
      link: await parser.getFeedURL(root),
      items: []
    };
  }
  else
  {
    data.link = await parser.getFeedURL(root, data.link);
    data.feedType = await parser.type;
  }
  
  //if (parser.isUpdated(data, root)) return data; 
  
  var items = await parser.getItems(root);
  var newItems = []; // TODO: Change current array, do not create new one.
  for (var i = 0; i < items.length; i++)
  {
    var info = await parser.getInfo(items[i]);
    var item = parser.findExisting(data.items, info);
    if (!item)
    {
      item = info;
      item.type = "rss";
      item.state = 0;
      item.read = false;
      item.feed = data.id;
    }
    else if (parser.wasChanged(item, info))
    {
      item.title = info.title;
      item.date = info.date;
      item.content = info.content;
      item.link = info.link;
      item.state = 0;
      item.read = false;
    }
    newItems.push(item);
    if (newItems.length == maxItems) break;
  }
  data.items = newItems;
  return data;
}

/**
 * @param {Feed} data
 * @param {Document} xml
 * @param {number} maxItems
 */
async function parse(data, xml, maxItems)
{
  var parser = await findParser(data, xml);
  data = await processFeed(data, xml, parser, maxItems);
  return data;
}