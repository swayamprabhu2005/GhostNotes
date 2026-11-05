// background/service-worker.js
// Handles Grok API processing, badge updates, and PDF downloads.

// Initialize extension defaults on install
chrome.runtime.onInstalled.addListener(async (details) => {
  const existing = await chrome.storage.local.get(['grokModel', 'customVocab', 'autoTurnOnCaptions']);
  await chrome.storage.local.set({
    grokModel: existing.grokModel || 'grok-2-latest',
    customVocab: existing.customVocab || '',
    autoTurnOnCaptions: existing.autoTurnOnCaptions !== undefined ? existing.autoTurnOnCaptions : true
  });
  console.log('[GhostNotes] Extension initialized.');
});

// Manage tab badge state
async function updateBadge(state) {
  try {
    if (state === 'RECORDING') {
      await chrome.action.setBadgeText({ text: 'REC' });
      await chrome.action.setBadgeBackgroundColor({ color: '#EF4444' }); // Red
    } else if (state === 'PROCESSING') {
      await chrome.action.setBadgeText({ text: 'AI...' });
      await chrome.action.setBadgeBackgroundColor({ color: '#6366F1' }); // Indigo
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    console.warn('[GhostNotes] Failed to set badge:', err);
  }
}

// Call xAI Grok API for contextual repair and script structuring
async function processWithGrok(rawTranscript, metadata, apiKey, model, customVocab) {
  const promptSystem = `You are GhostNotes, an expert AI meeting stenographer, dialogue editor, and intelligence scribe.
You are given a raw, live-captioned transcript from a business/technical meeting (Google Meet or MS Teams).

Live closed captions frequently have automated speech-to-text errors:
1. Phonetic speech misinterpretations (misheard jargon, technical acronyms, brand names, homophones, or mumbling).
2. Fragmented sentences or chopped phrasing.
3. Missing punctuation.

${customVocab ? `SPECIAL DOMAIN GLOSSARY / VOCABULARY TO RECOGNIZE:\n${customVocab}\n` : ''}

YOUR TASKS:
1. CONTEXTUAL RECONSTRUCTION:
   Intelligently infer what each speaker meant based on context and conversational flow. Fix phonetic errors and technical jargon automatically while strictly preserving the speaker's true intent. Do not fabricate facts.
2. CHRONOLOGICAL SCRIPT PRESERVATION:
   Keep the chronological order of speech intact. If the same speaker speaks multiple consecutive lines, merge them into a single coherent paragraph.
3. EXECUTIVE SUMMARY & DECISIONS:
   Extract high-level meeting takeaways, key discussion topics, and agreed decisions.
4. ACTION ITEMS:
   Extract assigned tasks, owners, and deadlines.

Return STRICTLY valid JSON (no markdown formatting, no code blocks, just raw JSON object) with this exact schema:
{
  "meetingTitle": "Descriptive Title Based on Context",
  "summary": [
    "High level takeaway 1",
    "High level takeaway 2"
  ],
  "decisions": [
    "Key decision 1"
  ],
  "actionItems": [
    { "owner": "Name or All", "task": "Task description", "deadline": "Stated deadline or Ongoing" }
  ],
  "script": [
    { "timestamp": "HH:MM:SS", "speaker": "Speaker Name", "text": "Corrected sentence." }
  ]
}`;

  const promptUser = `Meeting Date: ${metadata.date || new Date().toLocaleDateString()}
Duration: ${metadata.duration || 'Unknown'}
Detected Participants: ${metadata.participants?.join(', ') || 'Various'}

RAW CAPTIONED TRANSCRIPT:
${JSON.stringify(rawTranscript, null, 2)}`;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: model || 'grok-2-latest',
      messages: [
        { role: 'system', content: promptSystem },
        { role: 'user', content: promptUser }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '{}';

  // Parse JSON response (stripping markdown backticks if present)
  let cleanJson = rawContent.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  return JSON.parse(cleanJson);
}

// Message passing handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'SET_STATE') {
        await updateBadge(message.state);
        sendResponse({ success: true });
        return;
      }

      if (message.type === 'OPEN_OPTIONS') {
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
        return;
      }

      if (message.type === 'PROCESS_WITH_GROK') {
        const { rawTranscript, metadata } = message;
        const config = await chrome.storage.local.get(['grokApiKey', 'grokModel', 'customVocab']);

        if (!config.grokApiKey) {
          sendResponse({
            success: false,
            error: 'MISSING_API_KEY',
            message: 'No Grok API key found. Please open Extension Options and set your xAI API key.'
          });
          return;
        }

        await updateBadge('PROCESSING');

        try {
          const structuredData = await processWithGrok(
            rawTranscript,
            metadata,
            config.grokApiKey,
            config.grokModel,
            config.customVocab
          );
          await updateBadge('');
          sendResponse({ success: true, data: structuredData });
        } catch (apiError) {
          await updateBadge('');
          console.error('[Meeting Scribe] Grok processing failed:', apiError);
          sendResponse({
            success: false,
            error: 'API_ERROR',
            message: apiError.message || 'Failed to process transcript with Grok.'
          });
        }
        return;
      }

      if (message.type === 'DOWNLOAD_PDF') {
        const { dataUrl, filename } = message;
        const downloadId = await chrome.downloads.download({
          url: dataUrl,
          filename: filename || `GhostNotes_Script_${new Date().toISOString().slice(0, 10)}.pdf`,
          saveAs: false
        });
        sendResponse({ success: true, downloadId });
        return;
      }

      sendResponse({ success: false, error: 'UNKNOWN_MESSAGE_TYPE' });
    } catch (err) {
      console.error('[Meeting Scribe] Error in message listener:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true; // Keep message channel open for async response
});
