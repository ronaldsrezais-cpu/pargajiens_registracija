// Google Apps Script example for saving website form submissions to Google Sheets
// and returning public registration counters to the website.
//
// Setup:
// 1. Create a Google Sheet.
// 2. Open Extensions -> Apps Script.
// 3. Paste this code.
// 4. Replace SHEET_ID with your spreadsheet ID.
// 5. Deploy as Web app.
// 6. Add the Web app URL in Vercel as REGISTRATION_ENDPOINT.

const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Registrations';

const CITIES = {
  'Liepāja': ['5 km', '14 km', '22 km'],
  'Smiltene': ['7 km', '13 km', '21 km'],
  'Ilūkste': ['5 km', '12 km', '19 km'],
};

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function normaliseDistance(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.endsWith('km') ? text : `${text} km`;
}

function countParticipants(row) {
  const captain = row[5];
  const participant1 = row[8];
  const participant2 = row[9];
  const participant3 = row[10];
  const participant4 = row[11];

  return [captain, participant1, participant2, participant3, participant4]
    .filter((value) => String(value || '').trim().length > 0)
    .length;
}

function getEmptyStats() {
  const rows = [];

  Object.keys(CITIES).forEach((city) => {
    CITIES[city].forEach((distance) => {
      rows.push({
        city,
        distance,
        teams: 0,
        participants: 0,
      });
    });
  });

  return rows;
}

function buildStats() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const rows = getEmptyStats();

  values.forEach((row) => {
    const city = String(row[1] || '').trim();
    const distance = normaliseDistance(row[2]);

    if (!CITIES[city] || !CITIES[city].includes(distance)) {
      return;
    }

    const statsRow = rows.find((item) => item.city === city && item.distance === distance);

    if (!statsRow) {
      return;
    }

    statsRow.teams += 1;
    statsRow.participants += countParticipants(row);
  });

  const totals = rows.reduce((result, row) => {
    result.teams += row.teams;
    result.participants += row.participants;
    return result;
  }, { teams: 0, participants: 0 });

  return {
    ok: true,
    rows,
    totals,
    updatedAt: new Date().toISOString(),
  };
}

function doGet() {
  return jsonResponse(buildStats());
}

function doPost(e) {
  const sheet = getSheet();
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.submittedAt || new Date().toISOString(),
    data.participationCity || '',
    data.distance || '',
    data.teamName || '',
    data.teamCity || '',
    data.captainName || '',
    data.captainEmail || '',
    data.captainPhone || '',
    data.participant1 || '',
    data.participant2 || '',
    data.participant3 || '',
    data.participant4 || '',
  ]);

  return jsonResponse({ ok: true });
}
