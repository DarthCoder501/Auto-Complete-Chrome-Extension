"use strict";

let debug = false;

// Function to check if an element is a valid input field
function isValidInputField(element) {
  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    (element.tagName === "DIV" && element.isContentEditable)
  );
}

// Function to insert a completion tooltip near the input field
function insertCompletion(completion) {
  const tooltip = document.createElement("div");
  tooltip.textContent = completion;
  tooltip.style.position = "absolute";
  tooltip.style.backgroundColor = "yellow";
  tooltip.style.border = "1px solid black";
  tooltip.style.padding = "5px";
  tooltip.style.zIndex = "1000";
  document.body.appendChild(tooltip);
  return tooltip;
}

/* Listen for events on textboxes */

// React on focus events on textboxes
document.addEventListener(
  "focus",
  (event) => {
    if (!isValidInputField(event.target)) return;

    // Extract meaningful information from the page
    const title = document.title;
    const description =
      document.querySelector('meta[name="description"]')?.content || "";
    const bodyText = document.body.innerText;

    // Send a message to the background script to store the context
    chrome.runtime.sendMessage({
      type: "STORE_CONTEXT",
      context: { title, description, bodyText },
    });
  },
  true
);

// React on input events on textboxes
document.addEventListener(
  "input",
  (event) => {
    if (!isValidInputField(event.target)) return;

    // Collect the last character of the input text
    let lastChar = event.target.value.slice(-1);

    // If the last character is not a whitespace or newline, return
    if (lastChar !== " " && lastChar !== "\n") {
      return;
    }

    // Insert a "Thinking..." tooltip
    const tooltip = insertCompletion("Thinking...");

    // Remove the tooltip when the user presses any key
    event.target.addEventListener("keypress", function (e) {
      tooltip.remove();
    });

    // Send a message to the background script with the updated textbox content
    chrome.runtime.sendMessage({
      type: "TEXT_BOX_UPDATED",
      textBoxContent: event.target.value,
    });
  },
  true
);

/* Listen for messages from the background script */

// This section of code is responsible for listening to messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // We'll insert the completion into the currently active (focused) element
  let textBox = document.activeElement;

  // Stop if the message type is not COMPLETION_RECEIVED, or if the completion is not valid, or if the textbox is not a valid textbox
  if (
    request.type !== "COMPLETION_RECEIVED" ||
    !request.completion ||
    !isValidInputField(textBox)
  ) {
    return;
  }

  // Insert the completion tooltip
  const tooltip = insertCompletion(request.completion);

  // Handle keydown events on the textbox
  textBox.addEventListener("keydown", function (e) {
    // If the user presses the 'Tab' key while the tooltip is visible, insert the completion into the textbox
    if (e.key === "Tab") {
      e.preventDefault();

      // Get the current cursor position
      const cursorPosition = textBox.selectionStart;

      // Insert the completion at the cursor position
      textBox.value =
        textBox.value.slice(0, cursorPosition) +
        tooltip.textContent + // Uses the tooltip's text content
        //request.completion +
        textBox.value.slice(cursorPosition);

      // Move the cursor to the end of the inserted text
      textBox.selectionStart = cursorPosition + request.completion.length;
      textBox.selectionEnd = cursorPosition + request.completion.length;

      // Remove the tooltip
      tooltip.remove();
    }

    // If the user presses the 'Escape' key, remove the tooltip
    if (e.key === "Escape") {
      tooltip.remove();
    }

    // If the user presses any key while the tooltip is visible, remove the tooltip
    if (e.key.length > 1 && e.key !== " " && e.key !== "\n") {
      return;
    }

    // Remove the tooltip
    tooltip.remove();
  });
});
