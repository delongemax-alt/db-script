// =====================================================================================
// CORE: CONFIG, UI, API & UTILS
// =====================================================================================

(function() {
    'use strict';

    window.Nexus = window.Nexus || {};

    // 1. KONFIGURATION
    window.Nexus.CONFIG = {
        apiUrl: "https://api.dsplaner.space/api",
        debug: false,
        updateInterval: 300000,
        colors: {
            gold: '#c59b58',
            goldDim: 'rgba(197, 155, 88, 0.2)',
            dark: '#0f1116',
            glass: 'rgba(20, 22, 28, 0.95)',
            red: '#ff4d4d',
            green: '#2ecc71',
            blue: '#3498db',
            border: '1px solid rgba(197, 155, 88, 0.3)'
        }
    };

    window.Nexus.RESOURCES = {
        units: ["spear", "sword", "axe", "archer", "spy", "light", "marcher", "heavy", "ram", "catapult", "knight", "snob"],
        buildings: ['main', 'barracks', 'stable', 'garage', 'snob', 'smith', 'place', 'statue', 'market', 'wood', 'stone', 'iron', 'farm', 'storage', 'hide', 'wall']
    };

    window.Nexus.game_data = unsafeWindow.game_data;

    // 2. MODERNES UI & STYLING
    window.Nexus.addGlobalStyles = () => {
        const css = `
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
            #ds-nexus-panel { position: fixed; top: 100px; right: 20px; width: 320px; background: ${window.Nexus.CONFIG.colors.glass}; border: ${window.Nexus.CONFIG.colors.border}; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); color: #e0e0e0; z-index: 20000; font-family: 'Roboto', sans-serif; backdrop-filter: blur(5px); transition: transform 0.3s ease; }
            #ds-nexus-header { padding: 12px; background: linear-gradient(90deg, #1a1c24, #2a2d3a); border-bottom: ${window.Nexus.CONFIG.colors.border}; border-radius: 8px 8px 0 0; font-weight: 700; color: ${window.Nexus.CONFIG.colors.gold}; display: flex; justify-content: space-between; align-items: center; cursor: move; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; }
            .nexus-body { padding: 10px; max-height: 80vh; overflow-y: auto; }
            .nexus-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 10px; margin-bottom: 8px; }
            .nexus-btn { width: 100%; padding: 8px; margin-top: 5px; background: linear-gradient(180deg, #3a3f4b, #2c3039); border: 1px solid #4a505c; color: white; cursor: pointer; border-radius: 4px; font-weight: 500; font-size: 11px; transition: all 0.2s; text-transform: uppercase; display: flex; justify-content: center; align-items: center; gap: 6px; }
            .nexus-btn:hover { background: ${window.Nexus.CONFIG.colors.gold}; color: #000; border-color: ${window.Nexus.CONFIG.colors.gold}; }
            .nexus-btn.primary { background: linear-gradient(180deg, #2ecc71, #27ae60); border-color: #2ecc71; }
            .nexus-btn.danger { background: linear-gradient(180deg, #e74c3c, #c0392b); border-color: #e74c3c; }
            .nexus-input { width: 100%; background: #111; border: 1px solid #444; color: #fff; padding: 6px; border-radius: 4px; margin: 5px 0; font-size: 11px; }
            #nexus-log { font-family: monospace; font-size: 10px; height: 100px; overflow-y: auto; background: rgba(0,0,0,0.5); padding: 5px; border-radius: 4px; border: 1px solid #333; }
            .log-entry { padding: 2px 0; border-bottom: 1px dashed #333; display: flex; justify-content: space-between; }
            .log-success { color: ${window.Nexus.CONFIG.colors.green}; } .log-error { color: ${window.Nexus.CONFIG.colors.red}; } .log-info { color: ${window.Nexus.CONFIG.colors.blue}; }
            .nexus-badge { position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.8); color: ${window.Nexus.CONFIG.colors.gold}; font-size: 9px; padding: 2px 4px; border-radius: 3px; border: 1px solid ${window.Nexus.CONFIG.colors.gold}; z-index: 10; pointer-events: none; }
            .nexus-tooltip { position: absolute; background: #1a1c24; border: ${window.Nexus.CONFIG.colors.border}; padding: 10px; z-index: 21000; color: #fff; border-radius: 5px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); font-size: 11px; min-width: 200px; pointer-events: none; }
            .nexus-checkbox-container { display: flex; align-items: center; justify-content: center; }
            .nexus-checkbox { transform: scale(1.2); cursor: pointer; accent-color: ${window.Nexus.CONFIG.colors.gold}; }
            .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px; }
            .status-box { background: rgba(255,255,255,0.05); padding: 5px; text-align: center; border-radius: 4px; }
            .status-val { font-size: 14px; font-weight: bold; color: ${window.Nexus.CONFIG.colors.gold}; }
            .status-label { font-size: 9px; color: #888; text-transform: uppercase; }
            #nexus-toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 22000; display: flex; flex-direction: column; gap: 10px; }
            .nexus-toast { background: #1a1c24; border-left: 4px solid ${window.Nexus.CONFIG.colors.gold}; color: white; padding: 12px 20px; border-radius: 4px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); animation: slideIn 0.3s; font-size: 12px; display: flex; align-items: center; gap: 10px; }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `;
        GM_addStyle(css);
    };

    // 3. API & HELPER ENGINE
    window.Nexus.API = {
        getToken: () => GM_getValue("nexus_token", ""),
        setToken: (t) => { GM_setValue("nexus_token", t); location.reload(); },

        request: async (method, path, body = null) => {
            const token = window.Nexus.API.getToken();
            if (!token) return { success: false, error: "Kein Token. Bitte im Nexus anmelden." };

            return new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: method,
                    url: `${window.Nexus.CONFIG.apiUrl}${path}`,
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    data: body ? JSON.stringify(body) : null,
                    onload: (res) => {
                        try {
                            const json = JSON.parse(res.responseText);
                            resolve(json);
                        } catch (e) {
                            resolve({ success: false, error: "Server Antwort ungültig" });
                        }
                    },
                    onerror: () => resolve({ success: false, error: "Netzwerkfehler" })
                });
            });
        },
        post: (path, data) => window.Nexus.API.request("POST", path, data),
        get: (path) => window.Nexus.API.request("GET", path)
    };

    window.Nexus.Utils = {
        getWorld: () => {
            if (window.Nexus.game_data && window.Nexus.game_data.world) {
                return window.Nexus.game_data.world.replace(/\D/g, '');
            }
            const match = window.location.host.match(/^([a-z]+)(\d+)\./);
            return match ? match[2] : 'unknown';
        },
        getCoords: (str) => { const match = str.match(/\d{3}\|\d{3}/); return match ? match[0] : null; },
        formatDate: (ts) => new Date(ts * 1000).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        
        createUI: () => {
            if (document.getElementById('ds-nexus-panel')) return;
            const panel = document.createElement('div');
            panel.id = 'ds-nexus-panel';
            const token = window.Nexus.API.getToken();
            const currentWorld = window.Nexus.Utils.getWorld();

            let content = !token ? `
                <div class="nexus-card" style="border-color:${window.Nexus.CONFIG.colors.red}; text-align:center;">
                    <div style="color:${window.Nexus.CONFIG.colors.red};font-weight:bold;margin-bottom:5px;">⚠️ NICHT VERBUNDEN</div>
                    <input type="text" id="nexus-token" class="nexus-input" placeholder="Token hier einfügen...">
                    <button id="nexus-login" class="nexus-btn primary">Verbinden</button>
                </div>
            ` : `
                <div class="status-grid">
                    <div class="status-box">
                        <div class="status-val">${currentWorld}</div>
                        <div class="status-label">Welt</div>
                    </div>
                    <div class="status-box">
                        <div id="stat-uploads" class="status-val">0</div>
                        <div class="status-label">Uploads</div>
                    </div>
                </div>
                <div class="nexus-card">
                    <div style="font-size:10px; color:#888; margin-bottom:5px;">SCHNELLZUGRIFF</div>
                    <button class="nexus-btn" onclick="window.location.href='/game.php?screen=map'">🗺️ Taktik-Karte</button>
                    <button class="nexus-btn" onclick="window.location.href='/game.php?screen=overview_villages&mode=incomings'">🛡️ Incomings / Tab-It</button>
                    <button class="nexus-btn" onclick="window.location.href='/game.php?screen=report'">📂 Berichte Mass-Upload</button>
                </div>
                <div class="nexus-card">
                    <div style="font-size:10px; color:#888; margin-bottom:5px;">LIVE LOG</div>
                    <div id="nexus-log"></div>
                </div>
                <button id="nexus-logout" class="nexus-btn danger" style="margin-top:10px;">Ausloggen</button>
            `;

            panel.innerHTML = `
                <div id="ds-nexus-header">
                    <span>🔱 Nexus Titan v16.1</span>
                    <span style="cursor:pointer" onclick="this.parentElement.parentElement.style.display='none'">✕</span>
                </div>
                <div class="nexus-body">${content}</div>
            `;
            document.body.appendChild(panel);

            // Drag Functionality
            const header = document.getElementById('ds-nexus-header');
            let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
            header.addEventListener("mousedown", dragStart);
            document.addEventListener("mouseup", dragEnd);
            document.addEventListener("mousemove", drag);

            function dragStart(e) { initialX = e.clientX - xOffset; initialY = e.clientY - yOffset; if (e.target === header || e.target.parentNode === header) isDragging = true; }
            function dragEnd() { initialX = currentX; initialY = currentY; isDragging = false; }
            function drag(e) { if (isDragging) { e.preventDefault(); currentX = e.clientX - initialX; currentY = e.clientY - initialY; xOffset = currentX; yOffset = currentY; panel.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`; } }

            if (!token) {
                document.getElementById('nexus-login').onclick = () => window.Nexus.API.setToken(document.getElementById('nexus-token').value.trim());
            } else {
                document.getElementById('nexus-logout').onclick = () => window.Nexus.API.setToken("");
            }
        },

        log: (msg, type='info') => {
            const log = document.getElementById('nexus-log');
            if(!log) return;
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
            const time = new Date().toLocaleTimeString().split(' ')[0];
            entry.innerHTML = `<span class="log-${type}">${icon} ${msg}</span> <span style="color:#666">${time}</span>`;
            log.prepend(entry);
        },

        toast: (msg, type='info') => {
            let container = document.getElementById('nexus-toast-container');
            if(!container) {
                container = document.createElement('div');
                container.id = 'nexus-toast-container';
                document.body.appendChild(container);
            }
            const t = document.createElement('div');
            t.className = 'nexus-toast';
            t.style.borderColor = type === 'success' ? window.Nexus.CONFIG.colors.green : (type === 'error' ? window.Nexus.CONFIG.colors.red : window.Nexus.CONFIG.colors.gold);
            t.innerHTML = `<span>${msg}</span>`;
            container.appendChild(t);
            setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 4000);
        }
    };
})();
