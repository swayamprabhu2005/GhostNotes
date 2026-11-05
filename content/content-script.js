// content/content-script.js
// Observes closed captions in Google Meet and MS Teams, buffers chronological speech,
// coordinates Grok contextual error correction, and generates PDF scripts.

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__AI_SCRIBE_INITIALIZED__) return;
  window.__AI_SCRIBE_INITIALIZED__ = true;

  console.log('[AI Meeting Scribe] Content script loaded.');

  // State management
  let isRecording = false;
  let startTime = null;
  let timerInterval = null;
  let transcript = []; // Array of { timestamp, speaker, text }
  let detectedParticipants = new Set();
  let currentSpeaker = null;
  let currentSpeech = '';
  let speechDebounceTimer = null;
  let captionObserver = null;

  // Platform detection
  const isMeet = window.location.hostname.includes('meet.google.com');
  const isTeams = window.location.hostname.includes('teams.microsoft.com') || window.location.hostname.includes('teams.live.com');

  // DOM Elements for Floating UI
  let rootContainer = null;
  let statusDot = null;
  let statusText = null;
  let metaText = null;
  let toggleBtn = null;
  let previewArea = null;

  // Format seconds to HH:MM:SS
  function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function getLocalTimestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // HH:MM:SS
  }

  // Create and inject the floating widget
  function injectFloatingWidget() {
    if (document.getElementById('ai-scribe-root')) return;

    rootContainer = document.createElement('div');
    rootContainer.id = 'ai-scribe-root';
    const iconUrl = chrome.runtime.getURL('icons/icon-48.png');
    rootContainer.innerHTML = `
      <div class="ai-scribe-panel">
        <div class="ai-scribe-header" id="ai-scribe-drag-handle">
          <div class="ai-scribe-title-wrap">
            <img src="${iconUrl}" alt="GhostNotes" class="ai-scribe-logo-img">
            <div class="ai-scribe-title">GhostNotes</div>
          </div>
          <div class="ai-scribe-actions-header">
            <button class="ai-scribe-btn-icon" id="ai-scribe-btn-settings" title="Options / API Key">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            <button class="ai-scribe-btn-icon" id="ai-scribe-btn-minimize" title="Minimize / Expand">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="ai-scribe-body" id="ai-scribe-panel-body">
          <div class="ai-scribe-status-bar">
            <div class="ai-scribe-status-indicator">
              <span class="ai-scribe-dot" id="ai-scribe-dot"></span>
              <span id="ai-scribe-status-text">Ready</span>
            </div>
            <div class="ai-scribe-meta" id="ai-scribe-meta">00:00 • 0 lines</div>
          </div>

          <div class="ai-scribe-controls">
            <button class="ai-scribe-btn ai-scribe-btn-start" id="ai-scribe-btn-toggle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              <span>Start AI Scribe</span>
            </button>
          </div>

          <div class="ai-scribe-live-preview" id="ai-scribe-preview" style="display: none;">
            <div style="color: #64748B; font-style: italic;">Awaiting speech...</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(rootContainer);

    // Cache elements
    statusDot = document.getElementById('ai-scribe-dot');
    statusText = document.getElementById('ai-scribe-status-text');
    metaText = document.getElementById('ai-scribe-meta');
    toggleBtn = document.getElementById('ai-scribe-btn-toggle');
    previewArea = document.getElementById('ai-scribe-preview');

    // Event listeners
    toggleBtn.addEventListener('click', handleToggleRecording);
    document.getElementById('ai-scribe-btn-settings').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
    });

    const minimizeBtn = document.getElementById('ai-scribe-btn-minimize');
    const panelBody = document.getElementById('ai-scribe-panel-body');
    let isMinimized = false;
    minimizeBtn.addEventListener('click', () => {
      isMinimized = !isMinimized;
      panelBody.style.display = isMinimized ? 'none' : 'block';
    });

    setupDraggable(rootContainer, document.getElementById('ai-scribe-drag-handle'));
  }

  // Draggable widget helper
  function setupDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = () => {
        document.onmouseup = null;
        document.onmousemove = null;
      };
      document.onmousemove = (moveEvent) => {
        moveEvent.preventDefault();
        pos1 = pos3 - moveEvent.clientX;
        pos2 = pos4 - moveEvent.clientY;
        pos3 = moveEvent.clientX;
        pos4 = moveEvent.clientY;
        element.style.top = (element.offsetTop - pos2) + 'px';
        element.style.left = (element.offsetLeft - pos1) + 'px';
        element.style.bottom = 'auto';
        element.style.right = 'auto';
      };
    };
  }

  // Auto-enable closed captions in Google Meet if not already on
  async function ensureCaptionsActive() {
    if (!isMeet) return;
    try {
      const ccBtn = document.querySelector(
        'button[aria-label*="captions" i], button[data-tooltip*="captions" i], button[aria-label*="caption" i]'
      );
      if (ccBtn) {
        const isPressed = ccBtn.getAttribute('aria-pressed') === 'true';
        const label = ccBtn.getAttribute('aria-label') || '';
        // If not pressed or label says "Turn on captions"
        if (!isPressed && (label.toLowerCase().includes('turn on') || !isPressed)) {
          ccBtn.click();
          console.log('[AI Meeting Scribe] Automatically clicked Turn On Captions.');
        }
      }
    } catch (e) {
      console.warn('[AI Meeting Scribe] Could not auto-toggle captions:', e);
    }
  }

  // Toggle Recording Start / Stop
  async function handleToggleRecording() {
    if (!isRecording) {
      startRecording();
    } else {
      await stopRecordingAndProcess();
    }
  }

  // Start recording session
  async function startRecording() {
    isRecording = true;
    transcript = [];
    detectedParticipants.clear();
    currentSpeaker = null;
    currentSpeech = '';
    startTime = Date.now();

    await ensureCaptionsActive();

    // UI Updates
    statusDot.className = 'ai-scribe-dot recording';
    statusText.textContent = 'Listening...';
    toggleBtn.className = 'ai-scribe-btn ai-scribe-btn-stop';
    toggleBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="2"></rect>
      </svg>
      <span>Stop & Generate PDF</span>
    `;
    previewArea.style.display = 'block';
    previewArea.innerHTML = '<div style="color: #64748B; font-style: italic;">Awaiting speech...</div>';

    // Timer
    timerInterval = setInterval(() => {
      const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
      metaText.textContent = `${formatDuration(elapsedSecs)} • ${transcript.length} lines`;
    }, 1000);

    // Notify service worker
    chrome.runtime.sendMessage({ type: 'SET_STATE', state: 'RECORDING' });

    // Start caption observer
    startObservingCaptions();
  }

  // Commit an utterance into the transcript buffer
  function commitUtterance(speaker, text) {
    if (!speaker || !text || !text.trim()) return;
    const cleanText = text.trim();
    const timestamp = getLocalTimestamp();

    // Check if this is an extension or duplicate of the last entry
    const lastEntry = transcript[transcript.length - 1];
    if (lastEntry && lastEntry.speaker === speaker) {
      // If it starts with the last entry, replace it with the expanded version
      if (cleanText.startsWith(lastEntry.text)) {
        lastEntry.text = cleanText;
        updatePreview();
        return;
      }
    }

    transcript.push({ timestamp, speaker, text: cleanText });
    detectedParticipants.add(speaker);
    updatePreview();
  }

  // Update in-widget preview display
  function updatePreview() {
    if (!previewArea) return;
    const recent = transcript.slice(-3);
    if (recent.length === 0) return;

    previewArea.innerHTML = recent.map(item => `
      <div class="ai-scribe-preview-line">
        <span class="ai-scribe-speaker-tag">${escapeHtml(item.speaker)}:</span>
        <span>${escapeHtml(item.text)}</span>
      </div>
    `).join('');
    previewArea.scrollTop = previewArea.scrollHeight;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Live caption observer
  function startObservingCaptions() {
    if (captionObserver) captionObserver.disconnect();

    captionObserver = new MutationObserver(() => {
      if (!isRecording) return;

      if (isMeet) {
        parseGoogleMeetCaptions();
      } else if (isTeams) {
        parseTeamsCaptions();
      }
    });

    captionObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // Extract from Google Meet DOM
  function parseGoogleMeetCaptions() {
    // Look for caption blocks
    // Google Meet renders caption blocks that contain speaker badge/avatar + caption body
    const captionBlocks = document.querySelectorAll(
      'div[jsname="YSxPC"], div.a4cQT, div[class*="caption-block"], div[class*="CaptionBlock"]'
    );

    if (captionBlocks && captionBlocks.length > 0) {
      captionBlocks.forEach(block => {
        // Speaker element
        const speakerEl = block.querySelector(
          '.zs75Ib, .jxFHg, [class*="speaker" i], [class*="Sender" i], img[alt]'
        );
        // Text element
        const textEl = block.querySelector(
          '.iTTPOb, span[jsname], [class*="caption-text" i]'
        );

        let speaker = '';
        if (speakerEl) {
          speaker = speakerEl.alt || speakerEl.textContent || '';
        }
        let text = textEl ? textEl.textContent : '';

        processCapturedSpeech(speaker.trim(), text.trim());
      });
      return;
    }

    // Generic fallback for changing Google Meet caption containers
    // Scan for elements containing aria-live or speech spans
    const liveContainers = document.querySelectorAll('div[aria-live="polite"], div[aria-live="assertive"]');
    liveContainers.forEach(container => {
      const text = container.textContent.trim();
      if (text && text.length > 3) {
        // Look for pattern "Name: Text"
        const colonIndex = text.indexOf(':');
        if (colonIndex > 0 && colonIndex < 35) {
          const speaker = text.slice(0, colonIndex).trim();
          const speech = text.slice(colonIndex + 1).trim();
          processCapturedSpeech(speaker, speech);
        }
      }
    });
  }

  // Extract from MS Teams DOM
  function parseTeamsCaptions() {
    const items = document.querySelectorAll(
      'div[data-tid="closed-caption-item"], .ui-chat__item, div[class*="caption-item"]'
    );

    items.forEach(item => {
      const speakerEl = item.querySelector(
        'span[data-tid="caption-speaker-name"], .ui-chat__item__author, [class*="speaker" i]'
      );
      const textEl = item.querySelector(
        'span[data-tid="caption-text"], .ui-chat__item__message, [class*="text" i]'
      );

      const speaker = speakerEl ? speakerEl.textContent.trim() : '';
      const text = textEl ? textEl.textContent.trim() : '';

      processCapturedSpeech(speaker, text);
    });
  }

  // Handle live speech stream with debouncing
  function processCapturedSpeech(speaker, text) {
    if (!speaker || !text) return;

    if (currentSpeaker && currentSpeaker !== speaker) {
      // Speaker changed: finalize previous speaker's utterance
      commitUtterance(currentSpeaker, currentSpeech);
      currentSpeaker = speaker;
      currentSpeech = text;
    } else {
      currentSpeaker = speaker;
      currentSpeech = text;
    }

    // Reset silence debounce timer (1800ms pause commits the utterance)
    clearTimeout(speechDebounceTimer);
    speechDebounceTimer = setTimeout(() => {
      if (currentSpeaker && currentSpeech) {
        commitUtterance(currentSpeaker, currentSpeech);
        currentSpeaker = null;
        currentSpeech = '';
      }
    }, 1800);
  }

  // Stop recording, process with Grok, and generate PDF
  async function stopRecordingAndProcess() {
    if (!isRecording) return;
    isRecording = false;

    // Disconnect observer & clear timer
    if (captionObserver) captionObserver.disconnect();
    clearInterval(timerInterval);
    clearTimeout(speechDebounceTimer);

    // Commit any trailing in-flight utterance
    if (currentSpeaker && currentSpeech) {
      commitUtterance(currentSpeaker, currentSpeech);
    }

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const durationStr = formatDuration(elapsedSeconds);

    console.log(`[AI Meeting Scribe] Stopped. Captured ${transcript.length} lines.`);

    // UI state: Processing
    statusDot.className = 'ai-scribe-dot processing';
    statusText.textContent = 'Grok is refining...';
    toggleBtn.disabled = true;
    toggleBtn.textContent = 'Generating PDF...';

    const metadata = {
      title: document.title || 'Meeting Discussion',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      duration: durationStr,
      participants: Array.from(detectedParticipants)
    };

    if (transcript.length === 0) {
      alert('[GhostNotes] No captions were captured during this session. Please make sure closed captions are visible on screen.');
      resetWidgetUI();
      return;
    }

    let finalData = null;

    try {
      // Send raw transcript to service worker for Grok processing
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_WITH_GROK',
        rawTranscript: transcript,
        metadata
      });

      if (response && response.success && response.data) {
        finalData = response.data;
        console.log('[AI Meeting Scribe] Grok successfully formulated the script.');
      } else {
        console.warn('[AI Meeting Scribe] Grok API bypassed or failed:', response?.error);
        // Fallback to raw transcript cleanly
        finalData = createFallbackData(transcript, metadata);
      }
    } catch (e) {
      console.warn('[AI Meeting Scribe] Error connecting to Grok:', e);
      finalData = createFallbackData(transcript, metadata);
    }

    // Generate PDF and trigger download
    try {
      await generateAndDownloadPDF(finalData, metadata);
      showToast('✓ PDF Script Downloaded!');
    } catch (pdfErr) {
      console.error('[AI Meeting Scribe] PDF generation error:', pdfErr);
      alert('Failed to generate PDF: ' + pdfErr.message);
    } finally {
      resetWidgetUI();
      chrome.runtime.sendMessage({ type: 'SET_STATE', state: '' });
    }
  }

  // Graceful fallback when Grok API key is absent or unreachable
  function createFallbackData(rawList, metadata) {
    return {
      meetingTitle: metadata.title || 'GhostNotes Meeting Transcript',
      summary: [
        'Raw live-captioned transcript captured directly from the meeting.',
        'Tip: Configure your Grok API key in Extension Options for contextual phonetic error correction, executive summaries, and action item extraction.'
      ],
      decisions: [],
      actionItems: [],
      script: rawList.map(item => ({
        timestamp: item.timestamp,
        speaker: item.speaker,
        text: item.text
      }))
    };
  }

  // Generate styled PDF using jsPDF + autoTable
  async function generateAndDownloadPDF(data, metadata) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('jsPDF library is not loaded.');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });

    const primaryColor = [79, 70, 229];   // Indigo #4F46E5
    const darkTextColor = [30, 41, 59];   // Slate #1E293B
    const grayColor = [100, 116, 139];    // Gray #64748B
    const accentColor = [14, 165, 233];   // Cyan #0EA5E9

    let yPos = 40;
    const margin = 44;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    // --- Header Section ---
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPos, 4, 32, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...darkTextColor);
    doc.text(data.meetingTitle || metadata.title || 'GhostNotes Transcript', margin + 12, yPos + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.text(`Generated on ${metadata.date}  •  Duration: ${metadata.duration}`, margin + 12, yPos + 28);
    yPos += 48;

    // Participants row
    const participantsList = metadata.participants?.length > 0 ? metadata.participants.join(', ') : 'Participants Detected from Audio';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text('PARTICIPANTS:', margin, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkTextColor);
    const splitParticipants = doc.splitTextToSize(participantsList, contentWidth - 85);
    doc.text(splitParticipants, margin + 85, yPos);
    yPos += (splitParticipants.length * 12) + 16;

    // --- Executive Summary Box ---
    if (data.summary && data.summary.length > 0) {
      doc.setFillColor(248, 250, 252); // Light slate background
      doc.setDrawColor(226, 232, 240);
      const summaryStartY = yPos;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      doc.text('Executive Summary & Key Takeaways', margin + 12, yPos + 18);
      yPos += 28;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...darkTextColor);

      data.summary.forEach(point => {
        const bulletText = `•  ${point}`;
        const lines = doc.splitTextToSize(bulletText, contentWidth - 24);
        doc.text(lines, margin + 12, yPos);
        yPos += (lines.length * 13);
      });

      yPos += 8;
      // Draw enclosing box
      doc.roundedRect(margin, summaryStartY, contentWidth, yPos - summaryStartY, 6, 6, 'FD');
      // Redraw text over rect
      yPos += 16;
    }

    // --- Action Items Table ---
    if (data.actionItems && data.actionItems.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...darkTextColor);
      doc.text('Action Items & Decisions', margin, yPos);
      yPos += 8;

      const tableRows = data.actionItems.map(item => [item.owner || 'All', item.task || '', item.deadline || 'Ongoing']);

      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: yPos,
          margin: { left: margin, right: margin },
          head: [['Owner', 'Action Item / Decision', 'Deadline / Context']],
          body: tableRows,
          theme: 'striped',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            textColor: darkTextColor,
            fontSize: 8.5
          },
          columnStyles: {
            0: { cellWidth: 80, fontStyle: 'bold' },
            2: { cellWidth: 90 }
          }
        });
        yPos = doc.lastAutoTable.finalY + 24;
      }
    }

    // --- Chronological Script Section ---
    if (yPos > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      yPos = 40;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...darkTextColor);
    doc.text('Chronological Discussion Script', margin, yPos);
    yPos += 6;

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(margin, yPos, margin + contentWidth, yPos);
    yPos += 16;

    const scriptItems = data.script || [];
    const pageHeight = doc.internal.pageSize.getHeight();

    scriptItems.forEach((entry) => {
      // Speaker Header: "[HH:MM:SS] Speaker Name"
      const headerText = `[${entry.timestamp || ''}] ${entry.speaker || 'Speaker'}:`;
      const bodyLines = doc.splitTextToSize(entry.text || '', contentWidth - 16);
      const entryHeight = 14 + (bodyLines.length * 12) + 8;

      // Check for page break
      if (yPos + entryHeight > pageHeight - 40) {
        doc.addPage();
        yPos = 40;
      }

      // Draw subtle speaker line
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...accentColor);
      doc.text(headerText, margin, yPos);
      yPos += 13;

      // Spoken body text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkTextColor);
      doc.text(bodyLines, margin + 8, yPos);
      yPos += (bodyLines.length * 12) + 8;
    });

    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text(
        `GhostNotes • Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    }

    // Filename
    const sanitizedTitle = (data.meetingTitle || 'GhostNotes_Script')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `${sanitizedTitle}_${dateStamp}.pdf`;

    // Download via chrome.downloads in service-worker
    const dataUrl = doc.output('datauristring');
    await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_PDF',
      dataUrl,
      filename
    });
  }

  // Show brief confirmation toast
  function showToast(message) {
    if (!rootContainer) return;
    const existing = rootContainer.querySelector('.ai-scribe-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ai-scribe-toast';
    toast.textContent = message;
    rootContainer.querySelector('.ai-scribe-panel').appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Reset widget back to Idle state
  function resetWidgetUI() {
    statusDot.className = 'ai-scribe-dot';
    statusText.textContent = 'Ready';
    toggleBtn.disabled = false;
    toggleBtn.className = 'ai-scribe-btn ai-scribe-btn-start';
    toggleBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
      <span>Start AI Scribe</span>
    `;
  }

  // Periodic check to inject widget once meeting UI is ready
  function init() {
    injectFloatingWidget();
    // Re-verify injection if SPA changes URL or navigates
    setInterval(() => {
      if (!document.getElementById('ai-scribe-root')) {
        injectFloatingWidget();
      }
    }, 2000);
  }

  // Initialize when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
