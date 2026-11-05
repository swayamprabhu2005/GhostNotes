// options/options.js
// Handles saving and verifying Grok API configuration and domain vocabulary

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('grok-api-key');
  const toggleKeyBtn = document.getElementById('btn-toggle-key');
  const modelSelect = document.getElementById('grok-model');
  const customVocabInput = document.getElementById('custom-vocab');
  const autoCcCheckbox = document.getElementById('auto-turn-on-captions');
  const testBtn = document.getElementById('btn-test-connection');
  const testStatus = document.getElementById('test-status');
  const saveBtn = document.getElementById('btn-save');
  const saveToast = document.getElementById('save-toast');

  // Load existing settings
  const config = await chrome.storage.local.get([
    'grokApiKey',
    'grokModel',
    'customVocab',
    'autoTurnOnCaptions'
  ]);

  if (config.grokApiKey) apiKeyInput.value = config.grokApiKey;
  if (config.grokModel) modelSelect.value = config.grokModel;
  if (config.customVocab) customVocabInput.value = config.customVocab;
  if (config.autoTurnOnCaptions !== undefined) {
    autoCcCheckbox.checked = config.autoTurnOnCaptions;
  }

  // Toggle key visibility
  toggleKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleKeyBtn.textContent = 'Hide';
    } else {
      apiKeyInput.type = 'password';
      toggleKeyBtn.textContent = 'Show';
    }
  });

  // Test Grok API connection
  testBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      testStatus.className = 'test-status error';
      testStatus.textContent = 'Please enter an API key first.';
      return;
    }

    testStatus.className = 'test-status';
    testStatus.style.color = '#94A3B8';
    testStatus.textContent = 'Pinging xAI Grok API...';
    testBtn.disabled = true;

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: modelSelect.value || 'grok-2-latest',
          messages: [{ role: 'user', content: 'Respond with just "OK"' }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        testStatus.className = 'test-status success';
        testStatus.textContent = '✓ Successfully connected to Grok!';
      } else {
        const err = await response.text();
        testStatus.className = 'test-status error';
        testStatus.textContent = `Connection failed (${response.status}): Invalid key or quota limit.`;
      }
    } catch (e) {
      testStatus.className = 'test-status error';
      testStatus.textContent = `Network error: ${e.message}`;
    } finally {
      testBtn.disabled = false;
    }
  });

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const grokApiKey = apiKeyInput.value.trim();
    const grokModel = modelSelect.value;
    const customVocab = customVocabInput.value.trim();
    const autoTurnOnCaptions = autoCcCheckbox.checked;

    await chrome.storage.local.set({
      grokApiKey,
      grokModel,
      customVocab,
      autoTurnOnCaptions
    });

    saveToast.style.display = 'block';
    setTimeout(() => {
      saveToast.style.display = 'none';
    }, 3500);
  });
});
