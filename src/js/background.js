// Constants for icons and script status
const javascriptEnabled = { 32: "../res/icons/bScript_enabled-32.png" };
const javascriptDisabled = { 32: "../res/icons/bScript_disabled-32.png" };
const prefix = "ujs_bScript";
const none = "{display: none !important;}";
let enabled = false;

// Check if host is whitelisted
function isWhitelisted(storage, host) {
  return storage[host] !== undefined ? storage[host] : true;
}

// Add Content-Security-Policy header to block JavaScript if not whitelisted
function addCspNoJsHeader(response) {
  const host = new URL(response.url).hostname;
  const headers = response.responseHeaders;

  return new Promise((resolve) => {
    browser.storage.local.get(host).then((storage) => {
      const whitelistJs = isWhitelisted(storage, host);
      if (!whitelistJs) {
        headers.push({
          name: "Content-Security-Policy",
          value: "script-src 'none';",
        });
      }
      resolve({ responseHeaders: headers });
    });
  });
}

// Listen for incoming headers and modify if necessary
browser.webRequest.onHeadersReceived.addListener(
  addCspNoJsHeader,
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking", "responseHeaders"]
);

// Update page action icon and title based on the whitelist status
function updatePageActionIcon(id, url) {
  const host = new URL(url).hostname;

  browser.storage.local.get(host).then((storage) => {
    const whitelistJs = isWhitelisted(storage, host);
    const statusIcon = whitelistJs ? javascriptEnabled : javascriptDisabled;
    const statusTitle = whitelistJs
      ? browser.i18n.getMessage("javascriptEnabled")
      : browser.i18n.getMessage("javascriptDisabled");

    browser.pageAction.setIcon({ path: statusIcon, tabId: id });
    browser.pageAction.setTitle({ title: statusTitle, tabId: id });
    browser.pageAction.show(id); // Show the page action after updating
  });
}

// Listen for tab updates and refresh the icon and title
browser.tabs.onUpdated.addListener((id, changeInfo) => {
  if (changeInfo.url) {
    updatePageActionIcon(id, changeInfo.url);
  }
});

// Toggle JavaScript activation for the current host
function toggleJavaScript(tab) {
  const host = new URL(tab.url).hostname;

  browser.storage.local.get(host).then((storage) => {
    const whitelistJs = isWhitelisted(storage, host);
    const updatedStatus = !whitelistJs;
    const statusIcon = updatedStatus ? javascriptEnabled : javascriptDisabled;
    const statusTitle = updatedStatus
      ? browser.i18n.getMessage("javascriptEnabled")
      : browser.i18n.getMessage("javascriptDisabled");

    // Store the new whitelist status and update the page action
    browser.storage.local.set({ [host]: updatedStatus }).then(() => {
      browser.pageAction.setIcon({ path: statusIcon, tabId: tab.id });
      browser.pageAction.setTitle({ title: statusTitle, tabId: tab.id });

      // Reload the page after toggling JavaScript
      browser.tabs.reload(tab.id);
    });
  });
}

// Listen for page action icon clicks to toggle JavaScript
browser.pageAction.onClicked.addListener(toggleJavaScript);

// Handle the creation of context menu items
function onCreated() {
  if (browser.runtime.lastError) {
    console.error(`Error: ${browser.runtime.lastError}`);
  }
}

// Create or remove the context menu based on localStorage settings
function manageContextMenu() {
  const contextMenuSetting = localStorage.getItem("contextMenu");

  if (contextMenuSetting === "True" || contextMenuSetting === null) {
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

// Listen for context menu item clicks
browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "bScript") {
    toggleJavaScript(tab);
  }
});

// Shows the page action icon when the tab is updated
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    browser.pageAction.show(tabId);
  }
});
