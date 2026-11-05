/**
 * First Thought room server for Google Sheets.
 *
 * Paste this whole file into Extensions > Apps Script on a blank Google Sheet, then deploy as a web app.
 * Setup steps: docs/sheets-setup.md
 *
 * This is a port of src/backend/core.ts. Keep the two in sync.
 * Data model: one "rooms" tab and one "responses" tab, created automatically on first use.
 */

var ROOM_COLUMNS = ['code', 'label', 'level', 'mode', 'caseId', 'roundId', 'roundStartedAt', 'roundSeconds', 'revealed', 'hostKey', 'createdAt', 'updatedAt'];
var RESPONSE_COLUMNS = ['id', 'createdAt', 'code', 'roundId', 'learnerId', 'caseId', 'level', 'text'];
var PATCHABLE = ['label', 'level', 'mode', 'caseId', 'roundId', 'roundStartedAt', 'roundSeconds', 'revealed'];
var LEVELS = ['M1', 'M2', 'M3', 'M4'];
var CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';
var MAX_RESPONSE_LENGTH = 600;
var DEFAULT_CASE_ID = 'chest-pain';
var ROUND_SECONDS = 240;

function doGet(e) {
  return respond_((e && e.parameter) || {});
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Malformed request' });
  }
  return respond_(body);
}

function respond_(request) {
  try {
    var result = route_(request);
    result.ok = true;
    return json_(result);
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function route_(req) {
  switch (req.action) {
    case 'getRoom':
      return { room: getRoom_(req.code) };
    case 'verifyHost':
      var room = findRoom_(req.code);
      return { valid: Boolean(room && req.hostKey && room.hostKey === String(req.hostKey)) };
    case 'getResponses':
      return getResponses_(req);
    case 'createRoom':
      return withLock_(function () { return createRoom_(req); });
    case 'submit':
      return withLock_(function () { submit_(req); return {}; });
    case 'updateRoom':
      return withLock_(function () { return { room: updateRoom_(req) }; });
    default:
      throw new Error('Unknown action');
  }
}

// ---- Rules (mirror src/backend/core.ts and src/domain/rounds.ts) ----

function publicRoom_(room) {
  return {
    code: room.code,
    label: room.label,
    level: room.level,
    mode: room.mode === 'led' ? 'led' : 'open',
    caseId: room.caseId,
    roundId: room.roundId,
    roundStartedAt: room.roundStartedAt,
    roundSeconds: Number(room.roundSeconds) || ROUND_SECONDS,
    revealed: room.revealed === true || String(room.revealed).toLowerCase() === 'true',
    updatedAt: room.updatedAt
  };
}

function getRoom_(code) {
  var room = findRoom_(code);
  return room ? publicRoom_(room) : null;
}

function createRoom_(req) {
  if (LEVELS.indexOf(req.level) === -1) throw new Error('Unknown level');
  var rooms = readRows_(ROOM_COLUMNS, 'rooms');
  var code;
  do {
    code = '';
    for (var i = 0; i < 4; i++) code += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  } while (rooms.some(function (room) { return room.code === code; }));

  var now = new Date().toISOString();
  var room = {
    code: code,
    label: String(req.label || '').trim().slice(0, 80) || 'First Thought room',
    level: req.level,
    mode: 'open',
    caseId: DEFAULT_CASE_ID,
    roundId: '',
    roundStartedAt: '',
    roundSeconds: ROUND_SECONDS,
    revealed: false,
    hostKey: Utilities.getUuid().replace(/-/g, '').slice(0, 16),
    createdAt: now,
    updatedAt: now
  };
  appendRow_('rooms', ROOM_COLUMNS, room);
  return { room: publicRoom_(room), hostKey: room.hostKey };
}

function getResponses_(req) {
  var room = findRoom_(req.code);
  if (!room) throw new Error('Room not found');
  var roundId = String(req.roundId || '');
  var inRound = readRows_(RESPONSE_COLUMNS, 'responses').filter(function (item) {
    return item.code === room.code && item.roundId === roundId;
  });
  var isHost = Boolean(req.hostKey) && String(req.hostKey) === room.hostKey;
  var learnerSubmitted = Boolean(req.learnerId) && inRound.some(function (item) { return item.learnerId === String(req.learnerId); });
  var pub = publicRoom_(room);
  var visible =
    isHost ||
    (roundId.indexOf('open-') === 0 && learnerSubmitted) ||
    (pub.mode === 'led' && pub.revealed && pub.roundId === roundId);

  return {
    visible: visible,
    count: inRound.length,
    responses: visible
      ? inRound.map(function (item) {
          return { id: item.id, learnerId: item.learnerId, text: item.text, createdAt: item.createdAt };
        })
      : []
  };
}

function submit_(req) {
  var room = findRoom_(req.code);
  if (!room) throw new Error('Room not found');
  var text = String(req.text || '').trim();
  if (!text) throw new Error('Empty answer');
  if (text.length > MAX_RESPONSE_LENGTH) throw new Error('Answers are limited to ' + MAX_RESPONSE_LENGTH + ' characters');
  if (!req.roundId || !req.learnerId) throw new Error('Missing round or learner');
  var duplicate = readRows_(RESPONSE_COLUMNS, 'responses').some(function (item) {
    return item.code === room.code && item.roundId === String(req.roundId) && item.learnerId === String(req.learnerId);
  });
  if (duplicate) throw new Error('Already submitted for this round');
  appendRow_('responses', RESPONSE_COLUMNS, {
    id: Utilities.getUuid(),
    createdAt: new Date().toISOString(),
    code: room.code,
    roundId: String(req.roundId),
    learnerId: String(req.learnerId),
    caseId: String(req.caseId || ''),
    level: String(req.level || ''),
    text: text
  });
}

function updateRoom_(req) {
  var sheet = sheet_('rooms', ROOM_COLUMNS);
  var values = sheet.getDataRange().getValues();
  var code = String(req.code || '').toUpperCase();
  for (var r = 1; r < values.length; r++) {
    var room = rowToObject_(ROOM_COLUMNS, values[r]);
    if (room.code !== code) continue;
    if (!req.hostKey || String(req.hostKey) !== room.hostKey) throw new Error('Not authorized for this room');
    var patch = req.patch || {};
    if (patch.level !== undefined && LEVELS.indexOf(patch.level) === -1) throw new Error('Unknown level');
    PATCHABLE.forEach(function (key) {
      if (patch[key] !== undefined) room[key] = patch[key];
    });
    room.updatedAt = new Date().toISOString();
    sheet.getRange(r + 1, 1, 1, ROOM_COLUMNS.length).setValues([objectToRow_(ROOM_COLUMNS, room)]);
    return publicRoom_(room);
  }
  throw new Error('Room not found');
}

// ---- Sheet helpers ----

function sheet_(name, columns) {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(name);
  if (!sheet) {
    sheet = book.insertSheet(name);
    sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    sheet.setFrozenRows(1);
    // Plain text everywhere, so Sheets never turns timestamps or codes into dates or numbers.
    sheet.getRange(1, 1, sheet.getMaxRows(), columns.length).setNumberFormat('@');
  }
  return sheet;
}

function readRows_(columns, name) {
  var values = sheet_(name, columns).getDataRange().getValues();
  return values.slice(1).map(function (row) { return rowToObject_(columns, row); });
}

function findRoom_(code) {
  var target = String(code || '').toUpperCase();
  var rooms = readRows_(ROOM_COLUMNS, 'rooms');
  for (var i = 0; i < rooms.length; i++) if (rooms[i].code === target) return rooms[i];
  return null;
}

function appendRow_(name, columns, object) {
  sheet_(name, columns).appendRow(objectToRow_(columns, object));
}

function rowToObject_(columns, row) {
  var object = {};
  columns.forEach(function (column, index) {
    var value = row[index];
    object[column] = value === undefined || value === null ? '' : value === true || value === false ? value : String(value);
  });
  return object;
}

/** Prefix anything that looks like a formula so learner text can never execute in the Sheet. */
function objectToRow_(columns, object) {
  return columns.map(function (column) {
    var value = object[column];
    if (typeof value === 'string' && /^[=+\-@]/.test(value)) return "'" + value;
    return value === undefined ? '' : value;
  });
}

function withLock_(run) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return run();
  } finally {
    lock.releaseLock();
  }
}

function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}
