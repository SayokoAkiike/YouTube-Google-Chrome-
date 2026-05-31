import { defaultSettings, STORAGE_KEY } from './defaultSettings.js';

let currentSettings = { ...defaultSettings };

function applySettings() {
  if (!currentSettings.enabled) {
    document.documentElement.style.removeProperty('--yt-sub-pos-x');
    document.documentElement.style.removeProperty('--yt-sub-pos-y');
    document.documentElement.style.removeProperty('--yt-sub-font-size');
    document.documentElement.style.removeProperty('--yt-sub-line-height');
    document.documentElement.style.removeProperty('--yt-sub-bg-opacity');
    document.documentElement.classList.remove('yt-sub-helper-enabled');
    document.documentElement.classList.remove('yt-sub-lines-1', 'yt-sub-lines-2', 'yt-sub-lines-3');
    cleanupDragListeners();
    return;
  }

  document.documentElement.classList.add('yt-sub-helper-enabled');
  
  // Apply CSS Variables to root element
  if (currentSettings.subtitlePosX !== null) {
      document.documentElement.style.setProperty('--yt-sub-pos-x', `${currentSettings.subtitlePosX}px`);
  }
  if (currentSettings.subtitlePosY !== null) {
      document.documentElement.style.setProperty('--yt-sub-pos-y', `${currentSettings.subtitlePosY}px`);
  }
  document.documentElement.style.setProperty('--yt-sub-font-size', `${currentSettings.fontSizePercentage}%`);
  document.documentElement.style.setProperty('--yt-sub-line-height', `${currentSettings.lineHeight}`);
  document.documentElement.style.setProperty('--yt-sub-bg-opacity', `${currentSettings.backgroundOpacity / 100}`);
  
  if (currentSettings.maxLines > 0) {
      document.documentElement.classList.add(`yt-sub-lines-${currentSettings.maxLines}`);
  } else {
      document.documentElement.classList.remove('yt-sub-lines-1', 'yt-sub-lines-2', 'yt-sub-lines-3');
  }
}

// Initialize on page load
// Wrap in try-catch to ensure we fail safely without breaking the user's video playback
try {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    if (result[STORAGE_KEY]) {
      currentSettings = result[STORAGE_KEY];
    }
    applySettings();
  });

  // Listen for changes from the popup
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes[STORAGE_KEY]) {
      currentSettings = changes[STORAGE_KEY].newValue;
      applySettings();
    }
  });

  // Setup mutation observer to watch for the subtitle container rendering
  setupDragObserver();

} catch (error) {
  console.warn('[YouTube Subtitle Helper] Could not initialize safely:', error);
}

function setupDragObserver() {
  const dragObserver = new MutationObserver(() => {
    const container = document.querySelector(".ytp-caption-window-container");
    if (container && !container.dataset.dragAttached) {
      container.dataset.dragAttached = "true";
      attachDragListeners(container);
    }
    setupSecondSubtitleObserver();
  });
  dragObserver.observe(document.body, { childList: true, subtree: true });
}

function attachDragListeners(container) {
  let isDragging = false;
  let startX, startY, initialX, initialY;

  container.addEventListener("mousedown", (e) => {
    if (!currentSettings.enabled) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = currentSettings.subtitlePosX || 0;
    initialY = currentSettings.subtitlePosY || 0;
    
    container.style.cursor = "grabbing";
    e.stopPropagation();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newX = initialX + dx;
    const newY = initialY + dy;
    document.documentElement.style.setProperty("--yt-sub-pos-x", `${newX}px`);
    document.documentElement.style.setProperty("--yt-sub-pos-y", `${newY}px`);
  });

  window.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = "grab";
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    currentSettings.subtitlePosX = initialX + dx;
    currentSettings.subtitlePosY = initialY + dy;
    
    chrome.storage.local.set({ [STORAGE_KEY]: currentSettings });
  });
}

function cleanupDragListeners() {
  const container = document.querySelector(".ytp-caption-window-container");
  if (container) {
    container.dataset.dragAttached = "";
  }
}

let secondSubContainer = null;
let lastCaptionText = "";
let debounceTranslationTimer = null;

function buildCaptionDOM(text, settings) {
  const span = document.createElement('span');
  span.textContent = text;
  span.className = 'ytp-caption-segment custom-second-segment';
  span.style.cssText = `font-size: ${settings.fontSizePercentage}%; line-height: ${settings.lineHeight}; background: rgba(8, 8, 8, ${settings.backgroundOpacity / 100}); display: inline-block;`;
  
  const captionLine = document.createElement('span');
  captionLine.className = 'caption-visual-line';
  captionLine.appendChild(span);
  
  const captions = document.createElement('span');
  captions.className = 'captions-text';
  captions.appendChild(captionLine);
  
  const captionWindow = document.createElement('div');
  captionWindow.className = 'caption-window';
  captionWindow.style.cssText = 'background: rgba(0,0,0,0); width: 100%; text-align: center;';
  captionWindow.appendChild(captions);
  
  return captionWindow;
}

async function translateText(sourceText, targetLangCode) {
    if (!sourceText || !targetLangCode) return "";
    
    // Normalize text: replace line breaks with spaces for better translation context
    const normalizedText = sourceText.replace(/\n+/g, ' ').trim();
    
    // Use Google Translate Web API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLangCode)}&dt=t&q=${encodeURIComponent(normalizedText)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Translation request failed");
        const data = await response.json();
        
        // Data format is typically [[[ "Translated text", "Original text", ... ]]]
        let translatedText = "";
        if (data && data[0]) {
            data[0].forEach(segment => {
                if (segment[0]) translatedText += segment[0];
            });
        }
        return translatedText || "[Translation unavailable]";
    } catch (e) {
        console.error("Translation error:", e);
        return "[Translation Error]";
    }
}

function updateSecondSubtitleText(originalText) {
    if (!secondSubContainer) return;
    
    // Clear debounce
    if (debounceTranslationTimer) clearTimeout(debounceTranslationTimer);
    
    // Show a loading/placeholder indicator instantly to avoid jumping
    const loadingText = `[Translating to ${currentSettings.secondLanguageCode.toUpperCase()}...]`;
    const loadingDOM = buildCaptionDOM(loadingText, currentSettings);
    
    secondSubContainer.innerHTML = '';
    secondSubContainer.appendChild(loadingDOM);
    secondSubContainer.style.display = "block";

    // Rate-limit fetches to wait for caption settling (~200ms)
    debounceTranslationTimer = setTimeout(async () => {
        const translatedStr = await translateText(originalText, currentSettings.secondLanguageCode);
        
        if (secondSubContainer && lastCaptionText === originalText) {
            const resultDOM = buildCaptionDOM(translatedStr, currentSettings);
            
            secondSubContainer.innerHTML = '';
            secondSubContainer.appendChild(resultDOM);
        }
    }, 200);
}

function setupSecondSubtitleObserver() {
  const container = document.querySelector(".ytp-caption-window-container");
  if (!container) return;

  if (currentSettings.showSecondSubtitleArea && currentSettings.secondLanguageCode) {
    if (!secondSubContainer) {
      secondSubContainer = document.createElement("div");
      secondSubContainer.className = "ytp-caption-window-container ytp-caption-window-container-second custom-second-sub";
      
      // We apply standard YT classes to inherit styling, but ensure it sits below the main container
      secondSubContainer.style.position = "absolute";
      secondSubContainer.style.width = "100%";
      secondSubContainer.style.left = "0";
      // Position it vertically offset from whatever the main subtitle container is doing
      secondSubContainer.style.marginTop = "60px";
      secondSubContainer.style.pointerEvents = "none"; 
      
      // Make sure it doesn't get hidden by YouTube's relative positioning
      secondSubContainer.style.zIndex = "9999";
      
      container.parentElement.appendChild(secondSubContainer);
    }
    
    // Example observer to sync text. Full translation involves intercepting YouTube player API,
    // but for now we mirror the main subtitle area to show the UI wrapper works.
    // Check if there is actually visible text in the main caption right now
    const captionTextNode = container.querySelector(".captions-text");
    const currentText = captionTextNode ? captionTextNode.innerText.trim() : "";
    
    if (currentText && currentText !== lastCaptionText) {
       lastCaptionText = currentText;
       // Kick off the translation fetch process
       updateSecondSubtitleText(currentText);
    } else if (!currentText) {
       secondSubContainer.style.display = "none";
       lastCaptionText = "";
    }
  } else if (secondSubContainer) {
    secondSubContainer.remove();
    secondSubContainer = null;
  }
}



