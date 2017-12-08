// Searches the HTML and fills placeholders of the form __MSG_*__ 
function replaceHtmlLocalizedStrings() {
    let tags = document.getElementsByTagName('html');
    for (let tag of tags) {
        let oldText = tag.innerHTML.toString();
        let replaced = oldText.replace(/__MSG_(\w+)__/g, function(match, v1) {
            if (v1) {
                return chrome.i18n.getMessage(v1);
            } else {
                return '';
            }
        });

        if(oldText !== replaced) {
            tag.innerHTML = replaced;
        }
    }
}

document.addEventListener("DOMContentLoaded", replaceHtmlLocalizedStrings);