document.addEventListener("DOMContentLoaded", init);
  
async function init() {
	loadFolderName();

	browser.bookmarks.onChanged.addListener(handleBookmarkChanges);
	browser.storage.onChanged.addListener(handleStorageChanges);

	document.getElementById('rename').addEventListener('click', renameFolder);	
	document.getElementById('folder_name').addEventListener('keydown', function(e) {
		if (e.key === 'Enter') {
			renameFolder();
		}
	});
	document.getElementById('change').addEventListener('click', changeFolder);	

	loadAfterSettings();
	document.getElementById('delete_after').addEventListener('click', changeDeleteAfter);
} 

// Folder------------------------
async function loadFolderName() {
	let settings = await browser.storage.local.get('folderId');
	let folderId = settings.folderId;
	let folder = await browser.bookmarks.get(folderId);
	folder = folder[0];

	document.getElementById('folder_name').value = folder.title;
}

async function handleBookmarkChanges(id, info) {
	let settings = await browser.storage.local.get('folderId');
	if (id == settings.folderId) {
		loadFolderName();
	}
}
async function handleStorageChanges(changes, areaName) {
	if(areaName === 'local') {
		if (changes.folderId) {
			loadFolderName();
		}
	}
}

async function renameFolder() {
	let name = document.getElementById('folder_name').value;
	let settings = await browser.storage.local.get('folderId');

	if(name === ''){
		loadFolderName();
		return;
	}
	browser.bookmarks.update(settings.folderId, {title: name});
}

async function changeFolder() {
	let name = document.getElementById('folder_name').value;
	if(name === ''){
		loadFolderName();
		return;
	}

	let bp = browser.extension.getBackgroundPage();
	let newId = await bp.findOrCreateFolder(name);
	browser.storage.local.set({ 'folderId': newId });
}

// Close after------------------------

async function loadAfterSettings() {
	let box = document.getElementById('delete_after');
	let setting = await browser.storage.local.get('deleteAfter');
	box.checked = setting.deleteAfter;
}

async function changeDeleteAfter() {
	let box = document.getElementById('delete_after');
	browser.storage.local.set({ deleteAfter: box.checked });
}