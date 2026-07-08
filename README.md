# BeActive Hike Registration Form

Vienkārša Next.js mājaslapa pārgājiena komandu reģistrācijai ar Google Sheets pieslēgumu, skaitītāju un pieteikumu labošanas/atsaukšanas funkciju.

## Kas ir iekļauts

- Pieteikšanās forma latviešu valodā.
- Iespēja pievienot neierobežotu papildu dalībnieku skaitu.
- Pilsētas un distances:
  - Liepāja: 5 km, 14 km, 22 km
  - Smiltene: 7 km, 13 km, 21 km
  - Ilūkste: 5 km, 12 km, 19 km
- Google Sheets datu saglabāšana.
- Skaitītājs pa pilsētām un distancēm ar pilsētu ģerboņiem.
- Unikāls pieteikuma labošanas kods katrai komandai.
- Automātisks e-pasts kapteinim ar saiti “Labot vai atsaukt pieteikumu”.
- Atsevišķa labošanas lapa: `/labot`.

## Google Apps Script atjaunināšana

Tā kā šajā versijā pievienota pieteikumu labošanas/atsaukšanas funkcija, Google Apps Script kods ir jāatjaunina.

1. Atveriet savu Google Sheet.
2. Ejiet uz `Extensions → Apps Script`.
3. Izdzēsiet veco kodu un iekopējiet jauno kodu no faila:

```txt
apps-script/Code.gs
```

4. Šajā rindā:

```js
const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
```

ielieciet savu Google Sheet ID. Nelieciet pilnu Google Sheet linku un nelieciet Apps Script `/exec` linku.

Pareizi:

```js
const SHEET_ID = '13ZoUwhTLpMeXWqpBXxmsdyat-KWh8-mj1wznpBW6TGg';
```

Nepareizi:

```js
const SHEET_ID = 'https://docs.google.com/spreadsheets/d/13ZoUwhTLpMeXWqpBXxmsdyat-KWh8-mj1wznpBW6TGg/edit';
```

5. Nospiediet `Save`.
6. Funkciju sarakstā izvēlieties `authorizeScript`.
7. Nospiediet `Run` un apstipriniet piekļuves tiesības. Tas vajadzīgs, jo jaunā versija sūta e-pastus un pārbauda Gmail alias.
8. Ejiet uz `Deploy → Manage deployments`.
9. Spiediet zīmulīti/edit pie esošā Web app deployment.
10. Pie `Version` izvēlieties `New version`.
11. Pārbaudiet, ka ir:

```txt
Execute as: Me
Who has access: Anyone
```

12. Spiediet `Deploy`.
13. `/exec` linkam jāpaliek tajam pašam, ja rediģējat esošo deployment. Ja Google iedod jaunu `/exec` linku, tas jāieliek `app/settings.ts`.

## Website URL pieslēgums

Google Apps Script Web App URL ir failā:

```txt
app/settings.ts
```

Šajā versijā jau ir ielikts pēdējais izmantotais `/exec` links. Ja Apps Script dod jaunu linku, aizvietojiet to šajā failā.

## Testēšana pēc deploy

1. Atveriet mājaslapu.
2. Iesniedziet testa pieteikumu.
3. Pārbaudiet, vai Google Sheet parādās jauna rinda.
4. Pārbaudiet, vai kapteiņa e-pastā atnāk apstiprinājums.
5. E-pastā atveriet labošanas saiti.
6. Pamēģiniet nomainīt dalībnieku un saglabāt.
7. Pamēģiniet atsaukt pieteikumu.
8. Pārbaudiet, vai skaitītājs pēc atsaukšanas samazina aktīvo komandu/dalībnieku skaitu.

## Lokāla palaišana

```bash
npm install
npm run dev
```

## Build pārbaude

```bash
npm run build
```


## E-pasta sūtītājs

Apps Script sūta e-pastus ar adresi `latvijassportafederacijupadome@gmail.com`. Lai šī adrese parādītos kā īstais sūtītājs laukā “From”, tai jābūt pievienotai kā Gmail/Google Workspace send-as alias kontam, ar kuru tiek izpildīts Apps Script. Ja alias nav pieejams, pieteikums tiks saglabāts, bet apstiprinājuma e-pasts netiks nosūtīts, lai nejauši netiktu parādīts privātais e-pasts.

## Logo un ģerboņi

Failā `public/lsfp-logo.png` ir ievietots atjaunotais LSFP logo. Skaitītāja sadaļai pievienoti pilsētu ģerboņi: `crest-liepaja.png`, `crest-smiltene.png`, `crest-ilukste.png`.

## Latest change

Apvienotas jaunākās izmaiņas: īsāks pieteikuma apstiprinājuma teksts, paskaidrojums labošanas kodam, neierobežots papildu dalībnieku skaits, pilsētu ģerboņi skaitītājā, pilni vārdi “komandas” un “dalībnieki”, kā arī atjaunots LSFP logo e-pastā. Google Apps Script kods jāatjaunina no `apps-script/Code.gs`.
