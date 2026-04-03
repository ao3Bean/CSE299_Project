//friends pagination
  const FRIENDS_PER_PAGE_FIRST = 3;
  const FRIENDS_PER_PAGE_REST  = 3;

  const friendsPanel = document.getElementById('friendsPanel');
  const allFriendCards = Array.from(friendsPanel.querySelectorAll('.rooms-grid .friend-card'));
  const friendsPrevBtn = friendsPanel.querySelector('.rooms-page-btn[aria-label="Previous"]');
  const friendsNextBtn = friendsPanel.querySelector('.rooms-page-btn[aria-label="Next"]');
  const friendSearch   = document.querySelector('.rooms-search');
  let friendsCurrentPage  = 0;
  let visibleFriendCards  = allFriendCards;

  function totalFriendPages() {
    if (visibleFriendCards.length === 0) return 1;
    const afterFirst = Math.max(0, visibleFriendCards.length - FRIENDS_PER_PAGE_FIRST);
    return 1 + Math.ceil(afterFirst / FRIENDS_PER_PAGE_REST);
  }

  function getFriendPageCards(page) {
    if (page === 0) return visibleFriendCards.slice(0, FRIENDS_PER_PAGE_FIRST);
    const start = FRIENDS_PER_PAGE_FIRST + (page - 1) * FRIENDS_PER_PAGE_REST;
    return visibleFriendCards.slice(start, start + FRIENDS_PER_PAGE_REST);
  }

  function showFriendPage(page) {
    allFriendCards.forEach(card => card.style.display = 'none');
    getFriendPageCards(page).forEach(card => card.style.display = '');

    //const emptyMsg = document.getElementById('friendsEmpty');
    //emptyMsg.style.display = visibleFriendCards.length === 0 ? 'block' : 'none';

    updateFriendDots(page);
    friendsPrevBtn.disabled = page === 0;
    friendsNextBtn.disabled = page >= totalFriendPages() - 1;
    friendsCurrentPage = page;
  }

  function updateFriendDots(page) {
    const indicator = friendsPanel.querySelector('.rooms-page-indicator');
    indicator.innerHTML = '';
    for (let i = 0; i < totalFriendPages(); i++) {
      const dot = document.createElement('span');
      dot.className = 'rooms-page-dot' + (i === page ? ' rooms-page-dot--active' : '');
      indicator.appendChild(dot);
    }
  }

  // Live search — filters friend cards, resets to page 0
  friendSearch.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    visibleFriendCards = query === ''
      ? allFriendCards
      : allFriendCards.filter(card => {
          const name = card.querySelector('.friend-username')?.textContent.toLowerCase() || '';
          return name.includes(query);
        });
    showFriendPage(0);
  });

  friendsPrevBtn.addEventListener('click', () => { if (friendsCurrentPage > 0) showFriendPage(friendsCurrentPage - 1); });
  friendsNextBtn.addEventListener('click', () => { if (friendsCurrentPage < totalFriendPages() - 1) showFriendPage(friendsCurrentPage + 1); });

  showFriendPage(0);


  /* REQUESTS PAGINATION — mirrors tempRooms pattern */
  const REQS_PER_PAGE_FIRST = 6;
  const REQS_PER_PAGE_REST  = 6;

  const requestsPanel = document.getElementById('requestsPanel');

  if (requestsPanel) { // only runs if requests panel exists
    const allReqCards   = Array.from(requestsPanel.querySelectorAll('.rooms-grid .friend-card'));
    const reqsPrevBtn   = requestsPanel.querySelector('.rooms-page-btn[aria-label="Previous"]');
    const reqsNextBtn   = requestsPanel.querySelector('.rooms-page-btn[aria-label="Next"]');
    let reqsCurrentPage  = 0;
    let visibleReqCards  = allReqCards;

    function totalReqPages() {
      if (visibleReqCards.length === 0) return 1;
      const afterFirst = Math.max(0, visibleReqCards.length - REQS_PER_PAGE_FIRST);
      return 1 + Math.ceil(afterFirst / REQS_PER_PAGE_REST);
    }

    function getReqPageCards(page) {
      if (page === 0) return visibleReqCards.slice(0, REQS_PER_PAGE_FIRST);
      const start = REQS_PER_PAGE_FIRST + (page - 1) * REQS_PER_PAGE_REST;
      return visibleReqCards.slice(start, start + REQS_PER_PAGE_REST);
    }

    function showReqPage(page) {
      allReqCards.forEach(card => card.style.display = 'none');
      getReqPageCards(page).forEach(card => card.style.display = '');

      //const emptyMsg = document.getElementById('requestsEmpty');
      //emptyMsg.style.display = visibleReqCards.length === 0 ? 'block' : 'none';

      updateReqDots(page);
      reqsPrevBtn.disabled = page === 0;
      reqsNextBtn.disabled = page >= totalReqPages() - 1;
      reqsCurrentPage = page;
    }

    function updateReqDots(page) {
      const indicator = requestsPanel.querySelector('.rooms-page-indicator');
      indicator.innerHTML = '';
      for (let i = 0; i < totalReqPages(); i++) {
        const dot = document.createElement('span');
        dot.className = 'rooms-page-dot' + (i === page ? ' rooms-page-dot--active' : '');
        indicator.appendChild(dot);
      }
    }

    reqsPrevBtn.addEventListener('click', () => { if (reqsCurrentPage > 0) showReqPage(reqsCurrentPage - 1); });
    reqsNextBtn.addEventListener('click', () => { if (reqsCurrentPage < totalReqPages() - 1) showReqPage(reqsCurrentPage + 1); });

    showReqPage(0);
  }

// ============================================================
//  CSRF TOKEN
// ============================================================
const CSRF = document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''; // ← NEW: needed for all fetch() POST requests

  /* 
    ADD FRIEND BAR
   */
  document.getElementById('addFriendBtn').addEventListener('click', () => {
    const val = document.getElementById('addFriendInput').value.trim();
    if (!val) return;
    // TODO: wire to send_friend_request view via fetch() POST when backend ready
    //alert('Friend request sent to: ' + val); // ← REMOVED: replaced with real fetch() POST
    //document.getElementById('addFriendInput').value = ''; // ← REMOVED: now inside .then() below

      fetch('/friends/add/', { // ← NEW: real POST to send_friend_request view
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': CSRF
    },
    body: `username=${encodeURIComponent(val)}`
  })
  .then(r => r.json())
  .then(data => {
    showFriendMsg(data.ok, data.ok ? data.message : data.error); // ← NEW: shows pastel message instead of alert
    if (data.ok) document.getElementById('addFriendInput').value = ''; // ← NEW: clears input on success
  });

  });

  document.getElementById('addFriendInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('addFriendBtn').click();
  });

// ← NEW: pastel success/error message function (replaces alert())
function showFriendMsg(success, text) {
  let msg = document.getElementById('friendAddMsg');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'friendAddMsg';
    msg.style.cssText = 'margin-top:8px; padding:8px 14px; border-radius:10px; font-size:13px; font-weight:700; text-align:center;';
    document.querySelector('.rooms-join-wrap').after(msg);
  }
  msg.textContent      = text;
  msg.style.background = success ? '#d4f5e2' : '#fde8f0'; // ← pastel green or pastel pink (no red! 🩷)
  msg.style.color      = success ? '#2d7a4f' : '#b84c72';
  msg.style.border     = success ? '2px solid #a8e6c1' : '2px solid #f5b8d0';
  msg.style.display    = 'block';
  setTimeout(() => msg.style.display = 'none', 3500);
}

  /* 
     SHARE LINK MODAL — mirrors room_card.js pattern
   */
  const friendShareBackdrop = document.getElementById('friendShareBackdrop');

  function openFriendShareModal(username) {
    document.getElementById('shareTargetName').textContent = username;
    document.getElementById('friendShareInput').value = '';
    document.getElementById('friendSharePasscode').value = ''; // ← MOVED HERE: clears when modal opens
    friendShareBackdrop.classList.add('open');
  }

  function closeFriendShareModal() {
    friendShareBackdrop.classList.remove('open');
  }

  document.getElementById('closeFriendShare').addEventListener('click', closeFriendShareModal);
  document.getElementById('closeFriendShareFooter').addEventListener('click', closeFriendShareModal);
  friendShareBackdrop.addEventListener('click', e => {
    if (e.target === friendShareBackdrop) closeFriendShareModal();
  });

  // TODO: hook accept / remove / decline buttons to fetch() POST when backend is ready
  // TODO: replace placeholder cards with template loop from context


// OLD: // TODO: wire send btn to send_room_link view via fetch() POST when backend ready // ← REMOVED: now done below
document.getElementById('friendShareSendBtn').addEventListener('click', () => { // ← NEW: Send button now wired to backend
  const username = document.getElementById('shareTargetName').textContent;
  const link     = document.getElementById('friendShareInput').value.trim();
  const passcode = document.getElementById('friendSharePasscode').value.trim(); // ← NEW: grab passcode
  if (!link) return;
  fetch('/friends/send-link/', { // ← NEW: POST to send_room_link view
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': CSRF
    },
    //body: `username=${encodeURIComponent(username)}&room_link=${encodeURIComponent(link)}
    body: `username=${encodeURIComponent(username)}&room_link=${encodeURIComponent(link)}&passcode=${encodeURIComponent(passcode)}` // ← NEW: include passcode
  })
  .then(r => r.json())
  .then(data => {
    alert(data.ok ? '✅ Link sent!' : '❌ ' + data.error);
    if (data.ok) closeFriendShareModal();
  });
});


// ============================================================
//  FRIEND ACTIONS — accept, decline, remove, copy link
// ============================================================

// OLD: // TODO: hook accept / remove / decline buttons to fetch() POST when backend is ready // ← REMOVED: done below
// OLD: // TODO: replace placeholder cards with template loop from context // ← REMOVED: done in friends.html

function acceptRequest(friendshipId, btn) { // ← NEW: was a TODO, now wired to accept_friend_request view
  fetch(`/friends/accept/${friendshipId}/`, {
    method: 'POST',
    headers: { 'X-CSRFToken': CSRF }
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) location.reload(); // ← reloads so new friend appears in friends list
  });
}

function declineRequest(friendshipId, btn) { // ← NEW: was a TODO, now wired to decline_friend_request view
  fetch(`/friends/decline/${friendshipId}/`, {
    method: 'POST',
    headers: { 'X-CSRFToken': CSRF }
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) document.getElementById(`req-card-${friendshipId}`)?.remove(); // ← removes card instantly, no reload
  });
}

function removeFriend(friendId, btn) { // ← NEW: was a TODO, now wired to remove_friend view
  if (!confirm('Remove this friend?')) return;
  fetch(`/friends/remove/${friendId}/`, {
    method: 'POST',
    headers: { 'X-CSRFToken': CSRF }
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) btn.closest('.friend-card')?.remove(); // ← removes card instantly, no reload
  });
}

function copyLink(link, btn) { // ← NEW: copies room link from received links inbox to clipboard
  navigator.clipboard.writeText(link).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = orig, 2000); // ← resets button text after 2 seconds
  });
}
