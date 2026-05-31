import { defaultSettings, STORAGE_KEY } from './defaultSettings.js';

// DOM Elements
const enabledToggle = document.getElementById('enabled-toggle');
const fontsizeSlider = document.getElementById('fontsize-slider');
const fontsizeVal = document.getElementById('fontsize-val');
const lineheightSlider = document.getElementById('lineheight-slider');
const lineheightVal = document.getElementById('lineheight-val');
const opacitySlider = document.getElementById('opacity-slider');
const opacityVal = document.getElementById('opacity-val');
const secondSubtitleToggle = document.getElementById('second-subtitle-toggle');
const secondLangGroup = document.getElementById('second-lang-group');
const secondLangSelect = document.getElementById('second-lang-select');
const maxlinesSelect = document.getElementById('maxlines-select');
const resetBtn = document.getElementById('reset-btn');
const saveStatus = document.getElementById('save-status');

// Load settings
function loadSettings() {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const settings = result[STORAGE_KEY] || defaultSettings;
    
    enabledToggle.checked = settings.enabled;
    
    fontsizeSlider.value = settings.fontSizePercentage.toString();
    fontsizeVal.innerText = settings.fontSizePercentage.toString();
    
    lineheightSlider.value = settings.lineHeight.toString();
    lineheightVal.innerText = settings.lineHeight.toString();
    
    opacitySlider.value = settings.backgroundOpacity.toString();
    opacityVal.innerText = settings.backgroundOpacity.toString();
    
    secondSubtitleToggle.checked = settings.showSecondSubtitleArea;
    secondLangGroup.style.display = settings.showSecondSubtitleArea ? 'block' : 'none';
    secondLangSelect.value = settings.secondLanguageCode || '';
    maxlinesSelect.value = settings.maxLines || "0";
  });
}

// Save settings
function saveSettings() {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const prev = result[STORAGE_KEY] || defaultSettings;
    const settings = {
      ...prev,
      enabled: enabledToggle.checked,
      fontSizePercentage: parseInt(fontsizeSlider.value, 10),
      lineHeight: parseFloat(lineheightSlider.value),
      backgroundOpacity: parseInt(opacitySlider.value, 10),
      showSecondSubtitleArea: secondSubtitleToggle.checked,
      secondLanguageCode: secondLangSelect.value,
      maxLines: parseInt(maxlinesSelect.value, 10) || 0,
    };
    
    chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
      if (saveStatus) {
        saveStatus.innerText = 'Saved!';
        setTimeout(() => {
          if (saveStatus) saveStatus.innerText = '';
        }, 1000);
      }
    });
  });
}

// Event Listeners
enabledToggle.addEventListener('change', saveSettings);

fontsizeSlider.addEventListener('input', () => {
  fontsizeVal.innerText = fontsizeSlider.value;
});
fontsizeSlider.addEventListener('change', saveSettings);

lineheightSlider.addEventListener('input', () => {
  lineheightVal.innerText = parseFloat(lineheightSlider.value).toFixed(1);
});
lineheightSlider.addEventListener('change', saveSettings);

opacitySlider.addEventListener('input', () => {
  opacityVal.innerText = opacitySlider.value;
});
opacitySlider.addEventListener('change', saveSettings);

secondSubtitleToggle.addEventListener('change', (e) => {
  secondLangGroup.style.display = e.target.checked ? 'block' : 'none';
  saveSettings();
});

secondLangSelect.addEventListener('change', saveSettings);
maxlinesSelect.addEventListener('change', saveSettings);

resetBtn.addEventListener('click', () => {
  const isConfirmed = confirm('Are you sure you want to reset all settings to defaults?');
  if (isConfirmed) {
    chrome.storage.local.set({ [STORAGE_KEY]: defaultSettings }, () => {
      loadSettings();
    });
  }
});

// Init
document.addEventListener('DOMContentLoaded', loadSettings);
