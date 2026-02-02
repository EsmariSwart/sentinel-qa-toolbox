// Sentinel QA Toolbox - Popup Logic

let rulerEnabled = false;
let typographyEnabled = false;

// Load saved state
chrome.storage.local.get(['rulerEnabled', 'typographyEnabled'], (result) => {
  rulerEnabled = result.rulerEnabled || false;
  typographyEnabled = result.typographyEnabled || false;
  updateButtonStates();
});

function updateButtonStates() {
  const rulerBtn = document.getElementById('toggleRuler');
  const typeBtn = document.getElementById('auditType');
  
  if (rulerEnabled) {
    rulerBtn.classList.add('active');
    rulerBtn.textContent = 'Ruler: ON';
  } else {
    rulerBtn.classList.remove('active');
    rulerBtn.textContent = 'Ruler: OFF';
  }
  
  if (typographyEnabled) {
    typeBtn.classList.add('active');
    typeBtn.textContent = 'Typography: ON';
  } else {
    typeBtn.classList.remove('active');
    typeBtn.textContent = 'Typography: OFF';
  }
}

document.getElementById('toggleRuler').addEventListener('click', () => {
  rulerEnabled = !rulerEnabled;
  chrome.storage.local.set({ rulerEnabled });
  updateButtonStates();
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleRuler',
        enabled: rulerEnabled
      });
    }
  });
  
  updateStatus(rulerEnabled ? 'Ruler enabled' : 'Ruler disabled');
});

document.getElementById('auditType').addEventListener('click', () => {
  typographyEnabled = !typographyEnabled;
  chrome.storage.local.set({ typographyEnabled });
  updateButtonStates();
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleTypography',
        enabled: typographyEnabled
      });
    }
  });
  
  updateStatus(typographyEnabled ? 'Typography audit enabled' : 'Typography audit disabled');
});

function updateStatus(message) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  setTimeout(() => {
    statusEl.textContent = 'Sentinel is ready.';
  }, 2000);
}
