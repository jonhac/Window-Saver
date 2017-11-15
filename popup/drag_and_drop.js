document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mouseleave', handleMouseLeavePopup);

let dragging = null;
let dragStartY;

function stopDragging() {
	dragging.classList.remove('moving');
	dragging = null;
}

function handleMouseDown(e) {
	dragging = getValidDragNode(e.target);
	dragging.classList.add('moving');
	dragStartY = e.pageY;
}
function handleMouseEnter(e) {
	if (!dragging || dragging === e.target) {
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
	if (dragging) {
		stopDragging();
	}
}
async function handleMouseUp(e) {
	if (!dragging) {
		return;
	}

	let target = getValidDragNode(e.target);

	if (!target) {
		stopDragging();
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

		if (target !== dragging) {
			// move the HTML
			let parent = dragging.parentNode;
			parent.removeChild(dragging);
			parent.insertBefore(dragging, target);

			// move the bookmarks
			let settings = await browser.storage.local.get('folderId');
			let folderId = settings.folderId;

			browser.bookmarks.move(
				dragging.id, {parentId: folderId, index: targetedIndex}
			)

			stopDragging();
		} else {
			stopDragging();
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