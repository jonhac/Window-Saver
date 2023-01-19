import { findOrCreateBookmarkFolder } from "../bookmark_helper.js";
const defaultFolderName = "Window Saver";

browser.bookmarks.onRemoved.addListener(() => {
  handleFolderRemoved();
});
browser.runtime.onInstalled.addListener(() => {
  initDefaultSettings();
});

async function initDefaultSettings() {
  initSetting("deleteAfter", false);
  initSetting("confirmSavePrivate", true);
  initSetting("confirmDelete", true);
  initSetting("confirmOverride", true);
  initSetting("confirmCloseNonPrivate", false);
  initSetting("confirmClosePrivate", false);
  initSetting("showPlaceholder", true);

  let folderSettings = await browser.storage.local.get("folderId");
  if ("undefined" == typeof folderSettings.folderId) {
    let id = await findOrCreateBookmarkFolder(defaultFolderName);
    browser.storage.local.set({ folderId: id });
  }

  async function initSetting(name, value) {
    let setting = await browser.storage.local.get(name);
    if ("undefined" == typeof setting[name]) {
      browser.storage.local.set({ [name]: value });
    }
  }
}

async function handleFolderRemoved(id, info) {
  let settings = await browser.storage.local.get("folderId");
  if (id === settings.folderId) {
    // They deleted our folder! We go back to the default.
    let id = await findOrCreateBookmarkFolder(defaultFolderName);
    browser.storage.local.set({ folderId: id });
  }
}
