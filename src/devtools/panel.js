// DevTools Panel Logic - Failed Requests Monitor

let requests = [];
let failedRequests = [];

// Get the inspected window's tab ID
const tabId = chrome.devtools.inspectedWindow.tabId;

// Listen for network events from the inspected page
// Note: In MV3, we need to use chrome.devtools.network API
chrome.devtools.network.onRequestFinished.addListener((request) => {
  const status = request.response ? request.response.status : 0;
  const url = request.request.url;
  const method = request.request.method;
  
  requests.push({
    url,
    method,
    status,
    timestamp: Date.now(),
    type: request.response && request.response.content ? request.response.content.mimeType : 'unknown'
  });

  // Check if request failed (4xx, 5xx, or network errors)
  if (status >= 400 || status === 0 || request.wasBlocked || request.canceled) {
    let error = 'Unknown Error';
    if (status >= 500) {
      error = 'Server Error';
    } else if (status >= 400) {
      error = 'Client Error';
    } else if (request.wasBlocked) {
      error = 'Blocked';
    } else if (request.canceled) {
      error = 'Canceled';
    } else if (status === 0) {
      error = 'Network Error';
    }
    
    failedRequests.push({
      url,
      method,
      status: status || (request.wasBlocked ? -1 : request.canceled ? -2 : 0),
      timestamp: Date.now(),
      type: request.response && request.response.content ? request.response.content.mimeType : 'error',
      error: error
    });
    updateUI();
  } else {
    updateUI();
  }
});

function updateUI() {
  const totalCount = document.getElementById('totalCount');
  const failedCount = document.getElementById('failedCount');
  const errorCount = document.getElementById('errorCount');
  const requestList = document.getElementById('requestList');

  totalCount.textContent = requests.length;
  failedCount.textContent = failedRequests.filter(r => r.status >= 400 && r.status < 500).length;
  errorCount.textContent = failedRequests.filter(r => r.status >= 500 || r.status === 0).length;

  // Clear and rebuild list
  requestList.innerHTML = '';

  if (failedRequests.length === 0) {
    requestList.innerHTML = `
      <div class="empty-state">
        <p>No failed requests detected.</p>
        <p>Refresh the page to capture network requests.</p>
      </div>
    `;
    return;
  }

  // Sort by timestamp (newest first)
  const sorted = [...failedRequests].sort((a, b) => b.timestamp - a.timestamp);

  sorted.forEach((req) => {
    const item = document.createElement('div');
    item.className = 'request-item';
    
    if (req.status >= 500 || req.status === 0) {
      item.classList.add('error');
    } else {
      item.classList.add('failed');
    }

    const statusClass = req.status >= 500 ? 'status-5xx' : (req.status < 0 || req.status === 0) ? 'status-error' : 'status-4xx';
    const statusText = (req.status < 0 || req.status === 0) ? req.error : req.status;

    item.innerHTML = `
      <div class="request-header">
        <div class="request-url">${escapeHtml(req.url)}</div>
        <div class="request-status ${statusClass}">${statusText}</div>
      </div>
      <div class="request-details">
        <strong>Method:</strong> ${req.method} | 
        <strong>Type:</strong> ${req.type} | 
        <strong>Time:</strong> ${new Date(req.timestamp).toLocaleTimeString()}
      </div>
    `;

    requestList.appendChild(item);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export failed requests
document.getElementById('exportBtn').addEventListener('click', () => {
  const data = {
    timestamp: new Date().toISOString(),
    url: chrome.devtools.inspectedWindow.url,
    failedRequests: failedRequests
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `failed-requests-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Clear requests
document.getElementById('clearBtn').addEventListener('click', () => {
  requests = [];
  failedRequests = [];
  updateUI();
});

// Refresh
document.getElementById('refreshBtn').addEventListener('click', () => {
  chrome.devtools.inspectedWindow.reload();
});

// Initial update
updateUI();
