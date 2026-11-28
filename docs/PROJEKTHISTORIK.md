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
27. **Kompetensmått – "Vad kan jag lösa?" (26 nov 2026):** 20 verkliga problemtyper i sex områden, var och en med de kunskaper (ofta från olika ämnen) som krävs. Spelet räknar ut vilka man kan lösa (svagaste länken), vilka som är ett steg bort och *nästa bästa sak att lära sig* (den kunskap som låser upp flest nya problemtyper). Visuellt facit med ✅/saknas per kunskap och framåtblick: klicka på en kunskap så lyser alla problem den öppnar. Presenteras som en förutsägelse som testas i Uppskattningar och Bluffkollen.
28. **AI-genererade frågor, steg 1 (26 nov 2026):** *generatorer* (`generators.js`) som bygger nya påståenden och uppskattningar ur spelets kunskap varje runda (vilken händelse kom först, var lever djuret, vilken djurgrupp, hur många år mellan två händelser) – rätt svar per konstruktion, märkta ⚙️. En första *AI-omgång* (`quizzes/ai-omgang-1.js`): 12 bluffpåståenden och 6 uppskattningar skrivna av AI, förankrade i spelets kunskap och märkta 🤖. *🚩 Något fel i frågan?* låter spelaren flagga en fråga – den visas inte igen och listas på resultatsidan för granskning. `node tools/validera.js` kontrollerar allt innehåll (referenser, felindex, svar, uträkningar) och kör generatorerna hundratals gånger och räknar om svaren. Samtidigt rättades en krasch på resultatsidan när det fanns historieprogress.
29. **Bidrag från spelare (26 nov 2026):** alla kan fylla på ämnena på samma sätt som det inbyggda innehållet – *ordlistor* (Språk), *historiekategorier*, *sorteringar* (Zoologi) och *recept* – via enkla formulär (en sak per rad, t.ex. `hus = house`) med begripliga felmeddelanden. Bidragen fungerar som allt annat (progress, repetition, kunskapskarta) och märks ✍️ med vem som lagt till dem. Filter: *allt / bara Lärospels innehåll / bara bidrag* och dölj enskilda personer. Bidragen sparas i webbläsaren (gemensamt för spelarna på datorn) och delas som fil; uppladdade filer kontrolleras på nytt. Generatorerna bygger fortfarande bara på Lärospels eget, granskade innehåll. `contrib.js`.
30. **Gamifiering – nivå, svit, period och jämförelse (26 nov 2026):** daglig logg (svar, rätt, nya lärda, återlärda, repetitioner, XP) och tidsstämpel när något lärs in – nu även i matte- och fysikträden. XP (1 per rätt svar, 10 per ny sak, 5 per återlärd, 3 per repetition, 30 per klart steg i träden) ger nivåer med titlar (🌱 Nyfiken → 🏛️ Legend); allt man kunde innan räknas in en gång. Spelarkort på startsidan med nivå, XP-stapel och 🔥 dagar i rad; "+XP" och "⬆️ Ny nivå!" efter en runda. *🏆 Min utveckling*: var du står per ämne, vad du lärt dig idag / 7 dagar / 30 dagar / i år / allt (siffror, stapeldiagram och listan över sakerna) och en topplista med spelarna på datorn – och vänner, via deras sparade progressfil. `gamify.js`.
31. **Mer innehåll (26 nov 2026):** receptet *Pão de queijo* (med fyra vanliga fel i "Vad gick fel?"); 14 nya mattesteg – division, räkneordning, potenser, bråk och procent i Aritmetik, en ny gren *Statistik* (medelvärde, median, variationsbredd), och de tidigare "kommer snart"-grenarna *Sannolikhet* (gynnsamma/möjliga, både och, förväntat antal) och *Analys* (lutning, derivata, största/minsta) – alla med "Det här kan du lösa nu"; 9 nya språkkategorier på alla sex språk (mat & dryck, kroppen, familjen, kläder, dagar & tid, väder & natur, vanliga verb, motsatser, tal 11–1000 – 110 ord).
32. **Fler ordlistor (27 nov 2026):** tre nya språkkategorier på alla sex språk – fraser & hälsningar (12 ord), frågeord & småord (14) och månader & årstider (16).

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
- **"Något skaver?"-anteckningar (att göra):** en liten 📝-knapp på varje sida; anteckningen sparas med sida och tid, och en lista i adminläget kan kopieras eller sparas ner som underlag till att göra-listan.
- **Fler spel (att göra):** regioner och regionhuvudstäder/delstatshuvudstäder i olika länder; konturer – känn igen ett land eller en region på formen; fler språk.
- **Ordfrekvens (att göra):** visa varje ords plats bland språkets vanligaste ord, ett läge med "de N vanligaste orden" i stället för kategorier, och hur stor del av vanlig text orden man kan täcker.
- **Uppskattad språknivå (att göra, på skoj):** "är du på nivå B1 bör du klara det här" – en lekfull uppskattning utifrån ordförråd och lite grammatik, tydligt märkt att den inte är något officiellt resultat.
- **Användartest (att göra):** låt 3–5 personer spela medan man tittar utan att hjälpa – fastna-analys på spelet självt. Använd spelet själv dagligen och anteckna det som skaver.
- **Sundare spelkänsla (att göra):** egna rekord före topplistor, en "frysdag" för sviten, topplistan frivillig – så att sviter inte blir stress och de som ligger efter inte tappar lusten.
- **För vem? (att göra):** välj en tydlig första målgrupp per video/länk, t.ex. vuxna som vill lära sig om, de som lär sig svenska eller vänner med ett visst behov.
- **Tydliga tillbakalänkar och webbläsarens bakåtknapp (åtgärda först):** varje sida ska ha en tydlig väg tillbaka, och bakåtknappen ska fungera inne i spelet i stället för att lämna sidan.
- **Gästläge och direktlänkar (att göra):** spela utan att skapa spelare (namnge senare); delbara länkar direkt till ämne, spel eller kategori, t.ex. …/#/sprak/farger.
- **Grannspråk och dialekter (att göra):** danska och norska för svenskar – markera ord som lika / lika men annorlunda stavade / helt olika / falska vänner och träna bara på skillnaderna; stavnings- och uttalsregler som mönster (ö↔ø, ä↔æ …) med uppläsning. Samma modell kan användas för dialekter.
- **Skalbart och billigt att fylla på (att göra):** en sida i spelet där man klistrar in innehåll (t.ex. från en gratis-AI), får det kontrollerat och kan spara ner det – utan Node eller installation. Matte och fysik som *datamallar* i stället för kod (text med variabler, intervall och en formel för svaret), så att även de kan skrivas av en gratis-AI.
- **Grammatik i Språk (att göra, 28 nov 2026):** genus och artiklar (en/ett, un/une, el/la, o/a …) som sorteringsspel med en korg per artikel; pluraländelser (svenska -ar/-or/-er/-n/oförändrat – bra för den som lär sig svenska); oregelbundna verb (minst som Sporcle-tabell, gärna smartare, t.ex. grupperat efter mönster).
- **Oregelbundna verb efter mönster (att göra):** grupper som *springa–sprang–sprungit*, *dricka–drack–druckit* – t.ex. sortera verb i korgar per mönster.
- **Lyssna och säg (att göra):** uppläsning med webbläsarens talsyntes (gratis, alla moderna webbläsare); säg ordet i mikrofonen med taligenkänning (Chrome/Edge, ljudet går via Google/Microsoft) – grov uttalskoll genom att det igenkända ordet stämmer.
- **Granskning som vem som helst kan göra (att göra, idéutkast):** alla kan granska innehåll, och varje spelare väljer vems granskning den litar på (admin som standard). En granskare får ett eget nyckelpar som skapas i webbläsaren och "signerar" det den granskat – det går att kontrollera utan server och kan inte förfalskas som en vanlig id-kod.
- **Granskat innehåll (att göra):** en admin kryssar i att en fråga/lista är testad och korrekt → ✔️ granskad-märke, som extra spärr mot AI-fel.
- **Fuskläge och adminläge (att göra):** fuskläge = låsa upp allt (det admin-läget gör idag, t.ex. om man tappat sin fil); adminläge = granskning, flaggor och moderering.
- **"Var befinner du dig?" i alla ämnen (att göra):** hoppa fram till rätt nivå med ett kort test, som inplaceringstestet i matte men överallt.
- **Bilder i delbart innehåll (att göra):** emoji och inbäddad SVG i första hand; egna paket kan länka till bilder eller bädda in små bilder i JSON-filen.
- **Ännu säkrare mattegeneratorer (att göra):** valideringen räknar om svaret oberoende (sätter in svaret i ekvationen/formeln), testar alla kombinationer där de är få.
- **"Äg din egen data" – filer i stället för databas (att göra):** utöka från progress till innehållspaket (egna listor, recept …) som delas som fil eller som länk till en publik JSON-fil och kontrolleras i webbläsaren – inget sparas på sajten. Påminnelse om att spara ner progress.
- **Flytt via länk/QR-kod (att göra):** progress (komprimerad, det viktigaste) eller en liten lista i en länk/QR-kod; datan ligger efter # i adressen och skickas aldrig till någon server. Ryms ca 2–3 kB – hela historiken kräver fil.
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
- **Skräddarsydda, AI-genererade frågor:** frågor som hela tiden anpassas efter vad spelaren kan och hur långt den kommit – byggda av redan verifierad kunskap plus *gränsen* (ett steg bortom). Hybrid: (1) beräknade generatorer där svaret kan räknas fram (matte, fysik, årtal, avstånd), (2) AI skriver formuleringar, kopplingar, ordproblem och bluffpåståenden *förankrade i kunskapsgrafen*, (3) AI med webbsök för nya fakta – med källa. Validering i lager: räkna om svaret, kontrollera mot grafen, en andra AI-granskning, källhänvisning, flagga-knapp för spelare och stickprov av människa; frågor som beter sig konstigt (alla svarar fel) plockas bort automatiskt. Teknik: API-nyckeln får inte ligga i webbläsaren → en liten server/serverlös funktion; cacha och återanvänd frågor; skicka ingen persondata. Första steg: generera frågebanker i omgångar offline, granska och lägg in – sedan generering i realtid. *Steg 1 klart 26 nov 2026 (se punkt 28): generatorer, AI-omgång offline, märkning, flaggning och valideringsskript. Kvar: generering i realtid via en server, automatisk bortplockning av frågor som beter sig konstigt.*

**Kul senare**
- **Visuella teman (att göra):** historia, äventyr, rymd … – ett tema är bara lite data (färger, mönstertyp, tillåtna emoji, täthet) och en uppsättning säkra mönstergeneratorer ritar bakgrunden – olika varje gång (ny stjärnhimmel, nytt pergament). Standardtema per ämne och kategori (rymden, medeltiden, upplysningstiden …); egna teman som en fil man kan dela.
- **Ordförråd för ett mål (att göra):** ordpaket för ett syfte – en viss sorts YouTube-kanal, ett yrke, en miljö. Klistra in undertexter eller en text så plockar spelet fram de ord som är typiska för just den och som du inte redan kan.

- **Rörliga bakgrunder (att göra, frivilligt):** blinkande stjärnor, svävande damm – billigt ritat, pausas när fliken inte syns, avstängt för den som valt mindre rörelse.
- **Grammatikspel (att göra):** *grammatik som algebra* – en mening plus operationskort ("gör till dåtid", "gör till fråga", "nekande", "plural") precis som korten i algebran; *grammatikdetektiven* – hitta felet och vilken sorts fel (Bluffkollens motor); *mönster först* – se några exempel, gissa regeln, använd den på ett nytt ord; bygg meningen med ordbrickor (t.ex. ordföljd).
- **Samhällskunskap, nationalekonomi, pedagogik (att göra):** märk varje påstående som 📊 fakta, 🧩 modell (med antaganden) eller ⚖️ värdering – och ett spel "Fakta, modell eller åsikt?"; simuleringar där man kan byta modell och ser antagandena; *steelman* – välj det starkaste argumentet för båda sidor; avvägningskort (vem vinner, vem förlorar, hur stark är forskningen); uppskattningsfrågor om verklig statistik som avslöjar felaktiga föreställningar. Varje påstående med källa och hur säkert det är.

- **Stålmannen – politiska frågor på djupet (att göra):** lär dig de *starkaste* argumenten för alla sidor i stället för halmgubbar. Ett förslag → vilken sida brukar driva det och varför → nivåer som i matteträdet: (1) ytargumenten alla upprepar, (2) varje sidas starkaste argument, (3) kärnfrågorna – de sakfrågor oenigheten egentligen hänger på och hur olika värden vägs. Spel: hitta halmgubben, välj argumentet motsidan själv skulle skriva under på, hitta vilken fakta som skulle ändra slutsatsen, och "värdealgebra" – ändra hur ett värde vägs och se slutsatsen vända. Neutralitet: samma upplägg för alla sidor, källor och säkerhet, och varje sidas argument granskade av personer från den sidan. **Användarna bygger stålmännen (idéutkast):** vem som helst kan lägga till argument och bedöma vilka som är starkast; när man spelar väljer man vems bedömningar man litar på – spelet behöver aldrig själv avgöra vad som är starka argument eller vem som är höger eller vänster. Granskare anger sin egen ståndpunkt i varje fråga (då betyder "godkänt" att de som faktiskt tycker så ser det som sitt bästa argument), och ett extra märke när personer från *båda* sidor tycker att ett argument är rättvist återgivet. Bara granskare man själv valt räknas – aldrig råa antal. **Utgångspunkt i offentliga källor (idéutkast):** AI hämtar varje sidas ståndpunkter och argument ur partiprogram och beskrivningar av ideologier, alltid med citat, länk och datum, så att "parti X skriver …" går att kontrollera. Komplettera med hur partierna faktiskt röstat – riksdagens voteringar är öppna data – så att man kan jämföra vad som sägs med vad som görs.

- **Vem röstade för vad – och när? (att göra):** ett riktigt riksdagsbeslut → sortera partierna i för, emot och avstod; facit från riksdagens öppna voteringsdata med datum och länk. På en tidslinje syns hur ståndpunkter skiftar över åren.
- **Vem sa vad – och när? (att göra):** riktiga citat från politiker med källa, datum och sammanhang – gissa vem som sa det och när. Riksdagens anföranden är också öppna data. Korta, exakta citat, alltid med länk.

**För att gå från prototyp till verktyg för utbildningar och arbetsplatser**
- **Utmaningslänkar och resultatkort (att göra):** "slå mitt resultat" som länk direkt till samma övning, och en bild av resultatet att dela – för att sprida spelet via video och sociala medier.
- **Ladda innehåll per ämne vid behov (att göra när innehållet växer):** idag laddas allt innehåll när sidan öppnas; dela upp så att bara det ämne man spelar hämtas.
- **Egen domän (att göra, gärna tidigt):** ser seriösare ut; byt innan det finns många användare – ny adress betyder tom webbläsarlagring och att alla måste ladda upp sin sparade fil. Licens och upphovsrättsrad i sidfoten.
- **AI utan nycklar hos oss (att göra):** färdiga promptar per sorts innehåll som användaren tar med till sin egen AI och klistrar tillbaka i spelets kontrollsida. Senare eventuellt egen nyckel som bara sparas i användarens webbläsare.
- Bidrag från spelare som delas direkt (utan fil) – kräver en server; då behövs också granskning/moderering. Fler sorters bidrag: geografiplatser (klicka på kartan), bluffpåståenden, uppskattningar, felsökningsfall.
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
