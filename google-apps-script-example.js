/**
 * Google Apps Script example for saving registrations to Google Sheets.
 *
 * Instructions:
 * 1. Create a Google Sheet.
 * 2. Go to Extensions -> Apps Script.
 * 3. Paste this code.
 * 4. Change SHEET_NAME if needed.
 * 5. Deploy -> New deployment -> Web app.
 * 6. Execute as: Me.
 * 7. Who has access: Anyone.
 * 8. Copy the Web App URL and add it in Vercel as REGISTRATION_ENDPOINT.
 */

const SHEET_NAME = 'Registrations';

function doPost(e) {
  const sheet = getOrCreateSheet_();
  const data = JSON.parse(e.postData.contents || '{}');

  ensureHeader_(sheet);

  sheet.appendRow([
    new Date(),
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
    data.dataConsent ? 'Yes' : 'No',
    data.accuracyConfirmation ? 'Yes' : 'No',
    data.submittedAt || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.appendRow([
    'Received at',
    'Participation city',
    'Distance',
    'Team name',
    'Team city / municipality',
    'Captain name',
    'Captain email',
    'Captain phone',
    'Participant 1',
    'Participant 2',
    'Participant 3',
    'Participant 4',
    'Data consent',
    'Accuracy confirmation',
    'Submitted at'
  ]);
}
