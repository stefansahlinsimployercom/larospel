// Spår: Bygg & konstruktion – dra delarna till rätt plats på ritningen.
// En konstruktion:
//   icons:  true = delarna visas med ikoner (enkla saker), false = bara text (komplexa saker)
//   shapes: ritningen i koordinater 0–100 (bredd) × 0–60 (höjd)
//   slots:  platser { id, x, y, n: delens namn, e: ikon, hint: vad som sitter här (funktion), info: fördjupning }
//   decoys: delar som inte hör hemma { n, e, why }
//   tour:   ordningen när maskinen "startas" – [slot-id, text]
(window.TRACKS ||= []).push({
  id: 'bygg', name: 'Bygg & konstruktion', icon: '🛠️', type: 'build',
  builds: [
    {
      id: 'dator', name: 'Datorn', icon: '💻', icons: true, start: 'Starta datorn',
      intro: 'En stationär dator inifrån. Dra in delarna på rätt plats i chassit.',
      shapes: [
        { t: 'rect', x: 4, y: 3, w: 92, h: 54, cls: 'case' },
        { t: 'rect', x: 34, y: 5, w: 56, h: 40, cls: 'board' },
        { t: 'rect', x: 7, y: 42, w: 24, h: 13, cls: 'part' },
        { t: 'rect', x: 7, y: 12, w: 22, h: 18, cls: 'part' },
        { t: 'rect', x: 44, y: 9, w: 10, h: 10, cls: 'chip' },
        { t: 'rect', x: 66, y: 7, w: 2, h: 18, cls: 'chip' }, { t: 'rect', x: 70, y: 7, w: 2, h: 18, cls: 'chip' },
        { t: 'rect', x: 37, y: 36, w: 46, h: 7, cls: 'part' },
        { t: 'circle', cx: 92, cy: 12, r: 3.5, cls: 'part' },
      ],
      slots: [
        { id: 'psu', x: 19, y: 49, n: 'Nätaggregat', e: '🔌', hint: 'Tar emot el från vägguttaget och ger rätt spänning till alla delar.', info: 'Nätaggregatet (PSU) omvandlar 230 V växelström till de låga likspänningar (bl.a. 12 V, 5 V och 3,3 V) som datorns delar behöver.' },
        { id: 'mobo', x: 82, y: 33, n: 'Moderkort', e: '🟩', hint: 'Den stora kretsskivan som alla andra delar kopplas in i.', info: 'Moderkortet är datorns "ryggrad" – det kopplar ihop processor, minne, lagring och grafikkort så att de kan prata med varandra.' },
        { id: 'cpu', x: 49, y: 14, n: 'Processor', e: '🧠', hint: 'Datorns "hjärna" som räknar och kör programmen.', info: 'Processorn (CPU) utför programmens instruktioner – miljarder per sekund.' },
        { id: 'cool', x: 49, y: 27, n: 'Processorkylare', e: '❄️', hint: 'Sitter ovanpå hjärnan och hindrar den från att bli för varm.', info: 'Processorn blir varm när den jobbar. Kylaren leder bort värmen med kylflänsar och en fläkt (eller vätska).' },
        { id: 'ram', x: 74, y: 16, n: 'RAM-minne', e: '📏', hint: 'Snabbt arbetsminne för det som används just nu. Töms när datorn stängs av.', info: 'RAM är datorns korttidsminne. Mer RAM gör att fler program kan vara igång samtidigt utan att datorn blir seg.' },
        { id: 'gpu', x: 60, y: 40, n: 'Grafikkort', e: '🎮', hint: 'Räknar fram bilden som visas på skärmen.', info: 'Grafikkortet (GPU) är specialiserat på att räkna många saker parallellt – perfekt för spel, video och AI.' },
        { id: 'ssd', x: 18, y: 21, n: 'SSD (lagring)', e: '💾', hint: 'Sparar filer och program även när strömmen är av.', info: 'SSD:n är datorns långtidsminne. Den saknar rörliga delar och är mycket snabbare än gamla hårddiskar.' },
        { id: 'fan', x: 92, y: 12, n: 'Chassifläkt', e: '🌀', hint: 'Blåser ut varm luft ur lådan.', info: 'Chassifläktar skapar ett luftflöde genom datorn så att den varma luften kommer ut.' },
      ],
      decoys: [
        { n: 'Tändstift', e: '⚡', why: 'Tändstift tänder bränslet i en bilmotor – inget som behövs i en dator.' },
        { n: 'Pappersmagasin', e: '📄', why: 'Ett pappersmagasin sitter i en skrivare, inte inne i datorn.' },
      ],
      tour: [
        ['psu', 'Du trycker på startknappen. Nätaggregatet skickar ström till alla delar.'],
        ['mobo', 'Moderkortet vaknar och kontrollerar att allt är inkopplat.'],
        ['ssd', 'Operativsystemet (t.ex. Windows) läses in från SSD:n…'],
        ['ram', '…till RAM-minnet, där processorn snabbt kommer åt det.'],
        ['cpu', 'Processorn börjar köra programmen.'],
        ['gpu', 'Grafikkortet räknar fram bilden till skärmen.'],
        ['cool', 'Processorn blir varm – kylaren leder bort värmen…'],
        ['fan', '…och chassifläkten blåser ut den varma luften. Datorn är igång! 🎉'],
      ],
    },
    {
      id: 'bil', name: 'Bilen', icon: '🚗', icons: true, start: 'Starta bilen',
      intro: 'En vanlig bil med förbränningsmotor, sedd från sidan (fronten åt vänster). Dra in delarna där de sitter.',
      shapes: [
        { t: 'path', d: 'M4 40 L4 30 Q6 24 14 23 L30 22 L40 10 L70 10 L82 22 L94 25 Q97 28 96 40 Z', cls: 'case' },
        { t: 'line', x1: 30, y1: 22, x2: 82, y2: 22, cls: 'thin' },
        { t: 'circle', cx: 22, cy: 44, r: 8, cls: 'wheel' }, { t: 'circle', cx: 78, cy: 44, r: 8, cls: 'wheel' },
        { t: 'line', x1: 22, y1: 44, x2: 78, y2: 44, cls: 'thin' },
      ],
      slots: [
        { id: 'kyl', x: 7, y: 31, n: 'Kylare', e: '🌡️', hint: 'Längst fram – kyler motorns kylvätska med fartvinden.', info: 'Kylaren sitter längst fram där luften strömmar in. Kylvätskan pumpas runt i motorn och kyls här.' },
        { id: 'motor', x: 20, y: 31, n: 'Motor', e: '⚙️', hint: 'Förbränner bränsle och gör om det till rörelse.', info: 'I motorns cylindrar exploderar en blandning av bränsle och luft och trycker ner kolvar – det får vevaxeln att snurra.' },
        { id: 'batt', x: 28, y: 18, n: 'Batteri', e: '🔋', hint: 'Ger ström för att starta motorn och till lampor och elektronik.', info: 'Bilbatteriet (12 V) driver startmotorn. När motorn går laddas det av generatorn.' },
        { id: 'vax', x: 35, y: 33, n: 'Växellåda', e: '🔀', hint: 'Sitter direkt bakom motorn och anpassar motorns varvtal till farten.', info: 'Växellådan gör att motorn kan arbeta på ett lagom varvtal både när bilen kör sakta och fort.' },
        { id: 'ratt', x: 47, y: 16, n: 'Ratt', e: '🛞', hint: 'Föraren styr hjulen med den.', info: 'Ratten är kopplad via styrstången till framhjulen – oftast med servo som gör det lätt att svänga.' },
        { id: 'axel', x: 52, y: 44, n: 'Drivaxel', e: '➖', hint: 'För över kraften från växellådan till hjulen.', info: 'Drivaxeln överför motorns kraft till de drivande hjulen.' },
        { id: 'broms', x: 22, y: 51, n: 'Broms', e: '🛑', hint: 'Sitter vid hjulen och bromsar med friktion.', info: 'Skivbromsar klämmer bromsbelägg mot en skiva som sitter på hjulet – rörelseenergin blir värme.' },
        { id: 'tank', x: 74, y: 31, n: 'Bränsletank', e: '⛽', hint: 'Långt bak, skyddad under bilen – här förvaras bensinen.', info: 'Tanken sitter oftast under baksätet eller bakom bakaxeln, där den är skyddad vid krockar.' },
        { id: 'avgas', x: 91, y: 44, n: 'Avgassystem', e: '💨', hint: 'Leder ut avgaserna bakåt och dämpar ljudet.', info: 'Avgassystemet med katalysator och ljuddämpare renar och tystar avgaserna innan de släpps ut längst bak.' },
      ],
      decoys: [
        { n: 'Grafikkort', e: '🎮', why: 'Grafikkort sitter i datorer – inte i en bils drivlina.' },
        { n: 'Propeller', e: '🌀', why: 'Propellrar driver båtar och flygplan. En bil drivs via hjulen.' },
      ],
      tour: [
        ['batt', 'Du vrider om nyckeln. Batteriet driver startmotorn som drar runt motorn.'],
        ['tank', 'Bränslepumpen hämtar bensin från tanken…'],
        ['motor', '…och i motorn exploderar bränsle och luft och trycker ner kolvarna.'],
        ['kyl', 'Motorn blir varm – kylvätskan kyls i kylaren längst fram.'],
        ['vax', 'Kraften går via växellådan…'],
        ['axel', '…och drivaxeln ut till hjulen. Bilen rullar!'],
        ['ratt', 'Du styr med ratten.'],
        ['avgas', 'Avgaserna renas och leds ut bakåt.'],
        ['broms', 'Vid rödljus bromsar du – rörelseenergin blir värme i bromsarna. 🎉'],
      ],
    },
    {
      id: 'karnkraft', name: 'Kärnkraftverket', icon: '⚛️', icons: false, start: 'Starta kraftverket',
      intro: 'En kokvattenreaktor – den vanligaste typen i Sverige (t.ex. Forsmark). Delarna är för många för ikoner, så här jobbar du med text.',
      shapes: [
        { t: 'rect', x: 3, y: 4, w: 30, h: 52, cls: 'case' },
        { t: 'rect', x: 11, y: 12, w: 14, h: 38, cls: 'board', rx: 6 },
        { t: 'line', x1: 18, y1: 12, x2: 18, y2: 8, cls: 'pipe' }, { t: 'line', x1: 18, y1: 8, x2: 44, y2: 8, cls: 'pipe' },
        { t: 'line', x1: 44, y1: 8, x2: 44, y2: 12, cls: 'pipe' },
        { t: 'line', x1: 62, y1: 16, x2: 66, y2: 16, cls: 'thin' }, { t: 'line', x1: 84, y1: 16, x2: 86, y2: 16, cls: 'thin' },
        { t: 'line', x1: 52, y1: 22, x2: 52, y2: 32, cls: 'pipe' },
        { t: 'line', x1: 44, y1: 44, x2: 30, y2: 44, cls: 'pipe' },
        { t: 'line', x1: 62, y1: 40, x2: 68, y2: 40, cls: 'water' }, { t: 'line', x1: 62, y1: 44, x2: 68, y2: 44, cls: 'water' },
      ],
      slots: [
        { id: 'cont', x: 18, y: 54, n: 'Reaktorinneslutning', hint: 'En tjock betongbyggnad runt reaktorn som ska hålla kvar radioaktiva ämnen om något går fel.', info: 'Inneslutningen är en barriär av stålarmerad betong. Den är en av flera säkerhetsbarriärer mellan bränslet och omgivningen.' },
        { id: 'tank', x: 18, y: 17, n: 'Reaktortank', hint: 'Ett jättelikt tjockväggigt stålkärl fyllt med vatten, där härden sitter.', info: 'Reaktortanken håller vattnet under högt tryck. I en kokvattenreaktor kokar vattnet direkt i tanken.' },
        { id: 'core', x: 18, y: 30, n: 'Bränslestavar (härden)', hint: 'Här klyvs urankärnor – det frigör enorma mängder värme.', info: 'Bränslet är urandioxid i form av små kutsar i långa rör. När urankärnor klyvs frigörs värme som kokar vattnet.' },
        { id: 'rods', x: 18, y: 43, n: 'Styrstavar', hint: 'Skjuts in underifrån och fångar neutroner – bromsar eller stoppar kedjereaktionen.', info: 'Styrstavarna innehåller ämnen som fångar neutroner. Skjuts de in helt stoppas reaktorn på några sekunder.' },
        { id: 'turb', x: 52, y: 16, n: 'Ångturbin', hint: 'Ångan strömmar hit och får skovlarna att snurra.', info: 'Turbinen fungerar som ett snurrande hjul med tusentals skovlar som ångan blåser på.' },
        { id: 'gen', x: 75, y: 16, n: 'Generator', hint: 'Sitter på samma axel som turbinen och gör om rörelse till el.', info: 'Generatorn fungerar med magneter och kopparlindning – när axeln snurrar induceras elektrisk ström.' },
        { id: 'grid', x: 93, y: 16, n: 'Transformator & elnät', hint: 'Höjer spänningen och skickar ut elen till samhället.', info: 'Transformatorn höjer spänningen (till t.ex. 400 kV) så att elen kan transporteras långt med små förluster.' },
        { id: 'cond', x: 52, y: 38, n: 'Kondensor', hint: 'Kyler ångan så att den blir vatten igen.', info: 'I kondensorn kyls ångan av tusentals rör med kallt vatten – ångan kondenserar och kan pumpas tillbaka.' },
        { id: 'sea', x: 82, y: 42, n: 'Kylvatten från havet', hint: 'Stora mängder kallt vatten som tar hand om restvärmen.', info: 'Svenska kärnkraftverk ligger vid kusten och använder havsvatten för att kyla kondensorn. Vattnet kommer tillbaka några grader varmare.' },
        { id: 'pump', x: 37, y: 49, n: 'Matarvattenpump', hint: 'Pumpar tillbaka vattnet till reaktortanken.', info: 'Matarvattenpumparna trycker in vattnet i reaktortanken igen – kretsloppet är slutet.' },
      ],
      decoys: [
        { n: 'Kolpanna', why: 'I ett kolkraftverk eldas kol – i ett kärnkraftverk kommer värmen från kärnklyvning.' },
        { n: 'Solpaneler', why: 'Solpaneler gör el direkt av solljus. Ett kärnkraftverk gör el via ånga och turbin.' },
      ],
      tour: [
        ['core', 'Urankärnor klyvs i härden. Det frigör värme…'],
        ['tank', '…som får vattnet i reaktortanken att koka till ånga.'],
        ['rods', 'Styrstavarna reglerar hur intensivt kedjereaktionen pågår.'],
        ['turb', 'Ångan strömmar till turbinen och får den att snurra.'],
        ['gen', 'Generatorn på samma axel gör om rörelsen till el.'],
        ['grid', 'Transformatorn höjer spänningen och elen går ut på nätet.'],
        ['cond', 'Ångan kyls i kondensorn och blir vatten igen…'],
        ['sea', '…med hjälp av kallt havsvatten.'],
        ['pump', 'Matarvattenpumpen trycker tillbaka vattnet till reaktorn.'],
        ['cont', 'Allt sker innanför säkerhetsbarriärer som inneslutningen. Kraftverket är igång! ⚡'],
      ],
    },
  ],
});
