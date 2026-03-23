//Share and Info Modal
const shareBackdrop   = document.getElementById('shareModalBackdrop');
const closeShareBtn   = document.getElementById('closeShareModal');
const closeShareFooter = document.getElementById('closeShareFooter');
const shareLinkInput  = document.getElementById('shareLinkInput');
const copyLinkBtn     = document.getElementById('copyLinkBtn');
const copyConfirm     = document.getElementById('copyConfirm');
const passcodeSection = document.getElementById('passcodeSection');
const passcodeDisplay = document.getElementById('passcodeDisplay');
const copyPasscodeBtn = document.getElementById('copyPasscodeBtn');

function openShareModal(roomId, roomName, isPrivate, passcode) {
  const link = `${window.location.origin}/room/${roomId}/`;
  shareLinkInput.value = link;
  copyConfirm.classList.remove('visible');

  if (isPrivate === 'true' && passcode) {
    passcodeSection.style.display = 'block';
    passcodeDisplay.value = passcode;
  } else {
    passcodeSection.style.display = 'none';
  }
  shareBackdrop.classList.add('open');
}

function closeShareModal() {
  shareBackdrop.classList.remove('open');
}

//link up all (i) buttons
document.querySelectorAll('.card-info-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation(); //stops the card link from firing
    openShareModal(
      btn.dataset.roomId,
      btn.dataset.roomName,
      btn.dataset.isPrivate,
      btn.dataset.passcode
    );
  });
});

closeShareBtn.addEventListener('click', closeShareModal);
closeShareFooter.addEventListener('click', closeShareModal);
shareBackdrop.addEventListener('click', e => {
  if (e.target === shareBackdrop) closeShareModal();
});

copyLinkBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(shareLinkInput.value).then(() => {
    copyConfirm.classList.add('visible');
    setTimeout(() => copyConfirm.classList.remove('visible'), 2000);
  });
});

copyPasscodeBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(passcodeDisplay.value);
});

//Join Room
const joinRoomBtn = document.getElementById('joinRoomBtn');
if (joinRoomBtn) joinRoomBtn.addEventListener('click', () => {  const input = document.getElementById('joinRoomInput').value.trim();
  if (!input) return;

  //Handle both full URL and bare UUID
  //looks for "http://127.0.0.1:8000/room/...-.../" or just "....-..." basically 273 stuff
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = input.match(uuidRegex);

  if (match) {
    window.location.href = `/room/${match[0]}/`;
  } else {
    alert('Invalid room link or code. Please check and try again.');
  }
});

//allow pressing Enter to join
const joinRoomInput = document.getElementById('joinRoomInput');
if (joinRoomInput) joinRoomInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') joinRoomBtn.click();
});