// DevTools Panel for Failed Requests Monitoring

chrome.devtools.panels.create(
  "Sentinel QA",
  chrome.runtime.getURL("icons/icon128.png"),
  chrome.runtime.getURL("src/devtools/panel.html"),
  (panel) => {
    console.log("Sentinel QA DevTools panel created");
  }
);
