// Util

/** @param {string} query @returns {HTMLElement} */
function $(query) { return document.querySelector(query); }

function setFormData(data, prefix)
{
  for (var key in data)
  {
    var tag = prefix + key;
    $("#" + tag).value = data[key];
  }
}
function getFormData(data, prefix)
{
  for (var key in data)
  {
    var tag = prefix + key;
    var obj = $("#" + tag);
    if (obj.type == "number") data[key] = obj.valueAsNumber;
    else if (obj.type == "checkbox") data[key] = obj.checked;  
    else data[key] = obj.value;
  }
}

// Util:selects
function addtoSelect(id, name, value)
{
  var sel = $("#" + id);
  var opt = document.createElement("option");
  opt.textContent = name;
  opt.value = value || name;
  sel.appendChild(opt);
}

function removeFromSelect(id, idx)
{
  var sel = $("#" + id);
  if (idx === undefined) idx = sel.selectedIndex;
  // var ret = { val: sel.value, idx: idx };
  sel.children[idx].remove();
  // return ret;
}

// Data values
var main = { path: "Other bookmarks/RSS", rate: 15 };
var matchers = [];
var tags = [];

var settingList = ["settings", "matchers", "tags"];

function defaultSettings()
{
  main.path = "Other bookmarks/RSS";
  main.rate = 15;
  setFormData(main, "common_");
}

function getData()
{
  getFormData(main, "common_");
  return main;//{ path: $("#bookmark_path").value, rate: parseInt($("#update_rate").value) };
}

function getSyncData(storage, expand)
{
  var res = {
    matchers: [],
    tags: tags,
  };
  for (var m of matchers)
  {
    res.matchers.push(m.name);
    res["_" + m.name] = m.graph;
  }
  if (storage) res.settings = getData();
  else res.data = getData();
  if (expand)
  {
    for (var key in expand) res[key] = expand[key];
  }
  return res;
}

function load()
{
  chrome.storage.sync.get(loadCB);
}

function loadCB(data)
{
  if (data.settings)
  {
    main = data.settings;
    setFormData(main, "common_");
  }
  else
  {
    defaultSettings();
  }
  if (data.matchers)
  {
    matchers = data.matchers;
    for (var i = 0; i < matchers.length; i++)
    {
      if (matchers[i].name)
      {
        matchers[i] = matchers[i].name;
        data["_" + matchers[i].name] = matchers[i].graph;
      }
      matchers[i] = { name: matchers[i], graph: data["_" + matchers[i]] };
      addtoSelect("matcher_list", matchers[i].name);
    }
  }
  if (data.tags)
  {
    tags = data.tags;
    for (var tag of tags) addtoSelect("update_tags", tag.name);
    currentTTL = tags[$("#update_tags").selectedIndex];
    setFormData(currentTTL, "update_tag_");
  }
}

function save()
{
  var data = getData();
  $("#status").style.opacity = "1";
  $("#status").textContent = "Saving...";
  
  chrome.storage.sync.set(getSyncData(true), saveCB);
}

function saveCB()
{
  setTimeout(function() {
    $("#status").style.opacity = "0";
  }, 1000);
  $("#status").textContent = "Saved!";
  chrome.runtime.sendMessage(getSyncData(false, { type: "rebuild", all: true }));//{ type: "rebuild", all: true, data: getData(), matchers: matchers });
}

function refresh()
{
  chrome.runtime.sendMessage(getSyncData(false, { type: "rebuild", all: false }));//{ type: "rebuild", all: false, data: getData() });
}

$("#save").addEventListener("click", save);
$("#refresh").addEventListener("click", refresh);

// TTL
$("#update_tags").addEventListener("change", updateCustomTagForm);
$("#update_tags_save").addEventListener("click", saveCurrentTag);
$("#update_tags_delete").addEventListener("click", deleteCurrentTag);
var currentTTL = null;

function updateCustomTagForm(e)
{
  var idx = $("#update_tags").selectedIndex;
  currentTTL = tags[idx];
  setFormData(currentTTL, "update_tag_");
}

function saveCurrentTag()
{
  if (!currentTTL)
  {
    currentTTL = { name: "", rate: 0 };
    tags.push(currentTTL);
    getFormData(currentTTL, "update_tag_");
    addtoSelect("update_tags", currentTTL.name);
  }
  else getFormData(currentTTL, "update_tag_");
}

function deleteCurrentTag()
{
  if (currentTTL)
  {
    removeFromSelect("update_tags", tags.indexOf(currentTTL));
  }
  currentTTL = null;
  setFormData({ name: "", rate: 0 }, "update_tag_");
}


// Matchers

var matchers = [];
var currentMatcher = null;

function newMatcher()
{
  var e = $("#matcher_edit");
  e.style.height = e.scrollHeight + "px";
  currentMatcher = {};
}

function saveMatcher()
{
  if (!currentMatcher) return;
  currentMatcher.name = $("#matcherName").value;
  currentMatcher.graph = JSON.parse($("#matcherData").value);
  if (matchers.indexOf(currentMatcher) == -1)
  {
    matchers.push(currentMatcher);
    addtoSelect("matcher_list", currentMatcher.name);
    // addMatcherToList(currentMatcher);
    $("#matcher_list").selectedIndex = matchers.length;
  }
}

//piczel\.tv/gallery/[^/]+$
//div.cover
//.info span
//a:not(.user-info)
//.gallery-image-thumb

function deleteMatcher()
{
  var idx = matchers.indexOf(currentMatcher);
  if (idx != -1)
  {
    matchers.splice(idx, 1);
    $("#matcher_list").children.item(idx+1).remove();
  }
  currentMatcher = null;
  $("#matcher_edit").style.height = "0";
}

function selectMatcher()
{
  var index = $("#matcher_list").selectedIndex;
  var e = $("#matcher_edit");
  if (index == 0)
  {
    e.style.height = "0";
    currentMatcher = null;
  }
  else
  {
    e.style.height = e.scrollHeight + "px";
    currentMatcher = matchers[index - 1];
    $("#matcherName").value = currentMatcher.name;
    $("#matcherData").value = JSON.stringify(currentMatcher.graph);
  }
}

$("#newMatcher").addEventListener("click", newMatcher);
$("#saveMatcher").addEventListener("click", saveMatcher);
$("#deleteMatcher").addEventListener("click", deleteMatcher);
$("#matcher_list").addEventListener("change", selectMatcher);

load();