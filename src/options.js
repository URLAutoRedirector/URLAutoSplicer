// URLAutoSplicer
// Copyright (c) David Zhang, 2018

var rules = [];

$(document).ready(function() {
  // i18n UI
  setInterface();
  // new rule button
  $("#new-rule").click(function() {
    $("#rule-list").append(newRuleItem("", "", true));
  });
  // reset rule button
  $("#reset-rule").click(function() {
    var confirmReset = chrome.i18n.getMessage("confirm_reset");
    var r = confirm(confirmReset);
    if (r == true) {
      $(".rule-item").remove();
      var msg = {
        type: "resetRules"
      };
      chrome.runtime.sendMessage(msg, function(response) {
        console.log("Send msg[resetRules]");
      });
    }
  });
  // import rule button
  $("#import-rule").click(function() {
    var importedFile = $("#upload-rule").prop("files");
    if (importedFile.length == 0) {
      alert(chrome.i18n.getMessage("import_error_no_file"));
      return;
    } else {
      var reader = new FileReader();
      reader.readAsText(importedFile[0], "UTF-8");
      reader.onload = function(evt) {
        var rulesString = evt.target.result;
        var rulesJSON = JSON.parse(rulesString);
        var numOfRules = rulesJSON.length;
        if (numOfRules == 0) {
          alert(chrome.i18n.getMessage("import_error_no_rule"));
          return;
        }
        for (var i = 0; i < numOfRules; i++ ) {
          var name = rulesJSON[i].name;
          var pattern = rulesJSON[i].pattern;
          var isDeleted = false;
          var isEnabled = rulesJSON[i].isEnabled;

          rules.push({
            name: name,
            pattern: pattern,
            isEnabled: isEnabled
          });
        }
        setOptions();
        $(".rule-item").remove();
        getOptions(showOptions);
        alert(chrome.i18n.getMessage("import_success"));
      }
    }
  });
  // export rule button
  $("#export-rule").click(function() {
    var rulesString = JSON.stringify(rules);
    var blob = new Blob([rulesString]);

    var aLink = document.createElement('a');
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("click", false, false);
    aLink.download = "redirecting-rules.json";
    aLink.href = URL.createObjectURL(blob);
    aLink.dispatchEvent(evt);
  });
  // rule list drag & sort
  $("#rule-list").sortable({
    animation: 150,
    handle: ".drag-item",
    onEnd: function(evt){
      gatherRulesOnForm();
      setOptions();
    }
  });
});

$(document).on("click", ".is-enabled", function() {
  if ($(this).data("is-enabled") == true) {
    $(this).data("is-enabled", false);
    $(this).attr("class", "icon icon-toggle-off is-enabled");
  } else if ($(this).data("is-enabled") == false) {
    $(this).data("is-enabled", true);
    $(this).attr("class", "icon icon-toggle-on is-enabled");
  }
  gatherRulesOnForm();
  setOptions();
});

$(document).on("click", ".is-deleted", function() {
  var confirmDelete = chrome.i18n.getMessage("confirm_delete");
  var r = confirm(confirmDelete);
  if (r == true) {
    $(this).data("is-deleted", true);
    gatherRulesOnForm();
    setOptions();
    $(".rule-item").remove();
    getOptions(showOptions);
  }
});

$(document).on("change", ".rule-item>input[type='text']", function() {
  gatherRulesOnForm();
  setOptions();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == "reloadOptions") {
    getOptions(showOptions);
  }
});

function gatherRulesOnForm() {
  var numOfRules = $(".rule-item").length;
  rules = [];
  for (var i = 0; i < numOfRules; i++ ) {
    var name = $(".name:eq(" + i + ")").val();
    var pattern = $(".pattern:eq(" + i + ")").val();
    var isDeleted = $(".is-deleted:eq(" + i + ")").data("is-deleted");
    var isEnabled = $(".is-enabled:eq(" + i + ")").data("is-enabled");
    if (!isDeleted) {
      rules.push({
        name: name,
        pattern: pattern,
        isEnabled: isEnabled
      });
    }
  }
}

function setOptions() {
  var newOptions = {
    "options": {
      "rules": rules
    }
  }
  chrome.storage.local.set(newOptions);
  var msg = {
    type: "syncOptions",
    options: newOptions
  };
  chrome.runtime.sendMessage(msg, function(response) {
    console.log("Send msg[syncOptions]");
  });
}

function getOptions(callback) {
  chrome.storage.local.get("options", function(data) {
    rules = data.options.rules;
    callback();
  });
}

function showOptions() {
  for (var i=0; i<rules.length; i++) {
    $("#rule-list").append(newRuleItem(rules[i].name, rules[i].pattern, rules[i].isEnabled));
  }
}

function newRuleItem(name, pattern, isEnabled) {
  var title_enable = chrome.i18n.getMessage("title_enable");
  var title_delete = chrome.i18n.getMessage("title_delete");
  var ruleItemHTML = "<li class=\"rule-item\">" +
                     "<div title=\"Drag item to reorder\" class=\"icon icon-bars drag-item\"></div>" +
                     "<input type=\"text\" class=\"name\" value=\"" + name + "\">" +
                     "<input type=\"text\" class=\"pattern\" value=" + pattern + ">" +
                     "<div title=\"" + title_enable + "\" data-is-enabled=\"" + isEnabled + "\" class=\"icon " + (isEnabled ? "icon-toggle-on" : "icon-toggle-off") + " is-enabled\"></div>" +
                     "<div title=\"" + title_delete + "\" data-is-deleted=\"false\" class=\"icon icon-ban is-deleted\"></div>" +
                     "</li>";
                     console.log(ruleItemHTML);
  return ruleItemHTML;
}

/*eslint max-statements: 0*/
function setInterface() {
  // general
  var ext_name = chrome.i18n.getMessage("ext_name");
  var title    = chrome.i18n.getMessage("options_page_title") + " - " + ext_name;
  // rules
  var rules        = chrome.i18n.getMessage("options_rules");
  var rule_name    = chrome.i18n.getMessage("rule_name");
  var rule_pattern = chrome.i18n.getMessage("rule_pattern");
  var rule_enable  = chrome.i18n.getMessage("rule_enable");
  var rule_delete  = chrome.i18n.getMessage("rule_delete");
  // buttons
  var btn_new    = chrome.i18n.getMessage("btn_new");
  var btn_reset  = chrome.i18n.getMessage("btn_reset");
  var btn_import = chrome.i18n.getMessage("btn_import");
  var btn_export = chrome.i18n.getMessage("btn_export");
  // about
  var about      = chrome.i18n.getMessage("about");
  var copyright  = chrome.i18n.getMessage("copyright") + " &copy; <a target=\"_blank\" href=\"https://crispgm.com/\">David Zhang</a>, 2017.";
  var home       = "<a target=\"_blank\" href=\"https://urlautoredirector.github.io/URLAutoSplicer/\">" + chrome.i18n.getMessage("official_page") + "</a>";
  var contribute = chrome.i18n.getMessage("contribute") + " <a target=\"_blank\" href=\"https://github.com/UrlAutoRedirector/URLAutoSplicer\">GitHub - URLAutoSplicer</a>.";

  $(document).attr("title", title);
  $(".rules-label").text(rules);
  $(".title-name").text(rule_name);
  $(".title-pattern").text(rule_pattern);
  $(".title-enable").text(rule_enable);
  $(".title-is-deleted").text(rule_delete);

  $("#new-rule").val(btn_new);
  $("#reset-rule").val(btn_reset);
  $("#import-rule").val(btn_import);
  $("#export-rule").val(btn_export);

  $(".about-label").text(about);
  $(".about-copyright").html(copyright);
  $(".about-home").html(home);
  $(".about-contribute").html(contribute);
}

document.addEventListener("DOMContentLoaded", getOptions(showOptions));
