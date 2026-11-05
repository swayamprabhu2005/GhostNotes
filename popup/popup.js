// popup/popup.js
// Handles status checks and quick navigation

document.addEventListener('DOMContentLoaded', async () => {
  const platformDot = document.getElementById('platform-dot');
  const platformText = document.getElementById('platform-text');
  const statusHint = document.getElementById('status-hint');
  const grokBadge = document.getElementById('grok-status-badge');

  // Check active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      if (tab.url.includes('meet.google.com/')) {
        platformDot.className = 'status-indicator active';
        platformText.textContent = 'Google Meet Detected';
        statusHint.textContent = 'Use the in-meeting widget on screen to start.';
      } else if (tab.url.includes('teams.microsoft.com/') || tab.url.includes('teams.live.com/')) {
        platformDot.className = 'status-indicator active';
        platformText.textContent = 'MS Teams Detected';
        statusHint.textContent = 'Use the in-meeting widget on screen to start.';
      } else {
        platformDot.className = 'status-indicator';
        platformText.textContent = 'No Active Meeting';
        statusHint.textContent = 'Navigate to Google Meet or Teams tab.';
      }
    }
  } catch (err) {
    console.warn('[Popup] Error reading active tab:', err);
  }

  // Check Grok API key status
  const config = await chrome.storage.local.get(['grokApiKey']);
  if (config.grokApiKey && config.grokApiKey.trim().length > 5) {
    grokBadge.className = 'badge badge-success';
    grokBadge.textContent = 'API Key Configured';
  } else {
    grokBadge.className = 'badge badge-warning';
    grokBadge.textContent = 'Key Missing';
  }

  // Navigation handlers
  const openOptions = () => chrome.runtime.openOptionsPage();

  document.getElementById('btn-open-options').addEventListener('click', openOptions);
  document.getElementById('btn-open-settings').addEventListener('click', openOptions);

  document.getElementById('btn-quick-guide').addEventListener('click', () => {
    alert(
      'How It Works:\n\n' +
      '1. Open Google Meet or MS Teams in Chrome.\n' +
      '2. Look for the floating "AI Scribe" widget in the lower right corner.\n' +
      '3. Click "Start AI Scribe". The extension automatically reads captions and attributes speakers.\n' +
      '4. When the meeting ends, click "Stop & Generate PDF".\n' +
      '5. Grok AI corrects any misheard words, formats the dialogue script, and downloads your PDF!'
    );
  });
});
