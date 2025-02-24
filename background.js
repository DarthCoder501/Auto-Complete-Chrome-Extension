"use strict";

import Groq from "groq-sdk";

let timer = null;
let textBoxContent = "";
let pageContent = "";

// Initialize Groq SDK with API key from chrome.storage
let groq;

// Save the API key to chrome.storage (for testing purposes)
chrome.storage.sync.set({ apiKey: "YOUR_API_KEY" }, () => {
  console.log("API key saved to chrome.storage.sync.");
});

// Function to initialize Groq SDK
async function initializeGroq() {
  console.log("Initializing Groq SDK...");

  // Retrieve the API key from chrome.storage
  const settings = await chrome.storage.sync.get(["apiKey"]);
  console.log("Retrieved API key from chrome.storage:", settings.apiKey);

  if (!settings.apiKey) {
    console.error("Groq API key is not set.");
    return;
  }

  // Initialize the Groq SDK
  groq = new Groq({
    apiKey: settings.apiKey,
  });

  console.log("Groq SDK initialized successfully.");
}

// Initialize Groq SDK when the script loads
initializeGroq();

// Function to update the textbox with LLM suggestions
async function updateTextbox(request, sender) {
  console.log("Updating textbox with LLM suggestions...");

  textBoxContent = request.textBoxContent;

  // Retrieve settings and context from chrome.storage
  const settings = await chrome.storage.sync.get();
  const local_storage = await chrome.storage.local.get();
  const context = local_storage.context;

  console.log("Retrieved settings from chrome.storage:", settings);
  console.log("Retrieved context from chrome.storage.local:", context);

  const context_text = `
  TITLE: ${context.title}.
  DESCRIPTION: ${context.description}.
  PAGE TEXT: ${context.bodyText}`;

  // Construct the messages for the Groq API
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant that uses the context of the webpage and the user's input to provide the most logical and useful completion of the user's text. Provide only the completion, no explanations or other comments. Style your output as if the user were typing it.",
    },
    {
      role: "user",
      content: `The webpage contains the following information:
### ${context_text}
###

The user wrote: ###
${textBoxContent}
###
`,
    },
  ];

  console.log("Constructed messages for Groq API:", messages);

  try {
    // Call the Groq API to get a completion
    const response = await promptLLM(settings, messages);

    // Log the API response
    console.log("API Response:", response);

    // Get the completion from the API response
    const completion = response.choices[0].message.content;

    // Send the completion back to the content script
    chrome.tabs.sendMessage(sender.tab.id, {
      type: "COMPLETION_RECEIVED",
      completion: completion,
    });

    console.log("Completion sent to content script:", completion);
  } catch (error) {
    console.error("Error in updateTextbox:", error);

    // Send an error message back to the content script
    chrome.tabs.sendMessage(sender.tab.id, {
      type: "COMPLETION_ERROR",
      error: error.message,
    });
  }
}

// Function to call the Groq API
async function promptLLM(settings, messages) {
  console.log("Calling Groq API...");

  // Ensure Groq SDK is initialized
  if (!groq) {
    console.log("Groq SDK not initialized. Initializing...");
    await initializeGroq();
    if (!groq) {
      throw new Error("Groq API key is not set.");
    }
  }

  try {
    // Call the Groq API
    const response = await groq.chat.completions.create({
      model: "qwen-2.5-32b", //"deepseek-r1-distill-llama-70b", // Use the appropriate Groq model
      messages: messages,
      temperature: parseFloat(settings.modelTemp),
    });

    console.log("Groq API call successful:", response);
    return response;
  } catch (error) {
    console.error("Groq API call failed:", error);

    // Handle specific error cases
    if (error.message.includes("API key")) {
      throw new Error(
        "Invalid API key. Please check your API key in the extension options."
      );
    } else if (error.message.includes("network")) {
      throw new Error("Network error. Please check your internet connection.");
    } else {
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender) => {
  console.log("Message received from content script:", request);

  if (request.type === "TEXT_BOX_UPDATED") {
    // Cancel the previous timer
    if (timer) {
      clearTimeout(timer);
    }

    // Start a new timer
    timer = setTimeout(() => {
      updateTextbox(request, sender);
    }, 300);
  } else if (request.type === "STORE_CONTEXT") {
    // Store the context in chrome.storage.local
    chrome.storage.local.set({ context: request.context }, () => {
      console.log("Context saved to chrome.storage.local:", request.context);
    });
  }
});

// Listen for changes to the API key in chrome.storage
chrome.storage.onChanged.addListener((changes, area) => {
  console.log("Change detected in chrome.storage:", changes);

  if (area === "sync" && changes.apiKey) {
    console.log("API key updated. Reinitializing Groq SDK...");
    initializeGroq();
  }
});
