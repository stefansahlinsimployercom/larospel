# 🎓 Lärospel

Ett utbildningsspel i webbläsaren – Sporcle-känsla, fast för att lära sig på riktigt. Inga installationer, inga beroenden: ren HTML, CSS och JavaScript.

## Starta

**Enklast:** dubbelklicka på `index.html`.

**Med lokal server** (rekommenderas – geografikartan och vissa funktioner fungerar bäst så):

```
python server.py
```

Öppna sedan <http://localhost:8123>. Servern säger åt webbläsaren att inte cacha filerna, så vanlig F5 visar alltid senaste versionen.

## Ämnen och speltyper

| Ämne | Speltyp |
|---|---|
| 🌍 **Språk** | Sporcle-quiz i kategorier mellan svenska, engelska, spanska, portugisiska, ryska (kyrilliskt tangentbord) och kinesiska (teckenbrickor med pinyin) |
| ➗ **Matte** | Färdighetsträd: aritmetik, algebra (dra räkneoperationer till ekvationen), geometri – plus snabbräkning och frivilliga ordproblem |
| ⚛️ **Fysik** | Färdighetsträd: huvudlag → formel → storheter → räkna i steg → enhet |
| 🏛️ **Historia** | Skriv årtal eller ordna händelser på en tidslinje |
| 🦁 **Zoologi** | Sorteringsspel – fallande kort dras till rätt korg (djurgrupper, världsdelar) |
| 🗺️ **Geografi** | Klicka på världskartan med zoom, tre noggrannhetsnivåer |
| 🍳 **Matlagning** | Klassiska recept i fyra steg + "Vad gick fel?"-felsökning |
| 🔧 **Felsökning** | Diagnosspel i flera steg med farliga val och "proffsens väg" |
| 🔗 **Kedjor & flöden** | Bygg en värdekedja och placera aktörerna (t.ex. halvledarkedjan) |
| 🛠️ **Bygg & konstruktion** | Dra delar till rätt plats på en ritning och "starta maskinen" |
| 🕵️ **Bluffkollen** | Avslöja felaktiga påståenden: stämmer eller bluff, var sitter felet, vilken sorts fel – med kunskap från de andra ämnena |
| 🎯 **Uppskattningar** | Uppskatta svar som kombinerar kunskap från flera ämnen – poäng efter närhet och ett facit som visar vilka kunskaper som leder dit |

Gemensamt för alla: progress sparas i webbläsaren (ett ord/en plats/ett steg räknas som "kan" efter två rätt i rad), smart repetition (det man kan kommer tillbaka efter 1, 3, 7, 30 och 90 dagar), "träna bara det jag inte kan", ⓘ-inforutor med fördjupning, ledtrådar och facit, samt en resultatsida.

## Kunskapskartan

🗺️ *Min kunskapskarta* på startsidan visar allt i spelet på en gång – en ruta per sak, färgad efter om du kan den, håller på att lära dig den eller borde repetera den.

## Spelare och progress

Knappen med din emoji i sidhuvudet byter spelare. Varje spelare har sin egen progress i webbläsaren. Under 📊 Resultat kan du **spara ner** din progress som en fil och **ladda upp** den på en annan dator – som ny spelare eller sammanslagen med en befintlig.

## Admin-läge

🔒-knappen i sidhuvudet låser upp alla steg i färdighetsträden. PIN-koden sätts i `admin.js` (`ADMIN_PIN`).
Observera att spelet körs helt i webbläsaren – PIN:en är en enkel spärr, inget riktigt säkerhetsskydd.

## Struktur

- `index.html`, `style.css` – sidan och utseendet
- `game.js` – gemensam motor (lagring, startsida, resultat, ordquiz, inforutor)
- `history.js`, `math.js`, `phys.js`, `sort.js`, `geo.js`, `recipe.js`, `diag.js`, `chain.js`, `build.js`, `lang.js`, `admin.js`, `bluff.js`, `estimate.js`, `placement.js`, `knowledgemap.js`, `crosslinks.js`, `profiles.js` – en fil per speltyp
- `quizzes/*.js` – innehållet (ord, händelser, uppgiftsgeneratorer, recept, fall …). Nytt innehåll läggs till här utan att röra motorerna.
- `server.py` – liten lokal webbserver utan cache

Se även [DESIGNPRINCIPER.md](DESIGNPRINCIPER.md) – metoden och principerna bakom spelet – och [docs/PROJEKTHISTORIK.md](docs/PROJEKTHISTORIK.md) – vad som byggts, beslut och idébacklogg.
