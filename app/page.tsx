'use client';

import { FormEvent, useState } from 'react';
import { cityDistances, participationCities, type ParticipationCity } from './content';

type MessageState = {
  type: 'success' | 'error' | 'info';
  text: string;
} | null;

const memberFields = ['participant1', 'participant2', 'participant3', 'participant4'];

export default function Home() {
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCity, setSelectedCity] = useState<ParticipationCity | ''>('');

  const availableDistances = selectedCity ? cityDistances[selectedCity] : [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      participationCity: formData.get('participationCity'),
      distance: formData.get('distance'),
      teamName: formData.get('teamName'),
      teamCity: formData.get('teamCity'),
      captainName: formData.get('captainName'),
      captainEmail: formData.get('captainEmail'),
      captainPhone: formData.get('captainPhone'),
      participant1: formData.get('participant1'),
      participant2: formData.get('participant2'),
      participant3: formData.get('participant3'),
      participant4: formData.get('participant4'),
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
        text: result.message || 'Paldies! Pieteikums ir saņemts.',
      });

      if (!result.demoMode) {
        form.reset();
        setSelectedCity('');
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
          <div className="brand-line">
            <span>#BeActive</span>
            <small>pārgājiens</small>
          </div>
          <h1 id="registration-title">Pieteikšanās pārgājienam</h1>
        </div>

        <form className="registration-form" onSubmit={handleSubmit}>
          {message && <div className={`form-message ${message.type}`}>{message.text}</div>}

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

          <label>
            Komandas kapteiņa vārds, uzvārds *
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

          <div className="members-block">
            <h2>Papildu dalībnieki</h2>
            {memberFields.map((field, index) => (
              <label key={field}>
                Dalībnieks {index + 1}
                <input name={field} type="text" />
              </label>
            ))}
          </div>

          <label className="checkbox-label">
            <input type="checkbox" name="dataConsent" required />
            <span>Piekrītu, ka sniegtā informācija tiek izmantota pieteikuma apstrādei. *</span>
          </label>

          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Nosūta…' : 'Nosūtīt pieteikumu'}
          </button>
        </form>
      </section>
    </main>
  );
}
