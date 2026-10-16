const form = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberBox = document.getElementById('remember');
const toggleBtn = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');
const messageBox = document.getElementById('message');
const submitBtn = document.getElementById('submit-btn');

const REMEMBER_KEY = 'bh.tu_username';

const EYE_OPEN = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
const EYE_CLOSED = '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>';

try {
  const saved = localStorage.getItem(REMEMBER_KEY);
  if (saved) {
    usernameInput.value = saved;
    rememberBox.checked = true;
  }
} catch (err) {}

toggleBtn.addEventListener('click', function () {
  const isHidden = passwordInput.type === 'password';

  passwordInput.type = isHidden ? 'text' : 'password';
  eyeIcon.innerHTML = isHidden ? EYE_CLOSED : EYE_OPEN;
  toggleBtn.setAttribute('aria-label', isHidden ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
});

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.classList.toggle('success', type === 'success');
  messageBox.hidden = false;
}

function hideMessage() {
  messageBox.hidden = true;
  messageBox.textContent = '';
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('loading', isLoading);
}

[usernameInput, passwordInput].forEach(function (input) {
  input.addEventListener('input', function () {
    input.classList.remove('invalid');
  });
});

function validate(username, password) {
  usernameInput.classList.remove('invalid');
  passwordInput.classList.remove('invalid');

  if (!username && !password) {
    usernameInput.classList.add('invalid');
    passwordInput.classList.add('invalid');
    return 'กรอกบัญชี มธ. และรหัสผ่านให้ครบ';
  }
  if (!username) {
    usernameInput.classList.add('invalid');
    return 'กรอกบัญชี มธ.';
  }
  if (!password) {
    passwordInput.classList.add('invalid');
    return 'กรอกรหัสผ่าน';
  }
  return null;
}

function fakeLogin(username, password) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve({ ok: true });
    }, 1000);
  });
}

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  hideMessage();

  const error = validate(username, password);
  if (error) {
    showMessage(error, 'error');
    return;
  }

  setLoading(true);

  try {
    const result = await fakeLogin(username, password);

    if (!result.ok) {
      showMessage('ล็อกอินไม่สำเร็จ', 'error');
      return;
    }

    try {
      if (rememberBox.checked) {
        localStorage.setItem(REMEMBER_KEY, username);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (err) {}

    showMessage('เข้าสู่ระบบสำเร็จ (จำลอง) — ยินดีต้อนรับ ' + username, 'success');
    passwordInput.value = '';
  } catch (err) {
    showMessage('เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง', 'error');
  } finally {
    setLoading(false);
  }
});
