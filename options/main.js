document.addEventListener("DOMContentLoaded", init);
  
async function init() {
	loadFolderName();

	browser.storage.onChanged.addListener(handleStorageChanges);

	document.getElementById('rename').addEventListener('click', renameFolder);	
	document.getElementById('folderName').addEventListener('keydown', function(e) {
		if (e.key === 'Enter') {
			renameFolder();
		}
	});
	document.getElementById('change').addEventListener('click', changeFolder);	
	browser.bookmarks.onChanged.addListener(handleBookmarkChanges);

	let checkBoxes = document.querySelectorAll("input[type='checkbox']");
	for(let box of checkBoxes) {
		loadCheckBox(box, box.id);
		box.addEventListener('click', acceptCheckBox);
	}
}

async function loadCheckBox(element, settingName) {
	let setting = await browser.storage.local.get(settingName);
	element.checked = setting[settingName];
}

function acceptCheckBox() {
	browser.storage.local.set({ [this.id]: this.checked });
}

// Folder------------------------
async function handleStorageChanges(changes, areaName) {
	if(areaName === 'local') {
		if (changes.folderId) {
			loadFolderName();
		}
	}
}

async function loadFolderName() {
	let settings = await browser.storage.local.get('folderId');
	let folderId = settings.folderId;
	let folder = await browser.bookmarks.get(folderId);
	folder = folder[0];

	document.getElementById('folderName').value = folder.title;
}

async function handleBookmarkChanges(id, info) {
	let settings = await browser.storage.local.get('folderId');
	if (id == settings.folderId) {
		loadFolderName();
	}
}


async function renameFolder() {
	let name = document.getElementById('folderName').value;
	let settings = await browser.storage.local.get('folderId');

	if(name === ''){
		loadFolderName();
		return;
	}
	browser.bookmarks.update(settings.folderId, {title: name});
}

async function changeFolder() {
	let name = document.getElementById('folderName').value;
	if(name === ''){
		loadFolderName();
		return;
	}

	let bp = browser.extension.getBackgroundPage();
	bp.findOrCreateFolder(name)
	.then(function(newId) {
		browser.storage.local.set({ 'folderId': newId });
	}).catch(function() {
		window.alert(browser.i18n.getMessage('dublicateError'));
		loadFolderName();
	});
}