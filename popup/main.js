const folderName = 'Window Saver';
let folderId = new Promise (function(suc, fail) {
	browser.bookmarks.search({ title: folderName })
	.then(function (results) {
		if (results.length === 0) {
			createFolder();
		} else if (results.length === 1) {
			return suc(results[0].id);
		} else {
			let candidate = null;
			for (let result of results) {
				if ('undefined' == typeof result.url && 'unfiled_____' === result.parentId) {
					// found valid candidate
					if (candidate) {
						let warning = document.createElement('div');
						warning.id = 'warning';
						warning.textContent = 'More than one top-level bookmark folder with the name "' 
						+ folderName +'" was found. Please rename or delete all but one and try again.';

						while(document.body.firstChild) {
							document.body.removeChild(document.body.firstChild);
						}
						document.body.appendChild(warning);

						return fail();
					} else {
						candidate = result;
					}
				}
			}
			if (candidate) {
				return suc(candidate.id);
			} else {
				createFolder();
			}
		}
	});

	function createFolder() {
		browser.bookmarks.create({ title: folderName })
		.then(function (folder) {
			suc(folder.id);
		});
	}
});
window.addEventListener('load', listSaved);
document.getElementById('save').addEventListener('click', handleSave);
document.getElementById('name_input').addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		handleSave();
	}
});

function handleSave() {
	folderId.then(function (pId) {
		let sName = document.getElementById('name_input').value;
		if (sName === '') {
			let date = new Date();
			sName = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate()
				+ ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
		}
		browser.bookmarks.create({ parentId: pId, index: 0, title: sName })
		.then(function (sFolder) { 
			saveSession(sFolder.id);
			let dom = buildSessionDom(sFolder);
			let bookmars = document.getElementById('bookmarks');
			bookmars.insertBefore(dom, bookmars.firstChild);
		});
	});
}

function listSaved() {
	folderId.then(browser.bookmarks.getChildren)
	.then(function (sessions) {
		let list = document.getElementById('bookmarks');
		while(list.firstChild) {
			list.removeChild(list.firstChild);
		}
		let bookmarks = document.getElementById('bookmarks');
		for(let session of sessions) {
			let dom = buildSessionDom(session);
			bookmarks.appendChild(dom);
		}
	});
}

function buildSessionDom(bookmark) {
	let row = document.createElement('div');
	row.id = bookmark.id;
	row.className = 'session';
	// mouse event handlers are in drag_and_drop.js
	row.addEventListener('mousedown', handleMouseDown);
	row.addEventListener('mouseenter', handleMouseEnter);
	row.addEventListener('mouseleave', handleMouseLeave);

	let restoreHereButton = document.createElement('input');
	restoreHereButton.type = 'button';
	restoreHereButton.className = 'restore_here_button';
	restoreHereButton.value = '⬆';
	restoreHereButton.title = 'Close active and open saved window',
	row.appendChild(restoreHereButton);
	restoreHereButton.addEventListener('click', handleRestoreHere);

	let overrideButton = document.createElement('input');
	overrideButton.type = 'button';
	overrideButton.className = 'override_button';
	overrideButton.title = 'Override saved with active window',
	overrideButton.value = '⬇';
	row.appendChild(overrideButton);
	overrideButton.addEventListener('click', handleOverride);

	let deleteButton = document.createElement('input');
	deleteButton.type = 'button';
	deleteButton.className = 'delete_button';
	deleteButton.title = 'Delete saved window',
	deleteButton.value = '🗙';
	row.appendChild(deleteButton);
	deleteButton.addEventListener('click', handleDelete);

	let restoreButton = document.createElement('input');
	restoreButton.type = 'button';
	restoreButton.className = 'restore_button';
	restoreButton.value = bookmark.title;
	restoreButton.title = 'Restore saved window',
	row.appendChild(restoreButton);
	restoreButton.addEventListener('click', handleRestore);
	
	return row;
}

function handleRestoreHere(e) {
	handleRestore(e);
	browser.windows.getCurrent()
	.then(function(window) {
		browser.windows.remove(window.id);
	});
}

function saveSession(folderId) {
	browser.tabs.query({ currentWindow: true })
	.then(function (tabList) {
		for (let i = tabList.length-1; i >=0; i--) {
			browser.bookmarks.create({ parentId: folderId
				, index: i, title: tabList[i].title, url: tabList[i].url });
		}
	});
}

function handleOverride(e) {
	let id = e.target.parentNode.id;
	
	browser.bookmarks.getChildren(id)
	.then(function (oldEntries) {
		for(let oldEntry of oldEntries) {
			browser.bookmarks.remove(oldEntry.id);
		}
	})
	.then(saveSession(id));
}

function handleDelete(e) {
	let id = e.target.parentNode.id;
	browser.bookmarks.removeTree(id)
	.then(document.getElementById('bookmarks').removeChild(document.getElementById(id)));
}
function handleRestore(e) {
	let id = e.target.parentNode.id;
	browser.bookmarks.getChildren(id)
	.then(function (tabs) {
		let adresses = Array();
		for (let tab of tabs) {
			// Filter out priviledged URLs as they cannot be opened by an extension.
			// see: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/create
			let forbidden = false;
			if ('undefined' == typeof tab.url
				|| tab.url.indexOf('chrome:') === 0
				|| tab.url.indexOf('javascript:') === 0 	
				|| tab.url.indexOf('data:') === 0 	
				|| tab.url.indexOf('file:') === 0) {
				continue;
			}
			if (tab.url.indexOf('about') === 0 
				&& tab.url.indexOf('about:blank') !== 0) {
					continue;
			}
			
			adresses.push(tab.url);
		}
		browser.windows.create({ url: adresses});
	});
}
