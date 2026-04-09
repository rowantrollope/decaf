// Calm Feed — Popup

document.addEventListener("DOMContentLoaded", () => {
  const enabledToggle = document.getElementById("enabled");
  const noKeyEl = document.getElementById("noKey");
  const statsEl = document.getElementById("stats");
  const settingsLink = document.getElementById("openSettings");

  // Load state
  chrome.storage.sync.get({ enabled: true, apiKey: "" }, (settings) => {
    enabledToggle.checked = settings.enabled;
    if (!settings.apiKey) {
      noKeyEl.style.display = "block";
    }
  });

  // Show cache stats
  chrome.storage.local.get("calmFeedCache", (result) => {
    const cache = result.calmFeedCache || {};
    const count = Object.keys(cache).length;
    statsEl.innerHTML = `<strong>${count}</strong> rewritten post${count !== 1 ? "s" : ""} cached`;
  });

  // Toggle
  enabledToggle.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: enabledToggle.checked });
  });

  // Settings link
  settingsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});
