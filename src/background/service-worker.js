// Sentinel QA Toolbox - Service Worker
// Handles extension state, messaging, and data export

const MAX_CONSOLE_LOGS = 1000; // Ring buffer limit

chrome.runtime.onInstalled.addListener(() => {
  console.log("Sentinel QA Toolbox installed");
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
  } else if (request.action === 'storeConsoleLog') {
    // Store console log with ring buffer
    chrome.storage.local.get(['consoleLogs'], (result) => {
      let logs = result.consoleLogs || [];
      
      // Add new log
      logs.push(request.log);
      
      // Maintain ring buffer size
      if (logs.length > MAX_CONSOLE_LOGS) {
        logs = logs.slice(-MAX_CONSOLE_LOGS);
      }
      
      chrome.storage.local.set({ consoleLogs: logs });
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
  console.log("Storage changed:", changes, areaName);
});
