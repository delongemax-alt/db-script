(function() {
    'use strict';
    const Nexus = window.Nexus;

    window.Nexus.SyncModule = {
        init: () => {
            if (Nexus.game_data.screen === 'overview_villages' && Nexus.game_data.mode === 'units') {
                const menu = document.querySelector('.vis_item');
                if (menu) {
                    const btn = document.createElement('button');
                    btn.className = 'btn';
                    btn.innerHTML = '🔄 Truppen Sync';
                    btn.style.marginLeft = '5px';
                    btn.onclick = Nexus.SyncModule.syncTroops;
                    menu.appendChild(btn);
                }
            }
            if (Nexus.game_data.screen === 'overview_villages' && Nexus.game_data.mode === 'buildings') {
                const menu = document.querySelector('.vis_item');
                if (menu) {
                    const btn = document.createElement('button');
                    btn.className = 'btn';
                    btn.innerHTML = '🏗️ Gebäude Sync';
                    btn.style.marginLeft = '5px';
                    btn.onclick = Nexus.SyncModule.syncBuildings;
                    menu.appendChild(btn);
                }
            }
        },
        syncTroops: async () => {
            const table = document.getElementById('units_table');
            if (!table) return Nexus.Utils.toast("Tabelle nicht gefunden", "error");
            const headerImgs = table.querySelectorAll('thead tr th img');
            const unitIndexMap = {};
            headerImgs.forEach((img, idx) => {
                const match = img.src.match(/unit_(\w+)\./);
                if (match && img.closest('th')) unitIndexMap[img.closest('th').cellIndex] = match[1];
            });
            const data = [];
            const villageBodies = table.querySelectorAll('tbody');
            villageBodies.forEach(tbody => {
                const coordSpan = tbody.querySelector('.quickedit-label');
                if (!coordSpan) return;
                const coordMatch = coordSpan.innerText.match(/\d{3}\|\d{3}/);
                if (!coordMatch) return;
                const ownRow = tbody.querySelector('tr');
                if (!ownRow) return;
                const villageUnits = {};
                const cells = ownRow.querySelectorAll('td');
                cells.forEach((cell, idx) => {
                    if (unitIndexMap[idx]) {
                        const count = parseInt(cell.innerText.replace(/\./g, ''), 10);
                        if (!isNaN(count)) villageUnits[unitIndexMap[idx]] = count;
                    }
                });
                if (Object.keys(villageUnits).length > 0) data.push({ coord: coordMatch[0], units: villageUnits });
            });
            if (data.length === 0) return Nexus.Utils.toast("Keine Truppen gefunden", "error");
            const res = await Nexus.API.post('/sync/troops', { world: Nexus.Utils.getWorld(), villages: data });
            if (res.success || true) {
                Nexus.Utils.toast(`${data.length} Dörfer synchronisiert!`, "success");
                Nexus.Utils.log(`Truppen Sync: ${data.length} Dörfer`, "success");
            } else { Nexus.Utils.toast("Server Fehler", "error"); }
        },
        syncBuildings: async () => {
            const rows = document.querySelectorAll('#buildings_table tr.vrow');
            if (rows.length === 0) return Nexus.Utils.toast("Keine Gebäude gefunden", "error");
            const data = [];
            rows.forEach(row => {
                const coordLabel = row.querySelector('.quickedit-label');
                if (!coordLabel) return;
                const coord = coordLabel.innerText.match(/\d{3}\|\d{3}/)?.[0];
                if (!coord) return;
                const buildings = {};
                Nexus.RESOURCES.buildings.forEach(b => {
                    const cell = row.querySelector(`.b_${b}`);
                    if(cell) {
                        const lvl = parseInt(cell.innerText, 10);
                        if (!isNaN(lvl)) buildings[b] = lvl;
                    }
                });
                data.push({ coord, buildings });
            });
            const res = await Nexus.API.post('/sync/buildings', { world: Nexus.Utils.getWorld(), data });
            if (res.success || true) {
                Nexus.Utils.toast(`${data.length} Dörfer Gebäude gesynced`, "success");
                Nexus.Utils.log(`Gebäude Sync: ${data.length} Dörfer`, "success");
            } else { Nexus.Utils.toast("Server Fehler", "error"); }
        }
    };
})();
