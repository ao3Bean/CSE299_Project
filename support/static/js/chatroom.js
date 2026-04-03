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
  img1: 'url("/static/img/bg/nature.jpg") center/cover',
  img2: 'url("/static/img/bg/night.jpg") center/cover',
};

let activeBg = INIT_BG;
applyBg(activeBg);

// Mark correct preset button as active on load
document.querySelectorAll('.bg-preset').forEach(btn => {
  btn.classList.toggle('active', btn.dataset.bg === activeBg);
});

document.querySelectorAll('.bg-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bg-preset').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeBg = btn.dataset.bg;
    //console.log('BG clicked:', activeBg, 'value:', bgMap[activeBg]); 
    applyBg(activeBg);
  });
});

function applyBg(key) {
  //console.log('applyBg called with:', key);
  //console.log('setting to:', bgMap[key]);
  document.documentElement.style.setProperty('--room-bg', bgMap[key] || bgMap['img1']);
  document.body.style.backgroundAttachment = 'fixed';
}

/*  Timer durations — init from DB values  */
let FOCUS_DURATION = INIT_FOCUS * 60;
let BREAK_DURATION = INIT_BREAK * 60;

if (applyBtn) applyBtn.addEventListener('click', () => {
  const focusInput = document.getElementById('focusDuration');
  const breakInput = document.getElementById('breakDuration');

  const focusMin = focusInput ? (parseInt(focusInput.value) || INIT_FOCUS) : INIT_FOCUS;
  const breakMin = breakInput ? (parseInt(breakInput.value) || INIT_BREAK) : INIT_BREAK;

  FOCUS_DURATION = focusMin * 60;
  BREAK_DURATION = breakMin * 60;

  if (!timerRunning) {
    currentSeconds = FOCUS_DURATION;
    updateTimerDisplay();
  }

  if (IS_HOST || IS_PRIVATE) {
    if (chatSocket.readyState === WebSocket.OPEN) {
      chatSocket.send(JSON.stringify({
        type: 'settings_update',
        background_preset: activeBg,
        focus_duration: focusMin,
        break_duration: breakMin,
      }));
    }
    applyBtn.textContent = '✓ Applied!';
        setTimeout(() => applyBtn.textContent = 'Apply', 1000);
  }

  //closeModal();
});

/*  Save Settings (host only)  */
const saveSettingsBtn = document.getElementById('saveSettings');
if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', async () => {
    const focusInput = document.getElementById('focusDuration');
    const breakInput = document.getElementById('breakDuration');
    const focusMin = parseInt(focusInput.value) || INIT_FOCUS;
    const breakMin = parseInt(breakInput.value) || INIT_BREAK;

    try {
      const res = await fetch(`/room/${ROOM_ID}/settings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '',
        },
        body: JSON.stringify({
          background_preset: activeBg,
          focus_duration: focusMin,
          break_duration: breakMin,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (chatSocket.readyState === WebSocket.OPEN) {
          chatSocket.send(JSON.stringify({
            type: 'settings_update',
            background_preset: activeBg,
            focus_duration: focusMin,
            break_duration: breakMin,
          }));
        }
        saveSettingsBtn.textContent = '✓ Saved!';
        setTimeout(() => saveSettingsBtn.textContent = 'Save Settings', 2000);
      } else {
        alert('Could not save settings.');
      }
    } catch(err) {
      console.error('Save settings failed:', err);
    }
    //closeModal();
  });
}

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

  if (data.type === 'room_full') {
    // document.body.innerHTML = '';
    document.documentElement.style.visibility = 'hidden';
    const target = `/room/maxlimit/`;
    window.location.replace(target);
    // document.body.innerHTML = '';
    // alert(data.message || 'Room is full!');
    return;
  }

  if (data.type === 'chat_message') {
    const isSelf = data.username === USERNAME;
    appendMessage(data.username, data.message, isSelf);
  }

  if (data.type === 'system_message') {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg chat-msg-system';
    wrap.innerHTML = `<span>${escapeHtml(data.message)}</span>`;
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  if (data.type === 'presence_update') {
    updateAvatarGrid(data.users);
    document.getElementById('participantCount').textContent = data.users.length;
  }

  if (data.type === 'settings_update') {
    if (data.background_preset) {
      activeBg = data.background_preset;
      applyBg(activeBg);
      document.querySelectorAll('.bg-preset').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.bg === activeBg);
      });
    }
    if (data.focus_duration) {
      FOCUS_DURATION = data.focus_duration * 60;
      const focusInput = document.getElementById('focusDuration');
      if (focusInput) focusInput.value = data.focus_duration;
      if (!timerRunning && !isBreakMode) {
        currentSeconds = FOCUS_DURATION;
        updateTimerDisplay();
      }
    }
    if (data.break_duration) {
      BREAK_DURATION = data.break_duration * 60;
      const breakInput = document.getElementById('breakDuration');
      if (breakInput) breakInput.value = data.break_duration;
      if (!timerRunning && isBreakMode) {
        currentSeconds = BREAK_DURATION;
        updateTimerDisplay();
      }
    }
  }
};

chatSocket.onclose = function(e) {
  if (e.code === 4003) {
    // document.body.innerHTML = '';
    document.documentElement.style.visibility = 'hidden';
    const target = `/room/maxlimit/`;
    window.location.replace(target);
  } else {
    console.warn('WebSocket closed sad:', e.code);
  }
};

chatSocket.onerror = function(err) {
  console.error('WebSocket error:', err);
};

function updateAvatarGrid(users) {
  const grid = document.getElementById('avatarGrid');
  grid.innerHTML = '';

  users.forEach(({ username, avatar }) => {
    const isMe = username === USERNAME;
    const cell = document.createElement('div');
    cell.className = 'avatar-cell';
    cell.dataset.username = username;
    cell.dataset.state = 'idle';

    // Build layer paths
    const base = '/static/img/chatroom/';
    const skin   = `${base}skin/${avatar.skin}.png`;
    const outfit = `${base}outfit/${avatar.outfit}.png`;
    const hair   = `${base}hair/${avatar.hair}.png`;
    const desk   = `${base}desk.png`;

    // Pose images for each state
    const poses = {
      idle:     `${base}poses/idle.png`,
      focused:  `${base}poses/focus.png`,
      break:    `${base}poses/break.png`,
      chatting: `${base}poses/chatting.png`,
    };

    cell.innerHTML = `
      <div class="avatar-frame">
        <!-- Layer order: skin, outfit, hair, pose, desk -->
        <img src="${skin}"   alt="skin"   class="avatar-layer avatar-skin">
        <img src="${outfit}" alt="outfit" class="avatar-layer avatar-outfit">
        <img src="${hair}"   alt="hair"   class="avatar-layer avatar-hair">
        <!-- Pose images — only active state visible -->
        <img src="${poses.idle}"     alt="idle"     class="avatar-layer avatar-pose state-img state-idle">
        <img src="${poses.focused}"  alt="focused"  class="avatar-layer avatar-pose state-img state-focused">
        <img src="${poses.break}"    alt="break"    class="avatar-layer avatar-pose state-img state-break">
        <img src="${poses.chatting}" alt="chatting" class="avatar-layer avatar-pose state-img state-chatting">
        <!-- Desk always on top -->
        <img src="${desk}" alt="desk" class="avatar-layer avatar-desk">
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
const copyPassConfirm      = document.getElementById('copyPassConfirm');

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
    navigator.clipboard.writeText(input.value).then(() => {
      copyPassConfirm.classList.add('visible');
      setTimeout(() => copyPassConfirm.classList.remove('visible'), 2000);
    });

  });
}