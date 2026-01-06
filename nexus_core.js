// =====================================================================================
// CORE: CONFIG, UI, API & UTILS (FIXED WORKBENCH BUTTON)
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
            goldGlow: '0 0 10px rgba(197, 155, 88, 0.4)',
            dark: '#0f1116',
            glass: 'rgba(15, 17, 22, 0.95)',
            glassLight: 'rgba(255, 255, 255, 0.05)',
            red: '#ff4d4d',
            green: '#00e676',
            blue: '#2979ff',
            border: '1px solid rgba(197, 155, 88, 0.25)'
        }
    };

    window.Nexus.RESOURCES = {
        units: ["spear", "sword", "axe", "archer", "spy", "light", "marcher", "heavy", "ram", "catapult", "knight", "snob"],
        buildings: ['main', 'barracks', 'stable', 'garage', 'snob', 'smith', 'place', 'statue', 'market', 'wood', 'stone', 'iron', 'farm', 'storage', 'hide', 'wall']
    };

    window.Nexus.game_data = unsafeWindow.game_data;

    // 2. UI STYLING
    window.Nexus.addGlobalStyles = () => {
        const c = window.Nexus.CONFIG.colors;
        const css = `
            @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Roboto:wght@400;500&display=swap');
            
            #ds-nexus-panel { 
                position: fixed; top: 100px; right: 20px; width: 340px; 
                background: ${c.glass}; border: ${c.border}; border-radius: 12px; 
                box-shadow: 0 20px 50px rgba(0,0,0,0.9); color: #e0e0e0; z-index: 20000; 
                font-family: 'Roboto', sans-serif; backdrop-filter: blur(12px); 
            }
            #ds-nexus-header { 
                padding: 15px; background: linear-gradient(90deg, rgba(26,28,36,0.9), rgba(42,45,58,0.5)); 
                border-bottom: 1px solid rgba(255,255,255,0.08); border-radius: 12px 12px 0 0; 
                font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 16px; color: ${c.gold}; 
                display: flex; justify-content: space-between; align-items: center; cursor: move; 
                text-transform: uppercase; letter-spacing: 1.5px; text-shadow: ${c.goldGlow};
            }
            .nexus-body { padding: 15px; max-height: 80vh; overflow-y: auto; }
            .nexus-player-card {
                display: flex; align-items: center; justify-content: space-between;
                background: linear-gradient(135deg, rgba(197, 155, 88, 0.1), rgba(0,0,0,0));
                border: 1px solid rgba(197, 155, 88, 0.3); border-radius: 8px; padding: 10px 15px; margin-bottom: 15px;
            }
            .player-name { font-family: 'Rajdhani', sans-serif; font-size: 18px; font-weight: bold; color: #fff; }
            .world-info { font-size: 11px; color: ${c.gold}; opacity: 0.8; text-transform: uppercase; }
            .nexus-card { background: ${c.glassLight}; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
            .nexus-section-title { font-size: 10px; color: #6d758d; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
            .nexus-btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .nexus-btn { 
                width: 100%; padding: 10px; background: rgba(44, 48, 57, 0.6); border: 1px solid rgba(255,255,255,0.1); 
                color: #ccc; cursor: pointer; border-radius: 6px; font-weight: 500; font-size: 11px; 
                transition: all 0.2s; text-transform: uppercase; display: flex; justify-content: center; align-items: center; gap: 8px; 
            }
            .nexus-btn:hover { background: rgba(197, 155, 88, 0.15); color: #fff; border-color: ${c.gold}; box-shadow: ${c.goldGlow}; }
            .nexus-btn.primary { background: linear-gradient(180deg, rgba(46, 204, 113, 0.2), rgba(39, 174, 96, 0.2)); border-color: ${c.green}; color: ${c.green}; }
            .nexus-btn.primary:hover { background: ${c.green}; color: #000; box-shadow: 0 0 15px rgba(46, 204, 113, 0.4); }
            .nexus-btn.danger { background: rgba(231, 76, 60, 0.1); border-color: ${c.red}; color: ${c.red}; margin-top: 10px; }
            .nexus-btn.danger:hover { background: ${c.red}; color: #fff; }
            .nexus-input { width: 100%; background: #0a0b0e; border: 1px solid #333; color: #fff; padding: 8px; border-radius: 4px; margin: 5px 0; font-size: 12px; }
            .nexus-input:focus { border-color: ${c.gold}; outline: none; }
            #nexus-log { font-family: 'Consolas', monospace; font-size: 10px; height: 100px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); }
            .log-entry { padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; }
            .log-success { color: ${c.green}; } .log-error { color: ${c.red}; } .log-info { color: ${c.blue}; }
            .nexus-badge { position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.8); color: ${c.gold}; font-size: 9px; padding: 2px 4px; border-radius: 3px; border: 1px solid ${c.gold}; pointer-events: none; }
            .status-val { font-size: 16px; font-weight: bold; color: ${c.gold}; font-family: 'Rajdhani', sans-serif; }
            .status-label { font-size: 9px; color: #666; text-transform: uppercase; margin-top: 2px; }
            #nexus-toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 22000; display: flex; flex-direction: column; gap: 10px; }
            .nexus-toast { background: #1a1c24; border-left: 4px solid ${c.gold}; color: white; padding: 12px 20px; border-radius: 4px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); animation: slideIn 0.3s; font-size: 12px; }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `;
        GM_addStyle(css);
    };

    // 3. API & HELPER
    window.Nexus.API = {
        getToken: () => GM_getValue("nexus_token", ""),
        setToken: (t) => { GM_setValue("nexus_token", t); location.reload(); },
        request: async (method, path, body = null) => {
            const token = window.Nexus.API.getToken();
            if (!token) return { success: false, error: "Kein Token." };
            return new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: method, url: `${window.Nexus.CONFIG.apiUrl}${path}`,
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    data: body ? JSON.stringify(body) : null,
                    onload: (res) => { try { resolve(JSON.parse(res.responseText)); } catch (e) { resolve({ success: false, error: "Server Error" }); } },
                    onerror: () => resolve({ success: false, error: "Network Error" })
                });
            });
        },
        post: (path, data) => window.Nexus.API.request("POST", path, data),
        get: (path) => window.Nexus.API.request("GET", path)
    };

    window.Nexus.Utils = {
        getWorld: () => {
            if (window.Nexus.game_data && window.Nexus.game_data.world) return window.Nexus.game_data.world.replace(/\D/g, '');
            const match = window.location.host.match(/^([a-z]+)(\d+)\./);
            return match ? match[2] : 'unknown';
        }, 

        // Hilfsfunktionen
        formatNumber: (num) => {
            return num >= 1000 ? (num/1000).toFixed(1) + 'k' : num;
        },
        coordToId: (coord) => {
            return ""; 
        },

        getPlayerName: () => {
            if (window.Nexus.game_data && window.Nexus.game_data.player && window.Nexus.game_data.player.name) {
                return window.Nexus.game_data.player.name;
            }
            const links = document.querySelectorAll('a[href*="screen=info_player"]');
            for(let i = 0; i < links.length; i++) {
                const text = links[i].innerText.trim();
                if (text && text.toLowerCase() !== "profil" && text.toLowerCase() !== "profile" && text !== "") {
                    return text; 
                }
            }
            return "Spieler";
        },

        getCoords: (str) => { const match = str.match(/\d{3}\|\d{3}/); return match ? match[0] : null; },
        
        createUI: () => {
            if (document.getElementById('ds-nexus-panel')) return;
            const panel = document.createElement('div');
            panel.id = 'ds-nexus-panel';
            const token = window.Nexus.API.getToken();
            const currentWorld = window.Nexus.Utils.getWorld();
            const playerName = window.Nexus.Utils.getPlayerName(); 

            let content = !token ? `
                <div class="nexus-card" style="border-color:${window.Nexus.CONFIG.colors.red}; text-align:center;">
                    <div style="color:${window.Nexus.CONFIG.colors.red};font-weight:bold;margin-bottom:10px;">⚠️ NICHT VERBUNDEN</div>
                    <input type="text" id="nexus-token" class="nexus-input" placeholder="Token hier einfügen...">
                    <button id="nexus-login" class="nexus-btn primary" style="margin-top:10px;">Verbinden</button>
                </div>
            ` : `
                <div class="nexus-player-card">
                    <div>
                        <div class="player-name">${playerName}</div>
                        <div class="world-info">Welt ${currentWorld}</div>
                    </div>
                    <div style="text-align:right;">
                         <div class="status-val" id="stat-uploads-mini">0</div>
                         <div class="status-label">Uploads</div>
                    </div>
                </div>

                <div class="nexus-card">
                    <div class="nexus-section-title">Schnellzugriff</div>
                    <div class="nexus-btn-grid">
                        <button class="nexus-btn" onclick="window.location.href='/game.php?screen=map'">🗺️ Karte</button>
                        <button class="nexus-btn" onclick="window.location.href='/game.php?screen=overview_villages&mode=incomings'">🛡️ Incs</button>
                    </div>
                    <div class="nexus-btn-grid" style="margin-top:8px;">
                        <button class="nexus-btn" onclick="window.location.href='/game.php?screen=overview_villages&mode=units'">⚔️ Truppen</button>
                        <button class="nexus-btn" onclick="window.location.href='/game.php?screen=snob'">👑 Adelshof</button>
                    </div>
                    <button class="nexus-btn" style="margin-top:8px;" onclick="window.location.href='/game.php?screen=report'">📂 Berichte Upload</button>
                    
                    <button id="nexus-db-btn" class="nexus-btn primary" style="margin-top:8px;">👁️ Datenbank Viewer</button>
                    
                    <button id="nexus-wb-btn" class="nexus-btn" style="margin-top:8px;">⚔️ Workbench Import</button>
                </div>

                <div class="nexus-card">
                    <div class="nexus-section-title">Live Log</div>
                    <div id="nexus-log"></div>
                </div>
                <button id="nexus-logout" class="nexus-btn danger">Verbindung trennen</button>
            `;

            panel.innerHTML = `
                <div id="ds-nexus-header">
                    <span style="display:flex; align-items:center; gap:8px;">🔱 NEXUS TITAN <span style="font-size:10px; opacity:0.5;">v16.5</span></span>
                    <span style="cursor:pointer; opacity:0.7; font-size:18px;" onclick="this.parentElement.parentElement.style.display='none'">×</span>
                </div>
                <div class="nexus-body">${content}</div>
            `;
            document.body.appendChild(panel);

            // Dragging Logic
            const header = document.getElementById('ds-nexus-header');
            let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
            header.addEventListener("mousedown", (e) => { initialX = e.clientX - xOffset; initialY = e.clientY - yOffset; if (e.target === header || e.target.parentNode === header) isDragging = true; });
            document.addEventListener("mouseup", () => { initialX = currentX; initialY = currentY; isDragging = false; });
            document.addEventListener("mousemove", (e) => { if (isDragging) { e.preventDefault(); currentX = e.clientX - initialX; currentY = e.clientY - initialY; xOffset = currentX; yOffset = currentY; panel.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`; } });

            // Button Event Listeners
            if (!token) {
                document.getElementById('nexus-login').onclick = () => window.Nexus.API.setToken(document.getElementById('nexus-token').value.trim());
            } else {
                document.getElementById('nexus-logout').onclick = () => window.Nexus.API.setToken("");
                
                // DB Viewer Event
                const dbBtn = document.getElementById('nexus-db-btn');
                if (dbBtn) {
                    dbBtn.onclick = () => {
                        if (window.Nexus.DbViewModule && window.Nexus.DbViewModule.openViewer) {
                            window.Nexus.DbViewModule.openViewer();
                        } else {
                            window.Nexus.Utils.toast("Modul 'DbViewModule' nicht geladen!", "error");
                        }
                    };
                }

                // --- HIER IST DIE REPARATUR FÜR WORKBENCH ---
                const wbBtn = document.getElementById('nexus-wb-btn');
                if (wbBtn) {
                    wbBtn.onclick = () => {
                        if (window.Nexus.WorkbenchModule && window.Nexus.WorkbenchModule.openPopup) {
                            window.Nexus.WorkbenchModule.openPopup();
                        } else {
                            window.Nexus.Utils.toast("Modul 'WorkbenchModule' nicht geladen!", "error");
                            console.error("WorkbenchModule fehlt. Checke nexus_workbench.js auf GitHub.");
                        }
                    };
                }
            }
        },
        log: (msg, type='info') => {
            const log = document.getElementById('nexus-log'); if(!log) return;
            const entry = document.createElement('div'); entry.className = 'log-entry';
            const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : '»');
            entry.innerHTML = `<span class="log-${type}">${icon} ${msg}</span> <span style="color:#666">${new Date().toLocaleTimeString().split(' ')[0]}</span>`;
            log.prepend(entry);
        },
        toast: (msg, type='info') => {
            let container = document.getElementById('nexus-toast-container');
            if(!container) { container = document.createElement('div'); container.id = 'nexus-toast-container'; document.body.appendChild(container); }
            const t = document.createElement('div'); t.className = 'nexus-toast';
            t.style.borderColor = type === 'success' ? window.Nexus.CONFIG.colors.green : (type === 'error' ? window.Nexus.CONFIG.colors.red : window.Nexus.CONFIG.colors.gold);
            t.innerHTML = `<span>${msg}</span>`; container.appendChild(t);
            setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 4000);
        }
    };
})();
