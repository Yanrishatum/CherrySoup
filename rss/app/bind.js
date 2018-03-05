
function callKey(bind, item, key, ...args)
{
  if (item[key] && item[key] instanceof Function) return item[key].apply(item, args);
  if (window[key] && window[key] instanceof Function) return window[key].apply(item, args);
  if (bind[key] && bind[key] instanceof Function) return bind[key].apply(item, args);
  console.error("Unable to find function for object under key " + key +"!", bind, item, args);
}

function getKey(item, key, noWarn)
{
  if (item[key]) return item[key];
  if (window[key]) return window[key];
  // if (bind[key]) return bind[key];
  if (!noWarn) console.error("Unable to find key '"+key+"' in object!", item);
  return item[key];
}

function getOrCallKey(item, key, noWarn)
{
  var val = getKey(item, key, noWarn);
  if (val && val instanceof Function) return val.apply(item);
  return val;
}

function setOrCallKey(item, key, value)
{
  var val = getKey(item, key, true);
  if (val && val instanceof Function) val.call(item, value);
  else item[key] = value;
}

function updateBinds(item, soft)
{
  for (var bindKey in binders) binders[bindKey].update(item, soft);
}

var Bind = function(provider)
{
  this.els = [];
  this.items = [];
  this.privates = [];
  this.provider = provider;
}

Bind.prototype.bind = function(el, key, item)
{
  this.els.push(el);
  this.items.push(item);
  var keys = Array.isArray(key) ? key : [key];
  var private = { bind:this, key:keys[0], keys:keys, el:el, item:item };
  this.privates.push(private);
  if (this.provider.bind) this.provider.bind.call(private);
  // if (this.provider.update) this.provider.update.call(private);
}

Bind.prototype.unbind = function(item)
{
  if (!this.provider.unbind) return;
  var idx = 0;
  while ((idx = this.items.indexOf(item, idx)) != -1)
  {
    this.provider.unbind.call(this.privates[idx]);
    this.els.splice(idx, 1);
    this.items.splice(idx, 1);
    this.privates.splice(idx, 1);
  }
}

Bind.prototype.update = function(item, soft)
{
  if (!this.provider.update) return;
  var idx = 0;
  while ((idx = this.items.indexOf(item, idx)) != -1)
  {
    this.provider.update.call(this.privates[idx++], soft);
  }
}

var binders = {};
binders["rv-text"] = new Bind({
  update: function()
  {
    this.el.textContent = getOrCallKey(this.item, this.key, true);
  }
});
binders["rv-html"] = new Bind({
  update: function()
  {
    this.el.innerHTML = getOrCallKey(this.item, this.key, true);
  }
});
binders["rv-on-click"] = new Bind({
  bind: function()
  {
    var self = this;
    var callUpdate = true;//!!this.keys[1];
    this.handler = function (e) { for (var key of self.keys) { callKey(self, self.item, key, e); } if (callUpdate) updateBinds(self.item); }
    this.el.addEventListener("click", this.handler);
  },
  unbind: function()
  {
    this.el.removeEventListener("click", this.handler);
    this.handler = null;
  }
});
binders["rv-show"] = new Bind({
  update: function()
  {
    this.el.style.display = getOrCallKey(this.item, this.key, true) ? "" : "none";
  }
});
binders["rv-hide"] = new Bind({
  update: function()
  {
    this.el.style.display = getOrCallKey(this.item, this.key, true) ? "none" : "";
  }
});
binders["rv-class"] = new Bind({
  bind: function()
  {
    this.list = [];
  },
  unbind: function()
  {
    for (var c of this.list) this.el.classList.remove(c);
  },
  update: function()
  {
    for (var c of this.list) this.el.classList.remove(c);
    var list = getOrCallKey(this.item, this.key);
    if (list)
    {
      if (!Array.isArray(list)) list = [list];
      this.list = list;
      for (var c of list) this.el.classList.add(c);
    }
    else this.list = [];
  }
});
binders["rv-provider"] = new Bind({
  bind: function()
  {
    this.useCondition = !!this.keys[1];
    this.list = [];
    this.items = [];
  },
  unbind: function()
  {
    for (var i of this.list)
    {
      this.el.removeChild(i);
    }
    this.list = null;
    this.items = null;
  },
  update: function(soft)
  {
    if (this.useCondition)
    {
      if (getOrCallKey(this.item, this.keys[1])) this.el.style.display = "";
      else
      {
        this.el.style.display = "none";
        return;
      }
    }
    if (soft) return;
    var items = getOrCallKey(this.item, this.key);
    if (!items) items = [];
    if (this.item.sortCriteria)
    {
      var criteria = getKey(this.item, this.item.sortCriteria, true);
      if (criteria instanceof Function) items = items.concat().sort(criteria);
      
    }
    
    var existing = {};
    for (var i = 0; i < this.list.length; i++)
    {
      var idx = items.indexOf(this.items[i]);
      if (idx != -1)
      {
        existing[idx] = i;
        updateBinds(this.items[i]);
      }
      else
      {
        this.el.removeChild(this.list[i]);
        // unbindTemplate(this.list[i], this.items[i]);
      }
    }
    var oldList = this.list;
    this.list = [];
    this.items = [];
    
    var last = null;
    for (var i = 0; i < items.length; i++)
    {
      // We assume there will be no rearrangements.
      if (existing[i] !== undefined)
      {
        // frag.appendChild(oldList[existing[i]]);
        last = oldList[existing[i]];
        this.list.push(last);
      }
      else
      {
        var templ = createTemplate(items[i].type);
        if (templ)
        {
          if (last == null) this.el.appendChild(templ);
          else this.el.insertBefore(templ, last.nextSibling);
          bindTemplate(templ, items[i]);
          this.list.push(templ);
          last = templ;
        }
        else continue;
      }
      this.items.push(items[i]);
    }
  }
});
binders["rv-src"] = new Bind({
  update: function() {
    var src = getOrCallKey(this.item, this.key, true);
    if (!src) this.el.src = this.keys[1];
    else this.el.src = src;
  }
});
binders["rv-if"] = new Bind({
  update: function() {
    var result = true;
    for (var key of this.keys)
    {
      var not = false;
      if (key.charAt(0) == "!")
      {
        not = true;
        key = key.substr(1);
      }
      if (getOrCallKey(this.item, key, true))
      {
        if (not) { result = false; break; }
      }
      else if (!not) { result = false; break; }
    }
    this.el.style.display = result ? "" : "none";
  }
});
binders["rv-id"] = new Bind({
  update: function() {
    this.el.id = getOrCallKey(this.item, this.key);
  }
});
binders["rv-value"] = new Bind({
  bind: function ()
  {
    var self = this;
    this.handler = function ()
    {
      if (self.el.type == "checkbox")
      {
        setOrCallKey(self.item, self.key, self.el.checked);
        updateBinds(self.item);
      }
      else
      {
        setOrCallKey(self.item, self.key, self.el.value);
        updateBinds(self.item);
        // console.error("No other inputs supported apart from checkbox!");
      }
    };
    this.el.addEventListener("change", this.handler);
    this.bind.provider.update.call(this);
  },
  update: function ()
  {
    if (this.el.type == "checkbox")
    {
      var val = getOrCallKey(this.item, this.key, true);
      if (val === undefined) this.el.checked = this.keys[1] == "true";
      else this.el.checked = !!val;
    }
    else
    {
      var val = this.el.value = getOrCallKey(this.item, this.key, true);
      if (val === undefined && this.keys[1]) this.el.value = this.keys[1];
      else this.el.value = val;
    }
  },
  unbind: function ()
  {
    this.el.removeEventListener("change", this.handler);
  }
});
binders["rv-overscroll"] = new Bind({
  handler: function (ev)
  {
    var el = this.el;
    if (ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey || el.scrollHeight == el.clientHeight) return;
    
    if ((ev.deltaY < 0 && el.scrollTop == 0) || (ev.deltaY > 0 && el.scrollTop + el.clientHeight == el.scrollHeight)) this.overscroll++;
    else this.overscroll = 0;
    
    if (this.overscroll != 0 && this.overscroll < this.threshold) ev.preventDefault();
  },
  bind: function ()
  {
    this.threshold = parseInt(this.key);
    this.overscroll = 0;
    this.handler = this.bind.provider.handler.bind(this);
    this.el.addEventListener("wheel", this.handler);
  },
  unbind: function ()
  {
    this.el.removeEventListener("wheel", this.handler);
    this.handler = null;
  }
});
binders["rv-on"] = new Bind({
  handler: function (e)
  {
    var update = true;
    for (var i = 1; i < this.keys.length; i++)
    {
      var callResult = callKey(this, this.item, this.keys[i], e);
      if (callResult === false) update = false;
    }
    if (update) updateBinds(this.item);
  },
  bind: function ()
  {
    this.handler = this.bind.provider.handler.bind(this);
    this.el.addEventListener(this.key, this.handler);
  },
  unbind: function ()
  {
    this.el.removeEventListener(this.key, this.handler);
    this.handler = null;
  }
});
binders["rv-options"] = new Bind({
  bind: function ()
  {
    var list = getOrCallKey(this.item, this.key, true);
    if (list)
    {
      var el = this.el;
      for (var item of list)
      {
        var opt = document.createElement("option");
        if (typeof opt == "string")
        {
          opt.textContent = opt.value = item;
        }
        else
        {
          opt.value = item.value || item.name;
          opt.textContent = item.text || item.name || item.value;
        }
        el.appendChild(opt);
      }
    }
  }
});

//rv-feed-classlist

function createTemplate(name)
{
  var node = document.getElementById("template_" + name);
  if (!node) console.warn("Template " + name + " not found!");
  return document.importNode(node.content, true).firstElementChild;
}

var observer;
/** @param {HTMLElement} template */
function bindTemplate(template, item)
{
  if (!observer)
  {
    observer = new MutationObserver(unbindHandler);
    observer.observe(document.body, { childList: true });
  }
  template.item = item;
  
  for (var bindKey in binders)
  {
    /** @type {Bind} */
    var binder = binders[bindKey];
    if (template.hasAttribute(bindKey))
    {
      binder.bind(template, template.getAttribute(bindKey).split(","), item);
    }
    
    var query = template.querySelectorAll("*[" + bindKey + "]");
    for (var i = 0; i < query.length; i++)
    {
      // console.log("Binded: " + bindKey, item, query[i]);
      var el = query[i];
      binder.bind(el, el.getAttribute(bindKey).split(","), item);
      // binder.bind(query[i]);
    }
  }
  updateBinds(item);
  return template;
}

function unbindTemplate(template, item)
{
  console.log("Unbound template", template, item);
  for (var binder of binders)
  {
    binder.unbind(item);
  }
}

/**
 * @param {Array<MutationRecord>} records
 * @param {MutationObserver} instance
 */
function unbindHandler(records, instance)
{
  var toUnbind = [];
  for (var record of records)
  {
    if (record.removedNodes && record.removedNodes.length)
    {
      for (var i = 0; i < record.removedNodes.length; i++)
      {
        if (record.removedNodes[i].item !== undefined) toUnbind.push(record);
      }
    }
    if (record.addedNodes && record.addedNodes.length)
    {
      for (var i = 0; i < record.removedNodes.length; i++)
      {
        var templ = record.addedNodes[i];
        if (templ.item !== undefined)
        {
          var idx = toUnbind.indexOf(templ);
          if (idx !== -1) toUnbind.splice(idx, 1);
        }
      }
    }
  }
  for (var template of toUnbind)
  {
    unbindTemplate(template, item);
  }
}