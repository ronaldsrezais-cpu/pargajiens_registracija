import { NextResponse } from 'next/server';

type RegistrationPayload = {
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
  dataConsent?: boolean;
  accuracyConfirmation?: boolean;
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistrationPayload;

    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { ok: false, message: 'Please complete all required fields.', missingFields },
        { status: 400 }
      );
    }

    if (!body.dataConsent || !body.accuracyConfirmation) {
      return NextResponse.json(
        { ok: false, message: 'Please confirm consent and information accuracy.' },
        { status: 400 }
      );
    }

    const endpoint = process.env.REGISTRATION_ENDPOINT;

    if (!endpoint) {
      return NextResponse.json({
        ok: true,
        demoMode: true,
        message:
          'Registration received in demo mode. Add REGISTRATION_ENDPOINT in Vercel environment variables to store submissions.',
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, submittedAt: new Date().toISOString() }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: 'The registration could not be saved. Please try again later.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: 'Thank you! Your team registration has been submitted.' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: 'Something went wrong. Please check the form and try again.' },
      { status: 500 }
    );
  }
}
