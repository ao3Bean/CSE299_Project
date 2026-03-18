/**
 * avatar.js — Avatar Customization Controller
 * Works with avatar_customization.html
 */

document.addEventListener('DOMContentLoaded', function () {

    //  DOM 
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels  = document.querySelectorAll('.tab-panel');
    const saveBtn    = document.getElementById('btn-save');
    const resetBtn   = document.getElementById('btn-randomize');

    const avatarLayers = {
        skin:      document.getElementById('layer-skin'),
        outfit:    document.getElementById('layer-outfit'),
        hair:      document.getElementById('layer-hair'),
        face:      document.getElementById('layer-face'),
        accessory: document.getElementById('layer-accessory'), // empty for now
    };

    //  State — loaded from Django via savedAvatar in template 
    // savedAvatar is defined in avatar_customization.html as:
    // const savedAvatar = { skin: "skin_1", hair: "hair_1", ... }
    let avatarState = {
        skin:      savedAvatar.skin      || 'skin_1',
        hair:      savedAvatar.hair      || 'hair_1',
        face:      savedAvatar.face      || 'face_1',
        outfit:    savedAvatar.outfit    || 'outfit_1',
        accessory: savedAvatar.accessory || '', // empty for now
    };

    // Snapshot for reset — goes back to this on Reset click
    const defaultState = { ...avatarState };

    //  Init: apply saved state to preview and highlight buttons 
    function init() {
        updateAvatarLayer('skin',   avatarState.skin);
        updateAvatarLayer('hair',   avatarState.hair);
        updateAvatarLayer('face',   avatarState.face);
        updateAvatarLayer('outfit', avatarState.outfit);

        setInput('skin',  avatarState.skin);
        setInput('hair',  avatarState.hair);
        setInput('face',  avatarState.face);

        highlightSelected('skin',  avatarState.skin);
        highlightSelected('hair',  avatarState.hair);
        highlightSelected('face',  avatarState.face);
    }

    //  Tab Switching ─
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
        });
    });

    //  Item Selection + Live Preview ─
    document.querySelectorAll('.item-btn[data-layer]').forEach(btn => {
        btn.addEventListener('click', () => {
            const layer = btn.dataset.layer;
            const value = btn.dataset.value;

            // update preview layer
            updateAvatarLayer(layer, value);

            // update hidden form input
            setInput(layer, value);

            // update state
            avatarState[layer] = value;

            // highlight selected button in this grid
            btn.closest('.item-grid')
               .querySelectorAll('.item-btn')
               .forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    //  Layer Update 
    function updateAvatarLayer(layerType, value) {
        const layer = avatarLayers[layerType];
        if (!layer) return;
        if (!value) {
            layer.src = '';
            layer.style.display = 'none';
            return;
        }
        // build path: skin_1 → skin/skin_1.png
        const [folder] = value.split('_');
        const src = STATIC_URL + folder + '/' + value + '.png';
        layer.classList.add('loading');
        layer.style.display = 'block';
        layer.src = src;
        layer.onload  = () => layer.classList.remove('loading');
        layer.onerror = () => {
            layer.classList.remove('loading');
            console.error(`Failed to load layer [${layerType}]:`, src);
        };
    }

    //  Hidden Form Input Helper 
    function setInput(layer, value) {
        const map = { skin: 'input-skin', hair: 'input-hair', face: 'input-face' };
        const el = document.getElementById(map[layer]);
        if (el) el.value = value;
    }

    //  Highlight Saved Button 
    function highlightSelected(layer, value) {
        document.querySelectorAll(`[data-layer="${layer}"]`).forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.value === value);
        });
    }

    //  Confirm Button → Submit Form to Django 
    saveBtn.addEventListener('click', () => {
        saveBtn.classList.add('saving');
        saveBtn.textContent = '⏳ Saving...';
        document.getElementById('avatar-form').submit();
    });

    //  Reset Button → Back to Page Load State 
    resetBtn.addEventListener('click', () => {
        avatarState = { ...defaultState };
        updateAvatarLayer('skin',  avatarState.skin);
        updateAvatarLayer('hair',  avatarState.hair);
        updateAvatarLayer('face',  avatarState.face);
        setInput('skin', avatarState.skin);
        setInput('hair', avatarState.hair);
        setInput('face', avatarState.face);
        highlightSelected('skin', avatarState.skin);
        highlightSelected('hair', avatarState.hair);
        highlightSelected('face', avatarState.face);
    });

    init();
});