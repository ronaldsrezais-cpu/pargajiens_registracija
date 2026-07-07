// Google Apps Script example for saving website form submissions to Google Sheets.
// 1. Create a Google Sheet.
// 2. Open Extensions -> Apps Script.
// 3. Paste this code.
// 4. Replace SHEET_ID with your spreadsheet ID.
// 5. Deploy as Web app and use the Web app URL as REGISTRATION_ENDPOINT in Vercel.

const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Registrations';

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
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

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
