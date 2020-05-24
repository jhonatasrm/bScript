var imported = document.createElement("bScript.js");
const javascriptEnabled = { 32: "../res/icons/bScript_enabled-32.png" };
const javascriptDisabled = { 32: "../res/icons/bScript_disabled-32.png" };
var style,
  _style,
  enabled = false,
  prefix = "ujs_bScript",
  none = "{display: none !important;}";

function is_whitelisted(dict, host) {
  let whitelist_js = true;
  if (dict[host] !== undefined) {
    whitelist_js = dict[host];
  }
  return whitelist_js;
}

function add_csp_nojs_header(response) {
  let host = new URL(response.url).hostname;
  let headers = response.responseHeaders;
  return new Promise((resolve) => {
    browser.storage.local.get(host).then((item) => {
      let whitelist_js = is_whitelisted(item, host);
      if (!whitelist_js) {
        var new_csp = {
          name: "Content-Security-Policy",
          value: "script-src 'none';",
        };
        headers.push(new_csp);
      }
      resolve({ responseHeaders: headers });
    });
  });
}

browser.webRequest.onHeadersReceived.addListener(
  add_csp_nojs_header,
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking", "responseHeaders"]
);

browser.tabs.onUpdated.addListener((id, changeInfo) => {
  if (changeInfo.url) {
    let host = new URL(changeInfo.url).hostname;
    browser.storage.local.get(host).then((item) => {
      let whitelist_js = is_whitelisted(item, host);
      let status_icon = whitelist_js ? javascriptEnabled : javascriptDisabled;
      browser.pageAction.setIcon({ path: status_icon, tabId: id });
      let status_title = whitelist_js
        ? browser.i18n.getMessage("javascriptEnabled")
        : browser.i18n.getMessage("javascriptDisabled");
      browser.pageAction.setTitle({ title: status_title, tabId: id });
    });
  }
  browser.pageAction.show(id);
});

browser.pageAction.onClicked.addListener(activateOrNotbScript);

function activateOrNotbScript(tab) {
  let host = new URL(tab.url).hostname;
  browser.storage.local.get(host).then((item) => {
    let whitelist_js = is_whitelisted(item, host);
    let to_store = {};
    to_store[host] = !whitelist_js;
    browser.storage.local.set(to_store).then(function () {
      browser.tabs.reload();
    });
  });
}

// Context menu
function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  }
}

function startContextMenu() {
  if (
    localStorage.getItem("contextMenu") == "True" ||
    localStorage.getItem("contextMenu") == null
  ) {
    browser.menus.create(
      {
        id: "bScript",
        title: "bScript",
        contexts: ["all"],
      },
      onCreated
    );
  } else {
    browser.menus.remove("bScript");
  }
}

browser.menus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "bScript":
      activateOrNotbScript(tab);
      break;
  }
});
