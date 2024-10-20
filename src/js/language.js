// Update elements with either manifest data or i18n messages
document.querySelectorAll("[data-manifest], [data-i18n]").forEach(element => {
  const manifestKey = element.dataset.manifest;
  const i18nKey = element.dataset.i18n;

  if (manifestKey) {
    element.textContent = Manifest[manifestKey];
  } else if (i18nKey) {
    element.textContent = browser.i18n.getMessage(i18nKey);
  }
});