'use client';

import { FormEvent, useMemo, useState } from 'react';
import { siteContent } from './content';

type MessageState = {
  type: 'success' | 'error' | 'info';
  text: string;
} | null;

const memberFields = ['participant1', 'participant2', 'participant3', 'participant4'];

export default function Home() {
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

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
      accuracyConfirmation: formData.get('accuracyConfirmation') === 'on',
    };

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setMessage({ type: 'error', text: result.message || 'The registration could not be submitted.' });
        return;
      }

      setMessage({
        type: result.demoMode ? 'info' : 'success',
        text: result.message || 'Thank you! Your team registration has been submitted.',
      });

      if (!result.demoMode) {
        form.reset();
      }
    } catch {
      setMessage({ type: 'error', text: 'The registration could not be submitted. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Homepage">
          <span className="brand-mark">#</span>
          <span className="brand-copy">
            <strong>{siteContent.eventName}</strong>
            <small>Registration website</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          {siteContent.nav.map((item) => (
            <a key={item.href} href={item.href} className={item.href === '#registration' ? 'nav-cta' : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="campaign-label">{siteContent.heroTagline}</p>
              <h1>{siteContent.headline}</h1>
              <p className="hero-lead">{siteContent.subheadline}</p>

              <div className="hero-actions">
                <a className="primary-button" href="#registration">Register your team</a>
                <a className="secondary-button" href="#distances">View distances</a>
              </div>
            </div>

            <div className="hero-card" aria-label="Event summary">
              <div className="date-block">
                <span>Hike</span>
                <strong>3 cities</strong>
                <small>{siteContent.dates}</small>
              </div>
              <div className="distance-strip">
                <span>5 km</span>
                <span>14 km</span>
                <span>22 km</span>
              </div>
              <div className="abstract-visual" aria-hidden="true">
                <span className="circle circle-one"></span>
                <span className="circle circle-two"></span>
                <span className="circle circle-three"></span>
                <span className="route-line"></span>
                <span className="walker walker-one"></span>
                <span className="walker walker-two"></span>
              </div>
            </div>
          </div>
        </section>

        <section className="numbers-section" aria-label="Registration summary">
          <div className="number-card">
            <strong>3</strong>
            <span>participation cities</span>
          </div>
          <div className="number-card">
            <strong>3</strong>
            <span>route distances</span>
          </div>
          <div className="number-card">
            <strong>5</strong>
            <span>team members maximum</span>
          </div>
        </section>

        <section className="content-section" id="about">
          <div className="section-heading">
            <p>About the registration</p>
            <h2>One captain registers the whole team</h2>
          </div>

          <div className="steps-grid">
            <article>
              <span>01</span>
              <h3>Choose the city</h3>
              <p>Select the city where your team will take part in the hike.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Select the distance</h3>
              <p>Choose the most suitable distance: 5 km, 14 km, or 22 km.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Add team details</h3>
              <p>Add the team name, team city, captain contact details, and up to four additional people.</p>
            </article>
          </div>
        </section>

        <section className="content-section distances-section" id="distances">
          <div className="section-heading light">
            <p>Distances</p>
            <h2>Choose your route</h2>
          </div>

          <div className="distance-cards">
            {siteContent.distances.map((distance, index) => (
              <article className={index === 1 ? 'distance-card featured' : 'distance-card'} key={distance.value}>
                <strong>{distance.title}</strong>
                <h3>{distance.subtitle}</h3>
                <p>{distance.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="registration-section" id="registration">
          <div className="registration-copy">
            <p className="section-label">Registration form</p>
            <h2>Register your team</h2>
            <p>
              Please complete all required fields. The captain will be contacted if additional information is needed before the event.
            </p>
            <div className="registration-note">
              <strong>Team format</strong>
              <span>Captain + up to 4 additional participants.</span>
            </div>
          </div>

          <form className="registration-form" onSubmit={handleSubmit}>
            {message && <div className={`form-message ${message.type}`}>{message.text}</div>}

            <fieldset>
              <legend>Participation details</legend>
              <div className="form-grid">
                <label>
                  City of participation *
                  <select name="participationCity" required>
                    <option value="">Select city</option>
                    {siteContent.participationCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Distance *
                  <select name="distance" required>
                    <option value="">Select distance</option>
                    {siteContent.distances.map((distance) => (
                      <option key={distance.value} value={distance.value}>{distance.value}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Team name *
                  <input name="teamName" type="text" required placeholder="e.g. Forest Friends" />
                </label>

                <label>
                  Team city / municipality *
                  <input name="teamCity" type="text" required placeholder="e.g. Riga" />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Captain details</legend>
              <div className="form-grid">
                <label>
                  Captain’s name and surname *
                  <input name="captainName" type="text" required placeholder="Name Surname" />
                </label>

                <label>
                  Captain’s email address *
                  <input name="captainEmail" type="email" required placeholder="name@example.com" />
                </label>

                <label>
                  Captain’s phone number *
                  <input name="captainPhone" type="tel" required placeholder="+371 ..." />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Additional team members</legend>
              <p className="fieldset-note">You may add up to four additional participants.</p>
              <div className="form-grid">
                {memberFields.map((field, index) => (
                  <label key={field}>
                    Participant {index + 1}
                    <input name={field} type="text" placeholder="Name Surname" />
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="checkbox-label">
              <input type="checkbox" name="dataConsent" required />
              <span>I agree that the submitted information may be processed for registration and event communication purposes. *</span>
            </label>

            <label className="checkbox-label">
              <input type="checkbox" name="accuracyConfirmation" required />
              <span>I confirm that the provided information is correct. *</span>
            </label>

            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit registration'}
            </button>

            <p className="technical-note">
              To store submissions, add a Google Sheets / Formspree / Airtable endpoint as <code>REGISTRATION_ENDPOINT</code> in Vercel.
            </p>
          </form>
        </section>

        <section className="partners-section" id="contacts">
          <div>
            <p className="section-label">Contacts</p>
            <h2>Need help with registration?</h2>
            <p>Contact the organisers at <a href={`mailto:${siteContent.contactEmail}`}>{siteContent.contactEmail}</a>.</p>
          </div>
          <div className="partner-placeholder">
            <span>Coordinator logo</span>
            <span>Supporter logo</span>
            <span>Partner logo</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>© {currentYear} {siteContent.eventName}. All rights reserved.</p>
      </footer>
    </>
  );
}
