/*
document.getElementById("save").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value;
  chrome.storage.sync.set({ apiKey }, () => {
    console.log("API key saved.");
  });
});

// Load the saved API key
chrome.storage.sync.get("apiKey", (data) => {
  if (data.apiKey) {
    document.getElementById("apiKey").value = data.apiKey;
  }
});
*/

document.addEventListener("DOMContentLoaded", () => {
  const settingsForm = document.getElementById("settingsForm");

  // Handle form submission
  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    const apiKey = document.getElementById("apiKey").value;
    const modelTemp = document.getElementById("modelTemp").value;

    // Save settings to chrome.storage.sync
    chrome.storage.sync.set({ apiKey, modelTemp }, () => {
      console.log("Settings saved.");
    });
  });

  // Load saved settings
  chrome.storage.sync.get(["apiKey", "modelTemp"], (data) => {
    if (data.apiKey) {
      document.getElementById("apiKey").value = data.apiKey;
    }
    if (data.modelTemp) {
      document.getElementById("modelTemp").value = data.modelTemp;
    }
  });
});
