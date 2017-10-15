window.addEventListener('load', listSaved);
document.getElementById('save').addEventListener('click', handleSave);
document.getElementById('name_input').addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		handleSave();
	}
});
document.getElementById('settings').addEventListener('click', function(e) {
	browser.runtime.openOptionsPage();
	window.close();
});
document.getElementById('version').addEventListener('click', function() {
	window.location.href = browser.extension.getURL('popup/changelog.html');
});
displayVersion();

async function displayVersion() {
	let info = await browser.management.getSelf();
	document.getElementById('version').innerText = info.version;
};

async function handleSave() {
	let settings = await browser.storage.local.get('folderId');
	let folderId = settings.folderId;

	let name = document.getElementById('name_input').value;
	if (name === '') {
		let date = new Date();
		name = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate()
			+ ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
	}

	let windowFolder = await browser.bookmarks.create({ parentId: folderId, index: 0, title: name })
	saveSession(windowFolder.id);

	let dom = buildSessionDom(windowFolder);
	let bookmarks = document.getElementById('bookmarks');
	bookmarks.insertBefore(dom, bookmarks.firstChild);
}

async function listSaved() {
		let settings = await browser.storage.local.get('folderId');
		let folderId = settings.folderId;
		let sessions = await browser.bookmarks.getChildren(folderId);

		let list = document.getElementById('bookmarks');
		while(list.firstChild) {
			list.removeChild(list.firstChild);
		}
		let bookmarks = document.getElementById('bookmarks');
		for(let session of sessions) {
			let dom = buildSessionDom(session);
			bookmarks.appendChild(dom);
		}
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

async function handleRestoreHere(e) {
	handleRestore(e);
	let window = await browser.windows.getCurrent();
	browser.windows.remove(window.id);
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

async function handleOverride(e) {
	let id = e.target.parentNode.id;	

	let oldEntries = await browser.bookmarks.getChildren(id);
	for(let oldEntry of oldEntries) {
		browser.bookmarks.remove(oldEntry.id);
	}

	saveSession(id);
}

function handleDelete(e) {
	let id = e.target.parentNode.id;

	browser.bookmarks.removeTree(id);
	document.getElementById('bookmarks').removeChild(document.getElementById(id));
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
