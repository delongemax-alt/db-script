(function() {
    'use strict';
    const Nexus = window.Nexus;

    window.Nexus.DbViewModule = {
        init: () => {
            // Wir fügen einen Button zum Nexus-Panel hinzu, um die DB-Ansicht zu öffnen
            // Das passiert dynamisch, wenn das Panel erstellt wird (siehe nexus_core.js Änderung unten)
        },

        openViewer: async () => {
            // 1. Overlay erstellen
            const overlayId = 'nexus-db-overlay';
            if (document.getElementById(overlayId)) return;

            const overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.style.cssText = `
                position: fixed; top: 50px; left: 50px; right: 50px; bottom: 50px;
                background: rgba(15, 17, 22, 0.98); border: 1px solid ${Nexus.CONFIG.colors.gold};
                border-radius: 12px; z-index: 21000; display: flex; flex-direction: column;
                box-shadow: 0 0 50px rgba(0,0,0,0.8); backdrop-filter: blur(10px); color: #fff;
                font-family: 'Roboto', sans-serif;
            `;

            // 2. Header
            overlay.innerHTML = `
                <div style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3);">
                    <div style="font-family: 'Rajdhani', sans-serif; font-size: 20px; color: ${Nexus.CONFIG.colors.gold}; font-weight: bold; text-transform: uppercase;">
                        🔱 NEXUS DATABASE VIEWER <span style="font-size: 12px; opacity: 0.5;">Welt ${Nexus.Utils.getWorld()}</span>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="ndb-tab-troops" class="nexus-btn primary" style="width: auto;">🛡️ Truppen</button>
                        <button id="ndb-tab-commands" class="nexus-btn" style="width: auto;">⚔️ Befehle</button>
                        <button id="ndb-close" class="nexus-btn danger" style="width: 30px; padding: 0;">✕</button>
                    </div>
                </div>
                <div id="ndb-content" style="flex: 1; overflow-y: auto; padding: 20px;">
                    <div style="text-align: center; color: #666; margin-top: 50px;">Lade Daten...</div>
                </div>
            `;
            document.body.appendChild(overlay);

            // 3. Event Listeners
            document.getElementById('ndb-close').onclick = () => overlay.remove();
            document.getElementById('ndb-tab-troops').onclick = () => Nexus.DbViewModule.loadTroops();
            document.getElementById('ndb-tab-commands').onclick = () => Nexus.DbViewModule.loadCommands();

            // 4. Start mit Truppen
            Nexus.DbViewModule.loadTroops();
        },

        loadTroops: async () => {
            Nexus.DbViewModule.setActiveTab('ndb-tab-troops');
            const container = document.getElementById('ndb-content');
            container.innerHTML = '<div style="text-align: center; color: #aaa;">Lade Truppen aus Datenbank...</div>';

            const res = await Nexus.API.get(`/map/all-troops?world=${Nexus.Utils.getWorld()}`);
            if (!res || !Array.isArray(res)) {
                container.innerHTML = '<div style="color: red; text-align: center;">Fehler beim Laden oder keine Daten.</div>';
                return;
            }

            let html = `
                <div style="margin-bottom: 15px; display: flex; gap: 10px;">
                    <input type="text" id="ndb-search" class="nexus-input" placeholder="Suche Spieler oder Koord..." style="width: 300px;">
                </div>
                <table class="vis" style="width: 100%; background: transparent;">
                    <thead>
                        <tr style="background: rgba(197, 155, 88, 0.1); color: ${Nexus.CONFIG.colors.gold}; text-transform: uppercase; font-size: 11px;">
                            <th style="padding: 10px;">Spieler</th>
                            <th>Koordinate</th>
                            <th>Truppen (Deff)</th>
                            <th style="text-align: right;">Stand</th>
                        </tr>
                    </thead>
                    <tbody id="ndb-tbody">
            `;

            res.forEach(row => {
                const units = typeof row.units === 'string' ? JSON.parse(row.units) : row.units;
                // Deff-Wert berechnen (Speer + Schwert + Skav*4)
                const deffValue = (units.spear||0) + (units.sword||0) + ((units.heavy||0)*4);
                let unitStr = '';
                ['spear', 'sword', 'heavy', 'spy'].forEach(u => {
                    if(units[u]) unitStr += `<span style="margin-right:8px; font-family:monospace;"><img src="https://dsde.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_${u}.png" style="vertical-align:middle; width:14px;"> ${Nexus.Utils.formatNumber(units[u])}</span>`;
                });

                html += `
                    <tr class="ndb-row" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 8px; color: #fff; font-weight: bold;">${row.username}</td>
                        <td><a href="/game.php?screen=info_village&id=${Nexus.Utils.coordToId(row.coord)}" style="color: ${Nexus.CONFIG.colors.gold}; font-family: monospace;">${row.coord}</a></td>
                        <td>${unitStr} <span style="font-size:10px; color:#666; margin-left:5px;">(Total: ${Nexus.Utils.formatNumber(deffValue)})</span></td>
                        <td style="text-align: right; color: #666; font-size: 10px;">${new Date(row.updated_at).toLocaleString()}</td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;

            // Suche aktivieren
            document.getElementById('ndb-search').onkeyup = (e) => {
                const val = e.target.value.toLowerCase();
                document.querySelectorAll('.ndb-row').forEach(row => {
                    row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none';
                });
            };
        },

        loadCommands: async () => {
            Nexus.DbViewModule.setActiveTab('ndb-tab-commands');
            const container = document.getElementById('ndb-content');
            container.innerHTML = '<div style="text-align: center; color: #aaa;">Lade Befehle...</div>';

            // Hier nutzen wir den neuen Endpunkt, den wir vorhin besprochen haben
            const res = await Nexus.API.get(`/map/all-commands?world=${Nexus.Utils.getWorld()}`);
            
            // Fallback Dummy Data, falls Endpunkt noch nicht live
            // const res = [{id:1, player_name:"Test", source_coord:"555|555", target_coord:"444|444", arrival_time: Date.now(), type:'attack', unit_info:{axe:5000}}];

            if (!res || !Array.isArray(res)) {
                container.innerHTML = '<div style="color: red; text-align: center;">Keine Befehle gefunden.</div>';
                return;
            }

            let html = `
                <table class="vis" style="width: 100%; background: transparent;">
                    <thead>
                        <tr style="background: rgba(197, 155, 88, 0.1); color: ${Nexus.CONFIG.colors.gold}; text-transform: uppercase; font-size: 11px;">
                            <th style="padding: 10px;">Typ</th>
                            <th>Von</th>
                            <th>Nach</th>
                            <th>Ankunft</th>
                            <th>Info</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            res.forEach(cmd => {
                const units = typeof cmd.unit_info === 'string' ? JSON.parse(cmd.unit_info) : cmd.unit_info;
                let unitStr = '';
                for(let u in units) {
                    if(units[u] > 0) unitStr += `<img src="https://dsde.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_${u}.png" title="${u}" style="width:14px; margin-right:2px;">`;
                }

                const typeBadge = cmd.type === 'attack' 
                    ? `<span style="background: rgba(255,0,0,0.2); color: #ff5555; padding: 2px 5px; border-radius: 3px; font-size: 10px;">ANGRIFF</span>`
                    : `<span style="background: rgba(0,0,255,0.2); color: #5555ff; padding: 2px 5px; border-radius: 3px; font-size: 10px;">SUPPORT</span>`;

                html += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 8px;">${typeBadge}</td>
                        <td>${cmd.source_coord} <span style="font-size:10px; color:#888;">(${cmd.player_name})</span></td>
                        <td>${cmd.target_coord}</td>
                        <td style="font-family: monospace; color: #ebbc4d;">${new Date(cmd.arrival_time).toLocaleString()}</td>
                        <td>${unitStr}</td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        },

        setActiveTab: (id) => {
            ['ndb-tab-troops', 'ndb-tab-commands'].forEach(tid => {
                const btn = document.getElementById(tid);
                if(btn) {
                    btn.className = (tid === id) ? 'nexus-btn primary' : 'nexus-btn';
                }
            });
        }
    };
})();
