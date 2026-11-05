# Privacy Policy for GhostNotes

> Effective Date: November 5, 2026  
> Contact: your-email@example.com

## 1. Overview
GhostNotes ("we", "our", or "the extension") is a client-side Google Chrome extension designed to transcribe, format, and organize meeting discussions in Google Meet and Microsoft Teams into structured dialogue scripts and PDF documents.

We believe your meeting discussions are strictly confidential. GhostNotes does not operate any centralized tracking servers, user profiling databases, or analytics middleware.

## 2. Information We Process
* **Meeting Captions & Transcripts:** GhostNotes reads live closed-caption elements rendered on screen during active Google Meet or Microsoft Teams sessions that you explicitly initiate. This data is held in your browser's local runtime memory.
* **xAI Grok API Key:** If you choose to configure an xAI Grok API key, it is stored locally on your device within Chrome's sandboxed `chrome.storage.local`. It is never uploaded to any intermediary servers.
* **Custom Vocabulary:** Any custom terms, names, or acronyms you specify are stored exclusively on your device.

## 3. How Data is Transmitted
* **Direct AI Processing:** When you click "Stop & Generate PDF", the accumulated meeting transcript and custom vocabulary are sent over an encrypted HTTPS connection directly from your browser to the official xAI API (`https://api.x.ai/v1/chat/completions`) using your personal API key.
* **No Intermediary Storage:** GhostNotes does not route, intercept, inspect, or retain your meeting content on any private servers.

## 4. Data Sharing & Third Parties
* We do **not** sell, rent, monetize, or trade any user data or meeting transcripts.
* We do **not** use your data for advertising, creditworthiness, or lending purposes.
* Your transcripts are shared only with xAI (the AI service provider) strictly for the purpose of executing your transcription request when you enable that feature.

## 5. User Control & Data Retention
* Transcripts are kept in temporary browser memory and are wiped when the meeting tab is closed or a new session begins.
* You can clear your API key and settings at any time via the GhostNotes Extension Options page.
* You can uninstall GhostNotes at any time via `chrome://extensions/` to remove all locally stored data.

## 6. Contact
If you have any questions regarding this Privacy Policy, please open an issue on the official GhostNotes GitHub repository or reach out to the developer.
