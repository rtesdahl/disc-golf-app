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

// Hole Tee Tracking Variables
let holeTouchTimer = null;

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
        
        tr.innerHTML = `<td data-h="${h}" 
            style="user-select: none; cursor: pointer;"
            ontouchstart="handleHoleTouchStart(event, this)" 
            ontouchmove="handleHoleTouchMove(event, this)" 
            ontouchend="handleHoleTouchEnd(event, this)"
            oncontextmenu="return false;">${h}</td><td>
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

// --- SCORE INPUT TOUCH LOGIC ---
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

// --- HOLE TEE LOGGING TOUCH LOGIC ---
function handleHoleTouchStart(e, el) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = false;
    clearTimeout(holeTouchTimer);
    el.classList.add('long-press-active');
    holeTouchTimer = setTimeout(() => {
        if (!isDragging) {
            logTeeLocation(el.dataset.h, el);
        }
    }, 500);
}

function handleHoleTouchMove(e, el) {
    if (isDragging) return;
    const moveX = e.touches[0].clientX;
    const moveY = e.touches[0].clientY;
    if (Math.abs(moveX - touchStartX) > 10 || Math.abs(moveY - touchStartY) > 10) {
        isDragging = true;
        clearTimeout(holeTouchTimer);
        el.classList.remove('long-press-active');
    }
}

function handleHoleTouchEnd(e, el) {
    clearTimeout(holeTouchTimer);
    el.classList.remove('long-press-active');
}

function logTeeLocation(hole, el) {
    if (navigator.vibrate) navigator.vibrate(50); 
    el.classList.remove('long-press-active');
    
    const originalBg = el.style.backgroundColor;
    const originalColor = el.style.color;
    
    // 1. Initial State: Red (> 50m / Acquiring)
    el.style.backgroundColor = '#c0392b'; 
    el.style.color = 'white';

    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        el.style.backgroundColor = originalBg;
        el.style.color = originalColor;
        return;
    }

    let tempWatchId = null;
    let fallbackTimeout = null;
    let bestPos = null;
    
    const TARGET_ACCURACY = 10; 
    const MAX_WAIT_TIME = 10000; 

    const saveAndCleanup = (finalPos) => {
        if (tempWatchId) navigator.geolocation.clearWatch(tempWatchId);
        if (fallbackTimeout) clearTimeout(fallbackTimeout);

        if (finalPos) {
            const record = {
                courseId: currentGameState.courseId,
                hole: hole,
                lat: finalPos.coords.latitude,
                lng: finalPos.coords.longitude,
                accuracy: Math.round(finalPos.coords.accuracy),
                timestamp: new Date().toISOString()
            };
            
            const coords = JSON.parse(localStorage.getItem('dg_tee_coords') || '[]');
            coords.push(record);
            localStorage.setItem('dg_tee_coords', JSON.stringify(coords));
            console.log(`Tee ${hole} Logged. Accuracy: ${record.accuracy}m`);

            if (navigator.vibrate) navigator.vibrate([50, 100, 50]); 
            
            // Final Success State: Green hold for 5 seconds
            el.style.backgroundColor = '#27ae60'; 
            el.style.color = 'white';
            
            setTimeout(() => {
                el.style.backgroundColor = originalBg;
                el.style.color = originalColor;
            }, 5000);

        } else {
            // Complete failure (flash dark gray)
            el.style.backgroundColor = '#34495e'; 
            setTimeout(() => {
                el.style.backgroundColor = originalBg;
                el.style.color = originalColor;
            }, 1500);
        }
    };

    // 2. Spin up the high-precision stream
    tempWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            const acc = pos.coords.accuracy;
            
            if (!bestPos || acc < bestPos.coords.accuracy) {
                bestPos = pos;
            }
            
            // 3. Progressive Visual Feedback
            if (acc <= TARGET_ACCURACY) {
                saveAndCleanup(pos); 
            } else if (acc <= 25) {
                el.style.backgroundColor = '#f1c40f'; 
                el.style.color = 'black'; 
            } else if (acc <= 50) {
                el.style.backgroundColor = '#e67e22'; 
                el.style.color = 'white';
            }
        },
        (err) => {
            console.error("Tee Log GPS Error:", err);
            if (err.code === 1) saveAndCleanup(null); 
        },
        { 
            enableHighAccuracy: true, 
            timeout: 5000, 
            maximumAge: 0 
        }
    );

    // 4. Fallback timer
    fallbackTimeout = setTimeout(() => {
        console.warn("Tee GPS Timeout. Saving best available location.");
        saveAndCleanup(bestPos); 
    }, MAX_WAIT_TIME);
}

function exportTeeData() {
    const coords = JSON.parse(localStorage.getItem('dg_tee_coords') || '[]');
    if (coords.length === 0) {
        alert("No tee coordinates have been logged yet.");
        return;
    }
    
    let csv = "CourseID,Hole,Latitude,Longitude,Accuracy(m),Timestamp\n";
    coords.forEach(c => {
        csv += `${c.courseId},${c.hole},${c.lat},${c.lng},${c.accuracy},${c.timestamp}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dg_tee_coords_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        const h = JSON
