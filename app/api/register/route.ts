import { NextResponse } from 'next/server';
import { cityDistances, deadlineMessage, registrationClosedMessage, registrationCloseIso, type ParticipationCity } from '../../content';
import { GOOGLE_APPS_SCRIPT_URL } from '../../settings';

type RegistrationPayload = {
  participationCity?: string;
  distance?: string;
  teamName?: string;
  teamCity?: string;
  captainName?: string;
  captainEmail?: string;
  captainPhone?: string;
  participants?: string[];
  participant1?: string;
  participant2?: string;
  participant3?: string;
  participant4?: string;
  photoConsent?: boolean;
  safetyConsent?: boolean;
  dataConsent?: boolean;
};

type AppsScriptResponse = {
  ok?: boolean;
  message?: string;
  editCode?: string;
  editLink?: string;
  emailSent?: boolean | null;
  afterDeadline?: boolean;
  emailNotRequired?: boolean;
};

const PUBLIC_EDIT_BASE_URL = 'https://beactive.lv/pargajiens/labot/';

const requiredFields: Array<keyof RegistrationPayload> = [
  'participationCity',
  'distance',
  'teamName',
  'teamCity',
  'captainName',
  'captainEmail',
  'captainPhone',
];

function isParticipationCity(value: string | undefined): value is ParticipationCity {
  return Boolean(value && Object.keys(cityDistances).includes(value));
}

function getEndpoint() {
  return GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL !== 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'
    ? GOOGLE_APPS_SCRIPT_URL
    : process.env.REGISTRATION_ENDPOINT;
}

function getEditBaseUrl(request: Request) {
  const origin = request.headers.get('origin') || new URL(request.url).origin;
  return `${origin}/labot`;
}

function isRegistrationClosed() {
  return Date.now() >= new Date(registrationCloseIso).getTime();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistrationPayload;

    if (isRegistrationClosed()) {
      return NextResponse.json(
        { ok: false, message: registrationClosedMessage },
        { status: 403 }
      );
    }

    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { ok: false, message: 'Lūdzu, aizpildiet visus obligātos laukus.', missingFields },
        { status: 400 }
      );
    }

    if (!isParticipationCity(body.participationCity)) {
      return NextResponse.json(
        { ok: false, message: 'Lūdzu, izvēlieties derīgu pilsētu.' },
        { status: 400 }
      );
    }

    if (!cityDistances[body.participationCity].includes(String(body.distance))) {
      return NextResponse.json(
        { ok: false, message: 'Lūdzu, izvēlieties derīgu distanci izvēlētajai pilsētai.' },
        { status: 400 }
      );
    }

    if (!body.photoConsent || !body.safetyConsent || !body.dataConsent) {
      return NextResponse.json(
        { ok: false, message: 'Lūdzu, apstipriniet visus obligātos nosacījumus.' },
        { status: 400 }
      );
    }

    const endpoint = getEndpoint();

    if (!endpoint) {
      return NextResponse.json({
        ok: true,
        demoMode: true,
        message: 'Pieteikums saņemts testa režīmā. Lai saglabātu pieteikumus, app/settings.ts jāievieto Google Apps Script Web App URL.',
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        action: 'create',
        submittedAt: new Date().toISOString(),
        editBaseUrl: getEditBaseUrl(request),
        publicEditBaseUrl: PUBLIC_EDIT_BASE_URL,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: 'Pieteikumu neizdevās saglabāt. Lūdzu, mēģiniet vēlāk.' },
        { status: 502 }
      );
    }

    const result = (await response.json()) as AppsScriptResponse;

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message || 'Pieteikumu neizdevās saglabāt. Lūdzu, mēģiniet vēlāk.' },
        { status: 502 }
      );
    }

    // Pēc 21.09.2026. plkst. 15.00 Latvijas laika Apps Script
    // vairs nesūta apstiprinājuma e-pastu un neatgriež labošanas kodu/saite.
    if (result.afterDeadline) {
      return NextResponse.json({
        ok: true,
        afterDeadline: true,
        message:
          'Paldies! Dalība apstiprināta!\n\n' +
          'Reģistrācija joprojām ir iespējama, taču personalizēto dalībnieku numuru sagatavošanas termiņš ir beidzies. ' +
          'Numurzīmi būs iespējams personalizēt pasākuma norises vietā.\n\n' +
          'Komandu kapteiņi pirms došanās distancē saņems gan distances karti drukātā formātā, gan GPX formātā. ' +
          'GPX fails tiks nosūtīts uz e-pastu pārgājiena nedēļas piektdienā.',
      });
    }

    const deadlineNote = deadlineMessage;

    const emailNote = result.emailSent === false
      ? 'Kapteiņa norādītajā e-pastā dalības apstiprinājums, kā arī unikālais kods pieteikuma labošanai vai atsaukšanai tiks nosūtīts 24 stundu laikā.'
      : 'Kapteiņa norādītajā e-pastā saņemsiet dalības apstiprinājumu, kā arī unikālo kodu pieteikuma labošanai vai atsaukšanai.';

    return NextResponse.json({
      ok: true,
      message: `Paldies! Dalība apstiprināta!\n${emailNote}\n\n${deadlineNote}`,
      editCode: result.editCode,
      editLink: result.editLink,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Radās kļūda. Lūdzu, pārbaudiet formu un mēģiniet vēlreiz.' },
      { status: 500 }
    );
  }
}
