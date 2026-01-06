(function() {
    'use strict';
    const Nexus = window.Nexus;

    window.Nexus.WorkbenchModule = {
        init: () => {
            // Optional: Auto-Init logic
        },

        openPopup: () => {
            const overlayId = 'nexus-wb-overlay';
            if (document.getElementById(overlayId)) return;

            const overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.style.cssText = `
                position: fixed; top: 10%; left: 15%; width: 70%; height: 80%;
                background: rgba(15, 17, 22, 0.98); border: 1px solid ${Nexus.CONFIG.colors.gold};
                border-radius: 12px; z-index: 22000; display: flex; flex-direction: column;
                box-shadow: 0 0 50px rgba(0,0,0,0.8); backdrop-filter: blur(10px); color: #fff;
            `;

            overlay.innerHTML = `
                <div style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 18px; color: ${Nexus.CONFIG.colors.gold}; font-weight: bold;">⚔️ WB Angriffs-Planer</div>
                    <div style="font-size: 10px; color: #888;">Format: WB-Code, Text-Export oder Tabellen</div>
                    <button id="nwb-close" class="nexus-btn danger" style="width: 30px;">✕</button>
                </div>
                <div style="padding: 15px; display:flex; gap: 10px; height: 100%;">
                    <div style="width: 30%; display:flex; flex-direction:column;">
                        <textarea id="nwb-input" placeholder="Füge hier deinen WB-Code ein...\nBeispiel: 10380&8129&snob&..." style="flex:1; background: #0a0b0e; color: #ccc; border: 1px solid #444; padding: 8px; font-family: monospace; font-size: 11px; resize: none;"></textarea>
                        <button id="nwb-parse" class="nexus-btn primary" style="margin-top: 10px;">Pläne Einlesen</button>
                    </div>
                    <div class="vis" style="width: 70%; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 0; border-radius: 5px; border: 1px solid #333;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                            <thead style="position: sticky; top: 0; background: #1a1c24; z-index: 2;">
                                <tr style="color: ${Nexus.CONFIG.colors.gold}; text-align: left; border-bottom: 1px solid #444;">
                                    <th style="padding: 10px;">Start</th>
                                    <th style="padding: 10px;">Ziel</th>
                                    <th style="padding: 10px;">Ankunft</th>
                                    <th style="padding: 10px;">Einheiten</th>
                                    <th style="padding: 10px;">Aktion</th>
                                </tr>
                            </thead>
                            <tbody id="nwb-list">
                                <tr><td colspan="5" style="text-align:center; padding: 20px; color: #666;">Keine Daten geladen.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            document.getElementById('nwb-close').onclick = () => overlay.remove();
            document.getElementById('nwb-parse').onclick = Nexus.WorkbenchModule.parseInput;
        },

        parseInput: () => {
            const text = document.getElementById('nwb-input').value;
            if (!text.trim()) return Nexus.Utils.toast("Bitte Text einfügen!", "error");

            const lines = text.split(/\n/);
            const tbody = document.getElementById('nwb-list');
            tbody.innerHTML = '';

            const currentVillageId = Nexus.game_data.village.id;
            const currentCoord = Nexus.game_data.village.coord;
            let count = 0;

            lines.forEach(line => {
                line = line.trim();
                if (!line) return;

                let originId = null;
                let targetId = null;
                let originDisplay = "?";
                let targetDisplay = "?";
                let arrivalTime = "-";
                let units = {};
                let valid = false;

                // --- ERKENNUNG 1: Dein spezieller WB Code (ID&ID&...) ---
                // Format: 10380&8129&snob&1767817800000&...&spear=/sword=/...
                if (line.match(/^\d+&\d+&/)) {
                    try {
                        const parts = line.split('&');
                        originId = parseInt(parts[0]);
                        targetId = parseInt(parts[1]);
                        
                        originDisplay = `ID: ${originId}`;
                        targetDisplay = `ID: ${targetId}`;
                        
                        // Zeit (Index 3 ist Timestamp in ms)
                        const ts = parseInt(parts[3]);
                        if (!isNaN(ts)) arrivalTime = new Date(ts).toLocaleString();

                        // Einheiten parsen (Base64 decoded)
                        // Suche nach unitname=BASE64, gefolgt von / oder &
                        Nexus.RESOURCES.units.forEach(u => {
                            // Regex sucht z.B. snob=MQ==
                            const reg = new RegExp(`${u}=([^/&]*)`, 'i');
                            const match = line.match(reg);
                            if (match) {
                                const val = match[1];
                                if (val) {
                                    try {
                                        // Base64 decode
                                        const num = parseInt(atob(val));
                                        if (num > 0) units[u] = num;
                                    } catch(e) { console.log("B64 Error", val); }
                                }
                            }
                        });
                        valid = true;
                    } catch (e) { console.error("Parse Error WB-Code", e); }
                } 
                
                // --- ERKENNUNG 2: Standard Text (555|555 --> 666|666) ---
                else {
                    const coords = line.match(/(\d{3}\|\d{3})/g);
                    if (coords && coords.length >= 2) {
                        originDisplay = coords[0];
                        targetDisplay = coords[1];
                        
                        // Bei Text haben wir keine IDs, wir nutzen Namen/Coords für Link später
                        // (Das Script versucht IDs zu nutzen wenn möglich, sonst Coords)
                        
                        // Einheiten suchen (Text: "500 Ramme")
                        Nexus.RESOURCES.units.forEach(u => {
                            const regText = new RegExp(`(\\d+)\\s*${u}|${u}\\s*[:]*\\s*(\\d+)`, 'i');
                            const match = line.match(regText);
                            if (match) {
                                const amount = parseInt(match[1] || match[2]);
                                if (amount > 0) units[u] = amount;
                            }
                        });

                        // Zeit
                        const timeMatch = line.match(/(\d{2}\.\d{2}\.\s\d{2}:\d{2}:\d{2})|(\d{2}:\d{2}:\d{2})/);
                        if (timeMatch) arrivalTime = timeMatch[0];
                        
                        valid = true;
                    }
                }

                // --- ZEILE RENDERN ---
                if (valid && (Object.keys(units).length > 0 || true)) {
                    count++;
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                    
                    // Aktiv Check: Entweder ID Match oder Coord Match
                    const isActive = (originId && originId == currentVillageId) || (originDisplay === currentCoord);
                    
                    // Einheiten String & Icons
                    let urlParams = '';
                    let unitDisplay = '';
                    for (let u in units) {
                        urlParams += `&${u}=${units[u]}`;
                        unitDisplay += `<span style="margin-right:5px; white-space:nowrap;"><img src="https://dsde.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_${u}.png" width="14" style="vertical-align:middle"> ${units[u]}</span>`;
                    }

                    // Link bauen
                    let link = '#';
                    if (targetId) {
                        // Link mit Target ID (zuverlässiger für WB Code)
                        link = `/game.php?screen=place&target=${targetId}${urlParams}`;
                    } else {
                        // Link mit Koordinaten (Fallback für Text Import)
                        const [tx, ty] = targetDisplay.split('|');
                        link = `/game.php?screen=place&x=${tx}&y=${ty}${urlParams}`;
                    }

                    tr.innerHTML = `
                        <td style="padding: 8px; color: ${isActive ? '#00e676' : '#888'}; font-weight: ${isActive?'bold':'normal'}">${originDisplay}</td>
                        <td style="padding: 8px; color: ${Nexus.CONFIG.colors.gold};">${targetDisplay}</td>
                        <td style="padding: 8px; font-family:monospace; font-size:10px;">${arrivalTime}</td>
                        <td style="padding: 8px;">${unitDisplay || '<span style="opacity:0.3">-</span>'}</td>
                        <td style="padding: 8px;">
                            ${isActive 
                                ? `<button class="nexus-btn primary" style="padding: 4px 10px; font-size: 10px;" onclick="window.open('${link}', '_self')">⚔️ ATTACK</button>` 
                                : `<span style="font-size:9px; color:#555; border:1px solid #333; padding:2px 4px; border-radius:3px;">Falsches Dorf</span>`
                            }
                        </td>
                    `;
                    if(isActive) tr.style.background = 'rgba(46, 204, 113, 0.1)';
                    tbody.appendChild(tr);
                }
            });

            if (count === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #ff4d4d;">Keine gültigen Daten erkannt.</td></tr>`;
                Nexus.Utils.toast("Keine Angriffe gefunden.", "error");
            } else {
                Nexus.Utils.toast(`${count} Zeilen verarbeitet!`, "success");
            }
        }
    };
})();
