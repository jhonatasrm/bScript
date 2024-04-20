var backgroundPage = browser.extension.getBackgroundPage();

var version = document.getElementById("version");
var manifest = browser.runtime.getManifest();
version.textContent = `${manifest.name} (v${manifest.version})`;

document.addEventListener("DOMContentLoaded", function() {
  var radios = document.querySelectorAll('input[name="contextMenu"]');
  var val = localStorage.getItem("contextMenu");
  radios.forEach(radio => {
    if (radio.value === val) {
      radio.checked = true;
    }
    radio.addEventListener("change", function() {
      localStorage.setItem("contextMenu", this.value);
      backgroundPage.startContextMenu();
    });
  });
});