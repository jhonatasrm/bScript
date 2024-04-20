const javascriptEnabled = { 32: "../res/icons/bScript_enabled-32.png" };
const javascriptDisabled = { 32: "../res/icons/bScript_disabled-32.png" };
const prefix = "ujs_bScript";

async function isWhitelisted(host) {
  const item = await browser.storage.local.get(host);
  return !!item[host];
}

function addCspNoJsHeader(response) {
  const host = new URL(response.url).hostname;
  const headers = response.responseHeaders;
  return new Promise((resolve) => {
    isWhitelisted(host).then((whitelistJs) => {
      if (!whitelistJs) {
        const newCsp = {
          name: "Content-Security-Policy",
          value: "script-src 'none';",
        };
        headers.push(newCsp);
      }
      resolve({ responseHeaders: headers });
    });
  });
}

browser.webRequest.onHeadersReceived.addListener(
  addCspNoJsHeader,
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking", "responseHeaders"]
);

browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  if (changeInfo.url) {
    const host = new URL(changeInfo.url).hostname;
    isWhitelisted(host).then((whitelistJs) => {
      const statusIcon = whitelistJs ? javascriptEnabled : javascriptDisabled;
      browser.pageAction.setIcon({ path: statusIcon, tabId: id });
      const statusTitle = whitelistJs
        ? browser.i18n.getMessage("javascriptEnabled")
        : browser.i18n.getMessage("javascriptDisabled");
      browser.pageAction.setTitle({ title: statusTitle, tabId: id });
    });
  }
  browser.pageAction.show(id);
});

browser.pageAction.onClicked.addListener((tab) => {
  const host = new URL(tab.url).hostname;
  isWhitelisted(host).then((whitelistJs) => {
    const toStore = {};
    toStore[host] = !whitelistJs;
    browser.storage.local.set(toStore).then(() => {
      browser.tabs.reload(tab.id);
    });
  });
});

// Context menu
function startContextMenu() {
  const contextMenuEnabled =
    localStorage.getItem("contextMenu") !== "False";
  if (contextMenuEnabled || localStorage.getItem("contextMenu") === null) {
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

function onCreated() {
  if (browser.runtime.lastError) {
    console.error(`Error: ${browser.runtime.lastError}`);
  }
}

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "bScript") {
    activateOrNotbScript(tab);
  }
});