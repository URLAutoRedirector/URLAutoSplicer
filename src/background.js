// URLAutoSplicer
// Copyright (c) David Zhang, 2026

const defaultOptions = {
  options: {
    rules: [
      {
        name: "Search with Google",
        pattern: "https://google.com/search?q=%UAS_PARAM%",
        isEnabled: true
      }
    ]
  }
};

function generateContextMenu(rules) {
  const contexts = ["selection"];

  chrome.contextMenus.removeAll(function() {
    chrome.contextMenus.create({
      title: chrome.i18n.getMessage("ext_name"),
      id: "root",
      contexts: contexts
    });

    rules.forEach(function(rule, index) {
      if (!rule.isEnabled) {
        return;
      }

      chrome.contextMenus.create({
        title: rule.name,
        id: String(index),
        parentId: "root",
        contexts: contexts
      });
    });
  });
}

function getRules(callback) {
  chrome.storage.local.get("options", function(data) {
    const options = data.options || defaultOptions.options;
    callback(Array.isArray(options.rules) ? options.rules : defaultOptions.options.rules);
  });
}

function refreshContextMenu() {
  getRules(generateContextMenu);
}

function openRule(info, rules) {
  const menuId = String(info.menuItemId);
  const input = info.selectionText || "";

  if (!input || menuId === "root") {
    return;
  }

  const rule = rules[Number(menuId)];
  if (!rule || !rule.isEnabled) {
    return;
  }

  const url = rule.pattern.replace("%UAS_PARAM%", input);
  chrome.tabs.create({url: url});
}

chrome.contextMenus.onClicked.addListener(function(info) {
  getRules(function(rules) {
    openRule(info, rules);
  });
});

chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    chrome.storage.local.set(defaultOptions);
    return;
  }

  refreshContextMenu();
});

chrome.runtime.onStartup.addListener(refreshContextMenu);

chrome.storage.onChanged.addListener(function(changes, areaName) {
  if (areaName === "local" && changes.options) {
    refreshContextMenu();
  }
});
