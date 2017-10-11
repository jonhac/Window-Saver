const folderName = 'Saved Sessions';
let folderId;
browser.bookmarks.search({ title: folderName })
.then(function (results) {
	if (results.length === 0) {
		browser.bookmarks.create({ title: folderName }).then(function (folder) {
			folderId = Promise.resolve(folder.id);
		});
	} else if (results.length === 1) {
		folderId = Promise.resolve(results[0].id);
	} else {
		throw (new Error('to do'));
	}
})
.then(listSaved);

document.getElementById('save').addEventListener('click', function() {
	folderId.then(function (pId) {
		let sName = document.getElementById('name_input').value;
		if (sName === '') {
			sName = new Date().toString();
		}
		browser.bookmarks.create({ parentId: pId, index: 0, title: sName })
		.then(saveSession)
		.then(listSaved);
	});
});

function listSaved() {
	folderId.then(browser.bookmarks.getChildren)
	.then(function (sessions) {
		let list = document.getElementById('bookmarks');
		while(list.firstChild) {
			list.removeChild(list.firstChild);
		}
		for(let session of sessions) {
			let row = document.createElement('div');
			row.id = session.id;
			row.className = 'session';

			let restoreHereButton = document.createElement('input');
			restoreHereButton.type = 'button';
			restoreHereButton.className = 'restore_here_button';
			restoreHereButton.value = '⬆';
			restoreHereButton.title = 'Replace active with saved session',
			row.appendChild(restoreHereButton);
			restoreHereButton.addEventListener('click', openSessionHere);

			let overrideButton = document.createElement('input');
			overrideButton.type = 'button';
			overrideButton.className = 'override_button';
			overrideButton.title = 'Replace saved with active session',
			overrideButton.value = '⬇';
			row.appendChild(overrideButton);
			overrideButton.addEventListener('click', overrideSession);

			let deleteButton = document.createElement('input');
			deleteButton.type = 'button';
			deleteButton.className = 'delete_button';
			deleteButton.title = 'Delete saved session',
			deleteButton.value = '🗙';
			row.appendChild(deleteButton);
			deleteButton.addEventListener('click', deleteSession);

			let restoreButton = document.createElement('input');
			restoreButton.type = 'button';
			restoreButton.className = 'restore_button';
			restoreButton.value = session.title;
			restoreButton.title = 'Open saved session in new window',
			row.appendChild(restoreButton);
			restoreButton.addEventListener('click', openSession);
			
			list.appendChild(row);
		}
	});
}

function openSessionHere(e) {
	openSession(e);
	browser.windows.getCurrent()
	.then(function(window) {
		browser.windows.remove(window.id);
	});
}

function saveSession(sFolder) {
	browser.tabs.query({ currentWindow: true })
	.then(function (tabList) {
		for (let i = tabList.length-1; i >=0; i--) {
			browser.bookmarks.create({ parentId: sFolder.id
				, index: i, title: tabList[i].title, url: tabList[i].url });
		}
	});
}

function overrideSession(e) {
	let id = e.target.parentNode.id;
	let name;
	let index;

	browser.bookmarks.get(id)
	.then(function(folder) {
		name = folder[0].title;
		index = folder[0].index;
	}).then(function() {
		browser.bookmarks.removeTree(id)
		.then(folderId.then(function(pId) {
			browser.bookmarks.create({parentId: pId, index: index, title: name})
			.then(saveSession);
		}));
	});	
}

function deleteSession(e) {
	let id = e.target.parentNode.id;
	browser.bookmarks.removeTree(id)
	.then(listSaved);
}

function openSession(e) {
	let id = e.target.parentNode.id;
	console.log('restoring: ' + id);
	browser.bookmarks.getChildren(id)
	.then(function (tabs) {
		let adresses = Array();
		for (let tab of tabs) {
			// Filter out priviledged URLs as they cannot be opened by an extension.
			// see: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/create
			let forbidden = false;
			if (tab.url.indexOf('chrome:') === 0
				|| tab.url.indexOf('javascript:') === 0 	
				|| tab.url.indexOf('data:') === 0 	
				|| tab.url.indexOf('file:') === 0) {
				continue;
			}
			if (tab.url.indexOf('about') === 0) {
				if (tab.url.indexOf('about:newtab')) {
					adresses.push('');
				} else if (tab.url.indexOf('about:blank') !== 0) {
					continue;
				}
			}
			adresses.push(tab.url);
		}
		browser.windows.create({ url: adresses});
	});
}
