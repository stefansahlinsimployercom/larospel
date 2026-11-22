# Projekthistorik – Lärospel

Lärospel byggdes 21–22 november 2026 i en sammanhängande session med Claude (Claude Code), steg för steg utifrån idéer och tester från projektägaren. Det här dokumentet sammanfattar vad som byggdes, varför, vilka beslut som togs och vilka idéer som finns för framtiden – så att arbetet kan fortsätta även utan den ursprungliga konversationen.

Se även [DESIGNPRINCIPER.md](../DESIGNPRINCIPER.md).

## Utgångspunkt

- Idé: ett utbildningsspel med "Sporcle-känsla" men mer metodiskt för inlärning – lite Duolingo-inspirerat, men byggt kring var man faktiskt fastnar.
- Krav: så lite krångel som möjligt (inga installationer), spelkänsla viktigare än grafik, ett steg i taget.
- Teknikval: ren HTML/CSS/JavaScript utan beroenden. Progress sparas i webbläsarens `localStorage`.

## Vad som byggdes, i ordning

1. **Spelskal + språkquiz** (Sporcle-stil: skriv svar, rätt fylls i automatiskt, timer).
2. **Språk:** vända håll mellan språk, portugisiska, kategorier, sparade resultat, "kan" efter två rätt i rad och "träna bara det jag inte kan".
3. **Historia:** fritextläge (skriv årtal, f.Kr.-stöd) och tidslinjeläge (dra i ordning; poäng = längsta del i rätt ordning).
4. **Matte som färdighetsträd:** aritmetik, algebra steg 1–5 med *operationskort* som dras till ekvationen (bråk, ångra, ledtråd, kortaste väg), snabbräkning. Lärdom: man måste få "Gå vidare" och se progress, annars känns det som att spelet hängt sig.
5. **Geometri:** formel → mått → räkna, med ritade figurer och lurmått (sned sida, radie/diameter).
6. **Ordproblem (frivilligt läge):** Vad är x? → ekvationsform → dra in tal (inkl. brus) → lös → svara i en mening. Signalord markeras av ledtråden.
7. **Zoologi – sorteringsspel:** fallande kort dras till korgar (djurgrupper, världsdelar med kartbilder).
8. **Geografi – kartspel:** klicka på världskartan, zoom/panorering, tre nivåer (1000/500/200 km), platsers utbredning räknas in.
9. **Matlagning:** recept i fyra steg (ingredienser → arbetsgång → värden → klart när?) + **"Vad gick fel?"** (symptom → orsak → så undviker du det). Lärdom: ledtråd och facit behövs i *varje* steg.
10. **Felsökning – diagnosspel:** dold slumpad orsak, tester i steg som kostar poäng, ⛔ farliga val, åtgärdssteg och *proffsens väg* (smartaste testordningen räknas ut automatiskt).
11. **Fysik:** träd med Rörelse, Krafter, Energi, Elektricitet. Varje uppgift: huvudlag → formel (rätt omskrivning) → storheter (enhetsfällor) → räkna i steg → enhet.
12. **Kedjor & flöden:** bygg kedjan (ordning + steg som inte hör hemma) → placera aktörer (halvledarkedjan, 28 företag) → kedjekort.
13. **Ⓘ-inforutor i alla spel** – principen att de aldrig får avslöja svaret innan man svarat.
14. **Bygg & konstruktion:** dra delar till ritning (dator, bil med ikoner; kärnkraftverk med text) och "starta maskinen" som genomgång av flödet.
15. **Ryska och kinesiska:** kyrilliskt skärmtangentbord med latinska motsvarigheter (eller skriv translittererat), kinesiska teckenbrickor med pinyin.
16. **Admin-läge** (PIN) som låser upp alla steg i träden.
17. **Publicering:** GitHub-repo och GitHub Pages.

## Viktiga beslut och lärdomar

- **"Fastna-analys" som metod** – se designprinciperna.
- **Ingen ska fastna:** ledtråd → facit → alltid en väg vidare; hjälp kostar stjärna/"i rad" men stoppar aldrig.
- **Fel drag ska vara tillåtna och synliga** (algebra, felsökning) – man lär sig av konsekvensen.
- **Generatorer i stället för fasta listor** för matte/fysik → oändligt många uppgifter.
- **Etablerade grundrecept** för matlagning för att undvika godtycke.
- **Tilliten ska kalibreras efter insats:** prototyper får byggas snabbt och fritt; innehåll som ska användas på riktigt ska granskas av ämnesexperter.
- **Cache:** lokala servern skickar `no-store` så att vanlig F5 alltid visar senaste version (`server.py`).
- **Testa utan att röra användarens progress:** testa i egen flik och stubba `Store.save`.

## Vad kan vara nytt? En ärlig bedömning

Enskilda mekanismer har föregångare, och det är bra att känna till dem:

- **Algebra med drag-operationer:** *DragonBox Algebra* (sedan 2012, numera Kahoot) låter barn dra operationer till båda sidor av en ekvation, och *Graspable Math* låter en manipulera uttryck direkt. Brilliant.org och Khan Academy arbetar med interaktiva steg.
- **Felsökning/diagnos:** virtuella patientfall inom medicin (t.ex. Body Interact), felsökningslabb inom nätverk (Cisco Packet Tracer) och förgrenade scenarier i e-learningverktyg (Articulate Storyline m.fl.).
- **Kedjor/system:** begreppskartor och systemdynamiska spel.

Det som däremot verkar ovanligt – och kan vara på riktigt nytt – är:

1. **Översättningslagret i ordproblem** som egna, spelbara steg: *definiera x → välj ekvationsform → välj tal (med brus) → lös → rimlighet i en mening*. De flesta verktyg tränar räknandet; få tränar just översättningen, som är där många fastnar.
2. **En generell felsökningsmotor** för arbetslivet: dold slumpad orsak, tester med kostnad, farliga val och automatiskt beräknad expertväg att jämföra med. Liknande finns inom smala, dyra specialområden, men sällan som ett enkelt, generellt verktyg där vem som helst kan skapa fall.
3. **Samma pedagogiska ramverk över många speltyper** (träd, två rätt i rad, ledtråd/facit, ⓘ) – och **AI som innehållsproducent**: fall, kedjor och uppgifter kan genereras som utkast från manualer och processdokument och granskas av experter.
4. **Fastna-analys som designmetod** – att systematiskt utgå från hindret i stället för innehållet.

Det som avgör om det blir banbrytande är inte idén utan **evidens**: testa med riktiga elever/medarbetare, mät före/efter och tid till självständighet. Värt att läsa på: forskning om *worked examples*, *faded scaffolding*, *retrieval practice* och *spaced repetition*, samt studier av DragonBox (där frågan om överföring till vanlig algebra på papper är omdiskuterad).

## Idébacklogg

**Nära till hands**
- Fler algebrasteg (bråk, negativa lösningar, ekvationssystem, andragradsekvationer); geometri och fysik som ordproblem.
- Fler kedjor: ekonomins kretslopp, hur en aktieaffär går till, onboarding på en arbetsplats.
- **"Vad händer om…?"-läge** för kedjor: ändra en sak och följ effekten genom kedjan.
- Fler felsökningsfall: cykel, diskmaskin, webbsida som inte laddar, kod som kraschar, kundärenden.
- Fler konstruktioner: människokroppen (blodomloppet som genomgång), hus, vindkraftverk.
- Kombination **bygg → starta → något går fel → felsök**.
- Fler språk/ord; röstuppläsning av ord.

**Nästa att bygga (att göra-listan, 22 nov 2026)**
- **Inplaceringstest:** snabbtest i början som låser upp det man redan kan (t.ex. hoppa direkt till rätt steg i matteträdet).
- **Smart repetition (spaced repetition):** det man kan återkommer med växande mellanrum (1 dag, 3 dagar, 1 vecka, 1 månad) så länge man svarar rätt; en kort daglig repetitionsrunda.
- **Anpassad tröskel:** snabbt och säkert rätt direkt kan räcka för "kan"; tvekan eller fel kräver fler.
- **Mät svinnet:** visa tid till att kunna något, så att effekten syns.
- **Kunskapskarta:** visuell överblick för varje ämne och en samlad karta på startsidan – hur stort området är, var man är, framsteg i färg, vad som kommer härnäst och var nya områden hänger fast.
- **"Varför?"-lager i matte:** när ett steg är klart – "Det här kan du lösa nu": vilken kategori av verklighetsproblem steget låser upp, med ett exempel som ordproblem. Även omvänt: börja i en verklig fråga ("Lönar sig elbilen?") och se i trädet vilka steg som behövs.
- **"Varför?"-lager i allmänbildning:** visa kopplingar mellan saker (t.ex. Konstantinopels fall → nya handelsvägar → Columbus) och en *rimlighetskoll* där man använder det man kan för att bedöma om påståenden stämmer.

**För att gå från prototyp till verktyg för utbildningar och arbetsplatser**
- Redigeringsverktyg för innehåll (utan kod) + AI-genererade utkast från dokument.
- Inloggning, central progress och statistik för utbildningsansvariga; koppling till LMS (SCORM/xAPI).
- Mobil/pekskärm, tangentbord och skärmläsare (tillgänglighet).
- GDPR så fort persondata sparas.
- Pilot: välj en utbildning där folk fastnar i dag (t.ex. felsökning av vanliga kundärenden), bygg 5–10 fall och mät effekten.

## Teknisk karta

- `index.html` laddar `quizzes/*.js` (innehåll) och sedan motorerna.
- `game.js`: lagring (`Store`, sparar `attempts`, `known`, `math`, `settings`), startsida, resultatsida, ordquiz, inforutor (`infoBtn`).
- En motor per speltyp: `history.js`, `math.js` (träd, algebra, geometri, ordproblem, snabbräkning), `phys.js`, `sort.js`, `geo.js`, `recipe.js`, `diag.js`, `chain.js`, `build.js`, `lang.js`, `admin.js`.
- Ett spår registreras med `(window.TRACKS ||= []).push({ id, name, icon, type, … })`; `type` avgör motorn.
