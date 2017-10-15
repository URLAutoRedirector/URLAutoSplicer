// URLAutoSplicer
// Copyright (c) David Zhang, 2017

var defaultOptions = {
  "options": []
}

var rules;
var lastTabId = 0;

function matchUrl(url) {
  if (rules == undefined || url == undefined) {
    return false;
  }
  for (var i = 0; i < rules.length; i++) {
    var isEnabled = rules[i].isEnabled;
    var src = rules[i].pattern;

    if (isEnabled) {
      if (isRegex) {
        var re = new RegExp(src);
        if (url.search(re) != -1) {
          newUrl = url.replace(re, dst);
          return newUrl;
        }
      }
      else {
        if (url == src) {
          return dst;
        }
      }
    }
  }

  return false;
}

function getOptions(callback)
{
  chrome.storage.local.get("options", function(data){
    rules = data.options.rules;
    callback();
  });
}

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  if (change.status == "loading") {
    newUrl = matchUrl(change.url);
    if (newUrl) {
      console.log("Match:" + change.url)
      console.log("Target:" + newUrl)
      if (isNewTab == false) {
        lastTabId = tabId;
        chrome.tabs.update({url: newUrl});
      }
      else {
        chrome.tabs.create({url: newUrl}, function(tab){
          notify();
        });
      }
    }
  }
  if (change.status == "complete" && tabId == lastTabId) {
    notify();
    lastTabId = 0;
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if (request.type == "syncOptions") {
    isNewTab = request["options"]["options"]["isNewTab"];
    isNotify = request["options"]["options"]["isNotify"];
    rules = request["options"]["options"]["rules"];
  }
  if (request.type == "resetRules") {
    var newOptions = {
      "options": {
        "isNewTab": isNewTab,
        "isNotify": isNotify,
        "rules": defaultOptions["options"]["rules"]
      }
    }
    rules = defaultOptions["options"]["rules"];
    chrome.storage.local.set(newOptions);
    var msg = {
      type: "reloadOptions"
    };
    chrome.runtime.sendMessage(msg, function(response){
      console.log("Send msg[reloadOptions]");
    });
  }
});

function generateContextMenu(patterns) {
  var contexts = ["selection"];
  chrome.contextMenus.removeAll();
  // create parent
  chrome.contextMenus.create({
    "title": "URL Auto Splicer",
    "id": "parent",
    "contexts":contexts
  });
  for (var i in patterns) {
    chrome.contextMenus.create({
      "title": patterns[i]["name"],
      "id": patterns[i]["name"] + i,
      "parentId": "parent",
      "contexts": contexts
    });
  }
}

function parseQuery(info) {
  var menuId = info.menuItemId;
  var input = info.selectionText;
  if (input.length === 0 || menuId === "parent") {
    return;
  }
  // TODO
  var url = "https://google.com/";
  chrome.tabs.create({
    "url": url
  });
}

function onClickHandler(info, _tab) {
  chrome.storage.local.get("options", function(data) {
    rules = data.options.rules;
    parseQuery(info);
  });
}

getOptions(function() {
  console.log("getOption Done");
});

chrome.contextMenus.onClicked.addListener(onClickHandler);

chrome.runtime.onInstalled.addListener(function(){
  generateContextMenu(defaultOptions);
  chrome.storage.local.set(defaultOptions);
});
