(function() {
    'use strict';
    
    // Zugriff auf Core
    const Nexus = window.Nexus; 

    window.Nexus.ReportModule = {
        init: () => {
            if (Nexus.game_data.screen === 'report') {
                if (location.href.includes('view=')) {
                    Nexus.ReportModule.addSingleButton();
                } else {
                    Nexus.ReportModule.addMassUploadButton();
                }
            }
        },
        addSingleButton: () => {
            const anchor = document.querySelector('.report_date');
            if (!anchor) return;
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.innerHTML = '💾 Nexus Upload';
            btn.style.marginLeft = '10px';
            btn.onclick = async () => {
                const reportId = new URLSearchParams(window.location.search).get('view');
                btn.innerHTML = '⏳...';
                const success = await Nexus.ReportModule.processReport(reportId, document);
                btn.innerHTML = success ? '✅ OK' : '❌ Fehler';
            };
            anchor.parentNode.appendChild(btn);
        },
        addMassUploadButton: () => {
            const table = document.getElementById('report_list');
            if (!table) return;
            const btn = document.createElement('button');
            btn.className = 'btn btn-confirm';
            btn.innerHTML = '📦 Auswahl hochladen (Nexus)';
            btn.style.margin = '10px 0';
            btn.onclick = async (e) => {
                e.preventDefault();
                const checkboxes = Array.from(document.querySelectorAll('input[name^="id_"]:checked'));
                if (checkboxes.length === 0) return Nexus.Utils.toast("Keine Berichte ausgewählt!", "error");
                let successCount = 0;
                btn.disabled = true;
                for (const cb of checkboxes) {
                    const row = cb.closest('tr');
                    const id = cb.name.replace('id_', '');
                    row.style.background = 'rgba(255, 255, 0, 0.1)';
                    const html = await Nexus.ReportModule.fetchReport(id);
                    if (html) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, "text/html");
                        const res = await Nexus.ReportModule.processReport(id, doc);
                        if (res) {
                            successCount++;
                            row.style.background = 'rgba(46, 204, 113, 0.2)';
                            row.querySelector('.report-link').innerHTML += ' <span style="color:green;font-weight:bold;">[✔]</span>';
                        } else {
                            row.style.background = 'rgba(231, 76, 60, 0.2)';
                        }
                    }
                    await new Promise(r => setTimeout(r, 200));
                }
                Nexus.Utils.toast(`${successCount} Berichte hochgeladen!`, "success");
                btn.disabled = false;
                Nexus.Utils.log(`${successCount} Berichte übertragen`, "success");
            };
            table.parentNode.insertBefore(btn, table);
        },
        fetchReport: (id) => {
            return new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `/game.php?screen=report&mode=all&view=${id}`,
                    onload: (res) => resolve(res.responseText),
                    onerror: () => resolve(null)
                });
            });
        },
        processReport: async (id, doc) => {
            try {
                const attackerLink = doc.querySelector('#attack_info_att .village_anchor a');
                const defenderLink = doc.querySelector('#attack_info_def .village_anchor a');
                const originCoord = attackerLink ? attackerLink.innerText.match(/\d{3}\|\d{3}/)?.[0] : null;
                const targetCoord = defenderLink ? defenderLink.innerText.match(/\d{3}\|\d{3}/)?.[0] : null;
                if (!targetCoord) return false;
                const attUnits = Nexus.ReportModule.parseUnits(doc, 'attack_info_att_units');
                const defUnits = Nexus.ReportModule.parseUnits(doc, 'attack_info_def_units');
                const buildings = Nexus.ReportModule.parseBuildings(doc);
                const payload = {
                    report_id: id,
                    world: Nexus.Utils.getWorld(),
                    attacker: doc.querySelector('#attack_info_att th a')?.innerText.trim() || 'Unbekannt',
                    defender: doc.querySelector('#attack_info_def th a')?.innerText.trim() || 'Unbekannt',
                    origin_coord: originCoord,
                    target_coord: targetCoord,
                    timestamp: Math.floor(Date.now() / 1000),
                    att_troops: attUnits,
                    def_troops: defUnits,
                    buildings: buildings
                };
                const res = await Nexus.API.post('/report/upload', payload);
                return res.success;
            } catch (e) {
                return false;
            }
        },
        parseUnits: (doc, tableId) => {
            const table = doc.getElementById(tableId);
            if (!table) return {};
            const units = {};
            const imgRow = table.rows[0];
            const countRow = table.rows[1];
            if (!imgRow || !countRow) return {};
            const imgs = imgRow.querySelectorAll('img');
            const cells = countRow.querySelectorAll('td');
            imgs.forEach((img, index) => {
                const unitNameMatch = img.src.match(/unit_([a-z]+)\./);
                if (unitNameMatch && unitNameMatch[1]) {
                    const unitName = unitNameMatch[1];
                    const cellIndex = index + 1;
                    if (cells[cellIndex]) {
                        const countText = cells[cellIndex].innerText.trim().replace(/\./g, '');
                        const count = parseInt(countText, 10);
                        if (!isNaN(count)) units[unitName] = count;
                    }
                }
            });
            return units;
        },
        parseBuildings: (doc) => {
            const buildings = {};
            const ths = doc.querySelectorAll('th');
            let buildingTable = null;
            for (const th of ths) {
                if (th.innerText.includes('Gebäude:') || th.innerText.includes('Gebäude')) {
                    buildingTable = th.closest('table');
                    break;
                }
            }
            if (buildingTable) {
                const text = buildingTable.innerText;
                const lines = text.split('\n');
                lines.forEach(line => {
                    const match = line.match(/(.+)\s+\(Stufe\s+(\d+)\)/);
                    if (match) {
                        let name = match[1].trim();
                        const level = parseInt(match[2], 10);
                        const map = {'Hauptgebäude':'main','Kaserne':'barracks','Stall':'stable','Werkstatt':'garage','Adelshof':'snob','Schmiede':'smith','Versammlungsplatz':'place','Statue':'statue','Marktplatz':'market','Holzfällerlager':'wood','Lehmgrube':'stone','Eisenmine':'iron','Bauernhof':'farm','Speicher':'storage','Versteck':'hide','Wall':'wall'};
                        if(map[name]) buildings[map[name]] = level;
                    }
                });
            }
            return buildings;
        }
    };
})();
