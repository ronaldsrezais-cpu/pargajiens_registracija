import { NextResponse } from 'next/server';
import { cityDistances, type ParticipationCity } from '../../content';
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
  dataConsent?: boolean;
};

type AppsScriptResponse = {
  ok?: boolean;
  message?: string;
  editCode?: string;
  editLink?: string;
  emailSent?: boolean;
};

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistrationPayload;

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

    if (!body.dataConsent) {
      return NextResponse.json(
        { ok: false, message: 'Lūdzu, apstipriniet datu izmantošanu pieteikuma apstrādei.' },
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

    const deadlineNote = 'Pieteikšanās tiešsaistē un izmaiņu veikšana ir iespējama līdz 24. septembra plkst. 12.00. Ja izmaiņas rodas pēc šī termiņa — nebēdājiet, ikviens joprojām var droši pievienoties pārgājienam un reģistrēties uz vietas pasākuma dienā reģistrācijas punktā.';
    const emailNote = result.emailSent === false
      ? 'Pieteikums ir saglabāts, bet apstiprinājuma e-pastu neizdevās nosūtīt. Ja nepieciešams, sazinieties ar organizatoriem.'
      : 'Dalības apstiprinājums, kā arī unikālais kods pieteikuma labošanai vai atsaukšanai ir nosūtīti uz kapteiņa e-pastu.';

    return NextResponse.json({
      ok: true,
      message: `Paldies! Pieteikums ir saņemts.
${emailNote}

${deadlineNote}`,
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
