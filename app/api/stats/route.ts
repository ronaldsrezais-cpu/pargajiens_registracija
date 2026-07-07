import { NextResponse } from 'next/server';
import { cityDistances, participationCities, type ParticipationCity } from '../../content';

export const dynamic = 'force-dynamic';

type StatsRow = {
  city: ParticipationCity;
  distance: string;
  teams: number;
  participants: number;
};

type ExternalStatsResponse = {
  ok?: boolean;
  rows?: StatsRow[];
  totals?: {
    teams: number;
    participants: number;
  };
  updatedAt?: string;
  message?: string;
};

function createEmptyRows(): StatsRow[] {
  return participationCities.flatMap((city) =>
    cityDistances[city].map((distance) => ({
      city,
      distance,
      teams: 0,
      participants: 0,
    }))
  );
}

function addStatsAction(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}action=stats`;
}

function isValidStatsResponse(data: ExternalStatsResponse) {
  return Boolean(data && data.ok && Array.isArray(data.rows) && data.totals);
}

export async function GET() {
  try {
    const endpoint = process.env.STATS_ENDPOINT || process.env.REGISTRATION_ENDPOINT;

    if (!endpoint) {
      return NextResponse.json({
        ok: true,
        demoMode: true,
        message: 'Skaitītājs būs aktīvs pēc datu pieslēgšanas.',
        rows: createEmptyRows(),
        totals: { teams: 0, participants: 0 },
      });
    }

    const response = await fetch(addStatsAction(endpoint), {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: 'Skaitītāju neizdevās ielādēt.' },
        { status: 502 }
      );
    }

    const text = await response.text();
    const data = JSON.parse(text) as ExternalStatsResponse;

    if (!isValidStatsResponse(data)) {
      return NextResponse.json(
        { ok: false, message: 'Skaitītāja datu formāts nav derīgs.' },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Skaitītāju neizdevās ielādēt.' },
      { status: 500 }
    );
  }
}
