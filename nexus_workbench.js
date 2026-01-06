(function() {
    'use strict';
    const Nexus = window.Nexus;

    window.Nexus.WorkbenchModule = {
        init: () => {
            // Init logic if needed
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
                    <div style="font-size: 10px; color: #888;">Unterstützt: Text-Export, URL-Parameter, Tabellen</div>
                    <button id="nwb-close" class="nexus-btn danger" style="width: 30px;">✕</button>
                </div>
                <div style="padding: 15px; display:flex; gap: 10px; height: 100%;">
                    <div style="width: 30%; display:flex; flex-direction:column;">
                        <textarea id="nwb-input" placeholder="Workbench Export hier einfügen...&#10;Beispiel:&#10;555|555 666|666 Ramme 10:00:00" style="flex:1; background: #0a0b0e; color: #ccc; border: 1px solid #444; padding: 8px; font-family: monospace; font-size: 11px; resize: none;"></textarea>
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

            const lines = text.split('\n');
            const tbody = document.getElementById('nwb-list');
            tbody.innerHTML = '';

            const currentCoord = Nexus.game_data.village.coord; 
            let count = 0;

            lines.forEach(line => {
                // 1. Koordinaten finden (sucht nach ALLEN Vorkommen von NNN|NNN in einer Zeile)
                const coords = line.match(/(\d{3}\|\d{3})/g);
                
                // Wir brauchen mindestens 2 Koordinaten (Start und Ziel)
                if (coords && coords.length >= 2) {
                    const origin = coords[0];
                    const target = coords[1]; // Nimmt die zweite Koordinate als Ziel
                    
                    const units = {};
                    let hasUnits = false;

                    Nexus.RESOURCES.units.forEach(u => {
                        // Strategie A: URL-Format (z.B. &spear=100)
                        let regexUrl = new RegExp(`[&?]${u}=(\\d+)`, 'i');
                        let matchUrl = line.match(regexUrl);

                        // Strategie B: Text-Format (z.B. 100 Speer oder Speer: 100)
                        let regexText = new RegExp(`(\\d+)\\s*${u}|${u}\\s*[:]*\\s*(\\d+)`, 'i');
                        let matchText = line.match(regexText);

                        let amount = 0;
                        if (matchUrl) amount = parseInt(matchUrl[1]);
                        else if (matchText) amount = parseInt(matchText[1] || matchText[2]);

                        if (amount > 0) {
                            units[u] = amount;
                            hasUnits = true;
                        }
                    });

                    // Zeit parsen
                    const timeMatch = line.match(/(\d{2}\.\d{2}\.\s\d{2}:\d{2}:\d{2})|(\d{2}:\d{2}:\d{2})/);
                    const time = timeMatch ? timeMatch[0] : '-';

                    // Nur hinzufügen, wenn Einheiten gefunden wurden oder es explizit gewünscht ist
                    if (true) { 
                        count++;
                        const tr = document.createElement('tr');
                        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                        
                        const isActiveVillage = origin === currentCoord;
                        const rowColor = isActiveVillage ? 'rgba(46, 204, 113, 0.15)' : '';

                        let urlParams = '';
                        let unitDisplay = '';
                        for (let u in units) {
                            urlParams += `&${u}=${units[u]}`;
                            unitDisplay += `<span style="margin-right:5px;"><img src="https://dsde.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_${u}.png" width="14" style="vertical-align:middle"> ${units[u]}</span>`;
                        }

                        // Split target coords for link
                        const [tx, ty] = target.split('|');
                        // Link zum Versammlungsplatz
                        const link = `/game.php?village=${Nexus.game_data.village.id}&screen=place&x=${tx}&y=${ty}${urlParams}`;

                        tr.innerHTML = `
                            <td style="padding: 8px; color: ${isActiveVillage ? '#00e676' : '#888'}; font-weight: ${isActiveVillage?'bold':'normal'}">${origin}</td>
                            <td style="padding: 8px; color: ${Nexus.CONFIG.colors.gold};">${target}</td>
                            <td style="padding: 8px; font-family:monospace;">${time}</td>
                            <td style="padding: 8px;">${unitDisplay || '<span style="opacity:0.3">-</span>'}</td>
                            <td style="padding: 8px;">
                                ${isActiveVillage 
                                    ? `<button class="nexus-btn primary" style="padding: 4px 10px; font-size: 10px;" onclick="window.open('${link}', '_self')">⚔️ ATTACK</button>` 
                                    : `<span style="font-size:9px; color:#555; border:1px solid #333; padding:2px 4px; border-radius:3px;">Falsches Dorf</span>`
                                }
                            </td>
                        `;
                        tr.style.background = rowColor;
                        tbody.appendChild(tr);
                    }
                }
            });

            if (count === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #ff4d4d;">
                    Keine gültigen Zeilen erkannt!<br>
                    <span style="font-size:10px; color:#888;">Benötigtes Format pro Zeile: "Start|Koord ... Ziel|Koord ... Einheiten"</span>
                </td></tr>`;
                Nexus.Utils.toast("Keine Angriffe erkannt. Format prüfen.", "error");
            } else {
                Nexus.Utils.toast(`${count} Angriffe eingelesen!`, "success");
            }
        }
    };
})();
