// Base template for parsers
class Parser
{
  constructor(type)
  {
    this.type = type;
  }
  
  /**
   * 
   * @param {HTMLElement} xml 
   * @param {string} url
   * @returns {boolean}
   */
  async isCompatible(xml)
  {
    return false;
  }
  
  /**
   * @param {HTMLElement} xml
   * @returns {HTMLElement}
   */
  async getRoot(xml)
  {
    return null;
  }
  
  /**
   * @param {HTMLElement} root
   * @returns {string}
   */
  async getFeedTitle(root)
  {
    return "";
  }
  
  /**
   * @param {HTMLElement} root
   * @param {string} def
   * @returns {string}
   */
  async getFeedURL(root, def)
  {
    return def;
  }
  
  /**
   * @param {HTMLElement} root
   * @returns {HTMLElement[]}
   */
  async getItems(root)
  {
    return [];
  }
  
  /**
   * @param {HTMLElement} item
   * @returns {{ title:string, content:string, link:string, date:string }}
   */
  async getInfo(item)
  {
    return { title: "", link: "", date: "", content: "" };
  }
  
  // Pretty common
  /**
   * 
   * @param {FeedItem[]} list 
   * @param {{ link:string }} info 
   */
  findExisting(list, info)
  {
    for (var item of list)
    {
      if (item.link === info.link) return item;
    }
    return null;
  }
  
  /**
   * @param {FeedItem} item 
   * @param {{ date:string }} info
   * @returns {boolean}
   */
  wasChanged(item, info)
  {
    return (item.date != info.date);
  }
}

// RSS 2.0 spec
class RSSParser extends Parser
{
  constructor()
  {
    super("rss");
  }
  
  async isCompatible(xml, url)
  {
    return !!xml.querySelector("rss channel");
  }
  
  async getRoot(xml)
  {
    return xml.querySelector("rss channel");
  }
  
  async getFeedTitle(root)
  {
    return getTextContent(root, "title", "No title");
  }
  
  async getFeedURL(root, def)
  {
    return getTextContent(root, "link", def);
  }
  
  async getItems(root)
  {
    return root.querySelectorAll("item");
  }
  
  async getInfo(item)
  {
    return {
      title: getTextContent(item, "title", "[Untitled]"),
      content: getTextContent(item, "description", ""),
      link: getTextContent(item, "link", getTextContent(item, "guid", "No link?")),
      date: getTextContent(item, "pubDate", "???")
    };
  }
}

// Atom spec
class AtomParser extends Parser
{
  constructor()
  {
    super("atom");
  }
  
  async isCompatible(xml, url)
  {
    return !!xml.querySelector("feed");
  }
  
  async getRoot(xml)
  {
    return xml.querySelector("feed");
  }
  
  async getFeedTitle(root)
  {
    return getTextContent(root, "title", "Unknown title")
  }
  
  async getFeedURL(root, def)
  {
    var link = getHref(root, "link[rel='alternate']");
    if (!link) link = getHref(root, "link:not([rel])");
    if (!link) link = getHref(root, "link[rel='self']");
    if (!link) link = getTextContent(root, "id", def);
    return link;
  }
  
  async getItems(root)
  {
    return root.querySelectorAll("entry");
  }
  
  async getInfo(item)
  {
    var content = getTextContent(item, "content", getTextContent(item, "summary", ""));
    var id = getTextContent(item, "id");
    var lnk = getHref(item, "link[rel='alternate']");
    if (!lnk) lnk = getHref(item, "link:not([rel])");
    if (!lnk) lnk = id || content; // Not really follows standart, but okay.
    if (!lnk) throw "An atom:entry must have at least one atom:link element with a rel attribute of 'alternate' or an atom:content.";
    
    return {
      title: getTextContent(item, "title", "NO title"),
      date: getTextContent(item, "updated", "Unknown date"),
      content: content,
      link: lnk
    };
  }
  
}

/**
 * @typedef {{ type:string, reg:RegExp, query:string }} Matcher
 */

class RegexParser extends Parser
{
  constructor(name, matchers)
  {
    super("regex_" + name);
    this.matchers = matchers;
  }
  
  doQuery(item, query, standart, def)
  {
    var query = query.split("@@");
    var res = item.querySelector(query.shift());
    if (!res) return def;
    if (query.length > 0)
    {
      var retVal;
      var inp = query.shift();
      retVal = res[inp] || res.getAttribute(inp);
      while (query.length > 0)
      {
        inp = query.shift();
        var control = inp.charAt(0);
        inp = inp.substr(1);
        if (control == "!")
        {
          retVal = inp.replace("$0", retVal);
        }
      }
      return retVal;
    }
    return res[standart] || res.getAttribute(standart);
  }
  
  /**
   * 
   * @param {string} name 
   * @param {any} defVal 
   * @param {Document} xml 
   * @param {Feed} data 
   */
  callMatcher(name, defVal, xml, data)
  {
    /** @type {Matcher} */
    var matcher = this.matchers[name];
    if (matcher)
    {
      switch (matcher.type)
      {
        case "location":
          var reg = new RegExp(matcher.reg, "i");
          return reg.test(data);
          break;
        case "query":
          var res = xml.querySelector(matcher.query);
          if (res) return res;
          break;
        case "queryAll":
          var res = xml.querySelectorAll(matcher.query);
          // console.log(xml, res);
          if (res) return res;
          break;
        case "text":
          return this.doQuery(xml, matcher.query, "textContent", defVal);
        case "html":
          return this.doQuery(xml, matcher.query, "innerHTML", defVal); 
          var res = xml.querySelector(matcher.query);
          // console.log(res, res ? res.innerHTML : "NULL");
          if (res) return res.cloneNode(true).innerHTML;
          break;
        case "href":
          return this.doQuery(xml, matcher.query, "href", defVal);
          var res = xml.querySelector(matcher.query);
          if (res) return res.href || res.getAttribute("href");
          break;
      }
    }
    return defVal;
  }
  
  async isCompatible(xml, url)
  {
    return this.callMatcher("isCompatible", false, xml, url);
  }
  
  async getRoot(xml)
  {
    return this.callMatcher("getRoot", xml, xml);
  }
  
  async getFeedTitle(root)
  {
    return this.callMatcher("getFeedTitle", "[RegexParser:Untitled]", root);
  }
  
  async getFeedURL(root, def)
  {
    return this.callMatcher("getFeedURL", def, root);
  }
  
  async getItems(root)
  {
    return this.callMatcher("getItems", [], root);
  }
  
  async getInfo(item)
  {
    return {
      title: this.callMatcher("getItemTitle", "[RegexPareser:Untitled]", item),
      date: this.callMatcher("getItemDate", "[RegexParser:NoDate]", item),
      content: this.callMatcher("getItemContent", "", item),
      link: this.callMatcher("getItemLink", "[RegexParser:NoLink]", item)
    };
  }
  
  // wasChanged(o, n) { return true; }
  
}

var graphEngine;
class GraphParser extends Parser
{
  
  constructor(name, graphs)
  {
    super("graph_" + name);
    this.graphs = graphs;
    this.values = {};
    if (!graphEngine) graphEngine = initNodeEngine();
  }
  
  async isCompatible(xml, url)
  {
    this.values.xml = xml;
    this.values.defURL = url;
    await this.callGraph("isCompatible");
    var res = this.values.compatible || false;
    this.values.xml = null;
    this.values.defURL = null;
    this.values.isCompatible = null;
    return res;
  }
  
  async getRoot(xml)
  {
    this.values.xml = xml;
    await this.callGraph("getRoot");
    var res = this.values.root;
    this.values.xml = null;
    this.values.root = null;
    return res;
  }
  
  async getFeedTitle(root)
  {
    this.values.root = root;
    await this.callGraph("getFeedTitle");
    var res = this.values.title || "[GraphParser:NoFeedTitle]";
    this.values.title = null;
    this.values.root = null;
    return res;
  }
  
  async getFeedURL(root, def)
  {
    this.values.root = root;
    this.values.defURL = def;
    await this.callGraph("getFeedURL");
    var res = this.values.url || def;
    this.values.defURL = null;
    this.values.url = null;
    this.values.root = null;
    return res;
  }
  
  async getItems(root)
  {
    this.values.root = root;
    await this.callGraph("getItems");
    var res = this.values.items || [];
    this.values.root = null;
    this.values.items = null;
    return res;
  }
  
  async getInfo(item)
  {
    this.values.item = item;
    await this.callGraph("getInfo");
    var res = this.values.result;
    this.values.item = null;
    this.values.result = null;
    return res;
  }
  
  async callGraph(name)
  {
    var graph = this.graphs[name];
    if (graph)
    {
      await graphEngine.process(graph, null, this.values);
    }
  }
  
}

// isCompatible(xml): Is provided document can be processed by this parser
// getRoot(xml): Returns root node for parser
// getFeedTitle(root): Returns active feed title
// getFeedURL(root, def): Returns feed home URL.
// getItems(root): Returns list of all entries in feed.
// getInfo(item): Extracts information from entry item
// findExisting(list, info): Returns matching entry from the list
// wasChanged(item, info): Checks if entry was changed.

/** @type {Parser[]} */
var parsers = [];
/** @type {Object<string, Parser>} */
var parserIndex = {};

/** @param {Parser} parser */
function addParser(parser)
{
  if (parserIndex[parser.type])
  {
    parsers.splice(parsers.indexOf(parserIndex[parser.type]), 1);
  }
  parsers.unshift(parser);
  parserIndex[parser.type] = parser;
}

function cleanupRegParsers()
{
  var i = 0;
  while (i < parsers.length)
  {
    var p = parsers[i];
    if (p instanceof RegexParser || p instanceof GraphParser)
    {
      parsers.splice(i, 1);
      delete parserIndex[p.type];
      continue;
    }
    i++;
  }
}

/**
 * @param {Feed} data
 * @param {Document} xml
 * @returns {Parser}
 * @throws No parser were found
 */
async function findParser(data, xml)
{
  if (!data) throw "Data is null!";
  if (data.parserType)
  {
    var parser = parserIndex[data.parserType];
    if (parser && await parser.isCompatible(xml, data.url)) return parser;
  }
  for (var parser of parsers)
  {
    if (await parser.isCompatible(xml, data.url)) return parser;
  }
  throw "No suitable parser were found for this feed format";
}

addParser(new RSSParser());
addParser(new AtomParser());
