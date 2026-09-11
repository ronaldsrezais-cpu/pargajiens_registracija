# BeActive pārgājiena reģistrācijas forma

Šajā versijā papildus ir uzlabota e-pastu sūtīšanas diagnostika.

## Kas jāatjaunina

Ja mājaslapa jau strādā, obligāti jāatjaunina tikai Google Apps Script kods no:

`apps-script/Code.gs`

Frontend failus var atjaunināt kā parasti, bet šīs problēmas risināšanai galvenais ir Apps Script.

## Pēc koda ielikšanas Apps Script

1. Ievietojiet savu Google Sheet ID rindā:
   `const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';`
2. Save
3. Palaidiet `authorizeScript`
4. Palaidiet `checkEmailSetup`
5. Apps Script sadaļā Executions / Logs pārbaudiet:
   - Effective user email
   - Configured sender email
   - Available Gmail aliases
   - Remaining daily mail quota
6. Deploy → Manage deployments → Edit → Version: New version → Deploy

## Ja kādam e-pasts neaiziet

Google Sheet tagad automātiski pievienos kolonnas:
- E-pasts nosūtīts
- E-pasts nosūtīts plkst.
- E-pasta kļūda
- Pēdējais e-pasta mēģinājums

Tās palīdzēs redzēt, kāpēc konkrētam pieteikumam e-pasts nav nosūtīts.

## Atkārtota sūtīšana

Lai atkārtoti nosūtītu visiem, kam e-pasts nav nosūtīts, Apps Script palaidiet:

`resendFailedConfirmationEmails`

Lai nosūtītu tikai konkrētai rindai, Apps Script palaidiet šo no funkcijas vai pielāgojiet:

`resendConfirmationEmailForRow(2)`

kur `2` ir Google Sheet rindas numurs.
