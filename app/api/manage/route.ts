import { NextResponse } from 'next/server';
import { cityDistances, type ParticipationCity } from '../../content';
import { GOOGLE_APPS_SCRIPT_URL } from '../../settings';

export const dynamic = 'force-dynamic';

type ManagePayload = {
  action?: 'lookup' | 'update' | 'cancel';
  editCode?: string;
  participationCity?: string;
  distance?: string;
  teamName?: string;
  teamCity?: string;
  captainName?: string;
  captainEmail?: string;
  captainPhone?: string;
  participant1?: string;
  participant2?: string;
  participant3?: string;
  participant4?: string;
};

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

function validateUpdate(body: ManagePayload) {
  if (!isParticipationCity(body.participationCity)) {
    return 'Lūdzu, izvēlieties derīgu pilsētu.';
  }

  if (!cityDistances[body.participationCity].includes(String(body.distance))) {
    return 'Lūdzu, izvēlieties derīgu distanci izvēlētajai pilsētai.';
  }

  const requiredFields: Array<keyof ManagePayload> = [
    'teamName',
    'teamCity',
    'captainName',
    'captainEmail',
    'captainPhone',
  ];

  const missingField = requiredFields.find((field) => !body[field]);
  if (missingField) {
    return 'Lūdzu, aizpildiet visus obligātos laukus.';
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ManagePayload;
    const endpoint = getEndpoint();

    if (!endpoint) {
      return NextResponse.json(
        { ok: false, message: 'Nav pieslēgts Google Apps Script URL.' },
        { status: 500 }
      );
    }

    if (!body.editCode || String(body.editCode).trim().length < 12) {
      return NextResponse.json(
        { ok: false, message: 'Lūdzu, ievadiet derīgu pieteikuma labošanas kodu.' },
        { status: 400 }
      );
    }

    if (body.action === 'update') {
      const validationError = validateUpdate(body);
      if (validationError) {
        return NextResponse.json({ ok: false, message: validationError }, { status: 400 });
      }
    }

    if (!body.action || !['lookup', 'update', 'cancel'].includes(body.action)) {
      return NextResponse.json(
        { ok: false, message: 'Darbība nav derīga.' },
        { status: 400 }
      );
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, updatedAt: new Date().toISOString(), editBaseUrl: getEditBaseUrl(request) }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: 'Pieteikumu neizdevās apstrādāt. Lūdzu, mēģiniet vēlāk.' },
        { status: 502 }
      );
    }

    const result = await response.json();

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message || 'Pieteikumu neizdevās apstrādāt.' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Radās kļūda. Lūdzu, mēģiniet vēlreiz.' },
      { status: 500 }
    );
  }
}
