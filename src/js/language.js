document.querySelectorAll("[data-manifest], [data-i18n]").forEach(element => {
  if (element.dataset.manifest) {
    element.textContent = Manifest[element.dataset.manifest];
  } else if (element.dataset.i18n) {
    element.textContent = browser.i18n.getMessage(element.dataset.i18n);
  }
});