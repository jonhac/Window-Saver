document.addEventListener("DOMContentLoaded", init);

async function init() {
  let params = new URLSearchParams(window.location.search);
  document.body.style.width = params.get("w") + "px";

  document.getElementById("back").addEventListener("click", function () {
    window.location.href = browser.runtime.getURL("popup/popup.html");
  });
  document.getElementById("more").addEventListener("click", function () {
    browser.tabs.create({ url: browser.i18n.getMessage("storeUrl") });
    window.close();
  });
  document.getElementById("bug").addEventListener("click", function () {
    browser.tabs.create({
      url: "https://github.com/jonhac/Window-Saver/issues",
    });
    window.close();
  });

  let info = await browser.management.getSelf();
  let version = info.version;

  document.getElementById("change_header").innerText =
    browser.i18n.getMessage("newIn") + " " + version + ":";
  let log = browser.i18n.getMessage("changelog").split("\n");
  for (let change of log) {
    let element = document.createElement("div");
    element.className = "indented";
    element.innerText = change;
    document.getElementById("changelog").appendChild(element);
  }
}
