export async function findOrCreateBookmarkFolder(name) {
  let results = await browser.bookmarks.search({ title: name });

  if (results.length === 0) {
    let id = await createFolder();
    return id;
  } else if (results.length === 1) {
    return results[0].id;
  } else {
    let candidate = null;
    for (let result of results) {
      if (
        "undefined" == typeof result.url &&
        "unfiled_____" === result.parentId
      ) {
        if (candidate) {
          // more than one valid candidate
          throw new Error("more than one folder with name: " + name);
        } else {
          candidate = result;
        }
      }
    }
    if (candidate) {
      return candidate.id;
    } else {
      return await createFolder();
    }
  }

  async function createFolder() {
    let folder = await browser.bookmarks.create({ title: name });
    return folder.id;
  }
}
export function saveCurrentWindow(bookmarkFolderId) {
  browser.tabs.query({ currentWindow: true }).then((tabList) => {
    for (let i = tabList.length - 1; i >= 0; i--) {
      browser.bookmarks.create({
        parentId: bookmarkFolderId,
        index: i,
        title: tabList[i].title,
        url: tabList[i].url,
      });
    }
  });
}
