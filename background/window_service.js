browser.runtime.onMessage.addListener(onMessage);

/**
 * Opens a new browser window and loads tabs from a bookmark folder
 *
 * Implemented as a background service to enable the loading of 'discarded'
 * tabs. Window.create() loads all tabs immidiatly and steals the focus, stopping
 * scripts provided in the addon popup.
 */
async function onMessage(message) {
  let showPlaceholder = await browser.storage.local.get("showPlaceholder");

  let tabs = await browser.bookmarks.getChildren(message.bookmarkFolderId);

  let addresses = new Array();
  for (let tab of tabs) {
    // Filter out priviledged URLs as they cannot be opened by an extension.
    // see: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/create
    if (
      "undefined" == typeof tab.url ||
      tab.url.indexOf("chrome:") === 0 ||
      tab.url.indexOf("javascript:") === 0 ||
      tab.url.indexOf("data:") === 0 ||
      tab.url.indexOf("file:") === 0 ||
      (tab.url.indexOf("about:") === 0 && tab.url.indexOf("about:blank") !== 0)
    ) {
      if (showPlaceholder) {
        addresses.push(
          browser.runtime.getURL(
            "placeholder/placeholder.html?r=" + tab.url + "&t=" + tab.title
          )
        );
      }
    } else {
      addresses.push(tab.url);
    }
  }
  if (addresses.length < 5) {
    browser.windows.create({ url: addresses });
  } else {
    let window = await browser.windows.create({ url: addresses.slice(0, 5) });
    for (let i = 5; i < addresses.length; i++) {
      browser.tabs.create({
        windowId: window.id,
        url: addresses[i],
        index: i,
        discarded: true,
      });
    }
  }
}
