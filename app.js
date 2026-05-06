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
let touchTimer = null;

window.onload = () => {
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
        courseId: WALLER_PARK.id, courseName: WALLER_PARK.name,
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        players: playerNames, pars: [...WALLER_PARK.pars], scores: {},
        isChanged: true
    };
    
    playerNames.forEach(p => currentGameState.scores[p] = new Array(WALLER_PARK.holes.length).fill(0));
    startRoundUI();
}

function resumeGame() { startRoundUI(); }

function startRoundUI() {
    renderTable();
    // Initialize the CSS state for all pre-populated values
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
        hRow.innerHTML += `<th onclick="saveIndividualPrompt('${p}', ${i+1})">${p}</th>`;
        fRow.innerHTML += `<td id="tot${i+1}">0</td>`;
    });
    
    WALLER_PARK.holes.forEach((h, idx) => {
        let tr = document.createElement('tr');
        
        // Unified Par Input with handleParBlur added
        tr.innerHTML = `<td>${h}</td><td>
            <input type="number" class="par-input" id="p-${idx}" value="${currentGameState.pars[idx]}"
                onfocus="this.select(); setActiveRow(this);"
                ontouchstart="handleTouchStart(this)"
                ontouchend="handleTouchEnd(this)"
                oninput="savePar(${idx}, this)"
                onblur="handleParBlur(${idx}, this)"
                oncontextmenu="return false;">
        </td>`;
        
        currentGameState.players.forEach((p, i) => {
            const score = currentGameState.scores[p][idx];
            // Unified Score Input with handleScoreBlur added
            tr.innerHTML += `<td>
                <input type="number" class="score-input" data-p="${i+1}" data-h="${idx}" value="${score}" 
                    onfocus="this.select(); setActiveRow(this);" 
                    ontouchstart="handleTouchStart(this)" 
                    ontouchend="handleTouchEnd(this)" 
                    oninput="handleInput(this)"
                    onblur="handleScoreBlur(this)"
                    oncontextmenu="return false;">
            </td>`;
        });
        sBody.appendChild(tr);
    });
}

function handleTouchStart(el) {
    el.dataset.longpress = "false";
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => {
        el.dataset.longpress = "true";
        el.classList.add('long-press-active');
        if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
}

function handleTouchEnd(el) {
    clearTimeout(touchTimer);
    if (el.dataset.longpress === "true") {
        el.focus();
        el.select(); 
    }
}

function handleInput(el) { 
    currentGameState.isChanged = true;
    applyColor(el); 
    snapshotState(); 
    
    if (el.dataset.longpress !== "true" && el.value.length >= 1) {
        el.blur();
    }
}

// NEW: Catch empty score cells on blur
function handleScoreBlur(el) {
    el.classList.remove('long-press-active');
    if (el.value === "") {
        el.value = 0;
        applyColor(el);
        snapshotState();
    }
}

// NEW: Catch empty par cells on blur
function handleParBlur(idx, el) {
    el.classList.remove('long-press-active');
    if (el.value === "") {
        el.value = 3;
        savePar(idx, el);
    }
}

function applyColor(el) {
    const val = parseInt(el.value) || 0;
    const par = parseInt(document.getElementById(`p-${el.dataset.h}`).value) || 3;
    
    el.className = "score-input"; 
    if (el.dataset.longpress === "true") el.classList.add('long-press-active');
    
    if (val === 0) {
        el.classList.add('zero-val');
    } else {
        if (val === 1) el.classList.add('ace');
        else if (val <= par - 2) el.classList.add('double-birdie');
        else if (val === par - 1) el.classList.add('birdie');
        else if (val === par) el.classList.add('par');
        else if (val === par + 1) el.classList.add('bogey');
        else if (val >= par + 2) el.classList.add('double-bogey');
    }
    calc();
}

function savePar(idx, el) {
    const v = parseInt(el.value) || 3;
    currentGameState.pars[idx] = v;
    currentGameState.isChanged = true;
    
    document.querySelectorAll(`input.score-input[data-h="${idx}"]`).forEach(inp => applyColor(inp));
    snapshotState();
    calc();

    if (el.dataset.longpress !== "true" && el.value.length >= 1) {
        el.blur();
    }
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

function saveIndividualPrompt(name, idx) {
    if(confirm(`Archive current round for ${name}?`)) {
        const hist = JSON.parse(localStorage.getItem('dg_history') || "[]");
        hist.push({...currentGameState, players: [name], scores: { [name]: currentGameState.scores[name] }, isChanged: false });
        localStorage.setItem('dg_history', JSON.stringify(hist));
        alert("Saved to history!");
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
function setMapMode(m) { mapMode = m; if(m === 'follow') centerOnMe(); }
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
    const reversedIndex = h.length - 1 - idx; 
    if(confirm("Load this game? Current active progress will be overwritten.")) {
        currentGameState = h[reversedIndex];
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
