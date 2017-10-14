document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mouseleave', handleMouseLeavePopup);

let draged = null;
let dragStartY;

function handleMouseDown(e) {
	draged = getValidDragNode(e.target);
	draged.classList.add('moving');
	dragStartY = e.pageY;
}
function handleMouseEnter(e) {
	if (!draged || draged === e.target) {
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
	if (draged) {
		draged.classList.remove('moving');
		draged = null;
	}
}
function handleMouseUp(e) {
	if (!draged) {
		return;
	}

	let target = getValidDragNode(e.target);

	if (!target) {
		draged.classList.remove('moving');
		draged = null;
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

		if (target !== draged) {
			// move the HTML
			let parent = draged.parentNode;
			parent.removeChild(draged);
			parent.insertBefore(draged, target);

			// move the bookmarks
			folderId.then(function(pId) {
				browser.bookmarks.move(
					draged.id, {parentId: pId, index: targetedIndex}
				);
			}).then (function () {
				draged.classList.remove('moving');
				draged = null;
			});
		} else {
			draged.classList.remove('moving');
			draged = null;
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