'use client';

import { FormEvent, useEffect, useState } from 'react';
import { cityDistances, participationCities, type ParticipationCity } from './content';

type MessageState = {
  type: 'success' | 'error' | 'info';
  text: string;
  editLink?: string;
  editCode?: string;
} | null;

type StatsRow = {
  city: ParticipationCity;
  distance: string;
  teams: number;
  participants: number;
};

type StatsResponse = {
  ok: boolean;
  demoMode?: boolean;
  message?: string;
  totals?: {
    teams: number;
    participants: number;
  };
  rows?: StatsRow[];
  updatedAt?: string;
};

const managePageUrl = 'https://pargajiensregistracija-khaki.vercel.app/labot';

const cityCrests: Record<ParticipationCity, string> = {
  Liepāja: '/crest-liepaja.png',
  Smiltene: '/crest-smiltene.png',
  Ilūkste: '/crest-ilukste.png',
};

function RegistrationStats({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/stats', { cache: 'no-store' });
        const data = (await response.json()) as StatsResponse;

        if (isMounted) {
          setStats(data);
        }
      } catch {
        if (isMounted) {
          setStats({ ok: false, message: 'Skaitītāju neizdevās ielādēt.' });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const rows = stats?.rows || [];
  const totals = stats?.totals || { teams: 0, participants: 0 };

  return (
    <section className="stats-block" aria-labelledby="stats-title">
      <div className="stats-header">
        <h2 id="stats-title">Reģistrējušies</h2>
        <div className="stats-totals" aria-label="Kopējais reģistrāciju skaits">
          <span>{totals.teams} komandas</span>
          <span>{totals.participants} dalībnieki</span>
        </div>
      </div>

      {isLoading && <p className="stats-note">Ielādē skaitītāju…</p>}

      {!isLoading && stats && !stats.ok && (
        <p className="stats-note">{stats.message || 'Skaitītāju neizdevās ielādēt.'}</p>
      )}

      {!isLoading && stats?.demoMode && (
        <p className="stats-note">Skaitītājs būs aktīvs pēc datu pieslēgšanas.</p>
      )}

      {!isLoading && stats?.ok && rows.length > 0 && (
        <div className="stats-grid">
          {participationCities.map((city) => (
            <div className="city-stats" key={city}>
              <div className="city-stats-title">
                <img src={cityCrests[city]} alt={`${city} ģerbonis`} />
                <h3>{city}</h3>
              </div>
              <div className="distance-list">
                {cityDistances[city].map((distance) => {
                  const row = rows.find((item) => item.city === city && item.distance === distance);

                  return (
                    <div className="distance-row" key={`${city}-${distance}`}>
                      <strong className="distance-badge">{distance}</strong>
                      <span><b>{row?.teams || 0}</b> komandas</span>
                      <span><b>{row?.participants || 0}</b> dalībnieki</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function normaliseParticipants(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

export default function Home() {
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCity, setSelectedCity] = useState<ParticipationCity | ''>('');
  const [additionalParticipants, setAdditionalParticipants] = useState<string[]>([]);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const availableDistances = selectedCity ? cityDistances[selectedCity] : [];

  function updateAdditionalParticipant(index: number, value: string) {
    setAdditionalParticipants((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  function addAdditionalParticipant() {
    setAdditionalParticipants((current) => [...current, '']);
  }

  function removeAdditionalParticipant(index: number) {
    setAdditionalParticipants((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const participants = normaliseParticipants(additionalParticipants);

    const payload = {
      participationCity: formData.get('participationCity'),
      distance: formData.get('distance'),
      teamName: formData.get('teamName'),
      teamCity: formData.get('teamCity'),
      captainName: formData.get('captainName'),
      captainEmail: formData.get('captainEmail'),
      captainPhone: formData.get('captainPhone'),
      participants,
      dataConsent: formData.get('dataConsent') === 'on',
    };

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setMessage({ type: 'error', text: result.message || 'Pieteikumu neizdevās nosūtīt.' });
        return;
      }

      setMessage({
        type: result.demoMode ? 'info' : 'success',
        text:
          result.message ||
          'Paldies! Pieteikums ir saņemts.\nDalības apstiprinājums, kā arī unikālais kods pieteikuma labošanai vai atsaukšanai ir nosūtīti uz kapteiņa e-pastu.\n\nPieteikšanās tiešsaistē un izmaiņu veikšana ir iespējama līdz 24. septembra plkst. 12.00. Ja izmaiņas rodas pēc šī termiņa — nebēdājiet, ikviens joprojām var droši pievienoties pārgājienam un reģistrēties uz vietas pasākuma dienā reģistrācijas punktā.',
        editLink: result.editLink || managePageUrl,
        editCode: result.editCode,
      });

      setStatsRefreshKey((currentKey) => currentKey + 1);

      if (!result.demoMode) {
        form.reset();
        setSelectedCity('');
        setAdditionalParticipants([]);
      }
    } catch {
      setMessage({ type: 'error', text: 'Pieteikumu neizdevās nosūtīt. Lūdzu, mēģiniet vēlreiz.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="form-card" aria-labelledby="registration-title">
        <div className="form-header">
          <img className="beactive-logo" src="/beactive-logo.png" alt="#BeActive Eiropas Sporta nedēļa" />
          <h1 id="registration-title">Pieteikšanās pārgājienam</h1>
        </div>

        <form className="registration-form" onSubmit={handleSubmit}>
          {message && (
            <div className={`form-message ${message.type}`}>
              <p>{message.text}</p>
            </div>
          )}

          <label>
            Pilsēta *
            <select
              name="participationCity"
              required
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value as ParticipationCity | '')}
            >
              <option value="">Izvēlieties pilsētu</option>
              {participationCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </label>

          <label>
            Distance *
            <select name="distance" required disabled={!selectedCity}>
              <option value="">Izvēlieties distanci</option>
              {availableDistances.map((distance) => (
                <option key={distance} value={distance}>{distance}</option>
              ))}
            </select>
          </label>

          <label>
            Komandas nosaukums *
            <input name="teamName" type="text" required />
          </label>

          <label>
            Komandas pilsēta / novads *
            <input name="teamCity" type="text" required />
          </label>

          <div className="members-block">
            <h2>Dalībnieki</h2>

            <label>
              Kapteinis *
              <input name="captainName" type="text" required />
            </label>

            <label>
              Kapteiņa e-pasta adrese *
              <input name="captainEmail" type="email" required />
            </label>

            <label>
              Kapteiņa tālruņa numurs *
              <input name="captainPhone" type="tel" required />
            </label>

            {additionalParticipants.map((participant, index) => (
              <div className="participant-field" key={`participant-${index}`}>
                <label>
                  Dalībnieks {index + 2}
                  <input
                    value={participant}
                    onChange={(event) => updateAdditionalParticipant(index, event.target.value)}
                    type="text"
                  />
                </label>
                <button
                  type="button"
                  className="remove-participant-button"
                  onClick={() => removeAdditionalParticipant(index)}
                  aria-label={`Dzēst dalībnieku ${index + 2}`}
                >
                  ×
                </button>
              </div>
            ))}

            <div className="add-participant-block">
              <span>Vai vēlaties pievienot vēl personas?</span>
              <button type="button" className="small-action-button" onClick={addAdditionalParticipant}>
                Jā
              </button>
            </div>
          </div>

          <label className="checkbox-label">
            <input type="checkbox" name="dataConsent" required />
            <span>Piekrītu, ka sniegtā informācija tiek izmantota pieteikuma apstrādei. *</span>
          </label>

          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Nosūta…' : 'Nosūtīt pieteikumu'}
          </button>

          <a className="manage-link" href="/labot">Labot vai atsaukt pieteikumu</a>
        </form>

        <RegistrationStats refreshKey={statsRefreshKey} />
      </section>
    </main>
  );
}
