//Modal open/close
const backdrop = document.getElementById('createModalBackdrop');

document.getElementById('openCreateModal').addEventListener('click', e => {
  e.preventDefault(); //prevents button from opening a new page
  backdrop.classList.add('open'); //shows the modal from css
});

document.getElementById('closeCreateModal').addEventListener('click', () => backdrop.classList.remove('open')); //closes modal
document.getElementById('cancelCreateRoom').addEventListener('click', () => backdrop.classList.remove('open'));
backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.classList.remove('open'); }); //closes modal if you click outside of it

//Privacy toggle
//TODO: fix css for states
let isPrivate = false;
function setPrivacy(val) {
  isPrivate = val; //stores privacy choice 
  document.getElementById('btnPublic').classList.toggle('active', !val);
  document.getElementById('btnPrivate').classList.toggle('active', val);
  document.getElementById('roomPasscode').classList.toggle('modal-passcode--visible', val);
}

//submit form
document.getElementById('submitCreateRoom').addEventListener('click', async () => { //async because we need to wait for the server response
  const name = document.getElementById('roomName').value.trim();
  if (!name) { alert('Please enter a room name!'); return; }
  //fetch to send form data without page reload
  const res = await fetch(CREATE_ROOM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '' //prevent CSRF attacks
    },
    //json sends form data converted to python dict later in django view
    body: JSON.stringify({
      name,
      description: document.getElementById('roomDesc').value.trim(),
      is_private: isPrivate,
      passcode: document.getElementById('roomPasscode').value.trim() || null,
    })
  });

  const data = await res.json(); //res.json converts json text into a js object we can work with
  if (data.success) {
    window.location.href = data.redirect;
  } else {
    alert('Something went wrong, please try again.');
  }
});