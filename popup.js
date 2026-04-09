// ChillMode — Popup

document.addEventListener("DOMContentLoaded", () => {
  const enabledToggle = document.getElementById("enabled");
  const statsEl = document.getElementById("stats");
  const settingsLink = document.getElementById("openSettings");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");

  // Check provider status
  async function checkStatus() {
    const settings = await chrome.storage.sync.get({ apiKey: "", provider: "auto" });

    let ollamaOk = false;
    try {
      const res = await fetch("http://localhost:11435", {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      ollamaOk = res.ok;
    } catch {
      ollamaOk = false;
    }

    if (ollamaOk) {
      statusDot.className = "status-dot green";
      statusText.textContent = "Ollama connected";
    } else if (settings.apiKey) {
      statusDot.className = "status-dot yellow";
      statusText.textContent = "Using Anthropic API";
    } else {
      statusDot.className = "status-dot red";
      statusText.textContent = "No provider configured";
    }
  }

  checkStatus();

  // Load state
  chrome.storage.sync.get({ enabled: true }, (settings) => {
    enabledToggle.checked = settings.enabled;
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
