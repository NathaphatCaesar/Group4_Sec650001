const ICONS = {
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  calendar: '<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><path d="M17.5 17.5 16 16.3V14"/><circle cx="16" cy="16" r="6"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  comment: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  image: '<path d="M16 5h6"/><path d="M19 2v6"/><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><circle cx="9" cy="9" r="2"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  graduation: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>'
};

const TAGS = {
  sheet:      { hash: '#ชีท',        tone: 'tag-sheet',    title: 'ชื่อชีท เช่น ชีทวิชา MATH102 (แคลคูลัส 1)' },
  studybuddy: { hash: '#หาเพื่อนติว', tone: 'tag-buddy',    title: 'รับเพื่อนติว PHY101 (ฟิสิกส์ 1)' },
  qa:         { hash: '#ถาม-ตอบ',    tone: 'tag-qa',       title: 'คำถามของคุณคือ...' },
  poll:       { hash: '#โพลล์',       tone: 'tag-poll',     title: 'คำถามของโพลล์ เช่น จัดติวรอบไหนดี?' },
  announce:   { hash: '#ประกาศ',     tone: 'tag-announce', title: 'หัวข้อประกาศ' },
  general:    { hash: 'ทั่วไป',       tone: 'tag-general',  title: '' }
};
const TAG_ORDER = ['sheet', 'studybuddy', 'qa', 'poll', 'announce', 'general'];

const VISIBILITY = {
  public:  { label: 'สาธารณะ',  hint: 'คน มธ. ทุกคนเห็นได้',            icon: 'globe' },
  close:   { label: 'เพื่อนสนิท', hint: 'เฉพาะคนในรายชื่อเพื่อนสนิทของคุณ', icon: 'star' },
  private: { label: 'ส่วนตัว',   hint: 'เห็นคนเดียว ไม่มีใครเห็นอีก',      icon: 'lock' }
};

const FACULTIES = [
  ['law', 'คณะนิติศาสตร์'], ['comm', 'คณะพาณิชยศาสตร์และการบัญชี'], ['polsci', 'คณะรัฐศาสตร์'],
  ['econ', 'คณะเศรษฐศาสตร์'], ['socadmin', 'คณะสังคมสงเคราะห์ศาสตร์'], ['arts', 'คณะศิลปศาสตร์'],
  ['jc', 'คณะวารสารศาสตร์และสื่อสารมวลชน'], ['sociology', 'คณะสังคมวิทยาและมานุษยวิทยา'],
  ['sci', 'คณะวิทยาศาสตร์และเทคโนโลยี'], ['engr', 'คณะวิศวกรรมศาสตร์'], ['med', 'คณะแพทยศาสตร์'],
  ['allied', 'คณะสหเวชศาสตร์'], ['dent', 'คณะทันตแพทยศาสตร์'], ['nurse', 'คณะพยาบาลศาสตร์'],
  ['fineart', 'คณะศิลปกรรมศาสตร์'], ['arch', 'คณะสถาปัตยกรรมศาสตร์และการผังเมือง'],
  ['pubhealth', 'คณะสาธารณสุขศาสตร์'], ['pharm', 'คณะเภสัชศาสตร์'], ['lsed', 'คณะวิทยาการเรียนรู้และศึกษาศาสตร์'],
  ['ci', 'วิทยาลัยสหวิทยาการ'], ['citu', 'วิทยาลัยนวัตกรรม'], ['psds', 'วิทยาลัยพัฒนศาสตร์ ป๋วย อึ๊งภากรณ์'],
  ['sgs', 'วิทยาลัยโลกคดีศึกษา'], ['cicm', 'วิทยาลัยแพทยศาสตร์นานาชาติจุฬาภรณ์'],
  ['siit', 'สถาบันเทคโนโลยีนานาชาติสิรินธร'], ['pridi', 'วิทยาลัยปรีดี พนมยงค์'], ['tu-office', 'สำนักงานมหาวิทยาลัย']
];

const SUBJECTS = [
  ['MATH101', 'แคลคูลัสพื้นฐาน', 'sci'], ['MATH102', 'แคลคูลัส 1', 'sci'], ['MATH103', 'แคลคูลัส 2', 'sci'],
  ['MATH216', 'พีชคณิตเชิงเส้น', 'sci'], ['MA211', 'สถิติเบื้องต้น', 'sci'], ['PHY101', 'ฟิสิกส์ 1', 'sci'],
  ['PHY102', 'ฟิสิกส์ 2', 'sci'], ['CHM103', 'เคมีพื้นฐาน', 'sci'], ['BIO101', 'ชีววิทยาทั่วไป', 'sci'],
  ['CS101', 'ความรู้พื้นฐานคอมพิวเตอร์', 'sci'], ['CS102', 'การเขียนโปรแกรมเบื้องต้น', 'sci'],
  ['CS213', 'โครงสร้างข้อมูล', 'sci'], ['CS284', 'ระบบฐานข้อมูล', 'sci'],
  ['TU100', 'พลเมืองกับความรับผิดชอบต่อสังคม', null], ['TU101', 'โลก อาเซียน และไทย', null],
  ['TU102', 'ทักษะชีวิตทางสังคม', null], ['TU103', 'ชีวิตกับความยั่งยืน', null], ['TU104', 'สังคมกับการใช้เหตุผล', null],
  ['TU105', 'ทักษะการสื่อสารด้วยภาษาอังกฤษ', null], ['TU106', 'ความคิดสร้างสรรค์และการสื่อสาร', null],
  ['EL070', 'ภาษาอังกฤษพื้นฐาน 1', 'arts'], ['EL171', 'ภาษาอังกฤษ 1', 'arts'], ['EL172', 'ภาษาอังกฤษ 2', 'arts'],
  ['ENG230', 'การอ่านเชิงวิชาการ', 'arts'], ['AC201', 'การบัญชีชั้นต้น', 'comm'], ['FN201', 'การเงินธุรกิจ', 'comm'],
  ['MK201', 'หลักการตลาด', 'comm'], ['EC210', 'เศรษฐศาสตร์จุลภาค', 'econ'], ['EC211', 'เศรษฐศาสตร์มหภาค', 'econ'],
  ['LA200', 'กฎหมายแพ่งหลักทั่วไป', 'law'], ['LA201', 'กฎหมายอาญาภาคทั่วไป', 'law'],
  ['EG101', 'กลศาสตร์วิศวกรรม', 'engr'], ['EG102', 'เขียนแบบวิศวกรรม', 'engr']
];

const POLL_MIN = 2;
const POLL_MAX = 6;
const ANNOUNCE_DAYS = 7;

const posts = [];
const filters = { scope: 'all', tag: null, faculty: null, subject: null, sort: 'new' };
let nextId = 1;
let justPosted = null;
let openMenuId = null;
let toastTimer = null;
let draft = null;
let subjectQuery = '';
const compose = { tag: 'general', visibility: 'public', pollOptions: ['', ''] };

const $ = (id) => document.getElementById(id);

function icon(name, extraClass) {
  return '<svg class="icon' + (extraClass ? ' ' + extraClass : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}

function paintIcons(root) {
  root.querySelectorAll('i[data-icon]').forEach(function (el) {
    const holder = document.createElement('span');
    holder.innerHTML = icon(el.dataset.icon, el.className);
    el.replaceWith(holder.firstChild);
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function subjectName(code) {
  const found = SUBJECTS.find(function (s) { return s[0] === code; });
  return found ? found[1] : '';
}

function timeAgo(date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'เมื่อสักครู่';
  const min = Math.floor(sec / 60);
  if (min < 60) return min + ' นาที';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + ' ชั่วโมง';
  return Math.floor(hr / 24) + ' วัน';
}

function meetDate(value) {
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' }) +
    ' · ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
}

function showToast(text) {
  const toast = $('toast');
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.hidden = true;
  }, 2200);
}

function visiblePosts() {
  if (filters.scope === 'following') return [];
  if (filters.faculty) return [];

  let list = posts.slice();
  if (filters.scope === 'bookmarks') list = list.filter(function (p) { return p.bookmarked; });
  if (filters.tag) list = list.filter(function (p) { return p.tag === filters.tag; });
  if (filters.subject) list = list.filter(function (p) { return p.subject === filters.subject; });
  if (filters.sort === 'top') {
    list.sort(function (a, b) { return b.likes - a.likes || b.createdAt - a.createdAt; });
  } else {
    list.sort(function (a, b) { return b.createdAt - a.createdAt; });
  }
  return list;
}

function emptyText() {
  if (filters.scope === 'following') {
    return ['คนที่คุณติดตามยังไม่ได้โพสต์', 'ยังไม่ได้เชื่อมต่อระบบติดตาม — โพสต์ของคนที่คุณติดตามจะขึ้นตรงนี้เมื่อเชื่อม backend แล้ว'];
  }
  if (filters.faculty) {
    return ['ยังไม่มีโพสต์ตรงนี้', 'ยังไม่ได้เชื่อมต่อข้อมูลคณะ — การกรองตามคณะต้องใช้ข้อมูลผู้โพสต์จาก backend'];
  }
  if (filters.scope === 'bookmarks') {
    return ['ยังไม่มีโพสต์ที่บันทึกไว้', 'กดไอคอนบันทึกบนโพสต์ แล้วโพสต์นั้นจะมาอยู่ตรงนี้'];
  }
  if (posts.length) {
    return ['ยังไม่มีโพสต์ตรงนี้', 'ลองล้างตัวกรองดูอีกครั้ง'];
  }
  return ['ยังไม่มีโพสต์ตรงนี้', 'ยังไม่ได้เชื่อมต่อ backend — กด "สร้างโพสต์" เพื่อลองดูหน้าตาการ์ดได้ แต่โพสต์จะหายเมื่อรีเฟรช'];
}

function studyHtml(p) {
  const s = p.study;
  return (
    '<div class="study-box">' +
      '<div class="study-info">' +
        (s.at ? '<span class="strong">' + icon('calendar') + escapeHtml(meetDate(s.at)) + '</span>' : '') +
        (s.place ? '<span>' + icon('map-pin') + escapeHtml(s.place) + '</span>' : '') +
        '<span>' + icon('users') + 'เข้าร่วมแล้ว 0' + (s.capacity ? '/' + s.capacity : '') + ' คน</span>' +
        (s.approval ? '<span>' + icon('clock') + 'รออนุมัติ 0 คน</span>' : '') +
      '</div>' +
      '<div class="study-row">' +
        (s.approval ? '<span class="study-note">ต้องได้รับอนุมัติจากผู้ตั้งกลุ่ม</span>' : '') +
        '<button type="button" class="btn-primary btn-xs" data-action="chat">' + icon('message') + 'เข้าห้องแชทกลุ่มติว</button>' +
      '</div>' +
    '</div>'
  );
}

function pollHtml(p) {
  const total = p.poll.reduce(function (sum, o) { return sum + o.votes; }, 0);
  const voted = p.poll.some(function (o) { return o.mine; });
  return (
    '<div class="poll">' +
      p.poll.map(function (o, i) {
        const pct = total ? Math.round((o.votes / total) * 100) : 0;
        return (
          '<button type="button" class="poll-option' + (o.mine ? ' mine' : '') + '" data-action="vote" data-option="' + i + '">' +
            (voted ? '<span class="poll-fill" style="width:' + pct + '%"></span>' : '') +
            '<span class="poll-label">' + (o.mine ? icon('check') : '') + escapeHtml(o.label) + '</span>' +
            (voted ? '<span class="poll-pct">' + pct + '%</span>' : '') +
          '</button>'
        );
      }).join('') +
      '<p class="poll-foot">' + total + ' โหวต' + (voted ? ' · กดตัวเลือกเดิมเพื่อยกเลิก' : '') + '</p>' +
    '</div>'
  );
}

function postHtml(p) {
  const meta = TAGS[p.tag];
  const isAnnounce = p.tag === 'announce';
  const vis = VISIBILITY[p.visibility];
  const name = subjectName(p.subject);

  return (
    '<article class="card post' + (isAnnounce ? ' card-announce' : '') + (p.id === justPosted ? ' is-new' : '') + '" data-id="' + p.id + '">' +
      (isAnnounce ? '<p class="announce-strip">' + icon('megaphone') + 'ประกาศ<span class="days">ปักไว้อีก ' + ANNOUNCE_DAYS + ' วัน</span></p>' : '') +
      '<div class="post-head">' +
        '<span class="avatar">?</span>' +
        '<div class="post-meta">' +
          '<div class="name-line">' +
            '<span class="post-author">ยังไม่ได้เชื่อมต่อ</span>' +
            '<span class="handle">@—</span>' +
            '<span class="when">· ' + timeAgo(p.createdAt) + '</span>' +
            (p.visibility !== 'public' ? '<span class="vis-badge ' + p.visibility + '" title="' + vis.hint + '">' + icon(vis.icon) + vis.label + '</span>' : '') +
          '</div>' +
          '<span class="role-line"><span class="role-badge role-unknown">' + icon('graduation') + 'ยังไม่ทราบ role</span></span>' +
        '</div>' +
        '<div class="post-tools">' +
          '<button type="button" class="tool-btn' + (p.bookmarked ? ' saved' : '') + '" data-action="bookmark" aria-label="' + (p.bookmarked ? 'เอาออกจากที่บันทึกไว้' : 'บันทึกโพสต์') + '">' + icon('bookmark') + '</button>' +
          '<button type="button" class="tool-btn" data-action="menu" aria-label="ตัวเลือกเพิ่มเติม" aria-expanded="' + (openMenuId === p.id) + '">' + icon('more') + '</button>' +
          (openMenuId === p.id
            ? '<div class="post-menu">' +
                '<button type="button" class="danger" data-action="delete">' + icon('trash') + 'ลบโพสต์</button>' +
                '<button type="button" data-action="pin">' + icon('pin') + 'ปักหมุด</button>' +
              '</div>'
            : '') +
        '</div>' +
      '</div>' +
      '<div class="post-content">' +
        '<div class="post-tags">' +
          '<span class="tag ' + meta.tone + '">' + meta.hash + '</span>' +
          (p.subject ? '<span class="subject-chip">' + escapeHtml(p.subject) + (name ? ' · ' + escapeHtml(name) : '') + '</span>' : '') +
        '</div>' +
        (p.title ? '<h3 class="post-title">' + escapeHtml(p.title) + '</h3>' : '') +
        (p.body ? '<p class="post-body">' + escapeHtml(p.body) + '</p>' : '') +
        (p.poll ? pollHtml(p) : '') +
        (p.study ? studyHtml(p) : '') +
      '</div>' +
      '<div class="post-actions">' +
        '<button type="button" class="action' + (p.liked ? ' liked' : '') + '" data-action="like" aria-pressed="' + p.liked + '">' + icon('heart') + '<span>' + p.likes + '</span></button>' +
        '<button type="button" class="action" data-action="comment">' + icon('comment') + '<span>0</span></button>' +
        '<button type="button" class="action" data-action="share">' + icon('share') + '<span>' + p.shares + '</span></button>' +
      '</div>' +
    '</article>'
  );
}

function renderFeed() {
  const list = visiblePosts();
  $('feed-list').innerHTML = list.map(postHtml).join('');
  justPosted = null;

  const empty = list.length === 0;
  $('feed-empty').hidden = !empty;
  if (empty) {
    const text = emptyText();
    $('empty-title').textContent = text[0];
    $('empty-hint').textContent = text[1];
  }
}

function renderToolbar() {
  document.querySelectorAll('.scope-tab').forEach(function (tab) {
    const on = tab.dataset.scope === filters.scope;
    tab.classList.toggle('active', on);
    tab.setAttribute('aria-selected', on);
  });

  const chips = [];
  if (filters.sort === 'top') chips.push(['ยอดนิยม', 'sort']);
  if (filters.tag) chips.push([TAGS[filters.tag].hash, 'tag']);
  if (filters.subject) chips.push([filters.subject + ' ' + subjectName(filters.subject), 'subject']);
  if (filters.faculty) {
    const found = FACULTIES.find(function (f) { return f[0] === filters.faculty; });
    chips.push([found ? found[1] : filters.faculty, 'faculty']);
  }

  const count = $('filter-count');
  count.hidden = chips.length === 0;
  count.textContent = chips.length;
  $('filter-btn').classList.toggle('on', chips.length > 0);

  const box = $('chips');
  box.hidden = chips.length === 0;
  box.innerHTML = chips.map(function (c) {
    return '<button type="button" class="chip" data-remove="' + c[1] + '" aria-label="เอา ' + escapeHtml(c[0]) + ' ออก"><span>' + escapeHtml(c[0]) + '</span>' + icon('x') + '</button>';
  }).join('') + (chips.length ? '<button type="button" class="chip-clear" data-remove="all">ล้างทั้งหมด</button>' : '');
}

function render() {
  renderToolbar();
  renderFeed();
}

function resetFilter(key) {
  if (key === 'all' || key === 'sort') filters.sort = 'new';
  if (key === 'all' || key === 'tag') filters.tag = null;
  if (key === 'all' || key === 'subject') filters.subject = null;
  if (key === 'all' || key === 'faculty') filters.faculty = null;
}

let openModalEl = null;
let lastFocus = null;

function openModal(el) {
  lastFocus = document.activeElement;
  openModalEl = el;
  el.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!openModalEl) return;
  openModalEl.hidden = true;
  openModalEl = null;
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

function renderComposer() {
  const tag = compose.tag;

  $('composer-tags').innerHTML = TAG_ORDER.map(function (t) {
    const on = t === tag;
    return '<button type="button" class="composer-tag' + (on ? ' active ' + TAGS[t].tone : '') + '" data-tag="' + t + '">' + TAGS[t].hash + '</button>';
  }).join('');

  const locked = tag === 'announce' || tag === 'studybuddy';
  $('visibility-box').hidden = locked;
  $('visibility-locked').hidden = !locked;
  $('visibility-locked-text').textContent = tag === 'announce'
    ? 'ประกาศต้องเป็นสาธารณะเสมอ — คน มธ. ทุกคนเห็นได้'
    : 'โพสต์หาเพื่อนติวต้องเป็นสาธารณะ ไม่งั้นไม่มีใครมาเข้าร่วมได้';
  document.querySelectorAll('#visibility-options [data-vis]').forEach(function (b) {
    const on = b.dataset.vis === compose.visibility;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on);
  });
  $('visibility-hint').textContent = VISIBILITY[compose.visibility].hint;

  const title = $('composer-title-input');
  title.hidden = tag === 'general';
  title.placeholder = TAGS[tag].title;

  $('poll-box').hidden = tag !== 'poll';
  $('poll-options').innerHTML = compose.pollOptions.map(function (value, i) {
    return (
      '<div class="poll-row">' +
        '<input class="input" maxlength="80" data-poll="' + i + '" placeholder="ตัวเลือกที่ ' + (i + 1) + '" value="' + escapeHtml(value) + '" />' +
        (compose.pollOptions.length > POLL_MIN ? '<button type="button" class="icon-btn" data-poll-remove="' + i + '" aria-label="ลบตัวเลือก">' + icon('x') + '</button>' : '') +
      '</div>'
    );
  }).join('');
  $('poll-add').hidden = compose.pollOptions.length >= POLL_MAX;

  document.querySelectorAll('[data-study]').forEach(function (el) {
    el.hidden = tag !== 'studybuddy';
  });
}

function openComposer(tag) {
  compose.tag = tag && TAGS[tag] ? tag : 'general';
  compose.visibility = 'public';
  compose.pollOptions = ['', ''];
  $('composer-form').reset();
  $('composer-error').hidden = true;
  $('approval-hint').textContent = 'ตอนนี้ใครกดก็เข้ากลุ่มแชทได้เลย';
  renderComposer();
  openModal($('composer'));
  $('composer-body').focus();
}

function composerError(text) {
  const box = $('composer-error');
  box.textContent = text;
  box.hidden = false;
}

function submitPost() {
  const tag = compose.tag;
  const title = tag === 'general' ? '' : $('composer-title-input').value.trim();
  const body = $('composer-body').value.trim();

  if (tag !== 'general' && !title) return composerError('ใส่หัวข้อด้วย');
  if (tag === 'general' && !body) return composerError('เขียนอะไรสักหน่อยก่อนโพสต์');

  let poll = null;
  if (tag === 'poll') {
    const options = compose.pollOptions.map(function (o) { return o.trim(); }).filter(Boolean);
    if (options.length < POLL_MIN) return composerError('โพลล์ต้องมีอย่างน้อย ' + POLL_MIN + ' ตัวเลือก');
    poll = options.map(function (label) { return { label: label, votes: 0, mine: false }; });
  }

  let study = null;
  if (tag === 'studybuddy') {
    const at = $('study-at').value;
    if (!at) return composerError('เลือกวันเวลานัดติวด้วย');
    study = {
      at: at,
      place: $('study-place').value.trim(),
      capacity: Number($('study-capacity').value) || null,
      approval: $('study-approval').checked
    };
  }

  justPosted = nextId;
  posts.push({
    id: nextId++,
    tag: tag,
    title: title,
    body: body,
    subject: $('composer-subject').value,
    visibility: tag === 'announce' || tag === 'studybuddy' ? 'public' : compose.visibility,
    poll: poll,
    study: study,
    createdAt: new Date(),
    likes: 0,
    liked: false,
    shares: 0,
    bookmarked: false
  });

  closeModal();
  filters.scope = 'all';
  resetFilter('all');
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('โพสต์แล้ว (ยังไม่ได้บันทึกจริง)');
}

function subjectPool() {
  const needle = subjectQuery.trim().toLowerCase();
  let pool = draft.faculty
    ? SUBJECTS.filter(function (s) { return !s[2] || s[2] === draft.faculty; })
    : SUBJECTS;
  if (needle) {
    pool = pool.filter(function (s) {
      return s[0].toLowerCase().includes(needle) || s[1].toLowerCase().includes(needle);
    });
  }
  return pool.slice(0, 8);
}

function renderFilterSheet() {
  document.querySelectorAll('#filter-sort .pill').forEach(function (pill) {
    pill.classList.toggle('active', pill.dataset.sort === draft.sort);
  });

  $('filter-tags').innerHTML =
    '<button type="button" class="pill' + (draft.tag ? '' : ' active') + '" data-tag="">ทั้งหมด</button>' +
    TAG_ORDER.map(function (tag) {
      return '<button type="button" class="pill' + (draft.tag === tag ? ' active' : '') + '" data-tag="' + tag + '">' + TAGS[tag].hash.replace('#', '') + '</button>';
    }).join('');

  $('filter-faculty').value = draft.faculty || '';

  const picked = $('filter-picked');
  picked.hidden = !draft.subject;
  picked.innerHTML = draft.subject
    ? '<span class="code">' + draft.subject + '</span><span class="name">' + escapeHtml(subjectName(draft.subject)) + '</span><button type="button" data-unpick aria-label="ล้าง">' + icon('x') + '</button>'
    : '';

  const pool = subjectPool();
  $('filter-subjects').innerHTML = pool.length
    ? pool.map(function (s) {
        return '<li><button type="button" data-subject="' + s[0] + '"><span class="code">' + s[0] + '</span><span class="name">' + escapeHtml(s[1]) + '</span>' + (draft.subject === s[0] ? icon('check') : '') + '</button></li>';
      }).join('')
    : '<li class="none">ไม่พบวิชา</li>';
}

function openFilter() {
  draft = { tag: filters.tag, faculty: filters.faculty, subject: filters.subject, sort: filters.sort };
  subjectQuery = '';
  $('filter-subject').value = '';
  renderFilterSheet();
  openModal($('filter'));
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function (resolve, reject) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (ok) resolve();
    else reject(new Error('copy failed'));
  });
}

paintIcons(document);

$('filter-faculty').insertAdjacentHTML('beforeend', FACULTIES.map(function (f) {
  return '<option value="' + f[0] + '">' + f[1] + '</option>';
}).join(''));

$('composer-subject').insertAdjacentHTML('beforeend', SUBJECTS.map(function (s) {
  return '<option value="' + s[0] + '">' + s[0] + ' · ' + s[1] + '</option>';
}).join(''));

document.addEventListener('click', function (event) {
  const soon = event.target.closest('[data-soon]');
  if (soon && soon.tagName !== 'INPUT') {
    event.preventDefault();
    showToast('หน้า "' + soon.dataset.soon + '" ยังไม่ได้ทำ');
    $('user-menu').hidden = true;
    return;
  }

  const soonMsg = event.target.closest('[data-soon-msg]');
  if (soonMsg) {
    showToast(soonMsg.dataset.soonMsg);
    return;
  }

  if (event.target.closest('[data-compose]')) {
    openComposer();
    return;
  }

  if (event.target.closest('[data-close]')) {
    closeModal();
    return;
  }

  if (openModalEl && event.target === openModalEl) {
    closeModal();
    return;
  }

  if (openMenuId !== null && !event.target.closest('.post-tools')) {
    openMenuId = null;
    renderFeed();
  }

  const userBtn = event.target.closest('#user-btn');
  const menu = $('user-menu');
  if (userBtn) {
    menu.hidden = !menu.hidden;
    userBtn.setAttribute('aria-expanded', !menu.hidden);
    return;
  }
  if (!event.target.closest('#user-menu')) {
    menu.hidden = true;
    $('user-btn').setAttribute('aria-expanded', 'false');
  }
});

document.querySelector('.search input').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') showToast('ค้นหายังไม่ได้เชื่อมต่อ');
});

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;
  if (openModalEl) closeModal();
  $('user-menu').hidden = true;
  if (openMenuId !== null) {
    openMenuId = null;
    renderFeed();
  }
});

document.querySelector('.scope-tabs').addEventListener('click', function (event) {
  const tab = event.target.closest('[data-scope]');
  if (!tab) return;
  filters.scope = tab.dataset.scope;
  render();
});

$('chips').addEventListener('click', function (event) {
  const btn = event.target.closest('[data-remove]');
  if (!btn) return;
  resetFilter(btn.dataset.remove);
  render();
});

$('feed-list').addEventListener('click', function (event) {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const card = btn.closest('[data-id]');
  const post = posts.find(function (p) { return p.id === Number(card.dataset.id); });
  if (!post) return;

  const action = btn.dataset.action;
  if (action === 'like') {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    renderFeed();
  } else if (action === 'bookmark') {
    post.bookmarked = !post.bookmarked;
    renderFeed();
  } else if (action === 'menu') {
    openMenuId = openMenuId === post.id ? null : post.id;
    renderFeed();
  } else if (action === 'delete') {
    posts.splice(posts.indexOf(post), 1);
    openMenuId = null;
    renderFeed();
    showToast('ลบโพสต์แล้ว');
  } else if (action === 'pin') {
    openMenuId = null;
    renderFeed();
    showToast('ปักหมุดยังไม่ได้เชื่อมต่อ');
  } else if (action === 'share') {
    const url = location.href.split('#')[0] + '#post-' + post.id;
    copyText(url).then(function () {
      post.shares += 1;
      renderFeed();
      showToast('คัดลอกลิงก์แล้ว');
    }).catch(function () {
      showToast('คัดลอกไม่สำเร็จ');
    });
  } else if (action === 'comment') {
    showToast('คอมเมนต์ยังไม่ได้เชื่อมต่อ');
  } else if (action === 'chat') {
    showToast('แชทกลุ่มติวยังไม่ได้เชื่อมต่อ');
  } else if (action === 'vote') {
    const option = post.poll[Number(btn.dataset.option)];
    const wasMine = option.mine;
    post.poll.forEach(function (o) {
      if (o.mine) {
        o.mine = false;
        o.votes -= 1;
      }
    });
    if (!wasMine) {
      option.mine = true;
      option.votes += 1;
    }
    renderFeed();
  }
});

$('filter-btn').addEventListener('click', openFilter);

$('filter-sort').addEventListener('click', function (event) {
  const pill = event.target.closest('[data-sort]');
  if (!pill) return;
  draft.sort = pill.dataset.sort;
  renderFilterSheet();
});

$('filter-tags').addEventListener('click', function (event) {
  const pill = event.target.closest('[data-tag]');
  if (!pill) return;
  draft.tag = pill.dataset.tag || null;
  renderFilterSheet();
});

$('filter-faculty').addEventListener('change', function (event) {
  draft.faculty = event.target.value || null;
  renderFilterSheet();
});

$('filter-subject').addEventListener('input', function (event) {
  subjectQuery = event.target.value;
  renderFilterSheet();
});

$('filter-subjects').addEventListener('click', function (event) {
  const btn = event.target.closest('[data-subject]');
  if (!btn) return;
  draft.subject = draft.subject === btn.dataset.subject ? null : btn.dataset.subject;
  renderFilterSheet();
});

$('filter-picked').addEventListener('click', function (event) {
  if (!event.target.closest('[data-unpick]')) return;
  draft.subject = null;
  renderFilterSheet();
});

$('filter-clear').addEventListener('click', function () {
  draft = { tag: null, faculty: null, subject: null, sort: 'new' };
  renderFilterSheet();
});

$('filter-apply').addEventListener('click', function () {
  filters.tag = draft.tag;
  filters.faculty = draft.faculty;
  filters.subject = draft.subject;
  filters.sort = draft.sort;
  closeModal();
  render();
});

$('composer-tags').addEventListener('click', function (event) {
  const btn = event.target.closest('[data-tag]');
  if (!btn) return;
  compose.tag = btn.dataset.tag;
  renderComposer();
});

$('visibility-options').addEventListener('click', function (event) {
  const btn = event.target.closest('[data-vis]');
  if (!btn) return;
  compose.visibility = btn.dataset.vis;
  renderComposer();
});

$('poll-options').addEventListener('input', function (event) {
  const input = event.target.closest('[data-poll]');
  if (input) compose.pollOptions[Number(input.dataset.poll)] = input.value;
});

$('poll-options').addEventListener('click', function (event) {
  const btn = event.target.closest('[data-poll-remove]');
  if (!btn) return;
  compose.pollOptions.splice(Number(btn.dataset.pollRemove), 1);
  renderComposer();
});

$('poll-add').addEventListener('click', function () {
  compose.pollOptions.push('');
  renderComposer();
  const inputs = $('poll-options').querySelectorAll('input');
  inputs[inputs.length - 1].focus();
});

$('study-approval').addEventListener('change', function (event) {
  $('approval-hint').textContent = event.target.checked
    ? 'คนกดขอแล้วต้องรอคุณกดรับ ถึงจะเข้ากลุ่มแชทได้'
    : 'ตอนนี้ใครกดก็เข้ากลุ่มแชทได้เลย';
});

$('composer-form').addEventListener('submit', function (event) {
  event.preventDefault();
  submitPost();
});

render();
