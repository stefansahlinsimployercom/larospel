# Fylla på innehåll i Lärospel

Kort arbetsbeskrivning för att lägga till innehåll – för människor och för AI-assistenter.
Innehållet ligger i `quizzes/*.js`. Motorerna (`*.js` i roten) ska inte behöva röras för att lägga till innehåll.

## Arbetssätt (håll det billigt)

1. Lägg till en omgång (t.ex. 3–5 ordlistor) direkt i rätt fil.
2. Kör `node tools/validera.js` – ska sluta med "✅ Inga fel hittades." Rätta och kör igen tills det gör det.
3. Committa och pusha med ett kort meddelande. GitHub Pages uppdateras automatiskt inom ett par minuter.
4. Fyll i en rad i `docs/PROJEKTHISTORIK.md` under den senaste punkten om mer innehåll (eller lägg till en ny punkt).

**Vad valideringen täcker – och när webbläsartest behövs**

| Innehåll | Räcker `validera.js`? |
|---|---|
| Ordlistor, historia, zoologi, recept, Bluffkollen, Uppskattningar, kopplingar, problemtyper | ✅ Ja – inget webbläsartest |
| Nya matte/fysik-steg av snabbräkningstyp (`{ text, answer }`) | ✅ Ja – skriptet kör varje generator 300 gånger |
| Geografi (nya platser) | ⚠️ Skriptet kollar formatet, men titta på kartan att platsen hamnar rätt |
| Nya steg-för-steg-uppgifter (`eq`, `geo`, `phys`), nya speltyper eller ändrade motorer | ❌ Testa i webbläsaren |

Webbläsartest görs på `http://127.0.0.1:<port>` med en testspelare – aldrig på spelarens riktiga data.

## Startinstruktion för en ny chatt (Claude Code)

Klistra in och byt ut det som ska läggas till:

```
Fyll på Lärospel (mappen larospel). Läs docs/INNEHALL.md och följ den.
Lägg till: <t.ex. ordlistorna Frukt och grönsaker, Hemmet, Skolan / 10 händelser om industriella revolutionen i Historia / receptet Köttbullar>.
Kör node tools/validera.js tills den är grön, committa och pusha.
Inget webbläsartest om tabellen i INNEHALL.md säger att det inte behövs. Svara kort: vad som lades till.
```

Fortsätt sedan i samma chatt med bara "Nästa: …".

## Med en extern AI (ChatGPT, Gemini …)

Repot är publikt, så en AI med webbläsning kan läsa formatet själv. Annars: klistra in avsnittet om rätt format nedan.

```
Läs https://github.com/stefansahlinsimployercom/larospel/blob/main/docs/INNEHALL.md
och titta på exemplen i https://github.com/stefansahlinsimployercom/larospel/blob/main/quizzes/sprak.js
Skriv <t.ex. ordlistorna Frukt och grönsaker och Skolan, 12 ord var> i exakt samma JavaScript-format,
redo att klistras in sist i categories-listan. Bara koden, ingen förklaring.
```

Klistra sedan in svaret i Claude Code med: *"Lägg in det här i quizzes/sprak.js, kör validera.js, rätta eventuella fel, committa och pusha"* – eller klistra in det själv i filen och kör `node tools/validera.js`.
Extern AI kan inte köra valideringen, så det steget behövs alltid. Den kan också ha fel i fakta (årtal, översättningar) – validering hittar formatfel, inte sakfel.

## Ordlistor – `quizzes/sprak.js`

Lägg nya kategorier sist i `categories`. Varje ord måste finnas på **alla sex språk**:

```js
{
  id: 'frukt', name: 'Frukt & grönt', icon: '🍎',
  words: [
    { sv: 'äpple', en: 'apple', es: 'manzana', pt: 'maçã', ru: 'яблоко', zh: '苹果|píngguǒ' },
  ],
},
```

- `id`: unikt, små bokstäver utan å/ä/ö. Ändra aldrig id eller svenskt ord på befintliga ord – progressen sparas på dem.
- Flera godkända svar skrivs med snedstreck: `'vän/kompis'`. Det första visas som fråga och facit.
- Kinesiska skrivs `tecken|pinyin` med tontecken, flera alternativ `'汽车|qìchē/车|chē'`. Apostrof i pinyin skrivs ’ (inte ').
- Ryska: skriv med kyrilliska; ё kan anges som alternativ, `'ребёнок/ребенок'`.
- Portugisiska: ta med både brasiliansk och europeisk variant när de skiljer sig, `'suco/sumo'`.
- Samma ord får inte förekomma två gånger i en kategori på något språk (ger två likadana frågor). Exempel: ryska *рука* = både hand och arm → ta bara med ett av dem.
- 10–15 ord per kategori är lagom.

## Andra sorters innehåll

Formatet står i kommentaren överst i varje fil:

| Ämne | Fil |
|---|---|
| Historia (händelser + årtal, orsak → verkan) | `quizzes/historia.js` |
| Geografi (platser med koordinater) | `quizzes/geografi.js` |
| Zoologi (sorteringar) | `quizzes/zoologi.js` |
| Matlagning (recept + "Vad gick fel?") | `quizzes/matlagning.js` |
| Matte / fysik (steg med generatorer, "Det här kan du lösa nu") | `quizzes/matte.js`, `quizzes/fysik.js` |
| Bluffkollen, Uppskattningar | `quizzes/bluff.js`, `quizzes/uppskatta.js` (referenser måste finnas i spelet) |
| Kopplingar mellan ämnen, problemtyper | `quizzes/kopplingar.js`, `quizzes/problemtyper.js` |

Matte/fysik: nya generatorer bör köras många gånger och ge rimliga heltal (eller ange `tol`). Ändra aldrig befintliga id:n.
