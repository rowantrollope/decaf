// ChillMode — Options Page

document.addEventListener("DOMContentLoaded", () => {
  const providerSelect = document.getElementById("provider");
  const ollamaModelSelect = document.getElementById("ollamaModel");
  const ollamaModelField = document.getElementById("ollamaModelField");
  const customModelField = document.getElementById("customModelField");
  const customModelInput = document.getElementById("customOllamaModel");
  const apiKeyInput = document.getElementById("apiKey");
  const apiKeyField = document.getElementById("apiKeyField");
  const claudeModelField = document.getElementById("claudeModelField");
  const thresholdSelect = document.getElementById("threshold");
  const modelSelect = document.getElementById("model");
  const saveButton = document.getElementById("save");
  const statusEl = document.getElementById("status");

  function updateFieldVisibility() {
    const provider = providerSelect.value;
    const showOllama = provider === "ollama" || provider === "auto";
    const showAnthropic = provider === "anthropic" || provider === "auto";

    ollamaModelField.classList.toggle("hidden", !showOllama);
    customModelField.classList.toggle("hidden", !showOllama || ollamaModelSelect.value !== "custom");
    apiKeyField.classList.toggle("hidden", !showAnthropic);
    claudeModelField.classList.toggle("hidden", !showAnthropic);
  }

  providerSelect.addEventListener("change", updateFieldVisibility);
  ollamaModelSelect.addEventListener("change", updateFieldVisibility);

  // Load saved settings
  chrome.storage.sync.get(
    {
      apiKey: "",
      threshold: 3,
      model: "claude-sonnet-4-20250514",
      provider: "auto",
      ollamaModel: "llama3.2:3b",
      customOllamaModel: "",
    },
    (settings) => {
      apiKeyInput.value = settings.apiKey;
      thresholdSelect.value = String(settings.threshold);
      modelSelect.value = settings.model;
      providerSelect.value = settings.provider;
      ollamaModelSelect.value = settings.ollamaModel;
      customModelInput.value = settings.customOllamaModel;
      updateFieldVisibility();
    }
  );

  saveButton.addEventListener("click", () => {
    const settings = {
      apiKey: apiKeyInput.value.trim(),
      threshold: parseInt(thresholdSelect.value, 10),
      model: modelSelect.value,
      provider: providerSelect.value,
      ollamaModel: ollamaModelSelect.value,
      customOllamaModel: customModelInput.value.trim(),
    };

    chrome.storage.sync.set(settings, () => {
      statusEl.classList.add("visible");
      setTimeout(() => statusEl.classList.remove("visible"), 2000);
    });
  });
});
