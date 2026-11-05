<p align="center">
  <img src="icons/logo.png" width="128" height="128" alt="GhostNotes Logo" style="border-radius: 28px; box-shadow: 0 12px 36px rgba(0,0,0,0.35);">
</p>

<h1 align="center">GhostNotes 👻</h1>

<p align="center">
  <strong>The silent, personal AI meeting scribe for Google Meet & Microsoft Teams.</strong><br>
  No bots. No meeting admission required. Real-time chronological dialogue scripts powered by <strong>xAI Grok</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4F46E5?style=flat-square&logo=googlechrome&logoColor=white" alt="Manifest V3">
  <img src="https://img.shields.io/badge/AI_Engine-xAI_Grok_2-000000?style=flat-square" alt="xAI Grok">
  <img src="https://img.shields.io/badge/Export-Client--Side_PDF-EF4444?style=flat-square&logo=adobeacrobatreader&logoColor=white" alt="PDF Export">
  <img src="https://img.shields.io/badge/Platforms-Google_Meet_%7C_MS_Teams-0EA5E9?style=flat-square" alt="Platforms">
  <img src="https://img.shields.io/badge/Privacy-100%25_Local_&_Direct-10B981?style=flat-square" alt="Privacy">
</p>

---

## 🌟 Why GhostNotes?

Commercial meeting bots (like Fireflies or Otter) enter your meetings as an awkward extra participant (*"Swayam's Bot has requested to join"*). Hosts frequently reject them, corporate IT blocks them, and your company discussions get stored on third-party servers.

**GhostNotes does things differently:**

| Feature | GhostNotes 👻 | Traditional Meeting Bots (Fireflies, Otter) |
| :--- | :--- | :--- |
| **Meeting Admission** | **Guaranteed & Silent:** Runs inside your browser session. No bot joins the call. | **Fragile:** Must ask host for permission; often denied. |
| **Speaker Attribution** | **100% Accurate:** Reads native display names from live caption elements. | Requires acoustic voice diarization. |
| **Cost** | **Free / Pennies per month:** Direct Grok API usage only. Zero subscription. | \$15 – \$35 / user / month. |
| **Phonetic Error Repair** | **Contextual Grok Correction:** Automatically fixes misheard jargon & accents. | Standard automated speech recognition. |
| **Privacy** | **Direct & Secure:** Audio/transcripts stay on your machine and only touch xAI directly. | Meeting audio is uploaded to 3rd-party SaaS servers. |
| **Instant Export** | Direct download of structured **PDF reports** containing dialogue scripts and summaries. | Locked behind SaaS dashboards. |

---

## 🚀 Key Features

* **🎭 Screenplay-Style Dialogue Scripts:** Formulates your entire meeting in exact chronological sequence:
  > **[10:02:15] Swayam:** Good morning everyone. Let's review the product roadmap for Q3.  
  > **[10:02:30] Alex:** The team completed the prototype for the auth module.  
  > **[10:02:48] Sarah:** Did we resolve the database migration latency?  
  > **[10:03:02] Alex:** Yes, queries dropped from 300ms down to 38ms.
* **🧠 Contextual Error & Jargon Repair (xAI Grok):** Automated speech recognition often mishears technical terms (e.g. hearing *"cube netties"* instead of *"Kubernetes"* or *"seq"* instead of *"SQL"*). Grok analyzes the surrounding discussion and fixes these automatically.
* **📚 Custom Domain Vocabulary:** Enter your team's code names, acronyms, and colleague names in Settings to ensure 100% accuracy.
* **📄 Automated Executive PDF:** Generates a publication-grade PDF with:
  1. Header with date, duration, and participant roster.
  2. Executive summary callout box with key takeaways.
  3. Action items & decisions table (`Owner | Task | Deadline`).
  4. Complete chronological dialogue script with speaker badges and timestamps.
* **🕹️ Draggable Floating Widget:** A minimal, glassmorphic widget appears on your screen when you enter a call. You can drag it anywhere so it never covers slides or camera feeds.

---

## 🛠️ Quick Installation Guide

### 1. Load Unpacked Extension in Chrome
1. Open Google Chrome and go to `chrome://extensions/`.
2. In the top-right corner, switch **Developer mode** to **ON**.
3. In the top-left corner, click **Load unpacked**.
4. Select the project folder:
   ```
   d:\MyFiles\New folder\New folder (2)
   ```
5. **GhostNotes** is now installed and ready!

### 2. Configure Your Grok API Key
1. Click the GhostNotes icon in your Chrome toolbar (or right-click $\rightarrow$ **Options**).
2. Enter your **xAI Grok API Key** (`xai-...`).
3. Select your model (`grok-2-latest` recommended).
4. *(Optional)* Add any **Custom Vocabulary** (e.g., `Kubernetes, Next.js, Antigravity, Swayam, Alex, Q3 Roadmap`).
5. Click **Test Connection** to verify your key, then click **Save Settings**.

---

## 🎙️ How to Use During a Meeting

1. Join any **Google Meet** (`meet.google.com`) or **Microsoft Teams** (`teams.microsoft.com`) call.
2. The **GhostNotes** floating pill appears in the bottom-right corner.
3. Click **"Start AI Scribe"**:
   - Closed captions automatically turn on if they aren't active already.
   - GhostNotes begins capturing and attributing speech silently.
   - The live counter displays elapsed time and lines captured.
4. When the meeting wraps up, click **"Stop & Generate PDF"**:
   - Grok contextually repairs misheard words and organizes the dialogue.
   - A styled PDF (`GhostNotes_Script_YYYY-MM-DD.pdf`) downloads immediately to your browser!

---

## 📂 Project Architecture

```
GhostNotes/
├── manifest.json              # Chrome Manifest V3 declaration
├── icons/                     # Extension branding icons (16, 48, 128, 512)
│   ├── icon-16.png
│   ├── icon-48.png
│   ├── icon-128.png
│   └── logo.png
├── background/
│   └── service-worker.js      # Grok API communication & PDF download coordinator
├── content/
│   ├── content-script.js      # DOM caption observer, debouncer & PDF generator
│   └── content-style.css      # Floating widget styles (glassmorphic dark UI)
├── lib/
│   ├── jspdf.umd.min.js       # Bundled client-side PDF engine
│   └── jspdf.plugin.autotable.min.js
├── popup/                     # Extension toolbar popup
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/                   # Settings & Grok API key management
│   ├── options.html
│   ├── options.css
│   └── options.js
├── .gitignore
└── README.md
```

---

## 🔒 Privacy & Data Sovereignty

* **Zero Middleware Servers:** GhostNotes has no centralized backend or database.
* **Direct HTTPS Connection:** Your raw transcript is transmitted strictly between your local browser and the official `https://api.x.ai` API using your personal API key.
* **Offline Fallback:** If your API key expires or is missing, GhostNotes still formats and downloads your PDF script directly from the raw captions so you never lose meeting notes.

---

<p align="center">
  Built with ❤️ for focused, distraction-free meetings.
</p>
