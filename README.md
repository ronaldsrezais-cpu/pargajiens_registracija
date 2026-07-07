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
- Komandas kapteiņa vārds, uzvārds
- Kapteiņa e-pasts
- Kapteiņa tālrunis
- Līdz 4 papildu dalībniekiem

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
