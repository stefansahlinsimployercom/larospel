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
18. **Spelarprofiler och flytt mellan datorer (26 nov 2026):** "Vem spelar?" med egna profiler (namn + emoji), progress och admin-läge per profil, befintlig progress flyttades automatiskt till en första profil (originalet sparas som säkerhetskopia). Spara ner progress som fil och ladda upp den på en annan dator – som ny spelare eller sammanslagen (det bästa behålls per sak).
19. **"Det här kan du lösa nu" i matteträdet (26 nov 2026):** varje mattesteg har en 🔓-knapp som visar vilken kategori av verkliga problem steget låser upp, med exempelfrågor och ett räknat exempel. När ett steg blir klart visas "🔓 Nu kan du lösa: …".
20. **Kopplingar i historien (26 nov 2026):** 20 kopplingar orsak → verkan mellan händelser (5 tvärs över kategorierna). Nytt läge *🔗 Orsak & verkan* ("Vad ledde X till?" / "Vad låg bakom Y?"), en *🗺️ Tidslinjekarta* med alla händelser på en tidslinje och kopplingarna som bågar, samt ⓘ som visar kopplingar och vad som hände samtidigt i världen.
21. **Bluffkollen (26 nov 2026):** nytt ämne med 18 påståenden (4 sanna). Tre steg: stämmer eller bluff → klicka var i meningen felet sitter → vilken sorts fel (fakta, tid, storleksordning, samband, enhet, vilseledande jämförelse). Facit visar kunskapen från spelets andra ämnen som avslöjar bluffen och markerar det spelaren redan kan; påståenden som bygger på sådant man kan kommer först.
22. **Uppskattningar (26 nov 2026):** nytt ämne med 12 frågor som kombinerar kunskap från flera ämnen (t.ex. geografi + fysik). Poäng efter närhet (inom ×1,1 / ×1,5 / ×2 / ×10). Visuellt facit: logaritmisk skala med gissning mot svar, kunskapsbitarna (✅ = redan visat att man kan) som leder till svaret, och uträkningen steg för steg. Ledtråd visar vad man behöver veta (halverar poängen).
23. **Smart repetition och inplaceringstest (26 nov 2026):** allt man kan kommer tillbaka efter 1, 3, 7, 30 och 90 dagar (gäller alla spel); ett rätt svar flyttar fram nästa repetition, ett fel gör att det ska läras in igen. "🔁 Dags att repetera" på startsidan, och repetitionerna kommer med automatiskt i "bara det jag inte kan". *🧭 Inplaceringstest* i matte- och fysikträden: två rätt i rad per steg markerar steget som klart, ett fel eller "Vet inte" visar var man ska börja.
24. **Kunskapskartan (26 nov 2026):** visuell överblick över allt i spelet – en ruta per sak (grön = kan, gul = på gång, orange = dags att repetera, grå = inte än, streckad = kommer snart), grupperat per ämne och område så att man direkt ser hur stort varje område är och var man står. Ingång med procentring på startsidan.
25. **Kopplingar mellan ämnen (26 nov 2026):** 18 kopplingar historia ↔ geografi ↔ zoologi ↔ fysik (t.ex. orangutang ↔ Borneos regnskog, Mount Everest ↔ lägesenergi och lufttryck, Karl XII ↔ fjällen). Ⓘ i alla dessa ämnen visar "🌐 Kopplingar till andra ämnen", en kopplingskarta (nätverk med en kolumn per ämne) och spelet *Koppla ihop ämnen* – nås från kunskapskartan.
26. **Anpassad tröskel och mätning av svinn (26 nov 2026):** rätt första gången man möter något = kan direkt; fel innan man lärt sig något kräver ett extra rätt (tre i rad). Statistik per sak (antal svar, fel, svar till inlärning, svinn). Resultatsidan visar *Inlärning & svinn*: saker lärda, hur många man kunde direkt, svar i snitt för att lära in resten, svinn (svar på sådant man redan kunde när det inte var dags att repetera) och de svåraste sakerna.

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
- **"Varför?"-lager i matte:** när ett steg är klart – "Det här kan du lösa nu": vilken kategori av verklighetsproblem steget låser upp, med ett exempel som ordproblem. Även omvänt: börja i en verklig fråga ("Lönar sig elbilen?") och se i trädet vilka steg som behövs.
- **"Varför?"-lager i allmänbildning:** visa kopplingar mellan saker (t.ex. Konstantinopels fall → nya handelsvägar → Columbus) och en *rimlighetskoll* där man använder det man kan för att bedöma om påståenden stämmer.
- **Grund för allt ovan:** beskriv innehållet som strukturerad kunskap (en kunskapsgraf: saker med egenskaper och kopplingar), så att kopplingar och korsfrågor kan genereras automatiskt.
- **Kvantifiera vad man kan lösa tvärs över ämnen (kompetensmått):** beskriv *problemtyper* som kombinationer av grundfärdigheter från olika ämnen (en "färdighetsmatris": problemtyp × färdighet). Uppskatta hur säkert spelaren behärskar varje färdighet utifrån progressdatan, och räkna ut (1) andel problemtyper man kan lösa per område och totalt, (2) *gränsen*: problem som bara saknar en färdighet, och (3) *nästa bästa sak att lära sig*: den färdighet som låser upp flest nya problemtyper. Visa det visuellt (kunskapskarta/radar). Verifiera med korsfrågor/uppskattningsfrågor – att faktiskt lösa problemen är det riktiga beviset. Förebilder: Knowledge Space Theory (ALEKS), Q-matriser och kunskapsspårning (Bayesian Knowledge Tracing). Kan på sikt kopplas till arbetslivets färdighetstaxonomier (t.ex. ESCO).
- **Visuellt facit och framåtblick:** när spelet räknar ut vad man borde klara visas en karta som kopplar ihop *vilka* kunskaper från *vilka* ämnen som möts i problemet. Samma karta visar framåt: vilka nya problem och områden – även i andra ämnen – som öppnas om man lär sig en viss sak.
- **Skräddarsydda, AI-genererade frågor:** frågor som hela tiden anpassas efter vad spelaren kan och hur långt den kommit – byggda av redan verifierad kunskap plus *gränsen* (ett steg bortom). Hybrid: (1) beräknade generatorer där svaret kan räknas fram (matte, fysik, årtal, avstånd), (2) AI skriver formuleringar, kopplingar, ordproblem och bluffpåståenden *förankrade i kunskapsgrafen*, (3) AI med webbsök för nya fakta – med källa. Validering i lager: räkna om svaret, kontrollera mot grafen, en andra AI-granskning, källhänvisning, flagga-knapp för spelare och stickprov av människa; frågor som beter sig konstigt (alla svarar fel) plockas bort automatiskt. Teknik: API-nyckeln får inte ligga i webbläsaren → en liten server/serverlös funktion; cacha och återanvänd frågor; skicka ingen persondata. Första steg: generera frågebanker i omgångar offline, granska och lägg in – sedan generering i realtid.

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
