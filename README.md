# DG Pro: Persistent Scorer
**DG Pro** is a mobile-first, web-based disc golf scorecard application built for speed, persistence, and outdoor readability. Designed specifically to handle extended layouts (any number of holes, currently configured for Waller Park in Santa Maria,California), this app eliminates the friction of traditional mobile data entry so you can focus on your drive, not your screen.
## 🎯 Project Overview
Most disc golf apps are bloated or require too many taps to input a simple score. This project was built from the ground up to solve three specific field-usability problems:
 1. **Data Entry Friction:** Dropping the keyboard, fixing fat-finger typos, and dealing with double-digit edge cases.
 2. **Outdoor Readability:** Keeping track of which row you are editing on a massive 30-hole grid woth 8 players in direct sunlight.
 3. **Connection Loss:** Ensuring data is never lost, even if the browser closes or the cell signal drops.
## ✨ Key Features
### ⚡ "Fast Mode" & "Long-Press" Data Entry
The core innovation of this app is its hybrid data-entry UX, designed to make scoring 99% of holes instantaneous, while safely supporting edge cases:
 * **Fast Mode (Single-Tap):** Tap a cell, type a single digit, and the keyboard *instantly* auto-closes. The score is saved, color-coded, and calculated immediately without needing an "Enter" or "Done" button.
 * **Long-Press Mode (Double-Digits):** For scores of 10+, press and hold the cell for 500ms. The cell highlights yellow with a haptic buzz to confirm "Double-Digit Mode" is active. The keyboard remains open to allow multiple keystrokes.
### 📊 Live Grid & Sticky Architecture
Built with a strict Flexbox hierarchy to ensure native-app-like scrolling on mobile browsers:
 * **Sticky Headers & Footers:** Player names stay pinned to the top, and live relative-to-par totals (e.g., 28 (+1)) stay pinned to the bottom while scrolling through the 30-hole grid.
 * **Active Row Highlighting:** Tapping any cell paints the entire row bright blue, making it impossible to accidentally enter Player 3's score on the wrong hole.
 * **Color-Coded Scoring:** Standardized background highlights for Aces (Yellow), Double-Birdies (Dark Green), Birdies (Light Green), Pars (White), Bogeys (Light Red), and Double+ Bogeys (Dark Red).
### 💾 Deep Persistence & History
No database required. All state management is handled locally and securely on the device.
 * **Auto-Save:** Every keystroke snapshots the game state to localStorage. You can close the browser or refresh the page, and the game will resume exactly where you left off.
 * **Smart Archiving:** Archiving a round pushes it to the History list.
 * **Dirty Flag Memory (isChanged):** Loading a historic game to view the scorecard won't create duplicate archives unless you actually edit a score.
### 🗺️ GPS Map Integration
 * Includes a fully integrated map tab utilizing **Leaflet.js** and Esri High-Resolution Satellite imagery.
 * Features a toggleable "Follow Mode" to track your location on the course in real-time using the device's High-Precision GPS API.
### 📱 Instant Sharing
 * Built-in dynamic QR Code generation allows friends to scan your phone screen and instantly load the web app on their own devices.
## 🛠️ Technical Stack
 * **HTML5 / CSS3:** Mobile-first, strict dvh flexbox layout, -webkit-overflow-scrolling support, and custom touch-event handling.
 * **Vanilla JavaScript (ES6):** Zero-dependency state management and DOM manipulation.
 * **Leaflet.js:** Lightweight mapping library.
 * **QRCode.js:** Client-side QR code generation.
## 🚀 Setup & Customization
This app is entirely static. You can run it locally by opening index.html or host it for free via GitHub Pages.
**To Customize the Course:**
Open app.js and modify the WALLER_PARK constant at the top of the file to match your local course name, hole count, and default pars.
```javascript
const MY_COURSE = {
    id: "local_course_18",
    name: "My Local Course",
    holes: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18"],
    pars: Array(18).fill(3) // Change defaults as needed
};

```
*Built for the love of the game (and the hatred of clunky UI).*
