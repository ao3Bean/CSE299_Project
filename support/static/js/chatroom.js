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

let activeBg = 'img1';

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
  clearInterval(timerInterval);
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

window.addEventListener('beforeunload', () => {
  clearInterval(timerInterval);
  if (chatSocket.readyState === WebSocket.OPEN) {
    chatSocket.close();
  }
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
//TODO : fix music player lag problems 
const tracks = [
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
  if (!tracks[currentTrack].src) return;
  audioPlayer.src = tracks[currentTrack].src;
  trackName.textContent = tracks[currentTrack].name;
  if (isPlaying) audioPlayer.play().catch(() => {});
}

let playPending = false;

function togglePlay() {
  if (isPlaying) {
    audioPlayer.pause();
    isPlaying = false;
    playPauseBtn.innerHTML = '&#9654;';
    cassetteGif.src = stillSrc;
  } else if (!playPending) {
    playPending = true;
    audioPlayer.play().then(() => {
      isPlaying = true;
      playPending = false;
      playPauseBtn.innerHTML = '&#9646;&#9646;';
      cassetteGif.src = playingSrc;
    }).catch(err => {
      playPending = false;
      console.warn('Playback failed:', err);
    });
  }
}

playPauseBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => loadTrack(currentTrack - 1));
nextBtn.addEventListener('click', () => loadTrack(currentTrack + 1));

audioPlayer.addEventListener('ended', () => loadTrack(currentTrack + 1)); // loop to next track

// loadTrack(0);


/*  Chat + Presence — WebSocket  */
const chatMessages = document.getElementById('chatMessages');
const chatInput    = document.getElementById('chatInput');
const chatSend     = document.getElementById('chatSend');

const WS_URL = `ws://${window.location.host}/ws/room/${ROOM_ID}/`; //getting room url from template
const chatSocket = new WebSocket(WS_URL);

chatSocket.onopen = function() {
  console.log('Connected to room:', ROOM_ID);
};

chatSocket.onmessage = function(e) {
  const data = JSON.parse(e.data);

  if (data.type === 'presence_update') {
    updateAvatarGrid(data.users);
    document.getElementById('participantCount').textContent = data.users.length;
  }
};

chatSocket.onclose = function() {
  console.warn('WebSocket closed.');
};

chatSocket.onerror = function(err) {
  console.error('WebSocket error:', err);
};

function updateAvatarGrid(users) {
  const grid = document.getElementById('avatarGrid');
  grid.innerHTML = '';

  users.forEach(username => {
    const isMe = username === USERNAME;
    const cell = document.createElement('div');
    cell.className = 'avatar-cell';
    cell.dataset.username = username;
    cell.dataset.state = 'idle';

    cell.innerHTML = `
      <div class="avatar-frame">
        <img src="/static/img/avatars/idle.png" alt="idle"
             class="avatar-img state-img state-idle">
        <img src="/static/img/avatars/focused.png" alt="focused"
             class="avatar-img state-img state-focused">
        <img src="/static/img/avatars/break.png" alt="break"
             class="avatar-img state-img state-break">
        <img src="/static/img/avatars/chatting.png" alt="chatting"
             class="avatar-img state-img state-chatting">
      </div>
      <span class="avatar-tooltip">${escapeHtml(isMe ? 'Me' : username)}</span>
    `;
    grid.appendChild(cell);
  });
}

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
  if (chatSocket.readyState === WebSocket.OPEN) {
    chatSocket.send(JSON.stringify({
      type: 'chat_message',
      message: text
    }));
  }
  chatInput.value = '';
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Save room button (heart)
const saveRoomBtn = document.getElementById('saveRoom');

if (saveRoomBtn) {  //only exists if user is host
  saveRoomBtn.addEventListener('click', async () => { //async makes callback function asynchronous, so we can use await inside it
    const icon = saveRoomBtn.querySelector('.nav-icon'); //grabbing css classes 
    const label = saveRoomBtn.querySelector('.nav-label');
    const tooltip = saveRoomBtn.querySelector('.nav-tooltip');

    //If already saved, do nothing
    if (saveRoomBtn.dataset.saved === 'true') return;

    try {
      const res = await fetch(`/rooms/${ROOM_ID}/save/`, { //fetch makes http request
        method: 'POST',
        headers: {
          'X-CSRFToken': document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '' // CSRF token from cookie cross-site request forgery protection
        }
      });

      const data = await res.json(); //parse response as json

      if (data.success) { //updating UI
        icon.textContent = '♥';
        icon.style.color = '#ff6fae';
        label.textContent = 'Saved!';
        tooltip.textContent = 'Saved!';
        saveRoomBtn.dataset.saved = 'true';
      } else {
        alert('Could not save room.');
      }
    } catch(err) {
      console.error('Save failed:', err);
    }
  });
}

const shareBackdrop    = document.getElementById('shareModalBackdrop');
const shareChatroomBtn = document.getElementById('shareChatroomBtn');
const closeShareBtn    = document.getElementById('closeShareModal');
const closeShareFooter = document.getElementById('closeShareFooter');
const shareLinkInput   = document.getElementById('shareLinkInput');
const copyLinkBtn      = document.getElementById('copyLinkBtn');
const copyConfirm      = document.getElementById('copyConfirm');

// Set link on page load
shareLinkInput.value = `${window.location.origin}/room/${ROOM_ID}/`;

shareChatroomBtn.addEventListener('click', () => {
  shareBackdrop.classList.add('open');
});
closeShareBtn.addEventListener('click', () => shareBackdrop.classList.remove('open'));
closeShareFooter.addEventListener('click', () => shareBackdrop.classList.remove('open'));
shareBackdrop.addEventListener('click', e => {
  if (e.target === shareBackdrop) shareBackdrop.classList.remove('open');
});

copyLinkBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(shareLinkInput.value).then(() => {
    copyConfirm.classList.add('visible');
    setTimeout(() => copyConfirm.classList.remove('visible'), 2000);
  });
});

// Copy passcode if it exists
const copyPasscodeBtn = document.getElementById('copyPasscodeBtn');
if (copyPasscodeBtn) {
  copyPasscodeBtn.addEventListener('click', () => {
    const input = copyPasscodeBtn.closest('.share-link-wrap').querySelector('input');
    navigator.clipboard.writeText(input.value);
  });
}