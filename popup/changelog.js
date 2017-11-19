document.addEventListener("DOMContentLoaded", init);

let changelog = {
	'1.2': ['- Brand new settings page'
		, '- Displaying changelogs\n'
		, '- Minor style improvements'
	]
	, '1.3': ['- New option to delete stored windows after restoring them'
		, '- Some style improvements'
	]
	, '1.4': ['- Added a placeholder to handle restoring restricted pages like about:config']
	, '1.5': ['- Asks for confirmation before some actions (configurable in settings)\n'
		, '- Some style improvements\n'
		, '- The "delete after restore" setting will be respected for "close and restore" (  ) as well',
	]
	, '1.5.1': ['- Fixed a bug where the confirmations were not displayed correctly']
	, '1.6': ['Style improvements']
};

async function init() {
	let params = new URLSearchParams(window.location.search);
	document.body.style.width = params.get('w') + 'px';

	document.getElementById('back').addEventListener('click', function() {
		window.location.href = browser.extension.getURL('popup/popup.html');
	});
	document.getElementById('more').addEventListener('click', function() {
		browser.tabs.create({ url: 'https://addons.mozilla.org/en-US/firefox/addon/window-saver/versions/' });
		window.close();
	});
	document.getElementById('bug').addEventListener('click', function() {
		browser.tabs.create({ url: 'https://github.com/bit-tinker/Window-Saver/issues' });
		window.close();
	});

	let info = await browser.management.getSelf();
	let version = info.version;

	document.getElementById('change_header').innerText = 'New in ' + version + ':';
	let log = changelog[version];
	for (let change of log) {
		let element = document.createElement('div');
		element.className = 'indented';
		element.innerText = change;
		document.getElementById('changelog').appendChild(element);
	}
}

