# Pārgājiena reģistrācijas forma

Vienkārša Next.js lapa pieteikšanās formai latviešu valodā.

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

## Pieteikumu saglabāšana

Forma sūta datus uz:

```txt
/api/register
```

Lai pieteikumi tiktu saglabāti Google Sheets, Formspree, Airtable, Make/Zapier vai citā risinājumā, Vercel iestatījumos pievienojiet:

```txt
REGISTRATION_ENDPOINT=https://your-endpoint-here
```

Ja `REGISTRATION_ENDPOINT` nav norādīts, forma darbojas testa režīmā un pieteikumus nesaglabā.

## Google Sheets

Piemērs Google Apps Script savienojumam ir failā:

```txt
google-apps-script-example.js
```

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
3. Pievienojiet `REGISTRATION_ENDPOINT`, ja nepieciešama pieteikumu saglabāšana.
4. Deploy.
