/* 
   room.js  —  Cadence Room Page
 */

/*  Sidebar (same logic as sidebar.js)  */
const sidebar     = document.getElementById('sidebar');
const toggle      = document.getElementById('sidebarToggle');
const STORE_KEY   = 'cw_sidebar_expanded';

function applySidebar(expanded) {
  sidebar.classList.toggle('expanded', expanded);
  document.body.classList.toggle('sidebar-expanded', expanded);
  document.documentElement.classList.toggle('sidebar-expanded', expanded);
  toggle.textContent = expanded ? '\u00AB' : '\u00BB';
  try { localStorage.setItem(STORE_KEY, expanded ? '1' : '0'); } catch(e) {}
}

if (window.innerWidth > 640) {
  applySidebar(localStorage.getItem(STORE_KEY) === '1');
}
sidebar.classList.add('ready');

toggle.addEventListener('click', () => applySidebar(!sidebar.classList.contains('expanded')));

document.addEventListener('keydown', e => {
  if (e.key === '[' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const tag = document.activeElement.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') applySidebar(!sidebar.classList.contains('expanded'));
  }
});


/*  Settings Modal  */
const backdrop        = document.getElementById('modalBackdrop');
const openBtn         = document.getElementById('openSettings');
const closeBtn        = document.getElementById('closeSettings');
const closeFooterBtn  = document.getElementById('closeSettingsFooter');
const applyBtn        = document.getElementById('applySettings');

function openModal()  { backdrop.classList.add('open');  backdrop.setAttribute('aria-hidden', 'false'); }
function closeModal() { backdrop.classList.remove('open'); backdrop.setAttribute('aria-hidden', 'true'); }

openBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
closeFooterBtn.addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });


/*  Background Presets  */
const bgMap = {
  preset1: 'linear-gradient(135deg, #FFF1E6 0%, #ffd6ec 60%, #c8d2ff 100%)',
  preset2: 'linear-gradient(135deg, #d6eaff 0%, #bac4ff 100%)',
  preset3: 'linear-gradient(135deg, #d8f5d4 0%, #80c778 60%, #5b9cff 100%)',
  preset4: 'linear-gradient(135deg, #ffe5cc 0%, #ffb366 100%)',
  preset5: 'linear-gradient(135deg, #2d2d3a 0%, #3a2a4a 100%)',
  // TODO: img1 / img2 — set to CSS url() pointing to your static images
  img1: 'url("/static/img/bg/nature.jpg") center/cover',
  img2: 'url("/static/img/bg/night.jpg") center/cover',
};

let activeBg = 'preset1';

document.querySelectorAll('.bg-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bg-preset').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeBg = btn.dataset.bg;
    // Live preview
    document.body.style.background = bgMap[activeBg] || '';
  });
});

applyBtn.addEventListener('click', () => {
  // Apply timer settings
  const focusMin = parseInt(document.getElementById('focusDuration').value) || 25;
  const breakMin = parseInt(document.getElementById('breakDuration').value) || 5;
  FOCUS_DURATION = focusMin * 60;
  BREAK_DURATION = breakMin * 60;

  // If timer is not running, reset display to new focus duration
  if (!timerRunning) {
    currentSeconds = FOCUS_DURATION;
    updateTimerDisplay();
  }

  closeModal();
});

// Nudge buttons (+ / - on timer inputs)
document.querySelectorAll('.timer-nudge').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const val   = parseInt(input.value) || 0;
    const dir   = parseInt(btn.dataset.dir);
    input.value = Math.max(parseInt(input.min), Math.min(parseInt(input.max), val + dir));
  });
});


/*  Pomodoro Timer  */
let FOCUS_DURATION  = 25 * 60;   // seconds
let BREAK_DURATION  = 5  * 60;
let currentSeconds  = FOCUS_DURATION;
let timerRunning    = false;
let timerInterval   = null;
let isBreakMode     = false;

const timerDisplay  = document.getElementById('timerDisplay');
const timerBadge    = document.getElementById('timerModeBadge');
const startBtn      = document.getElementById('timerStart');
const resetBtn      = document.getElementById('timerReset');

function updateTimerDisplay() {
  const m = Math.floor(currentSeconds / 60).toString().padStart(2, '0');
  const s = (currentSeconds % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
}

function setTimerMode(breakMode) {
  isBreakMode    = breakMode;
  currentSeconds = breakMode ? BREAK_DURATION : FOCUS_DURATION;
  timerBadge.textContent = breakMode ? 'Break' : 'Focus';
  timerBadge.classList.toggle('break-mode', breakMode);
  updateTimerDisplay();
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  startBtn.textContent = '⏸ Pause';
  startBtn.classList.add('running');

  timerInterval = setInterval(() => {
    currentSeconds--;
    updateTimerDisplay();

    if (currentSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.textContent = '▶ Start';
      startBtn.classList.remove('running');
      setTimerMode(!isBreakMode);  // switch mode automatically

      // TODO: Broadcast timer state via WebSocket so all users sync
      // ws.send(JSON.stringify({ type: 'timer_end', next_mode: isBreakMode ? 'break' : 'focus' }));
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  startBtn.textContent = '▶ Start';
  startBtn.classList.remove('running');
}

startBtn.addEventListener('click', () => {
  timerRunning ? pauseTimer() : startTimer();
  // TODO: Broadcast timer state to other users in room
  // ws.send(JSON.stringify({ type: 'timer_toggle', running: timerRunning, seconds_left: currentSeconds }));
});

resetBtn.addEventListener('click', () => {
  pauseTimer();
  setTimerMode(false);
  // TODO: Broadcast reset to other users
});

updateTimerDisplay();


/*  Avatar State Demo Toggle  */
// This is a DEMO trigger — in production, states come from WS events
const stateBtns  = document.querySelectorAll('.state-btn');
const avatarGrid = document.getElementById('avatarGrid');

stateBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    stateBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const newState = btn.dataset.state;
    // Apply chosen state to all avatars (demo only — real version targets individual users)
    avatarGrid.querySelectorAll('.avatar-cell').forEach(cell => {
      cell.dataset.state = newState;
    });
  });
});


/*  Music Player  */
const tracks = [
  // TODO: Replace src paths with your actual static audio files
  { name: 'lofi chill vol. 1', src: '/static/audio/lofi1.mp3' },
  { name: 'rainy café',        src: '/static/audio/lofi2.mp3' },
  { name: 'study beats',       src: '/static/audio/lofi3.mp3' },
];

let currentTrack = 0;
let isPlaying    = false;

const audioPlayer  = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPause');
const prevBtn      = document.getElementById('prevTrack');
const nextBtn      = document.getElementById('nextTrack');
const trackName    = document.getElementById('trackName');
const cassetteGif  = document.getElementById('cassetteGif');

const stillSrc   = cassetteGif.dataset.stoppedSrc;
const playingSrc = cassetteGif.dataset.playingSrc;

function loadTrack(index) {
  currentTrack = (index + tracks.length) % tracks.length;
  audioPlayer.src  = tracks[currentTrack].src;
  trackName.textContent = tracks[currentTrack].name;
  if (isPlaying) audioPlayer.play().catch(() => {});
}

function togglePlay() {
  if (isPlaying) {
    audioPlayer.pause();
    isPlaying = false;
    playPauseBtn.innerHTML = '&#9654;';
    cassetteGif.src = stillSrc;
  } else {
    audioPlayer.play().then(() => {
      isPlaying = true;
      playPauseBtn.innerHTML = '&#9646;&#9646;';
      cassetteGif.src = playingSrc;
    }).catch(err => {
      // Autoplay blocked — silently ignore, user must interact first
      console.warn('Playback failed:', err);
    });
  }
}

playPauseBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => loadTrack(currentTrack - 1));
nextBtn.addEventListener('click', () => loadTrack(currentTrack + 1));

audioPlayer.addEventListener('ended', () => loadTrack(currentTrack + 1)); // loop to next track

loadTrack(0); // init first track


/*  Chat  */
// TODO: Replace 'your-room-id' with the actual room ID from Django context
// const ROOM_ID = "{{ room.id }}";
// const WS_URL  = `ws://${window.location.host}/ws/room/${ROOM_ID}/`;
// const chatSocket = new WebSocket(WS_URL);

const chatMessages = document.getElementById('chatMessages');
const chatInput    = document.getElementById('chatInput');
const chatSend     = document.getElementById('chatSend');

/* TODO: When Django Channels is set up, uncomment and wire up:

chatSocket.onmessage = function(e) {
  const data = JSON.parse(e.data);

  if (data.type === 'chat_message') {
    appendMessage(data.username, data.message, data.is_self);
  }
  if (data.type === 'timer_sync') {
    // sync timer state from server
  }
  if (data.type === 'user_state') {
    // update avatar state for a specific user
    const cell = avatarGrid.querySelector(`[data-username="${data.username}"]`);
    if (cell) cell.dataset.state = data.state;
  }
};

chatSocket.onclose = function() {
  console.warn('Chat socket closed. Reconnecting...');
};
*/

function appendMessage(username, text, isSelf = false) {
  const wrap = document.createElement('div');

  if (isSelf) {
    wrap.className = 'chat-msg chat-msg-self';
    wrap.innerHTML = `
      <div class="chat-msg-body chat-msg-body-self">
        <span class="chat-msg-text">${escapeHtml(text)}</span>
      </div>`;
  } else {
    wrap.className = 'chat-msg chat-msg-other';
    wrap.innerHTML = `
      <div class="chat-msg-avatar">${escapeHtml(username.charAt(0).toUpperCase())}</div>
      <div class="chat-msg-body">
        <span class="chat-msg-user">${escapeHtml(username)}</span>
        <span class="chat-msg-text">${escapeHtml(text)}</span>
      </div>`;
  }

  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Optimistically add to UI
  appendMessage('You', text, true);
  chatInput.value = '';

  // TODO: Send via WebSocket instead
  // chatSocket.send(JSON.stringify({ type: 'chat_message', message: text }));
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Save room button (heart)
document.getElementById('saveRoom').addEventListener('click', () => {
  // TODO: POST to Django view to save/favourite the room
  // fetch(`/rooms/${ROOM_ID}/save/`, { method: 'POST', headers: { 'X-CSRFToken': getCookie('csrftoken') } });
  const btn = document.getElementById('saveRoom');
  const icon = btn.querySelector('.nav-icon');
  icon.textContent = '♥';
  icon.style.color = '#ff6fae';
});