/** CK3 Dashboard - server code. Bound to the "Master Tracker" Google Sheet. */
const SH = {board:'Board 2026', units:'Dance Unit', members:'Members Info', picks:'Song Picks', avail:'Availability', updates:'Updates', suggestions:'Suggestions'};

// Home-screen logo
// Must be a DIRECT image link (uc?export=view&id=...), not the Drive "/view?usp=sharing" page link.
const LOGO_URL = '';
const STATUSES = ['', 'Active Fall', 'Active Winter', 'Active Summer', 'Hiatus', 'Left'];

function doGet() {
  const out = HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('CK3 Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // lets the home-screen wrapper page embed this app
  if (LOGO_URL) { try { out.setFaviconUrl(LOGO_URL); } catch (e) {} }
  return out;
}

const str_ = v => v == null ? '' : String(v).trim();
const clean_ = v => { v = str_(v).slice(0, 100); return /^[=+\-@]/.test(v) ? "'" + v : v; };

function sheet_(name, header) {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(name);
  if (!s && header) { s = ss.insertSheet(name); s.appendRow(header); }
  return s;
}

// Finds the header row (first cell equals key) so notes above the table don't matter.
function table_(sheet, key) {
  const v = sheet.getDataRange().getValues();
  const h = v.findIndex(r => str_(r[0]) === key);
  if (h < 0) return {h: -1, head: [], rows: []};
  return {h, head: v[h].map(str_), rows: v.slice(h + 1)};
}

// Only name, status and non-sensitive fields leave the server. Emails/phones are never sent.
function getData(code) {
  checkCode_(code);
  const tz = Session.getScriptTimeZone();

  const b = table_(sheet_(SH.board), 'Dance Unit'), bc = n => b.head.indexOf(n);
  const board = b.rows.filter(r => str_(r[0]) && str_(r[0]) !== '-').map(r => ({
    name: str_(r[0]), type: str_(r[bc('Type')]), event: str_(r[bc('Event')]),
    sched: str_(r[bc('Practice Schedule')]), status: str_(r[bc('Status')]),
    link: str_(r[bc('Playlist Link')]),
    date: evDate_(r[bc('Event Date')], tz)
  }));

  const m = table_(sheet_(SH.members), 'ID'), mc = n => m.head.indexOf(n);
  let members = m.rows.filter(r => str_(r[mc('ID')]) !== '').map(r => {
    const id = Number(r[mc('ID')]);
    return {id, status: str_(r[mc('Status')]),
      name: str_(r[mc('Stage Name')]) || str_(r[mc('Full Name')]).split(' ')[0] || ('#' + id)};
  });
  const count = {}; members.forEach(x => count[x.name.toLowerCase()] = (count[x.name.toLowerCase()] || 0) + 1);
  members = members.map(x => count[x.name.toLowerCase()] > 1 ? {...x, name: x.name + ' #' + x.id} : x);

  const u = table_(sheet_(SH.units), 'Dance Unit'), uc = u.head.indexOf('Member ID');
  const units = u.rows.filter(r => str_(r[0])).map(r => ({
    name: str_(r[0]),
    ids: str_(r[uc]).split(/[,\s]+/).filter(Boolean).map(Number).filter(n => !isNaN(n))
  }));

  const pv = sheet_(SH.picks, ['Period', 'Member ID', 'Pick 1', 'Pick 2', 'Updated']).getDataRange().getValues().slice(1);
  const picks = pv.filter(r => str_(r[0])).map(r => ({p: str_(r[0]), id: Number(r[1]), a: str_(r[2]), b: str_(r[3])}));

  const av = sheet_(SH.avail, ['Member ID', 'Slots', 'Updated']).getDataRange().getValues().slice(1);
  const avail = av.filter(r => str_(r[0])).map(r => ({id: Number(r[0]), slots: str_(r[1]).split(',').filter(Boolean)}));

  // Announcements: edited directly in the "Updates" tab (Date, Update, Hide After).
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const uv = sheet_(SH.updates, ['Date', 'Update', 'Hide After']).getDataRange().getValues().slice(1);
  const updates = uv.map((r, i) => ({r, row: i + 2}))
    .filter(x => str_(x.r[1]) && !(x.r[2] instanceof Date && x.r[2] < today))
    .map(x => ({
      row: x.row,
      date: x.r[0] instanceof Date ? Utilities.formatDate(x.r[0], tz, 'yyyy-MM-dd') : '',
      text: str_(x.r[1]).slice(0, 600)
    })).reverse().sort((a, b) => b.date.localeCompare(a.date));

  return {board, members, units, picks, avail, updates};
}

function lock_(fn) {
  const l = LockService.getScriptLock();
  l.waitLock(10000);
  try { return fn(); } finally { l.releaseLock(); }
}

function memberIds_() {
  const m = table_(sheet_(SH.members), 'ID'), c = m.head.indexOf('ID');
  return m.rows.filter(r => str_(r[c]) !== '').map(r => Number(r[c]));
}

// Accepts real dates, or text like "November 20" / "Oct 30" (assumes the current year).
function evDate_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  const t = str_(v);
  if (!t || t === '-') return '';
  const d = /\d{4}/.test(t) ? new Date(t) : new Date(t + ' ' + new Date().getFullYear());
  return isNaN(d) ? '' : Utilities.formatDate(d, tz, 'yyyy-MM-dd');
}

function savePicks(code, period, id, a, b) {
  checkCode_(code);
  id = Number(id);
  if (!/^P\d{4}-\d{2}$/.test(period) || !memberIds_().includes(id)) throw new Error('Invalid request');
  return lock_(() => {
    const s = sheet_(SH.picks, ['Period', 'Member ID', 'Pick 1', 'Pick 2', 'Updated']);
    const v = s.getDataRange().getValues();
    const row = [period, id, clean_(a), clean_(b), new Date()];
    const i = v.findIndex((r, k) => k > 0 && str_(r[0]) === period && Number(r[1]) === id);
    if (i > 0) s.getRange(i + 1, 1, 1, 5).setValues([row]); else s.appendRow(row);
    return true;
  });
}

function saveAvail(code, id, slots) {
  checkCode_(code);
  id = Number(id);
  if (!memberIds_().includes(id)) throw new Error('Invalid request');
  const ok = (slots || []).filter(x => /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)-(9|1\d|2[01])$/.test(x));
  return lock_(() => {
    const s = sheet_(SH.avail, ['Member ID', 'Slots', 'Updated']);
    const v = s.getDataRange().getValues();
    const row = [id, ok.join(','), new Date()];
    const i = v.findIndex((r, k) => k > 0 && Number(r[0]) === id);
    if (i > 0) s.getRange(i + 1, 1, 1, 3).setValues([row]); else s.appendRow(row);
    return true;
  });
}

function saveStatus(code, id, status) {
  checkCode_(code);
  id = Number(id);
  if (!STATUSES.includes(status)) throw new Error('Invalid status');
  return lock_(() => {
    const s = sheet_(SH.members), t = table_(s, 'ID');
    const idc = t.head.indexOf('ID'), sc = t.head.indexOf('Status'), lc = t.head.indexOf('Last Updated');
    const i = t.rows.findIndex(r => Number(r[idc]) === id);
    if (i < 0 || sc < 0) throw new Error('Member not found');
    const row = t.h + i + 2;
    s.getRange(row, sc + 1).setValue(status);
    if (lc >= 0) s.getRange(row, lc + 1).setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy'));
    return true;
  });
}

// ---- VP posting (shared password) ----
// Set the password in Apps Script: Project Settings > Script properties > VP_PASSWORD
function checkPw_(pw) {
  const cache = CacheService.getScriptCache(), fails = Number(cache.get('pwfails') || 0);
  if (fails >= 5) throw new Error('Too many wrong attempts. Try again in 10 minutes.');
  const real = PropertiesService.getScriptProperties().getProperty('VP_PASSWORD');
  if (!real) throw new Error('Posting password not set yet. See the README.');
  if (String(pw) !== real) { cache.put('pwfails', String(fails + 1), 600); throw new Error('Wrong password.'); }
  cache.remove('pwfails');
}

function unlockVp(code, pw) { checkCode_(code); checkPw_(pw); return true; }

function postUpdate(code, pw, text, hideAfter) {
  checkCode_(code);
  checkPw_(pw);
  let t = String(text || '').trim().slice(0, 600);
  if (!t) throw new Error('Message is empty.');
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(hideAfter || ''));
  const hide = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : '';
  return lock_(() => {
    const s = sheet_(SH.updates, ['Date', 'Update', 'Hide After']);
    s.appendRow([new Date(), t, hide]);
    const r = s.getLastRow();
    // Typed Sheets "Table" columns refuse setNumberFormat, so each call is skipped safely.
    try { s.getRange(r, 1).setNumberFormat('yyyy-mm-dd'); } catch (e) {}
    try { if (hide) s.getRange(r, 3).setNumberFormat('yyyy-mm-dd'); } catch (e) {}
    return true;
  });
}

function deleteUpdate(code, pw, row, text) {
  checkCode_(code);
  checkPw_(pw);
  row = Number(row);
  return lock_(() => {
    const s = sheet_(SH.updates);
    if (!s || row < 2 || row > s.getLastRow()) throw new Error('Update not found.');
    if (str_(s.getRange(row, 2).getValue()).slice(0, 600) !== String(text)) throw new Error('That update changed. Refresh and try again.');
    s.deleteRow(row);
    return true;
  });
}

function deletePicks(code, period, id) {
  checkCode_(code);
  id = Number(id);
  if (!/^P\d{4}-\d{2}$/.test(period) || !memberIds_().includes(id)) throw new Error('Invalid request');
  return lock_(() => {
    const s = sheet_(SH.picks);
    if (!s) return true;
    const v = s.getDataRange().getValues();
    for (let i = v.length - 1; i > 0; i--) {
      if (str_(v[i][0]) === period && Number(v[i][1]) === id) s.deleteRow(i + 1);
    }
    return true;
  });
}

// Anonymous suggestion box. Rows land in the "Suggestions" tab (Date, Name, Suggestion).
function sendSuggestion(code, text, name) {
  checkCode_(code);
  let t = String(text || '').trim().slice(0, 500);
  if (!t) throw new Error('Please write a suggestion first.');
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  const cache = CacheService.getScriptCache(), n = Number(cache.get('sgcount') || 0);
  if (n >= 10) throw new Error('Too many suggestions right now. Please try again later.');
  return lock_(() => {
    const s = sheet_(SH.suggestions, ['Date', 'Name', 'Suggestion']);
    s.appendRow([new Date(), clean_(name), t]);
    cache.put('sgcount', String(n + 1), 3600);
    return true;
  });
}

// ---- Access code: keeps outsiders out even if they find the link ----
// Set in Apps Script: Project Settings > Script properties > APP_CODE
function checkCode_(code) {
  const real = PropertiesService.getScriptProperties().getProperty('APP_CODE');
  if (!real) throw new Error('Access code not set yet. The sheet owner must add APP_CODE in Script properties.');
  const cache = CacheService.getScriptCache(), fails = Number(cache.get('codefails') || 0);
  if (fails >= 15) throw new Error('Too many wrong codes. Please try again in 10 minutes.');
  if (String(code || '') !== real) { cache.put('codefails', String(fails + 1), 600); throw new Error('BAD_CODE'); }
}

function checkAccess(code) { checkCode_(code); return true; }
