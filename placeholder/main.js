document.addEventListener("DOMContentLoaded", init);

async function init() {
	let params = new URLSearchParams(window.location.search);
	let url = params.get('r');

	let title = params.get('t');
	if(!title) {
		title = url;
	}
	
	document.title = browser.i18n.getMessage('placeholderTitlePrefix') + ' "' + title + '"';
	let r = document.getElementById('restricted');
	r.innerText = url;
} 