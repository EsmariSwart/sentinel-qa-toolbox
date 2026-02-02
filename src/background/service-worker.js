// Sentinel QA Toolbox - Service Worker
// Handles extension state, messaging, and data export

chrome.runtime.onInstalled.addListener(() => {
  console.log('Sentinel QA Toolbox installed');
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleRuler') {
    // Broadcast to all tabs
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleRuler', enabled: request.enabled });
      }
    });
    sendResponse({ success: true });
  } else if (request.action === 'toggleTypography') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleTypography', enabled: request.enabled });
      }
    });
    sendResponse({ success: true });
  } else if (request.action === 'exportData') {
    // Handle data export (to be implemented)
    sendResponse({ success: true });
  }
  return true; // Keep channel open for async response
});

// Get current state from storage
chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log('Storage changed:', changes, areaName);
});
