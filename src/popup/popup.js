// Sentinel QA Toolbox - Popup Logic

let rulerEnabled = false;
let typographyEnabled = false;
let consoleCaptureEnabled = false;
let currentViewport = { width: 0, height: 0, devicePixelRatio: 1 };

// Load saved state
chrome.storage.local.get(["rulerEnabled", "typographyEnabled", "consoleCaptureEnabled"], (result) => {
  rulerEnabled = result.rulerEnabled || false;
  typographyEnabled = result.typographyEnabled || false;
  consoleCaptureEnabled = result.consoleCaptureEnabled || false;
  updateButtonStates();
  updateViewportInfo();
});

function updateButtonStates() {
  const rulerBtn = document.getElementById("toggleRuler");
  const typeBtn = document.getElementById("auditType");
  const consoleBtn = document.getElementById("toggleConsole");
  const consoleFilters = document.getElementById("consoleFilters");

  if (rulerEnabled) {
    rulerBtn.classList.add("active");
    rulerBtn.textContent = "Ruler: ON";
  } else {
    rulerBtn.classList.remove("active");
    rulerBtn.textContent = "Ruler: OFF";
  }

  if (typographyEnabled) {
    typeBtn.classList.add("active");
    typeBtn.textContent = "Typography: ON";
  } else {
    typeBtn.classList.remove("active");
    typeBtn.textContent = "Typography: OFF";
  }

  if (consoleCaptureEnabled) {
    consoleBtn.classList.add("active");
    consoleBtn.textContent = "Console Capture: ON";
    consoleFilters.style.display = "block";
  } else {
    consoleBtn.classList.remove("active");
    consoleBtn.textContent = "Console Capture: OFF";
    consoleFilters.style.display = "none";
  }
}

function updateViewportInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getViewportInfo" }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script might not be ready
          const viewportInfo = document.getElementById("viewportInfo");
          viewportInfo.innerHTML = `<strong>Viewport:</strong> Refresh page to enable`;
          return;
        }
        if (response && response.success) {
          currentViewport = response.viewport;
          const viewportInfo = document.getElementById("viewportInfo");
          viewportInfo.innerHTML = `
            <strong>Viewport:</strong> ${currentViewport.width} x ${currentViewport.height}px<br>
            <strong>DPR:</strong> ${currentViewport.devicePixelRatio}
          `;
        }
      });
    }
  });
}

// Ruler toggle
document.getElementById("toggleRuler").addEventListener("click", () => {
  rulerEnabled = !rulerEnabled;
  chrome.storage.local.set({ rulerEnabled });
  updateButtonStates();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleRuler",
        enabled: rulerEnabled
      });
    }
  });

  updateStatus(rulerEnabled ? "Ruler enabled" : "Ruler disabled");
});

// Typography toggle
document.getElementById("auditType").addEventListener("click", () => {
  typographyEnabled = !typographyEnabled;
  chrome.storage.local.set({ typographyEnabled });
  updateButtonStates();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleTypography",
        enabled: typographyEnabled
      });
    }
  });

  updateStatus(typographyEnabled ? "Typography audit enabled" : "Typography audit disabled");
});

// Console capture toggle
document.getElementById("toggleConsole").addEventListener("click", () => {
  consoleCaptureEnabled = !consoleCaptureEnabled;
  chrome.storage.local.set({ consoleCaptureEnabled });
  updateButtonStates();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleConsoleCapture",
        enabled: consoleCaptureEnabled
      });
    }
  });

  updateStatus(consoleCaptureEnabled ? "Console capture enabled" : "Console capture disabled");
});


// Refresh viewport info
document.getElementById("refreshViewport").addEventListener("click", () => {
  updateViewportInfo();
  updateStatus("Viewport info refreshed");
});

// Export all data (console logs with filters applied)
document.getElementById("exportAll").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0] ? tabs[0].url : window.location.href;
    
    chrome.storage.local.get(["consoleLogs"], (result) => {
      const logs = result.consoleLogs || [];
      const levelFilter = document.getElementById("logLevel").value;
      const regexFilter = document.getElementById("logRegex").value;
      
      let filteredLogs = logs;
      
      // Apply level filter
      if (levelFilter !== "all") {
        const levelMap = {
          error: ["error"],
          warn: ["warn", "error"],
          info: ["info", "warn", "error"]
        };
        const allowedLevels = levelMap[levelFilter] || [];
        filteredLogs = filteredLogs.filter(log => allowedLevels.includes(log.level));
      }
      
      // Apply regex filter
      if (regexFilter) {
        try {
          const regex = new RegExp(regexFilter, 'i');
          filteredLogs = filteredLogs.filter(log => regex.test(log.message));
        } catch (e) {
          updateStatus("Invalid regex pattern");
          return;
        }
      }
      
      const data = {
        timestamp: new Date().toISOString(),
        url: currentUrl,
        viewport: currentViewport,
        filters: {
          level: levelFilter,
          regex: regexFilter
        },
        logs: filteredLogs
      };
      
      downloadJSON(data, `sentinel-qa-export-${Date.now()}.json`);
      updateStatus(`Exported ${filteredLogs.length} log entries`);
    });
  });
});

// Clear all data (but preserve user preferences/settings)
document.getElementById("clearData").addEventListener("click", () => {
  if (confirm("Clear all captured data (logs)? Your feature toggles will be preserved. This cannot be undone.")) {
    // Save current settings
    const settings = {
      rulerEnabled: rulerEnabled,
      typographyEnabled: typographyEnabled,
      consoleCaptureEnabled: consoleCaptureEnabled
    };
    
    // Clear all storage
    chrome.storage.local.clear(() => {
      // Restore settings
      chrome.storage.local.set(settings, () => {
        updateButtonStates();
        updateStatus("All captured data cleared (settings preserved)");
      });
    });
  }
});

// Helper function to download JSON
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function updateStatus(message) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  setTimeout(() => {
    statusEl.textContent = "Sentinel is ready.";
  }, 3000);
}

// Auto-refresh viewport info every 2 seconds when popup is open
setInterval(updateViewportInfo, 2000);
