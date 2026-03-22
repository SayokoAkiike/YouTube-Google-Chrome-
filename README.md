# YouTube Subtitle Layout Helper

This project is a personal desktop browser extension that locally adjusts subtitle layout on YouTube pages. 

- It **does not** download, store, redistribute, or bulk collect video or subtitle content. 
- It **does not** send subtitle or viewing data to any external servers. 
- It **does not** include analytics, tracking, accounts, or backend APIs.

This is an unofficial UI helper and may stop working if YouTube changes its page structure. 
Public code contains no API keys or secrets. Use at your own risk.

## Features
- Adjust subtitle font size, line height, and background opacity.
- Move subtitle position upward to clear up screen space.
- Toggle the UI helper ON/OFF seamlessly.
- Saves preferences locally using Chrome Extension storage API.

## Installation
Because this extension is written in Vanilla JavaScript, no build step (like Node.js or npm) is required.

1. Clone, download, or locate this repository folder on your PC.
2. Open Chrome/Edge and navigate to the Extensions page (`chrome://extensions/` or `edge://extensions/`).
3. Enable **Developer mode** (a toggle usually in the top right corner).
4. Click **Load unpacked** (パッケージ化されていない拡張機能を読み込む).
5. Select the entire `Youtube 二言語字幕_拡張機能自作` folder.
6. The extension is now installed and active!

## Privacy & Safety
This tool is entirely local. It asks for the bare minimum permissions (`storage`) and injects visual overrides using CSS only on the host `*://*.youtube.com/*`.

## Translation Feature Note
The secondary subtitle translation feature uses the free Google Translate Web API endpoint. Please note:
- Google may rate-limit or block requests if used excessively.
- For production use with heavy translation demands, consider implementing a backend service with proper API keys.
- The feature is disabled by default; enable in the popup settings if needed.
