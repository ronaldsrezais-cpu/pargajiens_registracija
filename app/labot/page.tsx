'use client';

import { FormEvent, useEffect, useState } from 'react';
import { cityDistances, participationCities, type ParticipationCity } from '../content';

type MessageState = {
  type: 'success' | 'error' | 'info';
  text: string;
} | null;

type RegistrationData = {
  editCode: string;
  status: string;
  participationCity: ParticipationCity | '';
  distance: string;
  teamName: string;
  teamCity: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  participants: string[];
  participant1?: string;
  participant2?: string;
  participant3?: string;
  participant4?: string;
};

function getParticipantsFromRegistration(registration: Partial<RegistrationData> | undefined) {
  if (!registration) return [];

  if (Array.isArray(registration.participants)) {
    return registration.participants.map((value) => String(value || '')).filter(Boolean);
  }

  return [registration.participant1, registration.participant2, registration.participant3, registration.participant4]
    .map((value) => String(value || ''))
    .filter(Boolean);
}

function emptyRegistration(editCode = ''): RegistrationData {
  return {
    editCode,
    status: 'Aktīvs',
    participationCity: '',
    distance: '',
    teamName: '',
    teamCity: '',
    captainName: '',
    captainEmail: '',
    captainPhone: '',
    participants: [],
  };
}

export default function ManageRegistrationPage() {
  const [editCode, setEditCode] = useState('');
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  async function lookupRegistration(code = editCode) {
    const cleanCode = code.trim();

    if (!cleanCode) {
      setMessage({ type: 'error', text: 'Lūdzu, ievadiet pieteikuma labošanas kodu.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lookup', editCode: cleanCode }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setRegistration(null);
        setMessage({ type: 'error', text: result.message || 'Pieteikumu neizdevās atrast.' });
        return;
      }

      const loadedRegistration = result.registration || emptyRegistration(cleanCode);
      setRegistration({
        ...emptyRegistration(cleanCode),
        ...loadedRegistration,
        participants: getParticipantsFromRegistration(loadedRegistration),
      });
      setEditCode(cleanCode);

      if (loadedRegistration?.status === 'Atsaukts') {
        setMessage({ type: 'info', text: 'Šis pieteikums ir atsaukts.' });
      } else {
        setMessage({ type: 'success', text: 'Pieteikums atrasts. Varat veikt izmaiņas.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Pieteikumu neizdevās ielādēt. Lūdzu, mēģiniet vēlreiz.' });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code') || '';

    if (codeFromUrl) {
      setEditCode(codeFromUrl);
      lookupRegistration(codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lookupRegistration();
  }

  function updateField(field: keyof RegistrationData, value: string) {
    if (!registration) return;

    setRegistration({
      ...registration,
      [field]: value,
      ...(field === 'participationCity' ? { distance: '' } : {}),
    });
  }

  function updateParticipant(index: number, value: string) {
    if (!registration) return;

    const participants = [...registration.participants];
    participants[index] = value;
    setRegistration({ ...registration, participants });
  }

  function addParticipant() {
    if (!registration) return;
    setRegistration({ ...registration, participants: [...registration.participants, ''] });
  }

  function removeParticipant(index: number) {
    if (!registration) return;
    setRegistration({
      ...registration,
      participants: registration.participants.filter((_, currentIndex) => currentIndex !== index),
    });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!registration) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...registration,
          participants: registration.participants.map((value) => value.trim()).filter(Boolean),
          action: 'update',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setMessage({ type: 'error', text: result.message || 'Izmaiņas neizdevās saglabāt.' });
        return;
      }

      const updatedRegistration = result.registration || registration;
      setRegistration({
        ...registration,
        ...updatedRegistration,
        participants: getParticipantsFromRegistration(updatedRegistration),
      });
      setMessage({ type: 'success', text: result.message || 'Izmaiņas saglabātas.' });
    } catch {
      setMessage({ type: 'error', text: 'Izmaiņas neizdevās saglabāt. Lūdzu, mēģiniet vēlreiz.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancel() {
    if (!registration) return;

    const confirmed = window.confirm('Vai tiešām vēlaties atsaukt šo pieteikumu?');
    if (!confirmed) return;

    setIsCancelling(true);
    setMessage(null);

    try {
      const response = await fetch('/api/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', editCode: registration.editCode }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setMessage({ type: 'error', text: result.message || 'Pieteikumu neizdevās atsaukt.' });
        return;
      }

      setRegistration(result.registration ? {
        ...registration,
        ...result.registration,
        participants: getParticipantsFromRegistration(result.registration),
      } : { ...registration, status: 'Atsaukts' });
      setMessage({ type: 'success', text: result.message || 'Pieteikums ir atsaukts.' });
    } catch {
      setMessage({ type: 'error', text: 'Pieteikumu neizdevās atsaukt. Lūdzu, mēģiniet vēlreiz.' });
    } finally {
      setIsCancelling(false);
    }
  }

  const selectedCity = registration?.participationCity || '';
  const availableDistances = selectedCity ? cityDistances[selectedCity] : [];
  const isCancelled = registration?.status === 'Atsaukts';

  return (
    <main className="page-shell">
      <section className="form-card" aria-labelledby="manage-title">
        <div className="form-header">
          <img className="beactive-logo" src="/beactive-logo.png" alt="#BeActive Eiropas Sporta nedēļa" />
          <h1 id="manage-title">Labot pieteikumu</h1>
        </div>

        <form className="registration-form" onSubmit={handleLookup}>
          {message && <div className={`form-message ${message.type}`}>{message.text}</div>}

          <label className="full-row">
            Pieteikuma labošanas kods *
            <span className="field-help">Pieteikuma labošanas kods ir pieejams norādītā kapteiņa e-pastā.</span>
            <input
              value={editCode}
              onChange={(event) => setEditCode(event.target.value)}
              type="text"
              required
              placeholder="Ievadiet kodu"
            />
          </label>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Ielādē…' : 'Ielādēt pieteikumu'}
          </button>

          <a className="manage-link" href="/">Atpakaļ uz pieteikšanos</a>
        </form>

        {registration && (
          <form className="registration-form edit-form" onSubmit={handleSave}>
            <div className={`form-message ${isCancelled ? 'info' : 'success'}`}>
              Statuss: {registration.status || 'Aktīvs'}
            </div>

            <label>
              Pilsēta *
              <select
                required
                value={registration.participationCity}
                onChange={(event) => updateField('participationCity', event.target.value)}
                disabled={isCancelled}
              >
                <option value="">Izvēlieties pilsētu</option>
                {participationCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>

            <label>
              Distance *
              <select
                required
                value={registration.distance}
                onChange={(event) => updateField('distance', event.target.value)}
                disabled={!selectedCity || isCancelled}
              >
                <option value="">Izvēlieties distanci</option>
                {availableDistances.map((distance) => (
                  <option key={distance} value={distance}>{distance}</option>
                ))}
              </select>
            </label>

            <label>
              Komandas nosaukums *
              <input value={registration.teamName} onChange={(event) => updateField('teamName', event.target.value)} type="text" required disabled={isCancelled} />
            </label>

            <label>
              Komandas pilsēta / novads *
              <input value={registration.teamCity} onChange={(event) => updateField('teamCity', event.target.value)} type="text" required disabled={isCancelled} />
            </label>

            <div className="members-block">
              <h2>Dalībnieki</h2>

              <label>
                Kapteinis *
                <input value={registration.captainName} onChange={(event) => updateField('captainName', event.target.value)} type="text" required disabled={isCancelled} />
              </label>

              <label>
                Kapteiņa e-pasta adrese *
                <input value={registration.captainEmail} onChange={(event) => updateField('captainEmail', event.target.value)} type="email" required disabled={isCancelled} />
              </label>

              <label>
                Kapteiņa tālruņa numurs *
                <input value={registration.captainPhone} onChange={(event) => updateField('captainPhone', event.target.value)} type="tel" required disabled={isCancelled} />
              </label>

              {registration.participants.map((participant, index) => (
                <div className="participant-field" key={`participant-${index}`}>
                  <label>
                    Dalībnieks {index + 2}
                    <input
                      value={participant}
                      onChange={(event) => updateParticipant(index, event.target.value)}
                      type="text"
                      disabled={isCancelled}
                    />
                  </label>
                  {!isCancelled && (
                    <button
                      type="button"
                      className="remove-participant-button"
                      onClick={() => removeParticipant(index)}
                      aria-label={`Dzēst dalībnieku ${index + 2}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {!isCancelled && (
                <div className="add-participant-block">
                  <span>Vai vēlaties pievienot vēl personas?</span>
                  <button type="button" className="small-action-button" onClick={addParticipant}>
                    Jā
                  </button>
                </div>
              )}
            </div>

            {!isCancelled && (
              <div className="button-row">
                <button type="submit" className="submit-button" disabled={isSaving}>
                  {isSaving ? 'Saglabā…' : 'Saglabāt izmaiņas'}
                </button>

                <button type="button" className="danger-button" onClick={handleCancel} disabled={isCancelling}>
                  {isCancelling ? 'Atsauc…' : 'Atsaukt pieteikumu'}
                </button>
              </div>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
