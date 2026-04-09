// Calm Feed — Options Page

document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("apiKey");
  const thresholdSelect = document.getElementById("threshold");
  const modelSelect = document.getElementById("model");
  const saveButton = document.getElementById("save");
  const statusEl = document.getElementById("status");

  // Load saved settings
  chrome.storage.sync.get(
    {
      apiKey: "",
      threshold: 3,
      model: "claude-sonnet-4-20250514",
    },
    (settings) => {
      apiKeyInput.value = settings.apiKey;
      thresholdSelect.value = String(settings.threshold);
      modelSelect.value = settings.model;
    }
  );

  saveButton.addEventListener("click", () => {
    const settings = {
      apiKey: apiKeyInput.value.trim(),
      threshold: parseInt(thresholdSelect.value, 10),
      model: modelSelect.value,
    };

    chrome.storage.sync.set(settings, () => {
      statusEl.classList.add("visible");
      setTimeout(() => statusEl.classList.remove("visible"), 2000);
    });
  });
});
