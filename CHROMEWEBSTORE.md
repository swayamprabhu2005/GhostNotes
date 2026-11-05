# Chrome Web Store Listing — GhostNotes

> Last Updated: 2026-11-05

## Store Listing

**Extension Name**
GhostNotes

**Short Description**
Silent personal AI scribe for Google Meet & Teams. Contextually repairs live captions with Grok into dialogue scripts and PDF reports.

**Detailed Description**
GhostNotes is your silent, personal AI meeting scribe for Google Meet and Microsoft Teams.

Unlike traditional meeting bots that enter your calls as an awkward extra participant and require host permission, GhostNotes operates completely behind the scenes directly inside your browser session. It captures live closed captions, extracts native participant names, uses xAI Grok to contextually correct misheard words and technical jargon, and automatically compiles your meeting into a publication-grade dialogue script PDF.

KEY FEATURES
- Screenplay-Style Dialogue Script: Reconstructs your meeting in chronological sequence (Speaker A, Speaker B, Speaker A).
- Contextual Error Correction: Powered by xAI Grok to automatically fix misheard homophones, acronyms, and accents.
- Custom Domain Vocabulary: Add your company's code names, project acronyms, or team roster to ensure specialized terms are transcribed accurately.
- Executive Summary & Action Items: Generates high-level takeaways and a structured action items table with assigned owners.
- One-Click PDF Export: Automatically formats and downloads a clean PDF report right after your meeting concludes.
- Draggable In-Meeting Control: Minimal, glassmorphic floating widget that you can reposition anywhere on screen.

HOW TO USE IT
1. Join any Google Meet or Microsoft Teams call in Google Chrome.
2. Click "Start AI Scribe" on the floating widget (closed captions turn on automatically).
3. When the meeting ends, click "Stop & Generate PDF".
4. GhostNotes refines the transcript with Grok AI and downloads your formatted PDF script.

PRIVACY & DATA SECURITY
GhostNotes has no centralized backend or server infrastructure. Transcripts and settings remain local on your machine. When AI refinement is used, requests are sent directly from your browser to the official xAI Grok API endpoint using your own personal API key. Your meeting data is never collected or sold.

SUPPORT & FEEDBACK
For assistance or feedback, open an issue on the project GitHub repository.

**Category**
Productivity

**Single Purpose**
Transcribes and formats Google Meet and Teams captions into chronological dialogue scripts and PDF summaries.

**Primary Language**
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|---|---|---|---|
| Store Icon | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Small Promo Tile | 440×280 PNG | 🟡 Recommended | |
| Screenshot 1 | 1280×800 PNG | ⬜ Required before submit | In-meeting floating widget on Google Meet |
| Screenshot 2 | 1280×800 PNG | 🟡 Recommended | Options page with Grok API configuration |
| Screenshot 3 | 1280×800 PNG | 🟡 Recommended | Sample generated PDF script |

---

## Permissions Justification

| Permission | Type | Plain-English Justification for Review Team |
|---|---|---|
| `storage` | permissions | Required to securely store user settings, custom domain vocabulary, and personal xAI Grok API keys locally on the device. |
| `downloads` | permissions | Required to save the generated meeting dialogue script and executive summary PDF directly to the user's computer. |
| `tabs` | permissions | Required to identify whether the active tab is an ongoing Google Meet or Microsoft Teams call to show meeting status in the popup. |
| `https://meet.google.com/*` | host_permissions | Required to inject the in-meeting scribe widget and observe live closed captions during Google Meet calls. |
| `https://teams.microsoft.com/*` | host_permissions | Required to inject the in-meeting scribe widget and observe live closed captions during Microsoft Teams calls. |
| `https://teams.live.com/*` | host_permissions | Required to observe live captions in personal Microsoft Teams web meetings. |
| `https://api.x.ai/*` | host_permissions | Required to send raw transcript text directly to the xAI Grok API endpoint for contextual speech-to-text correction and script formatting. |

---

## Privacy & Data Use Disclosure

**Does the extension collect user data?** Yes (Website Content & User Communications processed transiently for transcription).

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with 3rd Parties? |
|---|---|---|---|---|
| Website content / Captions | Yes | Yes (to xAI Grok API if user enables AI) | Core functionality: to format the meeting transcript | Only with xAI API directly |
| Personal communications | Yes | Yes (to xAI Grok API if user enables AI) | Core functionality: dialogue structuring | Only with xAI API directly |
| Personally identifiable info | No | No | None | No |
| Authentication / Credentials | No | No | Stored locally in `chrome.storage.local` | Never shared |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes
