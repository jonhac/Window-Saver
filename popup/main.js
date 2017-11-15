let settings = browser.storage.local.get(['folderId', 'confirmSavePrivate'
	, 'confirmDelete', 'confirmOverride', 'confirmCloseNonPrivate'
	, 'confirmClosePrivate', 'deleteAfter']);;

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
	window.location.href = browser.extension.getURL('popup/changelog.html?w=' + document.body.clientWidth);
});
displayVersion();

async function displayVersion() {
	let info = await browser.management.getSelf();
	document.getElementById('version').innerText = info.version;
};


let confirmationSender = null;
let confirmationLocation = null;
function toggleConfirmation(sender, location, message) {
	if (confirmationSender !== null) {
		let confirmed = (confirmationSender === sender);
		cancelConfirmation();
		return confirmed;
	} else {
		confirmationSender = sender;

		let element = document.createElement('div');
		element.id = 'confirmation';
		element.innerText = message;

		confirmationLocation = location;
		confirmationLocation.replaceWith(element);

		confirmationSender.addEventListener('mouseleave', cancelConfirmation);

		return false;
	}
}

function cancelConfirmation() {
	confirmationSender.removeEventListener('mouseleave', cancelConfirmation);

	let element = document.getElementById('confirmation');
	element.replaceWith(confirmationLocation);

	confirmationLocation = null;
	confirmationSender = null;
}

async function handleSave() {

	let confirmIncognito = (await settings).confirmSavePrivate;

	if (confirmIncognito) {
		let window = await browser.windows.getCurrent();
		if (window.incognito) {
			let confirmed = toggleConfirmation(
				document.getElementById('save')
				, document.getElementById('name_input')
				, 'save private window?');
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
		let name = document.getElementById('name_input').value;
		if (name === '') {
			let date = new Date();
			name = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate()
				+ ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
		}

		let folderId = (await settings).folderId;
		let windowFolder = await browser.bookmarks.create({ parentId: folderId, index: 0, title: name })
		saveSession(windowFolder.id);

		let dom = buildEntryDom(windowFolder);
		let bookmarks = document.getElementById('bookmarks');
		showOrRemoveWelcome();
		bookmarks.insertBefore(dom, bookmarks.firstChild);
	}
}

async function listSaved() {
		let windows = await browser.bookmarks.getChildren((await settings).folderId);

		let list = document.getElementById('bookmarks');
		while(list.firstChild) {
			list.removeChild(list.firstChild);
		}
		
		for(let window of windows) {
			let dom = buildEntryDom(window);
			list.appendChild(dom);
		}
		showOrRemoveWelcome();
}

function showOrRemoveWelcome() {
	let list = document.getElementById('bookmarks');
	if (list.childNodes.length === 0) {
		let welcome = document.createElement('div');
		welcome.id = 'welcome';
		welcome.innerText = 'Welcome to Window Saver!\n Hit the save button to get started.';
		list.appendChild(welcome);
	} else if (list.childNodes.length === 1) {
		if (list.firstChild.id === 'welcome') {
			list.removeChild(list.firstChild);
		}
	}
}

function buildEntryDom(bookmark) {
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
	restoreHereButton.title = 'Close active and open saved window';
	restoreHereButton.value = '';
	restoreHereButton.addEventListener('click', handleRestoreHere);

	let overrideButton = document.createElement('input');
	overrideButton.type = 'button';
	overrideButton.className = 'override_button';
	overrideButton.title = 'Override saved with active window';
	overrideButton.value = '';
	overrideButton.addEventListener('click', handleOverride);

	let deleteButton = document.createElement('input');
	deleteButton.type = 'button';
	deleteButton.className = 'delete_button';
	deleteButton.title = 'Delete saved window';
	deleteButton.value = '✖';
	deleteButton.addEventListener('click', handleDelete);

	let restoreButton = document.createElement('input');
	restoreButton.type = 'button';
	restoreButton.className = 'restore_button';
	restoreButton.title = 'Open saved window';
	restoreButton.value = bookmark.title;
	restoreButton.addEventListener('click', handleRestore);

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
				this
				, e.target.previousSibling
				, 'close active window?');
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

	let confirm = (await settings).confirmOverride;
	if (confirm) {
			let confirmed = toggleConfirmation(
				this
				, e.target.nextSibling
				, 'override?');
			if (confirmed) {
				override();
			}
	} else {
		override();
	}

	async function override() {
		let id = e.target.parentNode.id;	

		let oldEntries = await browser.bookmarks.getChildren(id);
		for(let oldEntry of oldEntries) {
			browser.bookmarks.remove(oldEntry.id);
		}

		saveSession(id);
	}
}

function deleteBookmarks(id) {
	browser.bookmarks.removeTree(id);
	document.getElementById('bookmarks').removeChild(document.getElementById(id));
	showOrRemoveWelcome();
}

async function handleDelete(e) {
	let confirm = (await settings).confirmDelete;
	let id = e.target.parentNode.id;

	if (confirm) {
		let confirmed = toggleConfirmation(this, e.target.nextSibling.nextSibling, 'delete?');
		if (confirmed) {
			deleteBookmarks(id);
		}
	} else {
		deleteBookmarks(id);
	}
}
async function handleRestore(e) {
	let id = e.target.parentNode.id;
	let tabs = await browser.bookmarks.getChildren(id);

	let addresses = new Array();
	for (let tab of tabs) {
		// Filter out priviledged URLs as they cannot be opened by an extension.
		// see: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/create
		if ('undefined' == typeof tab.url
		|| tab.url.indexOf('chrome:') === 0
		|| tab.url.indexOf('javascript:') === 0 	
		|| tab.url.indexOf('data:') === 0 	
		|| tab.url.indexOf('file:') === 0 
		|| (tab.url.indexOf('about:') === 0 && tab.url.indexOf('about:blank') !== 0)) {
			addresses.push(browser.extension.getURL(
				'placeholder/placeholder.html?r=' + tab.url + '&t=' + tab.title));
		} else {
			addresses.push(tab.url);
		}
	}
	browser.windows.create({ url: addresses});

	let settings = await browser.storage.local.get('deleteAfter');
	if (settings.deleteAfter) {
		deleteBookmarks(id);
	}
}
