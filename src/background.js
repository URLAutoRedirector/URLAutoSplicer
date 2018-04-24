// URLAutoSplicer
// Copyright (c) David Zhang, 2018

var defaultOptions = {
  options: {
    rules: [
      {
        name: "Search with Google",
        pattern: "https://google.com/search?q=%UAS_PARAM%",
        isEnabled: true
      }
    ]
  }
}

var rules;

function getOptions(callback) {
  chrome.storage.local.get("options", function(data) {
    rules = data.options.rules;
    callback();
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == "syncOptions") {
    rules = request.options.options.rules;
  }
  if (request.type == "resetRules") {
    var newOptions = {
      options: {
        rules: defaultOptions["options"]["rules"]
      }
    }
    rules = defaultOptions["options"]["rules"];
    chrome.storage.local.set(newOptions);
    var msg = {
      type: "reloadOptions"
    };
    chrome.runtime.sendMessage(msg, function(response) {
      console.log("Send msg[reloadOptions]");
    });
  }
  generateContextMenu(rules);
});

function generateContextMenu(rules) {
  var contexts = ["selection"];
  chrome.contextMenus.removeAll();
  // create parent
  chrome.contextMenus.create({
    title: "URL Auto Splicer",
    id: "root",
    contexts: contexts
  });
  for (var i in rules) {
    if (rules[i].isEnabled) {
      chrome.contextMenus.create({
        title: rules[i].name,
        id: i,
        parentId: "root",
        contexts: contexts
      });
    }
  }
}

function parseQuery(info) {
  var menuId = info.menuItemId;
  var input = info.selectionText;
  if (input.length == 0 || menuId == "root") {
    return;
  }
  for (var i in rules) {
    if (i == parseInt(menuId)) {
      console.log(rules[i].name + "matched.");
      var pattern = rules[i].pattern;
      var url = pattern.replace("%UAS_PARAM%", input);
      chrome.tabs.create({
        "url": url
      });
      return;
    }
  }
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

chrome.runtime.onInstalled.addListener(function() {
  generateContextMenu(defaultOptions.options.rules);
  chrome.storage.local.set(defaultOptions);
});
