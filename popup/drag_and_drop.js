document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mouseleave', handleMouseLeavePopup);

let grabed = null;
let dragStartY;

function handleMouseDown(e) {
	grabed = getValidDragNode(e.target);
	grabed.classList.add('moving');
	dragStartY = e.pageY;
}
function handleMouseEnter(e) {
	if (!grabed || grabed === e.target) {
		return;
	}
	if (e.pageY < dragStartY) {
		e.target.classList.add('drop_over');
	} else {
		e.target.classList.add('drop_under');
	}
}
function handleMouseLeave(e) {
	if (e.target.classList.contains('drop_over')) {
		e.target.classList.remove('drop_over');
	}  else if (e.target.classList.contains('drop_under')) {
		e.target.classList.remove('drop_under');
	}
}
function handleMouseLeavePopup(e) {
	if (grabed) {
		grabed.classList.remove('moving');
		grabed = null;
	}
}
async function handleMouseUp(e) {
	if (!grabed) {
		return;
	}

	let target = getValidDragNode(e.target);

	if (!target) {
		grabed.classList.remove('moving');
		grabed = null;
	} else {
		let targetedIndex = 0;
		
		let runner = target.parentNode.firstChild;
		while (runner !== target) {
			runner = runner.nextSibling;
			targetedIndex++;
		}

		if (target.classList.contains('drop_over')) {
			target.classList.remove('drop_over');
		}  else if (target.classList.contains('drop_under')) {
			target.classList.remove('drop_under');
			target = target.nextSibling;
		} 

		if (target !== grabed) {
			// move the HTML
			let parent = grabed.parentNode;
			parent.removeChild(grabed);
			parent.insertBefore(grabed, target);

			// move the bookmarks
			let settings = await browser.storage.local.get('folderId');
			let folderId = settings.folderId;

			browser.bookmarks.move(
				grabed.id, {parentId: folderId, index: targetedIndex}
			)

			// stop moving
			grabed.classList.remove('moving');
			grabed = null;
		} else {
			grabed.classList.remove('moving');
			grabed = null;
		}
	}
}

function getValidDragNode(node) {
	if (node.parentNode && 'undefined' !== typeof node.parentNode.classList
	&& node.parentNode.classList.contains('session')) {
		return node.parentNode;
	}
	if ('undefined' !== typeof node.classList
	&& node.classList.contains('session')) {
		return node;
	}
	return null;
}