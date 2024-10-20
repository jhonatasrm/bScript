// Access the background page
const backgroundPage = browser.extension.getBackgroundPage();

// Get manifest information and set the version text
const versionElement = document.getElementById("version");
const manifest = browser.runtime.getManifest();
versionElement.textContent = `${manifest.name} (v${manifest.version})`;

// Handle DOMContentLoaded event
document.addEventListener("DOMContentLoaded", () => {
  const radios = document.querySelectorAll('input[name="contextMenu"]');
  const savedContextMenu = localStorage.getItem("contextMenu");

  // Set the correct radio button based on saved contextMenu value
  radios.forEach((radio) => {
    if (radio.value === savedContextMenu) {
      radio.checked = true;
    }

    // Listen for changes to update localStorage and restart context menu
    radio.addEventListener("change", function() {
      localStorage.setItem("contextMenu", this.value);
      backgroundPage.startContextMenu();
    });
  });
});
