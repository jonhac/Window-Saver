document.addEventListener("DOMContentLoaded", init);

let changelog = {
	1.2: '- Brand new settings page\n- Displaying changelogs\n- Minor style improvements'
};

async function init() {
	document.getElementById('back').addEventListener('click', function() {
		window.location.href = browser.extension.getURL('popup/popup.html');
	});

	let info = await browser.management.getSelf();
	let version = info.version;

	document.getElementById('change_header').innerText = 'new in ' + version;
	document.getElementById('changelog').innerText = changelog[version];
}

