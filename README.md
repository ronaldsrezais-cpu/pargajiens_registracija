# Pārgājiena reģistrācijas forma

Vienkārša Next.js lapa pieteikšanās formai latviešu valodā ar skaitītāju zem formas.

## Lauki

- Pilsēta: Liepāja, Smiltene, Ilūkste
- Distance pēc izvēlētās pilsētas:
  - Liepāja: 5 km, 14 km, 22 km
  - Smiltene: 7 km, 13 km, 21 km
  - Ilūkste: 5 km, 12 km, 19 km
- Komandas nosaukums
- Komandas pilsēta / novads
- Dalībnieki:
  - Kapteinis
  - Kapteiņa e-pasts
  - Kapteiņa tālrunis
  - Dalībnieks 2
  - Dalībnieks 3
  - Dalībnieks 4
  - Dalībnieks 5

## Skaitītājs

Zem formas ir skaitītājs, kas rāda reģistrēto komandu un dalībnieku skaitu katrā pilsētā un distancē. Dalībnieku skaits tiek aprēķināts kā kapteinis + aizpildītie dalībnieku lauki.

Skaitītājs izmanto to pašu Google Apps Script adresi, kas saglabā pieteikumus. Google Apps Script piemērā ir pievienots arī `doGet()`, kas atgriež skaitītāja datus.

## Pieteikumu saglabāšana

Forma sūta datus uz vietnes iekšējo adresi `/api/register`, bet Google Apps Script adrese tiek norādīta projekta failā — līdzīgi kā Home & Heart risinājumā.

Atveriet failu:

```txt
app/settings.ts
```

Un aizvietojiet šo tekstu:

```txt
PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE
```

ar savu Google Apps Script Web App URL, kas beidzas ar `/exec`.

Pēc tam saglabājiet izmaiņas GitHub un pārdeployojiet Vercel. Vercel Environment Variables šajā variantā nav obligātas.


## Google Sheets pieslēgšana — tāpat kā Home & Heart variantā

1. Izveidojiet Google Sheet.
2. Tabulas pirmajā rindā ielieciet zemāk norādītās kolonnu galvenes.
3. Google Sheet atveriet Extensions → Apps Script.
4. Iekopējiet kodu no `apps-script/Code.gs`.
5. Kodā aizvietojiet `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` ar Google Sheet ID.
6. Apps Script izvēlieties Deploy → New deployment → Web app.
7. Iestatījumi:
   - Execute as: Me
   - Who has access: Anyone
8. Nokopējiet Web App URL, kas beidzas ar `/exec`.
9. Vietnes failā `app/settings.ts` aizvietojiet `PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` ar šo URL.
10. Saglabājiet izmaiņas GitHub un pārdeployojiet Vercel.

## Google Sheets

Piemērs Google Apps Script savienojumam ir failā:

```txt
apps-script/Code.gs
```

Šo kodu iekopējiet Google Sheets sadaļā Extensions → Apps Script.

Ieteicamās kolonnu galvenes Google Sheet tabulā:

```txt
Submitted at | Pilsēta | Distance | Komandas nosaukums | Komandas pilsēta / novads | Kapteinis | Kapteiņa e-pasts | Kapteiņa tālrunis | Dalībnieks 2 | Dalībnieks 3 | Dalībnieks 4 | Dalībnieks 5
```

## Pieteikuma maiņa vai atsaukšana

Vienkāršākajā versijā dalībnieki pieteikumu nevar paši rediģēt vai atsaukt. To var pievienot kā nākamo funkciju, izveidojot unikālu pieteikuma kodu un atsevišķu maiņas/atteikuma formu.

## Palaišana lokāli

```bash
npm install
npm run dev
```

## Vercel

1. Augšupielādējiet projekta mapi GitHub.
2. Importējiet GitHub repozitoriju Vercel.
3. Failā `app/settings.ts` ielīmējiet Google Apps Script Web App URL.
4. Deploy.
