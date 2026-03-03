/**
 * avatar.js — Avatar Customization Controller
 */

document.addEventListener('DOMContentLoaded', function () {

    //DOM 
    const tabButtons   = document.querySelectorAll('.tab-btn');
    const tabPanels    = document.querySelectorAll('.tab-panel');
    const saveBtn      = document.getElementById('btn-save');      // Confirm
    const resetBtn     = document.getElementById('btn-randomize'); // Reset

    const avatarLayers = {
        base:      document.getElementById('layer-base'),
        skin:      document.getElementById('layer-skin'),
        outfit:    document.getElementById('layer-outfit'),
        hair:      document.getElementById('layer-hair'),
        face:      document.getElementById('layer-face'),
        accessory: document.getElementById('layer-accessory'),
    };

    //  State 
    // TODO: Initialise from backend — pass saved avatar as JSON in template context:
    // const avatarState = {{ avatar_json|safe }};
    let avatarState = {
        skin:      'skin-1',
        hair:      'hair-1',
        hairColor: 'black',
        face:      'face-1',
        eyeColor:  'brown',
        outfit:    'outfit-1',
        accessory: 'acc-1',
    };

    // Snapshot of state at page load — used by Reset
    const defaultState = { ...avatarState };

    // Tab Switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
        });
    });

    //  Item Selection 
    document.querySelectorAll('.item-btn:not(.hair-color):not(.eye-color)').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel     = btn.closest('.tab-panel');
            const layerType = panel.dataset.panel;
            btn.closest('.item-grid').querySelectorAll('.item-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            updateAvatarLayer(layerType, btn.dataset.src);
            avatarState[layerType] = btn.dataset.item;
        });
    });

    // document.querySelectorAll('.hair-color').forEach(btn => {
    //     btn.addEventListener('click', () => {
    //         document.querySelectorAll('.hair-color').forEach(b => b.classList.remove('selected'));
    //         btn.classList.add('selected');
    //         avatarState.hairColor = btn.dataset.color;
    //         // TODO: Apply hair colour — CSS filter or load coloured image variant
    //     });
    // });

    // document.querySelectorAll('.eye-color').forEach(btn => {
    //     btn.addEventListener('click', () => {
    //         document.querySelectorAll('.eye-color').forEach(b => b.classList.remove('selected'));
    //         btn.classList.add('selected');
    //         avatarState.eyeColor = btn.dataset.color;
    //         // TODO: Apply eye colour
    //     });
    // });

    //  Layer Update 
    function updateAvatarLayer(layerType, src) {
        const layer = avatarLayers[layerType];
        if (!layer) return;
        if (!src) {
            layer.src = '';
            layer.style.display = 'none';
            return;
        }
        layer.classList.add('loading');
        layer.style.display = 'block';
        layer.src = src;
        layer.onload  = () => layer.classList.remove('loading');
        layer.onerror = () => {
            layer.classList.remove('loading');
            // TODO: Show fallback state in canvas
            console.error(`Failed to load layer [${layerType}]:`, src);
        };
    }

    //  Reset 
    // Resets selections back to whatever was loaded on page init
    resetBtn.addEventListener('click', () => {
        avatarState = { ...defaultState };

        // Re-select all default buttons visually
        document.querySelectorAll('.item-grid').forEach(grid => {
            grid.querySelectorAll('.item-btn').forEach(b => b.classList.remove('selected'));
        });

        // TODO: When backend is wired, restore each button that matches the
        // user's saved state by reading data-item attributes and adding .selected
        // For now just reload the page as the simplest reset
        location.reload();
    });

    //  Confirm / Save 
    saveBtn.addEventListener('click', async () => {
        saveBtn.classList.add('saving');
        saveBtn.textContent = '⏳ Saving...';

        // TODO: POST avatarState to Django
        /*
        try {
            const res = await fetch('/api/avatar/save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify(avatarState),
            });
            if (!res.ok) throw new Error('Save failed');
            showConfirmed();
        } catch (err) {
            console.error(err);
            saveBtn.classList.remove('saving');
            saveBtn.textContent = '❌ Error';
            setTimeout(() => { saveBtn.textContent = 'Confirm'; }, 2500);
        }
        */

        // Placeholder — remove when backend is ready
        setTimeout(() => {
            localStorage.setItem('avatarState', JSON.stringify(avatarState));
            showConfirmed();
        }, 700);
    });

    function showConfirmed() {
        saveBtn.classList.remove('saving');
        saveBtn.classList.add('saved');
        saveBtn.textContent = '✅ Confirmed!';
        setTimeout(() => {
            saveBtn.classList.remove('saved');
            saveBtn.textContent = 'Confirm';
        }, 2200);
    }

    //  Init 
    function init() {
        // TODO: Replace with real backend state passed via Django template context
        // Ideal pattern in avatar.html: <script>const savedAvatar = {{ avatar_json|safe }};</script>
        // Then here: avatarState = savedAvatar; and restore button selections from it
        const saved = localStorage.getItem('avatarState');
        if (saved) {
            try {
                avatarState = { ...JSON.parse(saved), ...avatarState };
            } catch (e) {
                console.error('Could not parse saved avatar state');
            }
        }
    }

    init();

    // TODO: Uncomment when wiring save to Django
    /*
    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }
    */
});