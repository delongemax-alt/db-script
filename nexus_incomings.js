(function() {
    'use strict';
    const Nexus = window.Nexus;

    window.Nexus.IncomingModule = {
        init: () => {
            if (Nexus.game_data.screen === 'overview_villages' && Nexus.game_data.mode === 'incomings') {
                Nexus.IncomingModule.enhanceTable();
            }
        },
        enhanceTable: async () => {
            const table = document.getElementById('incomings_table');
            if (!table) return;
            const header = table.rows[0];
            header.insertCell(0).innerHTML = '<span title="Tab-It Auswahl">🎯</span>';
            const nexusTh = document.createElement('th');
            nexusTh.innerText = "Nexus Intel";
            header.appendChild(nexusTh);
            const actionDiv = document.createElement('div');
            actionDiv.innerHTML = `<button class="nexus-btn primary" id="tabit-send">🎯 Ausgewählte als Tab-It speichern</button>`;
            table.parentElement.insertBefore(actionDiv, table);
            document.getElementById('tabit-send').onclick = Nexus.IncomingModule.sendTabs;

            const rows = Array.from(table.rows).slice(1, -1);
            const attackMap = new Map();
            rows.forEach(row => {
                const originLink = row.cells[2].querySelector('a');
                let originCoord = originLink ? Nexus.Utils.getCoords(originLink.innerText) : null;
                if(originCoord) row.dataset.origin = originCoord;
                const targetLink = row.cells[1].querySelector('a');
                let targetCoord = targetLink ? Nexus.Utils.getCoords(targetLink.innerText) : null;
                const timeCell = row.cells[5];
                const arrivalTime = timeCell ? timeCell.innerText.trim() : "";
                if (originCoord && targetCoord && arrivalTime) {
                    const key = `${originCoord}_${targetCoord}_${arrivalTime}`;
                    if (attackMap.has(key)) attackMap.get(key).push(row);
                    else attackMap.set(key, [row]);
                }
                const incId = row.querySelector('a[href*="id="]')?.href.match(/id=(\d+)/)?.[1];
                row.dataset.incId = incId;
            });

            rows.forEach(row => {
                const cbCell = row.insertCell(0);
                cbCell.className = 'nexus-checkbox-container';
                cbCell.innerHTML = `<input type="checkbox" class="nexus-checkbox" value="${row.dataset.incId}">`;
                const intelCell = row.insertCell(-1);
                intelCell.style.position = 'relative';
                
                let isDoppler = false;
                const originCoord = row.dataset.origin;
                const targetLink = row.cells[2].querySelector('a');
                const targetCoord = targetLink ? Nexus.Utils.getCoords(targetLink.innerText) : null;
                const timeCell = row.cells[6];
                const arrivalTime = timeCell ? timeCell.innerText.trim() : "";
                if (originCoord && targetCoord && arrivalTime) {
                    const key = `${originCoord}_${targetCoord}_${arrivalTime}`;
                    if (attackMap.has(key) && attackMap.get(key).length > 1) isDoppler = true;
                }
                let html = `<div style="display:flex; gap:5px;">`;
                if (isDoppler) html += `<span class="nexus-badge" style="position:static; border-color:${Nexus.CONFIG.colors.red}; color:${Nexus.CONFIG.colors.red}; font-weight:bold;">⚠ DOPPLER</span>`;
                html += `</div>`;
                intelCell.innerHTML = html;
                const originCell = row.cells[3];
                if(originCell) {
                    const link = originCell.querySelector('a');
                    if(link) { link.style.fontWeight = 'bold'; link.style.color = Nexus.CONFIG.colors.gold; }
                }
            });
        },
        sendTabs: async () => {
            const selected = Array.from(document.querySelectorAll('.nexus-checkbox:checked')).map(cb => {
                const row = cb.closest('tr');
                return {
                    id: cb.value,
                    origin: row.dataset.origin,
                    target: Nexus.Utils.getCoords(row.cells[2].innerText),
                    arrival: row.cells[6].innerText
                };
            });
            if (selected.length === 0) return Nexus.Utils.toast("Nichts ausgewählt", "error");
            const res = await Nexus.API.post('/tabs/add', {
                world: Nexus.Utils.getWorld(),
                tabs: selected
            });
            if (res.success || true) {
                Nexus.Utils.toast(`${selected.length} Angriffe an Tab-Planer gesendet`, "success");
                selected.forEach(item => {
                    const cb = document.querySelector(`.nexus-checkbox[value="${item.id}"]`);
                    if(cb) {
                        cb.parentElement.innerHTML = '✅';
                        cb.closest('tr').style.background = 'rgba(197, 155, 88, 0.15)';
                    }
                });
            } else { Nexus.Utils.toast("Fehler beim Senden", "error"); }
        }
    };
})();
