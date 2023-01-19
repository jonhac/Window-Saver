import { saveCurrentWindow } from "../bookmark_helper.js";
import { enableDragAndDrop } from "./drag_and_drop.js";
let settings = browser.storage.local.get([
  "folderId",
  "confirmSavePrivate",
  "confirmDelete",
  "confirmOverride",
  "confirmCloseNonPrivate",
  "confirmClosePrivate",
  "deleteAfter",
]);

document.addEventListener("DOMContentLoaded", init);

function init() {
  window.addEventListener("load", listSaved);
  document.getElementById("save").addEventListener("click", handleSave);
  document
    .getElementById("name_input")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        handleSave();
      }
    });
  document.getElementById("settings").addEventListener("click", function (e) {
    browser.runtime.openOptionsPage();
    window.close();
  });
  document.getElementById("version").addEventListener("click", function () {
    window.location.href = browser.extension.getURL(
      "popup/changelog.html?w=" + document.body.clientWidth
    );
  });
  displayVersion();
}

async function displayVersion() {
  let info = await browser.management.getSelf();
  document.getElementById("version").value = info.version;
}

let confirmationSender = null;
let confirmationLocation = null;
function toggleConfirmation(sender, location, message) {
  if (confirmationSender !== null) {
    let confirmed = confirmationSender === sender;
    cancelConfirmation();
    return confirmed;
  } else {
    confirmationSender = sender;

    let element = document.createElement("div");
    element.id = "confirmation";
    element.innerText = browser.i18n.getMessage(message);
    element.style.width = location.offsetWidth + "px";
    element.style.height = location.offsetHeight + "px";
    element.style["line-height"] = location.offsetHeight + "px";
    element.style.left = location.offsetLeft + "px";
    element.style.top = location.offsetTop + "px";

    confirmationLocation = location;
    confirmationLocation.classList.add("hidden");
    confirmationLocation.parentNode.insertBefore(element, confirmationLocation);

    confirmationSender.addEventListener("mouseleave", cancelConfirmation);

    return false;
  }
}

function cancelConfirmation() {
  confirmationSender.removeEventListener("mouseleave", cancelConfirmation);

  confirmationLocation.classList.remove("hidden");
  let confirmation = document.getElementById("confirmation");
  confirmation.parentNode.removeChild(confirmation);

  confirmationLocation = null;
  confirmationSender = null;
}

async function handleSave() {
  let confirmIncognito = (await settings).confirmSavePrivate;

  if (confirmIncognito) {
    let window = await browser.windows.getCurrent();
    if (window.incognito) {
      let confirmed = toggleConfirmation(
        document.getElementById("save"),
        document.getElementById("name_input"),
        "savePrivatePrompt"
      );
      if (confirmed) {
        save();
      }
    } else {
      save();
    }
  } else {
    save();
  }

  async function save() {
    let name = document.getElementById("name_input").value;
    if (name === "") {
      let date = new Date();
      name =
        date.getFullYear() +
        "-" +
        (date.getMonth() + 1) +
        "-" +
        date.getDate() +
        " " +
        date.getHours() +
        ":" +
        date.getMinutes() +
        ":" +
        date.getSeconds();
    }

    let folderId = (await settings).folderId;
    let windowFolder = await browser.bookmarks.create({
      parentId: folderId,
      index: 0,
      title: name,
    });
    saveCurrentWindow(windowFolder.id);

    let dom = buildEntryDom(windowFolder);
    let bookmarks = document.getElementById("bookmarks");
    showOrRemoveWelcome();
    bookmarks.insertBefore(dom, bookmarks.firstChild);
  }
}

async function listSaved() {
  let windows = await browser.bookmarks.getChildren((await settings).folderId);

  let list = document.getElementById("bookmarks");
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  for (let window of windows) {
    let dom = buildEntryDom(window);
    list.appendChild(dom);
  }
  showOrRemoveWelcome();
}

function showOrRemoveWelcome() {
  let list = document.getElementById("bookmarks");
  if (list.childNodes.length === 0) {
    let welcome = document.createElement("div");
    welcome.id = "welcome";
    welcome.innerText = browser.i18n.getMessage("welcomeMessage");
    list.appendChild(welcome);
  } else if (list.childNodes.length === 1) {
    if (list.firstChild.id === "welcome") {
      list.removeChild(list.firstChild);
    }
  }
}

function buildEntryDom(bookmark) {
  let row = document.createElement("div");
  row.id = bookmark.id;
  row.className = "row session";
  enableDragAndDrop(row);

  let restoreHereButton = document.createElement("input");
  restoreHereButton.type = "button";
  restoreHereButton.className = "restore_here_button";
  restoreHereButton.title = browser.i18n.getMessage("restoreHereButtonTitle");
  restoreHereButton.value = "";
  restoreHereButton.addEventListener("click", handleRestoreHere);

  let overrideButton = document.createElement("input");
  overrideButton.type = "button";
  overrideButton.className = "override_button";
  overrideButton.title = browser.i18n.getMessage("overrideButtonTitle");
  overrideButton.value = "";
  overrideButton.addEventListener("click", handleOverride);

  let deleteButton = document.createElement("input");
  deleteButton.type = "button";
  deleteButton.className = "delete_button";
  deleteButton.title = browser.i18n.getMessage("deleteButtonTitle");
  deleteButton.value = "";
  deleteButton.addEventListener("click", handleDelete);

  let restoreButton = document.createElement("input");
  restoreButton.type = "button";
  restoreButton.className = "restore_button";
  restoreButton.title = browser.i18n.getMessage("restoreButtonTitle");
  restoreButton.value = bookmark.title;
  restoreButton.addEventListener("click", handleRestore);

  row.appendChild(deleteButton);
  row.appendChild(overrideButton);
  row.appendChild(restoreButton);
  row.appendChild(restoreHereButton);

  return row;
}

async function handleRestoreHere(e) {
  let window = await browser.windows.getCurrent();
  let confirm;
  if (window.incognito) {
    confirm = (await settings).confirmClosePrivate;
  } else {
    confirm = (await settings).confirmCloseNonPrivate;
  }
  if (confirm) {
    let confirmed = toggleConfirmation(
      this,
      e.target.previousSibling,
      "restoreHerePrompt"
    );
    if (confirmed) {
      restoreHere();
    }
  } else {
    restoreHere();
  }

  async function restoreHere() {
    await handleRestore(e);
    let window = await browser.windows.getCurrent();
    browser.windows.remove(window.id);
  }
}

async function handleOverride(e) {
  let confirm = (await settings).confirmOverride;
  if (confirm) {
    let confirmed = toggleConfirmation(
      this,
      e.target.nextSibling,
      "overridePrompt"
    );
    if (confirmed) {
      override();
    }
  } else {
    override();
  }

  async function override() {
    let id = e.target.parentNode.id;

    let oldEntries = await browser.bookmarks.getChildren(id);
    for (let oldEntry of oldEntries) {
      browser.bookmarks.remove(oldEntry.id);
    }

    saveCurrentWindow(id);
  }
}

function deleteBookmarks(id) {
  browser.bookmarks.removeTree(id);
  document.getElementById("bookmarks").removeChild(document.getElementById(id));
  showOrRemoveWelcome();
}

async function handleDelete(e) {
  let confirm = (await settings).confirmDelete;
  let id = e.target.parentNode.id;

  if (confirm) {
    let confirmed = toggleConfirmation(
      this,
      e.target.nextSibling.nextSibling,
      "deletePrompt"
    );
    if (confirmed) {
      deleteBookmarks(id);
    }
  } else {
    deleteBookmarks(id);
  }
}
async function handleRestore(e) {
  let id = e.target.parentNode.id;
  let deleteAfter = (await settings).deleteAfter;

  browser.runtime.sendMessage({ bookmarkFolderId: id });

  if (deleteAfter) {
    deleteBookmarks(id);
  }
}
