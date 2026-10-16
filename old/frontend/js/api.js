const API_PORT = 8081;
const API_BASE = location.protocol.indexOf('http') === 0
  ? location.protocol + '//' + location.hostname + ':' + API_PORT
  : 'http://localhost:' + API_PORT;

async function apiRequest(path, options) {
  const opts = options || {};
  const res = await fetch(API_BASE + path, {
    method: opts.method || 'GET',
    credentials: 'include',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }
  return { ok: res.ok, status: res.status, data: data || {} };
}

const ROLE_LABEL = { student: 'นักศึกษา', instructor: 'อาจารย์', staff: 'เจ้าหน้าที่', admin: 'แอดมิน' };

function studyYear(entryYearBe) {
  if (!entryYearBe) return null;
  const now = new Date();
  const academicYear = now.getFullYear() + 543 - (now.getMonth() < 7 ? 1 : 0);
  const year = academicYear - entryYearBe + 1;
  return year >= 1 && year <= 8 ? year : null;
}

function shortFaculty(name) {
  return name ? name.replace(/^(คณะ|วิทยาลัย|สถาบัน)/, '') : '';
}

function initial(name) {
  return name ? name.trim().charAt(0).toUpperCase() : '?';
}
