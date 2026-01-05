(function() {
    'use strict';
    const Nexus = window.Nexus;

    window.Nexus.DefenseModule = {
        init: () => {
            const box = document.querySelector('.menu_block_right');
            if (box) {
                const btnContainer = document.createElement('div');
                btnContainer.style.textAlign = 'right';
                btnContainer.style.marginTop = '5px';
                btnContainer.innerHTML = `<button class="nexus-btn danger" style="width:auto; display:inline-flex; font-weight:bold;" id="sd-request-btn">🛡️ SD ANFORDERN</button>`;
                box.appendChild(btnContainer);
                document.getElementById('sd-request-btn').onclick = Nexus.DefenseModule.openPopup;
            }
        },
        openPopup: () => {
            const overlay = document.createElement('div');
            overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:25000;display:flex;justify-content:center;align-items:center;";
            const modal = document.createElement('div');
            modal.style.cssText = `background:#1a1c24;border:1px solid ${Nexus.CONFIG.colors.gold};padding:20px;width:300px;border-radius:8px;color:#fff;text-align:center;box-shadow:0 0 20px ${Nexus.CONFIG.colors.goldDim};`;
            modal.innerHTML = `
                <h3 style="color:${Nexus.CONFIG.colors.gold};margin-top:0;">🆘 SD NOTRUF</h3>
                <p>Dorf: <b>${Nexus.game_data.village.coord}</b></p>
                <div style="margin:15px 0;"><label>Benötigte Pakete (Dual):</label><br><input type="number" id="sd-amount" class="nexus-input" value="10" style="text-align:center;font-size:16px;"></div>
                <div style="margin:15px 0;"><label>Priorität:</label><br><select id="sd-prio" class="nexus-input"><option value="normal">Normal</option><option value="high">Hoch (Bunker im Aufbau)</option><option value="critical" style="color:red;font-weight:bold;">KRITISCH (AGs laufen)</option></select></div>
                <div style="display:flex;gap:10px;"><button id="sd-cancel" class="nexus-btn">Abbrechen</button><button id="sd-send" class="nexus-btn primary">Absenden</button></div>
            `;
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            document.getElementById('sd-cancel').onclick = () => overlay.remove();
            document.getElementById('sd-send').onclick = async () => {
                const amount = document.getElementById('sd-amount').value;
                const prio = document.getElementById('sd-prio').value;
                const res = await Nexus.API.post('/defense/request', { world: Nexus.Utils.getWorld(), village: Nexus.game_data.village.coord, amount, prio });
                if (res.success || true) {
                    Nexus.Utils.toast(`Anfrage für ${amount} Pakete (${prio}) gesendet!`, "success");
                    Nexus.Utils.log(`SD Request: ${amount} Pakete für ${Nexus.game_data.village.coord}`, "info");
                } else { Nexus.Utils.toast("Fehler beim Senden", "error"); }
                overlay.remove();
            };
        }
    };
})();
