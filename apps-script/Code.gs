// Google Apps Script for the #BeActive hike registration form.
//
// What it does:
// - saves new registrations to Google Sheets;
// - supports unlimited additional participants;
// - creates a unique edit code for every registration;
// - emails the captain a link to edit or cancel the registration;
// - allows the website to update or cancel an existing registration;
// - returns public counter data to the website.
//
// Setup:
// 1. Replace SHEET_ID with your Google Sheet ID only, not the full Sheet URL.
// 2. Save the script.
// 3. Run authorizeScript() once and approve permissions.
// 4. Deploy as Web app: Execute as Me, Who has access Anyone.
// 5. Use the /exec URL in app/settings.ts on the website.

const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Registrations';
const SENDER_EMAIL = 'latvijassportafederacijupadome@gmail.com';
const SENDER_NAME = 'Latvijas Sporta federāciju padome';
const BEACTIVE_WEBSITE_URL = 'https://beactive.lv/';
const EDIT_DEADLINE_ISO = '2026-09-21T15:00:00+03:00';
const EDIT_DEADLINE_DISPLAY = '21.09.2026. plkst. 15.00';
const PUBLIC_EDIT_BASE_URL = 'https://beactive.lv/pargajiens/labot/';

const STATUSES = {
  ACTIVE: 'Aktīvs',
  CANCELLED: 'Atsaukts',
};

const CITIES = {
  'Liepāja': ['7 km', '17 km', '24 km'],
  'Smiltene': ['8 km – “ĶELMĒNI” distance', '18 km – “SMILTENES PIENS” distance', '28 km – “top!” distance', 'Krēslas posms - 8 km'],
  'Ilūkste': ['6 km', '14 km', '28 km', 'Krēslas posms - 1,5 km'],
};

const EVENT_DATES = {
  'Liepāja': '26. septembrī',
  'Smiltene': '26. septembrī',
  'Ilūkste': '27. septembrī',
};

const BASE_HEADERS = [
  'Pieteikuma kods',
  'Statuss',
  'Submitted at',
  'Updated at',
  'Pilsēta',
  'Distance',
  'Komandas nosaukums',
  'Komandas pilsēta / novads',
  'Kapteinis',
  'Kapteiņa e-pasts',
  'Kapteiņa tālrunis',
  'E-pasts nosūtīts',
  'E-pasts nosūtīts plkst.',
  'E-pasta kļūda',
  'Pēdējais e-pasta mēģinājums',
  'Foto/video apstiprinājums',
  'Drošības noteikumu apstiprinājums',
  'Datu izmantošanas apstiprinājums',
];

const INITIAL_PARTICIPANT_HEADERS = [
  'Dalībnieks 2',
  'Dalībnieks 3',
  'Dalībnieks 4',
  'Dalībnieks 5',
];

const HEADERS = BASE_HEADERS.concat(INITIAL_PARTICIPANT_HEADERS);

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

  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return;
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  let headersChanged = false;

  HEADERS.forEach((header) => {
    if (!currentHeaders.includes(header)) {
      currentHeaders.push(header);
      headersChanged = true;
    }
  });

  if (headersChanged) {
    sheet.getRange(1, 1, 1, currentHeaders.length).setValues([currentHeaders]);
  }

  sheet.setFrozenRows(1);
}

function ensureParticipantHeaders(sheet, participantCount) {
  const requiredAdditionalCount = Math.max(Number(participantCount || 0), INITIAL_PARTICIPANT_HEADERS.length);
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  let headersChanged = false;

  for (let index = 0; index < requiredAdditionalCount; index += 1) {
    const header = `Dalībnieks ${index + 2}`;
    if (!currentHeaders.includes(header)) {
      currentHeaders.push(header);
      headersChanged = true;
    }
  }

  if (headersChanged) {
    sheet.getRange(1, 1, 1, currentHeaders.length).setValues([currentHeaders]);
  }
}

function getHeaderMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};

  headers.forEach((header, index) => {
    const key = String(header || '').trim();
    if (key) {
      map[key] = index;
    }
  });

  return map;
}

function getParticipantHeaders(map) {
  return Object.keys(map)
    .filter((header) => /^Dalībnieks \d+$/.test(header))
    .sort((a, b) => Number(a.replace('Dalībnieks ', '')) - Number(b.replace('Dalībnieks ', '')));
}

function rowToObject(row, map) {
  const get = (header) => {
    const index = map[header];
    return typeof index === 'number' ? String(row[index] || '').trim() : '';
  };

  const participantHeaders = getParticipantHeaders(map);
  const participants = participantHeaders
    .map((header) => get(header))
    .filter((value) => value.length > 0);

  const object = {
    editCode: get('Pieteikuma kods'),
    status: get('Statuss') || STATUSES.ACTIVE,
    submittedAt: get('Submitted at'),
    updatedAt: get('Updated at'),
    participationCity: get('Pilsēta'),
    distance: normaliseDistance(get('Distance')),
    teamName: get('Komandas nosaukums'),
    teamCity: get('Komandas pilsēta / novads'),
    captainName: get('Kapteinis'),
    captainEmail: get('Kapteiņa e-pasts'),
    captainPhone: get('Kapteiņa tālrunis'),
    photoConsent: get('Foto/video apstiprinājums') === 'Jā',
    safetyConsent: get('Drošības noteikumu apstiprinājums') === 'Jā',
    dataConsent: get('Datu izmantošanas apstiprinājums') === 'Jā',
    participants,
  };

  // Backwards-compatible fields for older website builds.
  participants.forEach((participant, index) => {
    object[`participant${index + 1}`] = participant;
  });

  return object;
}

function buildRowFromObject(object, map) {
  const row = new Array(Object.keys(map).length).fill('');

  Object.keys(object).forEach((header) => {
    const index = map[header];
    if (typeof index === 'number') {
      row[index] = object[header];
    }
  });

  return row;
}

function setRowValues(sheet, rowNumber, valuesByHeader, map) {
  Object.keys(valuesByHeader).forEach((header) => {
    const index = map[header];
    if (typeof index === 'number') {
      sheet.getRange(rowNumber, index + 1).setValue(valuesByHeader[header]);
    }
  });
}

function getErrorMessage(error) {
  if (!error) return '';
  if (error && error.message) return String(error.message);
  return String(error);
}

function isValidEmailAddress(email) {
  const cleanEmail = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
}

function markEmailResult(sheet, rowNumber, result) {
  ensureHeaders(sheet);
  const map = getHeaderMap(sheet);
  const now = new Date().toISOString();

  setRowValues(sheet, rowNumber, {
    'E-pasts nosūtīts': result && result.ok ? 'Jā' : 'Nē',
    'E-pasts nosūtīts plkst.': result && result.ok ? now : '',
    'E-pasta kļūda': result && result.ok ? '' : getErrorMessage(result && result.error ? result.error : 'Nezināma e-pasta sūtīšanas kļūda'),
    'Pēdējais e-pasta mēģinājums': now,
  }, map);
}

function runEmailSendWithRetry(sendFunction) {
  try {
    sendFunction();
    return { ok: true, error: '' };
  } catch (firstError) {
    Utilities.sleep(800);

    try {
      sendFunction();
      return { ok: true, error: '' };
    } catch (secondError) {
      return {
        ok: false,
        error: getErrorMessage(secondError) || getErrorMessage(firstError),
      };
    }
  }
}

function getParticipantsFromData(data) {
  if (Array.isArray(data.participants)) {
    return data.participants.map((value) => String(value || '').trim()).filter(Boolean);
  }

  return [data.participant1, data.participant2, data.participant3, data.participant4]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function getParticipantValuesByHeader(participants, map) {
  const values = {};
  const participantHeaders = getParticipantHeaders(map);

  participantHeaders.forEach((header) => {
    values[header] = '';
  });

  participants.forEach((participant, index) => {
    values[`Dalībnieks ${index + 2}`] = participant;
  });

  return values;
}

function normaliseDistance(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return /km\b/i.test(text) ? text : `${text} km`;
}

function normaliseCode(value) {
  return String(value || '').trim();
}

function createEditCode() {
  return Utilities.getUuid();
}

function findRegistrationByCode(sheet, editCode) {
  const cleanCode = normaliseCode(editCode);
  const map = getHeaderMap(sheet);
  const codeIndex = map['Pieteikuma kods'];

  if (typeof codeIndex !== 'number' || !cleanCode) {
    return null;
  }

  const values = sheet.getDataRange().getValues();

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex];

    if (String(row[codeIndex] || '').trim() === cleanCode) {
      return {
        rowNumber: rowIndex + 1,
        row,
        map,
        registration: rowToObject(row, map),
      };
    }
  }

  return null;
}

function isValidCityAndDistance(city, distance) {
  const cleanCity = String(city || '').trim();
  const cleanDistance = normaliseDistance(distance);
  return Boolean(CITIES[cleanCity] && CITIES[cleanCity].includes(cleanDistance));
}

function countParticipants(registration) {
  const participants = Array.isArray(registration.participants) ? registration.participants : [];

  return [registration.captainName].concat(participants)
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
  const map = getHeaderMap(sheet);
  const rows = getEmptyStats();

  values.forEach((row, index) => {
    if (index === 0) return;

    const registration = rowToObject(row, map);

    if (registration.status === STATUSES.CANCELLED) {
      return;
    }

    if (!isValidCityAndDistance(registration.participationCity, registration.distance)) {
      return;
    }

    const statsRow = rows.find(
      (item) => item.city === registration.participationCity && item.distance === registration.distance
    );

    if (!statsRow) {
      return;
    }

    statsRow.teams += 1;
    statsRow.participants += countParticipants(registration);
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


function buildEditLink(baseUrl, editCode) {
  const cleanBaseUrl = String(baseUrl || '').trim();
  const cleanCode = encodeURIComponent(String(editCode || '').trim());

  if (!cleanBaseUrl || !cleanCode) {
    return '';
  }

  const separator = cleanBaseUrl.includes('?') ? '&' : '?';
  return `${cleanBaseUrl}${separator}code=${cleanCode}`;
}

function createRegistration(data) {
  const sheet = getSheet();
  const participants = getParticipantsFromData(data);
  ensureParticipantHeaders(sheet, participants.length);
  const map = getHeaderMap(sheet);
  const now = data.submittedAt || new Date().toISOString();
  const editCode = createEditCode();
  const editBaseUrl = String(data.editBaseUrl || '').trim();
  const publicEditBaseUrl = String(data.publicEditBaseUrl || PUBLIC_EDIT_BASE_URL || editBaseUrl).trim();
  const editLink = buildEditLink(publicEditBaseUrl, editCode);

  if (!isValidCityAndDistance(data.participationCity, data.distance)) {
    return jsonResponse({ ok: false, message: 'Pilsēta vai distance nav derīga.' });
  }

  if (!data.photoConsent || !data.safetyConsent || !data.dataConsent) {
    return jsonResponse({ ok: false, message: 'Lūdzu, apstipriniet visus obligātos nosacījumus.' });
  }

  const row = buildRowFromObject(Object.assign({
    'Pieteikuma kods': editCode,
    'Statuss': STATUSES.ACTIVE,
    'Submitted at': now,
    'Updated at': now,
    'Pilsēta': data.participationCity || '',
    'Distance': normaliseDistance(data.distance),
    'Komandas nosaukums': data.teamName || '',
    'Komandas pilsēta / novads': data.teamCity || '',
    'Kapteinis': data.captainName || '',
    'Kapteiņa e-pasts': data.captainEmail || '',
    'Kapteiņa tālrunis': data.captainPhone || '',
    'Foto/video apstiprinājums': data.photoConsent ? 'Jā' : '',
    'Drošības noteikumu apstiprinājums': data.safetyConsent ? 'Jā' : '',
    'Datu izmantošanas apstiprinājums': data.dataConsent ? 'Jā' : '',
  }, getParticipantValuesByHeader(participants, map)), map);

  sheet.appendRow(row);
  const rowNumber = sheet.getLastRow();

  const emailResult = sendCreateEmail(Object.assign({}, data, { participants }), editCode, editLink);
  markEmailResult(sheet, rowNumber, emailResult);

  return jsonResponse({
    ok: true,
    editCode,
    editLink,
    emailSent: Boolean(emailResult && emailResult.ok),
    emailError: emailResult && emailResult.error ? String(emailResult.error) : '',
  });
}

function lookupRegistration(data) {
  const sheet = getSheet();
  const found = findRegistrationByCode(sheet, data.editCode);

  if (!found) {
    return jsonResponse({ ok: false, message: 'Pieteikums ar šādu kodu nav atrasts.' });
  }

  return jsonResponse({
    ok: true,
    registration: found.registration,
  });
}

function isEditDeadlinePassed() {
  return new Date().getTime() >= new Date(EDIT_DEADLINE_ISO).getTime();
}

function updateRegistration(data) {
  const sheet = getSheet();
  const found = findRegistrationByCode(sheet, data.editCode);

  if (!found) {
    return jsonResponse({ ok: false, message: 'Pieteikums ar šādu kodu nav atrasts.' });
  }

  if (found.registration.status === STATUSES.CANCELLED) {
    return jsonResponse({ ok: false, message: 'Atsauktu pieteikumu vairs nevar labot.' });
  }

  if (isEditDeadlinePassed()) {
    return jsonResponse({ ok: false, message: `Labojumu veikšana ir slēgta. Labojumi un personalizētie numuri bija iespējami līdz ${EDIT_DEADLINE_DISPLAY}.` });
  }

  if (!isValidCityAndDistance(data.participationCity, data.distance)) {
    return jsonResponse({ ok: false, message: 'Pilsēta vai distance nav derīga.' });
  }

  if (!data.photoConsent || !data.safetyConsent || !data.dataConsent) {
    return jsonResponse({ ok: false, message: 'Lūdzu, apstipriniet visus obligātos nosacījumus.' });
  }

  const participants = getParticipantsFromData(data);
  ensureParticipantHeaders(sheet, participants.length);
  const map = getHeaderMap(sheet);
  const now = data.updatedAt || new Date().toISOString();

  setRowValues(sheet, found.rowNumber, Object.assign({
    'Updated at': now,
    'Pilsēta': data.participationCity || '',
    'Distance': normaliseDistance(data.distance),
    'Komandas nosaukums': data.teamName || '',
    'Komandas pilsēta / novads': data.teamCity || '',
    'Kapteinis': data.captainName || '',
    'Kapteiņa e-pasts': data.captainEmail || '',
    'Kapteiņa tālrunis': data.captainPhone || '',
    'Foto/video apstiprinājums': data.photoConsent ? 'Jā' : '',
    'Drošības noteikumu apstiprinājums': data.safetyConsent ? 'Jā' : '',
    'Datu izmantošanas apstiprinājums': data.dataConsent ? 'Jā' : '',
  }, getParticipantValuesByHeader(participants, map)), map);

  const updated = findRegistrationByCode(sheet, data.editCode);

  if (updated) {
    sendUpdateEmail(updated.registration, data.editBaseUrl || '');
  }

  return jsonResponse({
    ok: true,
    message: 'Izmaiņas saglabātas.',
    registration: updated ? updated.registration : null,
  });
}

function cancelRegistration(data) {
  const sheet = getSheet();
  const found = findRegistrationByCode(sheet, data.editCode);

  if (!found) {
    return jsonResponse({ ok: false, message: 'Pieteikums ar šādu kodu nav atrasts.' });
  }

  if (found.registration.status === STATUSES.CANCELLED) {
    return jsonResponse({
      ok: true,
      message: 'Pieteikums jau ir atsaukts.',
      registration: found.registration,
    });
  }

  const now = data.updatedAt || new Date().toISOString();
  const map = getHeaderMap(sheet);

  setRowValues(sheet, found.rowNumber, {
    'Statuss': STATUSES.CANCELLED,
    'Updated at': now,
  }, map);

  const updated = findRegistrationByCode(sheet, data.editCode);

  if (updated) {
    sendCancelEmail(updated.registration, data.editBaseUrl || '');
  }

  return jsonResponse({
    ok: true,
    message: 'Pieteikums ir atsaukts.',
    registration: updated ? updated.registration : null,
  });
}

function getCityLocative(city) {
  const locatives = {
    'Liepāja': 'Liepājā',
    'Smiltene': 'Smiltenē',
    'Ilūkste': 'Ilūkstē',
  };

  return locatives[String(city || '').trim()] || String(city || '').trim();
}

function getEventDate(city) {
  return EVENT_DATES[String(city || '').trim()] || '27. septembrī';
}

function getSiteBaseUrl(editBaseUrl) {
  const cleanUrl = String(editBaseUrl || '').trim();
  if (!cleanUrl) return '';
  return cleanUrl.replace(/\/labot\/?$/, '');
}

function getLogoFooterHtml(editBaseUrl) {
  const siteBaseUrl = getSiteBaseUrl(editBaseUrl);
  const beactiveLogo = siteBaseUrl ? `${siteBaseUrl}/beactive-logo.png` : '';
  const lsfpLogo = siteBaseUrl ? `${siteBaseUrl}/lsfp-logo.png` : '';

  return `
    <div style="margin-top: 26px; padding-top: 18px; border-top: 1px solid #dddddd;">
      <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.5;">Pārējos Eiropas Sporta nedēļas pasākumus meklē mājaslapā – <a href="${BEACTIVE_WEBSITE_URL}">beactive.lv</a></p>
      ${siteBaseUrl ? `
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 12px;">
          <tr>
            <td style="padding: 0 18px 0 0; vertical-align: middle; width: 150px;">
              <img src="${beactiveLogo}" alt="#BeActive Eiropas Sporta nedēļa" width="150" style="display: block; width: 150px; max-width: 150px; height: auto; border: 0;">
            </td>
            <td style="padding: 0; vertical-align: middle; width: 150px;">
              <img src="${lsfpLogo}" alt="Latvijas Sporta federāciju padome" width="150" style="display: block; width: 150px; max-width: 150px; height: auto; border: 0;">
            </td>
          </tr>
        </table>
      ` : ''}
    </div>
  `;
}

function getClosingPlain(city) {
  return [
    '',
    `Tiekamies ${getCityLocative(city)} ${getEventDate(city)}!`,
    '',
    'Tavs sportisko pasākumu draugs – Latvijas Sporta federāciju padome!',
    '',
    'Pārējos Eiropas Sporta nedēļas pasākumus meklē mājaslapā – beactive.lv',
  ].join('\n');
}

function getClosingHtml(city, editBaseUrl) {
  return `
    <p style="margin-top: 22px;"><strong>Tiekamies ${escapeHtml(getCityLocative(city))} ${escapeHtml(getEventDate(city))}!</strong></p>
    <p>Tavs sportisko pasākumu draugs – Latvijas Sporta federāciju padome!</p>
    ${getLogoFooterHtml(editBaseUrl)}
  `;
}

function sendEmailMessage(options) {
  const to = String(options.to || '').trim();

  if (!isValidEmailAddress(to)) {
    return {
      ok: false,
      error: `Nederīga kapteiņa e-pasta adrese: ${to || 'nav norādīta'}`,
    };
  }

  const emailOptions = {
    htmlBody: options.htmlBody,
    name: SENDER_NAME,
    replyTo: SENDER_EMAIL,
  };

  try {
    const aliases = GmailApp.getAliases();
    const aliasEmails = aliases.map(String).map((value) => value.trim().toLowerCase());
    const effectiveUserEmail = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
    const senderEmail = String(SENDER_EMAIL || '').trim().toLowerCase();

    Logger.log('Remaining daily mail quota: ' + MailApp.getRemainingDailyQuota());
    Logger.log('Effective user email: ' + effectiveUserEmail);
    Logger.log('Configured sender email: ' + senderEmail);
    Logger.log('Available Gmail aliases: ' + JSON.stringify(aliases));

    if (aliasEmails.includes(senderEmail)) {
      return runEmailSendWithRetry(function() {
        GmailApp.sendEmail(
          to,
          options.subject,
          options.body,
          Object.assign({}, emailOptions, {
            from: SENDER_EMAIL,
          })
        );
      });
    }

    if (effectiveUserEmail === senderEmail) {
      return runEmailSendWithRetry(function() {
        GmailApp.sendEmail(to, options.subject, options.body, emailOptions);
      });
    }

    return {
      ok: false,
      error: 'Sūtītāja adrese nav pieejama šim Apps Script kontam. Pārbaudiet Send mail as / alias vai deployment kontu.',
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}

function getDeadlinePlain() {
  return `Līdz ${EDIT_DEADLINE_DISPLAY} iespējams veikt pieteikuma labojumus un pieteikt dalībniekus, lai pasākuma dienā būtu sagatavoti personalizēti dalībnieku numuri. Pieteikšanās būs iespējama arī pēc šī termiņa, taču dalībnieki numurzīmes varēs personalizēt paši pasākuma norises vietā.`;
}

function getDeadlineHtml() {
  return `<p>Līdz <strong>${EDIT_DEADLINE_DISPLAY}</strong> iespējams veikt pieteikuma labojumus un pieteikt dalībniekus, lai pasākuma dienā būtu sagatavoti personalizēti dalībnieku numuri. Pieteikšanās būs iespējama arī pēc šī termiņa, taču dalībnieki numurzīmes varēs personalizēt paši pasākuma norises vietā.</p>`;
}

function sendCreateEmail(data, editCode, editLink) {
  try {
    const email = String(data.captainEmail || '').trim();

    if (!email) {
      return { ok: false, error: 'Nav norādīts kapteiņa e-pasts.' };
    }

    const subject = 'Apstiprinājums dalībai BeActive Pārgājienā 2026';
    const plainBody = [
      'Jūsu komanda ir apstiprināta dalībai BeActive Pārgājienā 2026!',
      '',
      `Komanda: ${data.teamName || ''}`,
      `Pilsēta: ${data.participationCity || ''}`,
      `Distance: ${normaliseDistance(data.distance)}`,
      '',
      'Komandu kapteiņi pirms došanās distancē saņems gan distances karti drukātā formātā, gan GPX formātā. GPX fails tiks nosūtīts uz e-pastu pārgājiena nedēļas piektdienā.',
      '',
      getDeadlinePlain(),
      '',
      `Pieteikuma labošanas kods: ${editCode}`,
      editLink ? 'Labot vai atsaukt pieteikumu: izmantojiet e-pastā esošo saiti.' : '',
      getClosingPlain(data.participationCity),
    ].filter(Boolean).join('\n');

    const htmlBody = `
      <p>Jūsu komanda ir apstiprināta dalībai BeActive Pārgājienā 2026!</p>
      <p><strong>Komanda:</strong> ${escapeHtml(data.teamName || '')}<br>
      <strong>Pilsēta:</strong> ${escapeHtml(data.participationCity || '')}<br>
      <strong>Distance:</strong> ${escapeHtml(normaliseDistance(data.distance))}</p>
      <p>Komandu kapteiņi pirms došanās distancē saņems gan distances karti drukātā formātā, gan GPX formātā. GPX fails tiks nosūtīts uz e-pastu pārgājiena nedēļas piektdienā.</p>
      ${getDeadlineHtml()}
      <p><strong>Pieteikuma labošanas kods:</strong> ${escapeHtml(editCode)}</p>
      ${editLink ? `<p><a href="${escapeHtml(editLink)}">Labot vai atsaukt pieteikumu</a></p>` : '<p>Atveriet mājaslapas sadaļu /labot un ievadiet pieteikuma labošanas kodu.</p>'}
      ${getClosingHtml(data.participationCity, data.editBaseUrl || '')}
    `;

    return sendEmailMessage({
      to: email,
      subject,
      body: plainBody,
      htmlBody,
    });
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

function sendUpdateEmail(registration, editBaseUrl) {
  try {
    const email = String(registration.captainEmail || '').trim();
    if (!email) return { ok: false, error: 'Nav norādīts kapteiņa e-pasts.' };

    const subject = 'Pārgājiena pieteikums ir atjaunināts';
    const plainBody = [
      'Jūsu pārgājiena pieteikuma izmaiņas ir saglabātas.',
      '',
      `Komanda: ${registration.teamName}`,
      `Pilsēta: ${registration.participationCity}`,
      `Distance: ${registration.distance}`,
      getClosingPlain(registration.participationCity),
    ].join('\n');

    const htmlBody = `
      <p>Jūsu pārgājiena pieteikuma izmaiņas ir saglabātas.</p>
      <p><strong>Komanda:</strong> ${escapeHtml(registration.teamName)}<br>
      <strong>Pilsēta:</strong> ${escapeHtml(registration.participationCity)}<br>
      <strong>Distance:</strong> ${escapeHtml(registration.distance)}</p>
      ${getClosingHtml(registration.participationCity, editBaseUrl)}
    `;

    return sendEmailMessage({
      to: email,
      subject,
      body: plainBody,
      htmlBody,
    });
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

function sendCancelEmail(registration, editBaseUrl) {
  try {
    const email = String(registration.captainEmail || '').trim();
    if (!email) return { ok: false, error: 'Nav norādīts kapteiņa e-pasts.' };

    const subject = 'Pārgājiena pieteikums ir atsaukts';
    const plainBody = [
      'Jūsu pārgājiena pieteikums ir atsaukts.',
      '',
      `Komanda: ${registration.teamName}`,
      `Pilsēta: ${registration.participationCity}`,
      `Distance: ${registration.distance}`,
      '',
      'Pārējos Eiropas Sporta nedēļas pasākumus meklē mājaslapā – beactive.lv',
    ].join('\n');

    const htmlBody = `
      <p>Jūsu pārgājiena pieteikums ir atsaukts.</p>
      <p><strong>Komanda:</strong> ${escapeHtml(registration.teamName)}<br>
      <strong>Pilsēta:</strong> ${escapeHtml(registration.participationCity)}<br>
      <strong>Distance:</strong> ${escapeHtml(registration.distance)}</p>
      ${getLogoFooterHtml(editBaseUrl)}
    `;

    return sendEmailMessage({
      to: email,
      subject,
      body: plainBody,
      htmlBody,
    });
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}


function resendConfirmationEmailForRow(rowNumber) {
  const numericRow = Number(rowNumber);

  if (!numericRow || numericRow < 2) {
    Logger.log('Norādiet Google Sheet rindas numuru, sākot no 2. rindas.');
    return;
  }

  const sheet = getSheet();
  const map = getHeaderMap(sheet);
  const row = sheet.getRange(numericRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  const registration = rowToObject(row, map);

  if (!registration.editCode) {
    Logger.log('Rinda ' + numericRow + ': nav pieteikuma labošanas koda.');
    return;
  }

  if (registration.status === STATUSES.CANCELLED) {
    Logger.log('Rinda ' + numericRow + ': pieteikums ir atsaukts.');
    return;
  }

  const editLink = buildEditLink(PUBLIC_EDIT_BASE_URL, registration.editCode);
  const result = sendCreateEmail({
    teamName: registration.teamName,
    participationCity: registration.participationCity,
    distance: registration.distance,
    captainEmail: registration.captainEmail,
    editBaseUrl: PUBLIC_EDIT_BASE_URL,
    participants: registration.participants || [],
  }, registration.editCode, editLink);

  markEmailResult(sheet, numericRow, result);
  Logger.log('Rinda ' + numericRow + ': ' + registration.captainEmail + ' — ' + (result.ok ? 'nosūtīts' : 'neizdevās: ' + result.error));
}

function resendFailedConfirmationEmails() {
  const sheet = getSheet();
  const map = getHeaderMap(sheet);
  const values = sheet.getDataRange().getValues();
  const statusIndex = map['E-pasts nosūtīts'];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const rowNumber = rowIndex + 1;
    const row = values[rowIndex];
    const registration = rowToObject(row, map);
    const emailStatus = typeof statusIndex === 'number' ? String(row[statusIndex] || '').trim() : '';

    if (registration.status === STATUSES.CANCELLED || emailStatus === 'Jā') {
      skipped += 1;
      continue;
    }

    if (!registration.editCode || !registration.captainEmail) {
      markEmailResult(sheet, rowNumber, { ok: false, error: 'Trūkst pieteikuma koda vai kapteiņa e-pasta.' });
      failed += 1;
      continue;
    }

    const editLink = buildEditLink(PUBLIC_EDIT_BASE_URL, registration.editCode);
    const result = sendCreateEmail({
      teamName: registration.teamName,
      participationCity: registration.participationCity,
      distance: registration.distance,
      captainEmail: registration.captainEmail,
      editBaseUrl: PUBLIC_EDIT_BASE_URL,
      participants: registration.participants || [],
    }, registration.editCode, editLink);

    markEmailResult(sheet, rowNumber, result);

    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      Logger.log('Rinda ' + rowNumber + ' neizdevās: ' + result.error);
    }
  }

  Logger.log('Atkārtota sūtīšana pabeigta. Nosūtīti: ' + sent + ', neizdevās: ' + failed + ', izlaisti: ' + skipped + '.');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function doGet() {
  return jsonResponse(buildStats());
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const action = String(data.action || 'create').trim();

    if (action === 'lookup') {
      return lookupRegistration(data);
    }

    if (action === 'update') {
      return updateRegistration(data);
    }

    if (action === 'cancel') {
      return cancelRegistration(data);
    }

    return createRegistration(data);
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: String(error),
    });
  }
}

function setupSheet() {
  const sheet = getSheet();
  ensureHeaders(sheet);
}

function authorizeScript() {
  getSheet();
  MailApp.getRemainingDailyQuota();
  GmailApp.getAliases();
}

function checkEmailSetup() {
  Logger.log('Effective user email: ' + Session.getEffectiveUser().getEmail());
  Logger.log('Configured sender email: ' + SENDER_EMAIL);
  Logger.log('Available Gmail aliases: ' + JSON.stringify(GmailApp.getAliases()));
  Logger.log('Remaining daily mail quota: ' + MailApp.getRemainingDailyQuota());
}
