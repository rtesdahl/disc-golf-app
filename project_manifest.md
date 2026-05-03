# Disc Golf Scorer: Project Manifest & Initial Prompt
**Role:** Expert Full-Stack Developer / UI/UX Designer
**Task:** Maintain and evolve a specialized Disc Golf Scoring Web App (PWA).
## 1. Core App Configuration
 * **Target Device:** Android (Pixel 8) using Chrome.
 * **UI Architecture:** Single-Page Application (SPA) with three tabs: **SCORE**, **MAP**, **SETTINGS**.
 * **Course Layout:** 30 holes total.
 * **Hole Numbering:** 1, 2, 3, 4, 5, 6, 7, 8, **8A, 8B, 8C**, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27.
 * **Player Capacity:** 1–6 players with customizable names.
## 2. Technical Constraints (Ironclad)
 * **Scroll-Locking:** The body must be position: fixed with overscroll-behavior-y: contain to prevent accidental Chrome "Pull-to-Refresh" reloads.
 * **Single File:** All HTML, CSS, and JS must remain in a single index.html for easy GitHub Pages deployment.
 * **GPS Logic:** High-precision watchPosition must only run while the **MAP** tab is active to preserve battery.
 * **No Frameworks:** Use Vanilla JS and Leaflet.js (CDN) for maps.
## 3. Feature Specifications
### A. Scoring System
 * **Dynamic Par:** Default par is 3, but every par value is editable via tap-to-input.
 * **Live To-Par:** The total row must show Actual Score (Relative Score).
   * *Logic:* Relative score compares actual strokes only against holes where a score > 0 has been entered.
   * *Symbol:* Show (E) for even, (+X) for over, and (-X) for under.
 * **Visual Color Coding:**
   * 1: Yellow (Hole-in-one)
   * <= Par - 2: Normal Green (Double Birdie)
   * Par - 1: Pale Green (Birdie)
   * Par: White
   * Par + 1: Pale Red (Bogey)
   * >= Par + 2: Normal Red (Double Bogey+)
### B. Map System
 * **Provider:** Leaflet.js using **Esri World Imagery** (Satellite).
 * **Modes:** * Follow: Map centers on device GPS; pan is locked but pinch-zoom allowed.
   * Free: User can pan/zoom freely; includes a "Recenter" button.
 * **Markers:** Blue dot for user location with an accuracy radius circle.
### C. Settings & Persistence
 * **Round History:** Tapping a player's name in the header saves their specific round (Date, Name, Score) to localStorage.
 * **History View:** Settings tab displays a chronological list of saved rounds.
 * **App Sharing:** Settings tab must generate a QR code using qrcode.js based on window.location.href.
 * **GPS Config:** Toggle for High Accuracy and adjustable update intervals.
## 4. Source Code Baseline
*Refer to the most recent index.html provided in the conversation history for the current code state.*
**Current Status:** The app is functional and hosted on GitHub Pages. The UI is stable on the Pixel 8. Future plans include a Course Editor to allow adding/saving different course layouts.
