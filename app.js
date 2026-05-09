const WALLER_PARK = {
    id: "waller_27",
    name: "Waller Park",
    holes: ["1","2","3","4","5","6","7","8","8A","8B","8C","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27"],
    pars: Array(30).fill(3)
};

let currentGameState = null;
let map, userMarker, watchId = null;
let lastPos = [34.6141, -120.1925];
let mapMode = 'follow';

// Touch Tracking Variables
let touchTimer = null;
let touchStartX = 0;
let touchStartY = 0;
let isDragging = false;

// Scanner Variable
let html5QrcodeScanner = null;

// High Contrast State
let highContrastMode = false;

window.onload = () => {
    // Load saved contrast preference
    highContrastMode = localStorage.getItem('dg_high_contrast') === 'true';
    const hcCheckbox = document.getElementById('setHighContrast');
    if (hcCheckbox) hcCheckbox.checked = highContrastMode;

    checkActiveSession();
    drawNameInputs();
    window.onbeforeunload = (e) => { 
        if(currentGameState && currentGameState.isChanged) {
            e.preventDefault();
            return "Game in progress. Exit?"; 
        }
    };
};

function checkActiveSession() {
    const saved = localStorage.getItem('dg_active_session');
    if (saved) {
        currentGameState = JSON.parse(saved);
        document.getElementById('newGameSection').classList.add('hidden');
        document.getElementById('resumeSection').classList.remove('hidden');
        document.getElementById('resumeTitle').innerText = `Resume: ${currentGameState.courseName} (${currentGameState.startTime})`;
    }
}

function snapshotState() {
    if (!currentGameState) return;
    currentGameState.players.forEach((p, pIdx) => {
        const pNum = pIdx + 1;
        document.querySelectorAll(`input.score-input[data-p="${pNum}"]`).forEach(inp => {
            currentGameState.scores[p][inp.dataset.h] = parseInt(inp.value) || 0;
        });
    });
    localStorage.setItem('dg_active_session', JSON.stringify(currentGameState));
}

function initNewGame() {
    const pCount = document.getElementById('count').value;
    const playerNames = [];
    for(let i=1; i<=pCount; i++) playerNames.push(document.getElementById(`name${i}`).value || `P${i}`);
    
    currentGameState = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        courseId: WALLER_PARK.id, 
        courseName: WALLER_PARK.name,
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        players: playerNames, 
        pars: [...WALLER_PARK.pars], 
        scores: {},
        isChanged: true
    };
    
    playerNames.forEach(p => currentGameState.scores[p] = new Array(WALLER_PARK.holes.length).fill(0));
    startRoundUI();
}

function resumeGame() { startRoundUI(); }

function startRoundUI() {
    renderTable();
    document.querySelectorAll('.score-input').forEach(inp => applyColor(inp));
    document.getElementById('setupContainer').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    calc();
}

function setActiveRow(el) {
    document.querySelectorAll('#sBody tr').forEach(tr => tr.classList.remove('active-row'));
    const parentRow = el.closest('tr');
    if(parentRow) parentRow.classList.add('active-row');
}

function renderTable() {
    const hRow = document.getElementById('hRow'), fRow = document.getElementById('fRow'), sBody = document.getElementById('sBody');
    hRow.innerHTML = '<th>Hole</th><th>Par</th>';
    fRow.innerHTML = '<td colspan="2">TOTAL</td>';
    sBody.innerHTML = '';
    
    currentGameState.players.forEach((p, i) => {
        hRow.innerHTML += `<th>${p}</th>`;
        fRow.innerHTML += `<td id="tot${i+1}">0</td>`;
    });
    
    WALLER_PARK.holes.forEach((h, idx) => {
        let tr = document.createElement('tr');
        
        tr.innerHTML = `<td>${h}</td><td>
            <input type="number" class="par-input" id="p-${idx}" value="${currentGameState.pars[idx]}"
                onfocus="this.select(); setActiveRow(this);"
                ontouchstart="handleTouchStart(event, this)"
                ontouchmove="handleTouchMove(event, this)"
                ontouchend="handleTouchEnd(event, this)"
                oninput="savePar(${idx}, this)"
                onblur="handleParBlur(${idx}, this)"
                oncontextmenu="return false;">
        </td>`;
        
        currentGameState.players.forEach((p, i) => {
            const score = currentGameState.scores[p][idx];
            tr.innerHTML += `<td>
                <input type="number" class="score-input" data-p="${i+1}" data-h="${idx}" value="${score}" 
                    onfocus="this.select(); setActiveRow(this);" 
                    ontouchstart="handleTouchStart(event, this)" 
                    ontouchmove="handleTouchMove(event, this)"
                    ontouchend="handleTouchEnd(event, this)" 
                    oninput="handleInput(this)"
                    onblur="handleScoreBlur(this)"
                    oncontextmenu="return false;">
            </td>`;
        });
        sBody.appendChild(tr);
    });
}

function handleTouchStart(e, el) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = false;
    el.dataset.longpress = "false";
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => {
        if (!isDragging) {
            el.dataset.longpress = "true";
            el.classList.add('long-press-active');
            if (navigator.vibrate) navigator.vibrate(50);
        }
    }, 500);
}

function handleTouchMove(e, el) {
    if (isDragging) return;
    const moveX = e.touches[0].clientX;
    const moveY = e.touches[0].clientY;
    if (Math.abs(moveX - touchStartX) > 10 || Math.abs(moveY - touchStartY) > 10) {
        isDragging = true;
        clearTimeout(touchTimer);
        el.dataset.longpress = "false";
        el.classList.remove('long-press-active');
    }
}

function handleTouchEnd(e, el) {
    clearTimeout(touchTimer);
    if (isDragging) return;
    if (el.dataset.longpress === "true") {
        el.focus();
        el.select(); 
    }
}

function handleInput(el) { 
    currentGameState.isChanged = true;
    currentGameState.updatedAt = Date.now();
    applyColor(el); 
    snapshotState(); 
    if (el.dataset.longpress !== "true" && el.value.length >= 1) {
        el.blur();
    }
}

function handleScoreBlur(el) {
    el.classList.remove('long-press-active');
    if (el.value === "") {
        el.value = 0;
        applyColor(el);
        snapshotState();
    }
}

function handleParBlur(idx, el) {
    el.classList.remove('long-press-active');
    if (el.value === "") {
        el.value = 3;
        savePar(idx, el);
    }
}

function toggleHighContrast() {
    highContrastMode = document.getElementById('setHighContrast').checked;
    localStorage.setItem('dg_high_contrast', highContrastMode);
    document.querySelectorAll('.score-input').forEach(inp => applyColor(inp));
}

function applyColor(el) {
    const val = parseInt(el.value) || 0;
    const par = parseInt(document.getElementById(`p-${el.dataset.h}`).value) || 3;
    el.className = "score-input"; 
    if (el.dataset.longpress === "true") el.classList.add('long-press-active');
    
    // Determine suffix based on toggle state
    const hc = highContrastMode ? '-hc' : '';

    if (val === 0) el.classList.add(`zero-val${hc}`);
    else if (val === 1) el.classList.add(`ace${hc}`);
    else if (val <= par - 2) el.classList.add(`double-birdie${hc}`);
    else if (val === par - 1) el.classList.add(`birdie${hc}`);
    else if (val === par) el.classList.add(`par${hc}`);
    else if (val === par + 1) el.classList.add(`bogey${hc}`);
    else if (val >= par + 2) el.classList.add(`double-bogey${hc}`);
    calc();
}

function savePar(idx, el) {
    const v = parseInt(el.value) || 3;
    currentGameState.pars[idx] = v;
    currentGameState.isChanged = true;
    currentGameState.updatedAt = Date.now();
    document.querySelectorAll(`input.score-input[data-h="${idx}"]`).forEach(inp => applyColor(inp));
    snapshotState();
    calc();
    if (el.dataset.longpress !== "true" && el.value.length >= 1) el.blur();
}

function calc() {
    currentGameState.players.forEach((p, i) => {
        let act = 0, rel = 0, pNum = i + 1;
        document.querySelectorAll(`input.score-input[data-p="${pNum}"]`).forEach(inp => {
            const v = parseInt(inp.value) || 0;
            if (v > 0) { 
                act += v; 
                rel += parseInt(document.getElementById(`p-${inp.dataset.h}`).value) || 3; 
            }
        });
        const diff = act - rel;
        const txt = diff === 0 ? "E" : (diff > 0 ? `+${diff}` : diff);
        document.getElementById(`tot${pNum}`).innerHTML = act === 0 ? "0" : `${act}<br><small>(${txt})</small>`;
    });
}

function saveToHistoryAndReset() {
    if (!currentGameState.isChanged) {
        currentGameState = null;
        localStorage.removeItem('dg_active_session');
        location.reload();
        return;
    }
    if(confirm("Archive FULL round and reset?")) {
        const h = JSON.parse(localStorage.getItem('dg_history') || "[]");
        h.push(currentGameState);
        localStorage.setItem('dg_history', JSON.stringify(h));
        currentGameState = null; 
        localStorage.removeItem('dg_active_session');
        location.reload();
    }
}

function showPage(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    if (id === 'mapPage') { if(!map) initMap(); startGPS(); setTimeout(() => map.invalidateSize(), 200); } else stopGPS();
    if (id === 'settingsPage') { renderHistory(); if(!document.querySelector('#qrcode img')) new QRCode(document.getElementById("qrcode"), { text: window.location.href, width: 180, height: 180 }); }
}

function initMap() {
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri' });
    map = L.map('map', { center: lastPos, zoom: 18, layers: [sat], zoomControl: false });
}

function startGPS() {
    if (watchId || !navigator.geolocation) return;
    watchId = navigator.geolocation.watchPosition(pos => {
        lastPos = [pos.coords.latitude, pos.coords.longitude];
        if(!userMarker) userMarker = L.circleMarker(lastPos, { radius: 8, color: 'white', fillColor: '#3498db', fillOpacity: 1 }).addTo(map);
        else userMarker.setLatLng(lastPos);
        if (mapMode === 'follow') map.panTo(lastPos);
    }, null, { enableHighAccuracy: document.getElementById('setHighAcc')?.checked || true });
}

function stopGPS() { if(watchId) { navigator.geolocation.clearWatch(watchId); watchId = null; } }

function setMapMode(m) { 
    mapMode = m; 
    document.getElementById('btnFollow').classList.toggle('active', m === 'follow');
    document.getElementById('btnFree').classList.toggle('active', m === 'free');
    if(m === 'follow') centerOnMe(); 
}

function centerOnMe() { if(lastPos && map) map.panTo(lastPos); }

function renderHistory() {
    const h = JSON.parse(localStorage.getItem('dg_history') || "[]");
    document.getElementById('historyList').innerHTML = h.map((game, i) => `
        <div class="history-card" onclick="restoreFromHistory(${i})">
            <strong>${game.courseName}</strong> - ${game.players.join(', ')}<br>
            <small>${game.startTime}</small>
        </div>
    `).reverse().join('');
}

function restoreFromHistory(idx) {
    const h = JSON.parse(localStorage.getItem('dg_history') || "[]");
    if(confirm("Load this game? Current active progress will be overwritten.")) {
        currentGameState = h[idx];
        currentGameState.isChanged = false; 
        snapshotState();
        showPage('scorePage', document.querySelector('.tab-btn'));
        startRoundUI();
    }
}

function clearHistory() { if(confirm("Clear all?")) { localStorage.clear(); location.reload(); } }
function confirmNewGame() { if(confirm("Wipe active game?")) { currentGameState = null; localStorage.removeItem('dg_active_session'); location.reload(); } }

function drawNameInputs() {
    const n = document.getElementById('count').value, c = document.getElementById('nameInputs');
    c.innerHTML = "";
    for(let i=1; i<=n; i++) c.innerHTML += `<input type="text" id="name${i}" placeholder="Player ${i}" style="width:90%; padding:10px; margin-top:5px;">`;
}
function updateGPSConfig() { if(document.getElementById('mapPage').classList.contains('active')) { stopGPS(); startGPS(); } }

// --- Smart RLE Compression, QR Generation & Decoding ---

function encodeSmartRLE(arr) {
    let raw = arr.map(v => v.toString(36).toLowerCase()).join('');
    let rle = '';
    let count = 1;
    for (let i = 1; i <= arr.length; i++) {
        if (arr[i] === arr[i - 1] && count < 35) {
            count++;
        } else {
            rle += count.toString(36).toUpperCase() + arr[i - 1].toString(36).toLowerCase();
            count = 1;
        }
    }
    return rle.length < raw.length ? '*' + rle : raw;
}

function decodeSmartRLE(encoded) {
    let arr = [];
    if (encoded.startsWith('*')) {
        for (let i = 1; i < encoded.length; i += 2) {
            let count = parseInt(encoded[i], 36);
            let val = parseInt(encoded[i+1], 36);
            for (let c = 0; c < count; c++) arr.push(val);
        }
    } else {
        for (let i = 0; i < encoded.length; i++) {
            arr.push(parseInt(encoded[i], 36));
        }
    }
    return arr;
}

function generateShareQR() {
    if (!currentGameState) return;
    if (!currentGameState.id) currentGameState.id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    if (!currentGameState.createdAt) currentGameState.createdAt = Date.now();
    if (!currentGameState.updatedAt) currentGameState.updatedAt = Date.now();
    
    const header = "DGP1";
    const encPars = encodeSmartRLE(currentGameState.pars);
    const encScores = currentGameState.players.map(p => encodeSmartRLE(currentGameState.scores[p]));
    
    const payload = [
        header,
        currentGameState.id,
        currentGameState.createdAt.toString(36),
        currentGameState.updatedAt.toString(36),
        currentGameState.courseId,
        currentGameState.players.join(','),
        encPars,
        ...encScores
    ].join('|');
    
    const qrContainer = document.getElementById('modalQRCode');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, { text: payload, width: 250, height: 250, correctLevel: QRCode.CorrectLevel.L });
    document.getElementById('qrModal').classList.remove('hidden');
}

function startQRScanner() {
    document.getElementById('scannerModal').classList.remove('hidden');
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    }
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function stopQRScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(e => console.error(e));
    }
    document.getElementById('scannerModal').classList.add('hidden');
}

function onScanFailure(error) {
    // Ignore routine scan failures to avoid spamming the console
}

function onScanSuccess(decodedText) {
    stopQRScanner();
    try {
        if (!decodedText.startsWith("DGP1|")) {
            alert("Invalid QR format. This doesn't look like a Disc Golf Pro round.");
            return;
        }
        
        const parts = decodedText.split('|');
        const players = parts[5].split(',');
        const pars = decodeSmartRLE(parts[6]);
        
        let newGameState = {
            id: parts[1],
            createdAt: parseInt(parts[2], 36),
            updatedAt: parseInt(parts[3], 36),
            courseId: parts[4],
            courseName: WALLER_PARK.name, // Will need dynamic lookup if we add more courses
            startTime: new Date(parseInt(parts[2], 36)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            players: players,
            pars: pars,
            scores: {},
            isChanged: true 
        };

        players.forEach((p, idx) => {
            newGameState.scores[p] = decodeSmartRLE(parts[7 + idx]);
        });

        currentGameState = newGameState;
        snapshotState();

        // Archive imported game directly to history
        const h = JSON.parse(localStorage.getItem('dg_history') || "[]");
        const existingIdx = h.findIndex(g => g.id === currentGameState.id);
        if (existingIdx > -1) {
            h[existingIdx] = currentGameState; 
        } else {
            h.push(currentGameState);
        }
        localStorage.setItem('dg_history', JSON.stringify(h));

        alert("Round successfully imported!");
        startRoundUI();

    } catch (e) {
        console.error("Decode error:", e);
        alert("Failed to read the imported round data.");
    }
}
