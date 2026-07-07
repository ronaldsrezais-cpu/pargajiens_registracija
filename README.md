# Hike Registration Website

A standalone Next.js registration website for a hike organised in 3 cities with 3 route distances: 5 km, 14 km, and 22 km.

The design is prepared in a strong sports-event style inspired by the public BeActive Latvia website structure: clear navigation, large campaign hero, statistics blocks, distance cards, registration form, and footer/partner area.

## What is included

- Standalone Next.js website, ready for Vercel or GitHub upload
- Registration form with:
  - City of participation
  - Distance: 5 km / 14 km / 22 km
  - Team name
  - Team city / municipality
  - Captain name
  - Captain email
  - Captain phone number
  - Up to 4 additional participants
  - Data consent checkbox
  - Accuracy confirmation checkbox
- Configurable city names and content in `app/content.ts`
- API route for form submission in `app/api/register/route.ts`
- Environment variable support for external storage endpoint

## How to edit city names

Open:

```txt
app/content.ts
```

Replace:

```ts
participationCities: ['City 1', 'City 2', 'City 3'],
```

with the actual city names, for example:

```ts
participationCities: ['Riga', 'Liepāja', 'Daugavpils'],
```

## How to store submissions

The form is already connected to a local API route:

```txt
/api/register
```

To actually save registrations, add an external POST endpoint in Vercel as an environment variable:

```txt
REGISTRATION_ENDPOINT=https://your-endpoint-here
```

You can use:

- Google Apps Script + Google Sheets
- Formspree
- Airtable
- Make/Zapier webhook
- Your own database endpoint

If `REGISTRATION_ENDPOINT` is empty, the form will show a demo-mode message and submissions will not be stored.

## Google Sheets option

A simple Google Apps Script example is included in:

```txt
google-apps-script-example.js
```

Use it to connect the website to a Google Sheet.

## Run locally

```bash
npm install
npm run dev
```

Then open:

```txt
http://localhost:3000
```

## Deploy on Vercel

1. Upload this folder to GitHub.
2. Import the repository in Vercel.
3. Add `REGISTRATION_ENDPOINT` in Vercel project settings if you want to store form submissions.
4. Deploy.

## Main visual settings

The main colours are in:

```txt
app/globals.css
```

At the top of the file, edit:

```css
:root {
  --blue: #0057b8;
  --green: #00a651;
  --yellow: #ffd200;
}
```
