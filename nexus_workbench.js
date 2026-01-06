(function() {
    'use strict';
    const Nexus = window.Nexus;

    window.Nexus.WorkbenchModule = {
        init: () => {
            // Button zum Hauptpanel hinzufügen (muss in nexus_core.js aufgerufen werden oder hier injected)
             // Wir injizieren ihn einfach direkt in den Nexus-Header oder Body, wenn das Modul lädt
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
                <div style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between;">
                    <div style="font-size: 18px; color: ${Nexus.CONFIG.colors.gold}; font-weight: bold;">⚔️ WB Angriffs-Planer</div>
                    <button id="nwb-close" class="nexus-btn danger" style="width: 30px;">✕</button>
                </div>
                <div style="padding: 15px; display:flex; gap: 10px; height: 100%;">
                    <div style="width: 30%; display:flex; flex-direction:column;">
                        <textarea id="nwb-input" placeholder="Workbench Export hier einfügen..." style="flex:1; background: #000; color: #ccc; border: 1px solid #444; padding: 5px; font-family: monospace; font-size: 10px;"></textarea>
                        <button id="nwb-parse" class="nexus-btn primary" style="margin-top: 10px;">Pläne Einlesen</button>
                    </div>
                    <div class="vis" style="width: 70%; overflow-y: auto; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="color: ${Nexus.CONFIG.colors.gold}; text-align: left; border-bottom: 1px solid #444;">
                                    <th>Start</th>
                                    <th>Ziel</th>
                                    <th>Ankunft</th>
                                    <th>Einheiten</th>
                                    <th>Aktion</th>
                                </tr>
                            </thead>
                            <tbody id="nwb-list"></tbody>
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
            const lines = text.split('\n');
            const tbody = document.getElementById('nwb-list');
            tbody.innerHTML = '';

            const currentCoord = Nexus.game_data.village.coord; // Wo sind wir gerade?

            lines.forEach(line => {
                // Einfacher Regex für Workbench Formate (Musst du ggf. an dein Format anpassen)
                // Beispiel: "555|444 --> 666|777 Ramme 13.05.2024 14:00:00"
                // Dieser Regex sucht nach zwei Koordinatenpaaren
                const coords = line.match(/(\d{3}\|\d{3}).*?(\d{3}\|\d{3})/);
                
                if (coords) {
                    const origin = coords[1];
                    const target = coords[2];
                    
                    // Truppen parsen (sehr rudimentär, sucht nach Zahlen vor Einheitennamen)
                    // Du musst das Format deines WB Exports genau prüfen!
                    const units = {};
                    Nexus.RESOURCES.units.forEach(u => {
                        // Sucht z.B. nach "500 Axt" oder "Axt: 500"
                        const reg = new RegExp(`(\\d+)\\s*${u}`, 'i'); 
                        const match = line.match(reg);
                        if(match) units[u] = match[1];
                    });

                    // Zeit parsen
                    const timeMatch = line.match(/(\d{2}\.\d{2}\.\s\d{2}:\d{2}:\d{2})|(\d{2}:\d{2}:\d{2})/);
                    const time = timeMatch ? timeMatch[0] : '-';

                    // Zeile bauen
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                    
                    // Ist dies das aktuelle Dorf?
                    const isActiveVillage = origin === currentCoord;
                    const rowColor = isActiveVillage ? 'rgba(46, 204, 113, 0.1)' : '';

                    // Einheiten String für URL
                    let urlParams = '';
                    let unitDisplay = '';
                    for (let u in units) {
                        urlParams += `&${u}=${units[u]}`;
                        unitDisplay += `<img src="https://dsde.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_${u}.png" width="14"> ${units[u]} `;
                    }

                    // Link zum Versammlungsplatz bauen (Nutzt Ingame Koordinaten Params)
                    // Trick: Wir nutzen input=xy Parameter, das füllt oft Scripte aus, oder wir nutzen den Standard Link
                    // Achtung: Standard DS unterstützt Truppen per URL NICHT nativ ohne Scripte.
                    // Aber viele nutzen Userscripte die ?spear=100 lesen.
                    // Alternativ: Wir nutzen den "Fake Script Generator" Link Stil.
                    
                    // Wir bauen einen Link, der auf den Versammlungsplatz zeigt
                    // Um das Ziel zu setzen, nutzen wir &x und &y
                    const [tx, ty] = target.split('|');
                    const link = `/game.php?screen=place&x=${tx}&y=${ty}${urlParams}`;

                    tr.innerHTML = `
                        <td style="padding: 5px; color: ${isActiveVillage ? '#fff' : '#666'}; font-weight: ${isActiveVillage?'bold':'normal'}">${origin}</td>
                        <td style="padding: 5px; color: #ebbc4d;">${target}</td>
                        <td style="padding: 5px;">${time}</td>
                        <td style="padding: 5px;">${unitDisplay}</td>
                        <td style="padding: 5px;">
                            ${isActiveVillage 
                                ? `<button class="nexus-btn primary" onclick="window.open('${link}', '_self')">⚔️ ATTACK</button>` 
                                : `<span style="font-size:10px; color:#555;">Falsches Dorf</span>`
                            }
                        </td>
                    `;
                    tr.style.background = rowColor;
                    tbody.appendChild(tr);
                }
            });
        }
    };
})();
