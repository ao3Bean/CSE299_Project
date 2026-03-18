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

    const emptyMsg = document.getElementById('friendsEmpty');
    emptyMsg.style.display = visibleFriendCards.length === 0 ? 'block' : 'none';

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

      const emptyMsg = document.getElementById('requestsEmpty');
      emptyMsg.style.display = visibleReqCards.length === 0 ? 'block' : 'none';

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


  /* 
    ADD FRIEND BAR
   */
  document.getElementById('addFriendBtn').addEventListener('click', () => {
    const val = document.getElementById('addFriendInput').value.trim();
    if (!val) return;
    // TODO: wire to send_friend_request view via fetch() POST when backend ready
    alert('Friend request sent to: ' + val);
    document.getElementById('addFriendInput').value = '';
  });

  document.getElementById('addFriendInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('addFriendBtn').click();
  });


  /* 
     SHARE LINK MODAL — mirrors room_card.js pattern
   */
  const friendShareBackdrop = document.getElementById('friendShareBackdrop');

  function openFriendShareModal(username) {
    document.getElementById('shareTargetName').textContent = username;
    document.getElementById('friendShareInput').value = '';
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
