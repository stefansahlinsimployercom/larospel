# Fylla på innehåll i Lärospel

Kort arbetsbeskrivning för att lägga till innehåll – för människor och för AI-assistenter.
Innehållet ligger i `quizzes/*.js`. Motorerna (`*.js` i roten) ska inte behöva röras för att lägga till innehåll.

## Arbetssätt (håll det billigt)

1. Lägg till en omgång (t.ex. 3–5 ordlistor) direkt i rätt fil.
2. Kör `node tools/validera.js` – ska sluta med "✅ Inga fel hittades." Rätta och kör igen tills det gör det.
3. Ingen webbläsartest behövs för rent innehåll som validerats. Committa och pusha med ett kort meddelande.
4. Fyll i en rad i `docs/PROJEKTHISTORIK.md` under den senaste punkten om mer innehåll (eller lägg till en ny punkt).

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
