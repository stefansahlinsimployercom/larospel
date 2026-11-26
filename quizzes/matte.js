// Spår: Matte – ett färdighetsträd.
// Grenar består av noder (trappsteg). Varje nod tränar EN ny sak och har en generator
// som hittar på nya uppgifter med slumpade tal.
//   req:  noder som måste vara klara innan noden låses upp (kan ligga i andra grenar)
//   gen:  returnerar antingen
//         { text: '7 · 8', answer: 56 }                     – räkneuppgift (bara snabbräkning)
//         { eq: { L: {...}, R: {...} }, answer: 5 }         – ekvation (båda lägena)
//         En ekvationssida: { x, k, m, ix, ik } = m·(ix·x + ik) + x·x + k  (saknade fält = 0)
//   soon: true = syns i trädet men är inte byggd än
(() => {
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const coin = () => Math.random() < 0.5;
  const neg = n => (n < 0 ? `(−${-n})` : String(n));
  const sq = x => x * x;

  // Formler för geometri. tpl = uträkningen med {0}, {1} … där måtten dras in.
  // what = vad formeln räknar ut (visas när man väljer fel formel).
  const GF = {
    rectA: { label: 'A = b · h', tpl: '{0} · {1}', fn: (a, b) => a * b, what: 'arean av en rektangel' },
    rectO: { label: 'O = 2 · b + 2 · h', tpl: '2 · {0} + 2 · {1}', fn: (a, b) => 2 * a + 2 * b, what: 'omkretsen av en rektangel' },
    rectWrongO: { label: 'O = b + h', tpl: '{0} + {1}', fn: (a, b) => a + b, what: 'bara halva omkretsen – två av sidorna saknas' },
    triA: { label: 'A = b · h / 2', tpl: '{0} · {1} / 2', fn: (a, b) => a * b / 2, what: 'arean av en triangel' },
    triO: { label: 'O = a + b + c', tpl: '{0} + {1} + {2}', fn: (a, b, c) => a + b + c, what: 'omkretsen av en triangel' },
    circA: { label: 'A = π · r²', tpl: '3,14 · {0}²', fn: x => 3.14 * x * x, what: 'arean av en cirkel' },
    circOd: { label: 'O = π · d', tpl: '3,14 · {0}', fn: x => 3.14 * x, what: 'omkretsen av en cirkel' },
    circOr: { label: 'O = 2 · π · r', tpl: '2 · 3,14 · {0}', fn: x => 6.28 * x, what: 'omkretsen av en cirkel' },
    circWrongA: { label: 'A = 2 · π · r', tpl: '2 · 3,14 · {0}', fn: x => 6.28 * x, what: 'omkretsen – inte arean (arean har r²)' },
    pythC: { label: 'c² = a² + b²', tpl: '√({0}² + {1}²)', fn: (a, b) => Math.sqrt(sq(a) + sq(b)), what: 'hypotenusan' },
    pythSum: { label: 'c = a + b', tpl: '{0} + {1}', fn: (a, b) => a + b, what: 'ingenting – sidorna kan inte bara läggas ihop' },
    pythMinusC: { label: 'c² = a² − b²', tpl: '√({0}² − {1}²)', fn: (a, b) => Math.sqrt(sq(a) - sq(b)), what: 'ingenting – för hypotenusan ska kvadraterna adderas' },
    pythB: { label: 'b² = c² − a²', tpl: '√({0}² − {1}²)', fn: (c, a) => Math.sqrt(sq(c) - sq(a)), what: 'en katet' },
    pythPlusB: { label: 'b² = c² + a²', tpl: '√({0}² + {1}²)', fn: (c, a) => Math.sqrt(sq(c) + sq(a)), what: 'något längre än hypotenusan – men kateten är kortare!' },
    pythDiff: { label: 'b = c − a', tpl: '{0} − {1}', fn: (c, a) => c - a, what: 'ingenting – Pythagoras gäller kvadraterna' },
  };
  Object.entries(GF).forEach(([id, f]) => { f.id = id; f.n = (f.tpl.match(/\{\d\}/g) || []).length; });
  const PYTH = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25]];

  // Bygger en geometriuppgift av en beskrivning (se math.js → playGeo)
  function geoTask(o) {
    const f = GF[o.sol.f];
    const answer = f.fn(...o.sol.slots);
    const chips = [...new Set(o.chips)].sort(() => Math.random() - 0.5);
    return {
      text: o.text, answer, tol: o.tol || 0,
      geo: { ...o, chips, answer, formulas: o.formulas.slice().sort(() => Math.random() - 0.5), correct: o.alsoOk?.length ? o.alsoOk : [o.sol.f] },
    };
  }

  (window.TRACKS ||= []).push({
    id: 'matte', name: 'Matte', icon: '➗', type: 'tree',
    branches: [
      {
        id: 'aritmetik', name: 'Aritmetik', icon: '🔢',
        nodes: [
          {
            id: 'ar-tabell', name: 'Multiplikationstabellen', req: [],
            desc: 'Multiplicera två tal upp till 10.',
            gen: () => { const a = r(2, 10), b = r(2, 10); return { text: `${a} · ${b}`, answer: a * b }; },
          },
          {
            id: 'ar-neg', name: 'Negativa tal', req: [],
            desc: 'Addera och subtrahera när talen kan vara negativa.',
            gen: () => {
              const a = r(-10, 10), b = r(-10, 10);
              const s = a < 0 ? `−${-a}` : String(a);
              return coin() ? { text: `${s} + ${neg(b)}`, answer: a + b } : { text: `${s} − ${neg(b)}`, answer: a - b };
            },
          },
        ],
      },
      {
        id: 'algebra', name: 'Algebra', icon: '🧮',
        nodes: [
          {
            id: 'al1', name: 'x + a = b', req: [],
            desc: 'Ett steg: få x ensamt genom att lägga till eller dra bort samma tal på båda sidor.',
            gen: () => {
              const a = r(1, 12);
              if (coin()) { const x = r(1, 15); return { eq: { L: { x: 1, k: a }, R: { k: x + a } }, answer: x }; }
              const x = r(a + 1, a + 15); return { eq: { L: { x: 1, k: -a }, R: { k: x - a } }, answer: x };
            },
          },
          {
            id: 'al2', name: 'ax = b', req: ['al1'],
            desc: 'Ett steg: dela båda sidor med talet framför x.',
            gen: () => { const a = r(2, 9), x = r(1, 12); return { eq: { L: { x: a }, R: { k: a * x } }, answer: x }; },
          },
          {
            id: 'al3', name: 'ax + b = c', req: ['al2'],
            desc: 'Två steg: först bort med konstanten, sedan dela.',
            gen: () => {
              const a = r(2, 9), x = r(1, 10);
              const b = coin() ? r(1, 12) : -r(1, Math.min(12, a * x - 1));
              return { eq: { L: { x: a, k: b }, R: { k: a * x + b } }, answer: x };
            },
          },
          {
            id: 'al4', name: 'x på båda sidor', req: ['al3'],
            desc: 'Samla alla x på en sida först, sedan som förut.',
            gen: () => {
              const c = r(1, 6), a = c + r(1, 5), x = r(1, 10), b = r(1, 12);
              return { eq: { L: { x: a, k: b }, R: { x: c, k: (a - c) * x + b } }, answer: x };
            },
          },
          {
            id: 'al5', name: 'Parenteser', req: ['al3'],
            desc: 'Antingen multiplicera in parentesen – eller dela båda sidor med talet framför den.',
            gen: () => {
              const m = r(2, 6);
              const b = coin() ? r(1, 9) : -r(1, 9);
              const x = b < 0 ? r(-b + 1, -b + 10) : r(1, 10);
              return { eq: { L: { m, ix: 1, ik: b }, R: { k: m * (x + b) } }, answer: x };
            },
          },
        ],
      },
      {
        id: 'geometri', name: 'Geometri', icon: '📐',
        nodes: [
          {
            id: 'ge1', name: 'Rektangel', req: [],
            desc: 'Area eller omkrets av en rektangel. Välj formel, dra in måtten och räkna.',
            gen: () => {
              const w = r(3, 12), h = r(2, 9), area = coin();
              return geoTask({
                fig: { type: 'rect', w, h },
                question: area ? 'Hur stor är rektangelns area?' : 'Hur lång är rektangelns omkrets?',
                text: `Rektangel ${w} × ${h} cm – ${area ? 'area' : 'omkrets'}?`,
                formulas: [GF.rectA, GF.rectO, GF.triA, GF.rectWrongO],
                sol: { f: area ? 'rectA' : 'rectO', slots: [w, h] },
                chips: [w, h],
                ansLabel: area ? 'A' : 'O', unit: area ? 'cm²' : 'cm',
              });
            },
          },
          {
            id: 'ge2', name: 'Triangelns area', req: ['ge1'],
            desc: 'Arean av en triangel. Se upp: det är höjden som gäller, inte den sneda sidan!',
            gen: () => {
              const [h, off, s] = [[4, 3, 5], [3, 4, 5], [8, 6, 10], [6, 8, 10], [12, 5, 13], [5, 12, 13]][r(0, 5)];
              let b = off + r(2, 8); if ((b * h) % 2) b++;
              return geoTask({
                fig: { type: 'tri', b, h, off, s },
                question: 'Hur stor är triangelns area?',
                text: `Triangel med basen ${b} cm och höjden ${h} cm – area?`,
                formulas: [GF.triA, GF.rectA, GF.triO],
                sol: { f: 'triA', slots: [b, h] },
                chips: [b, h, s],
                ansLabel: 'A', unit: 'cm²',
              });
            },
          },
          {
            id: 'ge3', name: 'Cirkeln', req: ['ge2'],
            desc: 'Area och omkrets av en cirkel med π ≈ 3,14. Avrunda svaret till heltal. Radie eller diameter – vilken behöver formeln?',
            gen: () => {
              const rad = r(2, 10), showD = coin(), area = coin();
              const shown = showD ? 2 * rad : rad;
              return geoTask({
                fig: { type: 'circle', r: rad, showD },
                question: (area ? 'Hur stor är cirkelns area?' : 'Hur lång är cirkelns omkrets?') + ' (π ≈ 3,14, avrunda till heltal)',
                text: `Cirkel med ${showD ? 'diametern' : 'radien'} ${shown} cm – ${area ? 'area' : 'omkrets'}? (π ≈ 3,14, heltal)`,
                formulas: [GF.circA, GF.circOd, GF.circOr, GF.circWrongA],
                sol: area ? { f: 'circA', slots: [rad] } : showD ? { f: 'circOd', slots: [2 * rad] } : { f: 'circOr', slots: [rad] },
                alsoOk: area ? [] : ['circOd', 'circOr'],
                chips: [shown, shown / 2, shown * 2],
                ansLabel: area ? 'A' : 'O', unit: area ? 'cm²' : 'cm', tol: 1,
              });
            },
          },
          {
            id: 'ge4', name: 'Pythagoras: hypotenusan', req: ['ge3'],
            desc: 'I en rätvinklig triangel är c² = a² + b². Räkna ut den längsta sidan.',
            gen: () => {
              let [a, b, c] = PYTH[r(0, PYTH.length - 1)]; if (coin()) [a, b] = [b, a];
              return geoTask({
                fig: { type: 'right', a, b, c, unknown: 'c' },
                question: 'Hur lång är hypotenusan c?',
                text: `Rätvinklig triangel med kateterna ${a} och ${b} cm – hypotenusan?`,
                formulas: [GF.pythC, GF.pythSum, GF.pythMinusC],
                sol: { f: 'pythC', slots: [a, b] },
                chips: [a, b, a + b],
                ansLabel: 'c', unit: 'cm',
              });
            },
          },
          {
            id: 'ge5', name: 'Pythagoras: en katet', req: ['ge4'],
            desc: 'Nu är hypotenusan känd men en katet saknas. Samma sats – men vänd på den!',
            gen: () => {
              let [a, b, c] = PYTH[r(0, PYTH.length - 1)]; if (coin()) [a, b] = [b, a];
              return geoTask({
                fig: { type: 'right', a, b, c, unknown: 'b' },
                question: 'Hur lång är kateten b?',
                text: `Rätvinklig triangel med hypotenusan ${c} och kateten ${a} cm – andra kateten?`,
                formulas: [GF.pythB, GF.pythPlusB, GF.pythDiff],
                sol: { f: 'pythB', slots: [c, a] },
                chips: [c, a, c - a],
                ansLabel: 'b', unit: 'cm',
              });
            },
          },
        ],
      },
      {
        id: 'sannolikhet', name: 'Sannolikhet', icon: '🎲',
        nodes: [{ id: 'sa1', name: 'Gynnsamma / möjliga', req: ['ar-tabell'], soon: true }],
      },
      {
        id: 'analys', name: 'Analys', icon: '📈',
        nodes: [{ id: 'an1', name: 'Derivata', req: ['al5'], soon: true }],
      },
    ],
  });

  // ---------- Ordproblem (frivilligt läge) ----------
  // Varje mall är en egen generator och returnerar:
  //   text:     [[tal]] blir dragbara tal, {{signalord}} markeras av ledtråden
  //   x:        vad x står för – första är rätt, resten lockande fel
  //   shape:    rätt ekvationsform (se SHAPES i math.js); shapes: formerna att välja bland
  //   slots:    talen i rätt ordning för formen
  //   answer, sentence: svaret och svarsmeningen (___ = där svaret skrivs)
  const NAMES = ['Sara', 'Ali', 'Elin', 'Omar', 'Maja', 'Leo', 'Nora', 'Hugo', 'Alva', 'Noah'];
  const pick = a => a[r(0, a.length - 1)];
  const two = () => { const a = pick(NAMES); let b; do b = pick(NAMES); while (b === a); return [a, b]; };

  const ST = {
    al1: [
      () => {
        const N = pick(NAMES), a = r(3, 15), x = r(2, 20), b = x + a;
        return {
          text: `${N} hade några klistermärken. ${N} {{fick}} [[${a}]] {{till}} av en kompis och har nu [[${b}]] stycken. Hur många klistermärken hade ${N} från början?`,
          x: ['antal klistermärken från början', 'antal från kompisen', 'antal klistermärken nu'],
          shape: 'xpa', shapes: ['xpa', 'xma', 'ax'], slots: [a, b], answer: x,
          sentence: `${N} hade ___ klistermärken från början.`,
        };
      },
      () => {
        const a = r(5, 30), x = a + r(5, 40), b = x - a;
        return {
          text: `Ett tåg stannar vid en station. [[${a}]] passagerare {{kliver av}} och nu sitter det [[${b}]] passagerare kvar. Hur många passagerare fanns det på tåget från början?`,
          x: ['antal passagerare från början', 'antal som klev av', 'antal som är kvar'],
          shape: 'xma', shapes: ['xpa', 'xma', 'ax'], slots: [a, b], answer: x,
          sentence: 'Från början fanns det ___ passagerare.',
        };
      },
      () => {
        const N = pick(NAMES), x = r(6, 15), a = r(2, 9), b = x + a;
        return {
          text: `${N} är [[${a}]] år {{äldre än}} sin kusin. ${N} är [[${b}]] år. Hur gammal är kusinen?`,
          x: ['kusinens ålder', `${N}s ålder`, 'åldersskillnaden'],
          shape: 'xpa', shapes: ['xpa', 'xma', 'ax'], slots: [a, b], answer: x,
          sentence: 'Kusinen är ___ år.',
        };
      },
    ],
    al2: [
      () => {
        const a = r(2, 6), x = r(8, 40) * 5, b = a * x;
        return {
          text: `[[${a}]] kompisar delar {{lika}} på en restaurangnota på [[${b}]] kr. Hur mycket betalar var och en?`,
          x: ['vad var och en betalar', 'hela notan', 'antal kompisar'],
          shape: 'ax', shapes: ['ax', 'xpa', 'xma'], slots: [a, b], answer: x,
          sentence: 'Var och en betalar ___ kr.',
        };
      },
      () => {
        const N = pick(NAMES), a = r(2, 8), x = r(8, 16) * 10, b = a * x;
        return {
          text: `${N} köper [[${a}]] biobiljetter som kostar lika mycket och betalar [[${b}]] kr {{totalt}}. Vad kostar {{en}} biljett?`,
          x: ['priset för en biljett', 'totalpriset', 'antal biljetter'],
          shape: 'ax', shapes: ['ax', 'xpa', 'xma'], slots: [a, b], answer: x,
          sentence: 'En biljett kostar ___ kr.',
        };
      },
      () => {
        const N = pick(NAMES), a = r(3, 10), x = r(2, 10) * 10, b = a * x;
        return {
          text: `${N} sparar lika mycket {{varje vecka}}. Efter [[${a}]] veckor har ${N} sparat [[${b}]] kr. Hur mycket sparar ${N} {{per}} vecka?`,
          x: ['summan per vecka', 'antal veckor', 'summan totalt'],
          shape: 'ax', shapes: ['ax', 'xpa', 'xma'], slots: [a, b], answer: x,
          sentence: `${N} sparar ___ kr per vecka.`,
        };
      },
    ],
    al3: [
      () => {
        const N = pick(NAMES), a = r(4, 12) * 10, b = r(5, 30) * 10, x = r(2, 12), age = r(16, 60);
        return {
          text: `Ett gym tar [[${b}]] kr i startavgift och [[${a}]] kr {{per}} besök. ${N}, som är [[${age}]] år, har betalat [[${a * x + b}]] kr {{totalt}}. Hur många gånger har ${N} tränat?`,
          x: ['antal besök', 'pris per besök', 'totalt betalt'],
          shape: 'axb', shapes: ['axb', 'mxb', 'ax'], slots: [a, b, a * x + b], answer: x,
          sentence: `${N} har tränat ___ gånger.`,
        };
      },
      () => {
        const N = pick(NAMES), a = r(9, 18), b = r(4, 9) * 10, x = r(2, 25);
        return {
          text: `En taxiresa kostar [[${b}]] kr i startavgift {{plus}} [[${a}]] kr {{per}} kilometer. ${N}s resa kostade [[${a * x + b}]] kr. Hur många kilometer åkte ${N}?`,
          x: ['antal kilometer', 'pris per kilometer', 'startavgiften'],
          shape: 'axb', shapes: ['axb', 'mxb', 'ax'], slots: [a, b, a * x + b], answer: x,
          sentence: `${N} åkte ___ kilometer.`,
        };
      },
      () => {
        const N = pick(NAMES), a = r(2, 5), x = r(8, 20) * 10, b = r(2, 8) * 5;
        return {
          text: `${N} köper [[${a}]] lika dyra böcker och en tidning för [[${b}]] kr. {{Totalt}} blir det [[${a * x + b}]] kr. Vad kostar en bok?`,
          x: ['priset för en bok', 'antal böcker', 'priset för tidningen'],
          shape: 'axb', shapes: ['axb', 'mxb', 'ax'], slots: [a, b, a * x + b], answer: x,
          sentence: 'En bok kostar ___ kr.',
        };
      },
    ],
    al4: [
      () => {
        const c = r(1, 4) * 10, a = c + r(1, 4) * 10, x = r(2, 10), b = r(5, 15) * 10, d = (a - c) * x + b;
        return {
          text: `Mobilabonnemang A kostar [[${b}]] kr i månaden plus [[${a}]] kr {{per}} GB. Abonnemang B kostar [[${d}]] kr i månaden plus [[${c}]] kr {{per}} GB. Vid hur många GB kostar de {{lika mycket}}?`,
          x: ['antal GB', 'månadsavgiften', 'priset per GB'],
          shape: 'axbcxd', shapes: ['axbcxd', 'axb', 'mxb'], slots: [a, b, c, d], answer: x,
          sentence: 'Vid ___ GB kostar de lika mycket.',
        };
      },
      () => {
        const [N, M] = two(), c = r(2, 6) * 10, a = c + r(1, 5) * 10, x = r(2, 12), b = r(1, 10) * 10, d = (a - c) * x + b;
        return {
          text: `${N} har [[${b}]] kr och sparar [[${a}]] kr {{i veckan}}. ${M} har [[${d}]] kr och sparar [[${c}]] kr {{i veckan}}. Efter hur många veckor har de {{lika mycket}}?`,
          x: ['antal veckor', 'pengar från början', 'sparande per vecka'],
          shape: 'axbcxd', shapes: ['axbcxd', 'axb', 'mxb'], slots: [a, b, c, d], answer: x,
          sentence: 'Efter ___ veckor har de lika mycket.',
        };
      },
    ],
    al5: [
      () => {
        const m = r(2, 6), b = r(2, 5) * 5, x = r(8, 15) * 10;
        return {
          text: `[[${m}]] kompisar köper {{var sin}} pizza och {{var sin}} dricka för [[${b}]] kr. {{Totalt}} kostar det [[${m * (x + b)}]] kr. Vad kostar en pizza?`,
          x: ['priset för en pizza', 'antal kompisar', 'priset för en dricka'],
          shape: 'mxb', shapes: ['mxb', 'axb', 'ax'], slots: [m, b, m * (x + b)], answer: x,
          sentence: 'En pizza kostar ___ kr.',
        };
      },
      () => {
        const N = pick(NAMES), m = r(2, 6), b = r(1, 4) * 10, x = r(8, 15) * 10;
        return {
          text: `En konsertbiljett kostar ett grundpris {{plus}} en serviceavgift på [[${b}]] kr. ${N} köper [[${m}]] biljetter och betalar [[${m * (x + b)}]] kr {{totalt}}. Vad är grundpriset för en biljett?`,
          x: ['grundpriset för en biljett', 'serviceavgiften', 'antal biljetter'],
          shape: 'mxb', shapes: ['mxb', 'axb', 'ax'], slots: [m, b, m * (x + b)], answer: x,
          sentence: 'Grundpriset är ___ kr.',
        };
      },
    ],
  };
  window.TRACKS.find(t => t.id === 'matte').branches.flatMap(b => b.nodes)
    .forEach(n => { if (ST[n.id]) n.stories = ST[n.id]; });

  // ---------- "Det här kan du lösa nu" ----------
  // Vilken sorts verkliga problem varje steg låser upp – svaret på "varför ska jag kunna det här?"
  //   title: problemkategorin, problems: exempel på frågor, example: ett konkret ordproblem med lösning
  const UNLOCKS = {
    'ar-tabell': { title: 'Snabb huvudräkning', problems: ['Totalpris när du köper flera av samma sak', 'Hur mycket det blir per vecka, månad eller år', 'Area för rum och ytor'],
      example: 'Du köper 7 glassar för 8 kr styck. Vad kostar det? (7 · 8 = 56 kr)' },
    'ar-neg': { title: 'Plus och minus runt noll', problems: ['Temperaturer under noll – hur mycket varmare blev det?', 'Saldo och skulder på kontot', 'Höjder under havsytan'],
      example: 'Det var −7 °C på morgonen och +4 °C på eftermiddagen. Hur många grader steg det? (4 − (−7) = 11 grader)' },
    al1: { title: 'Hitta det som saknas', problems: ['Hur mycket har jag kvar av budgeten?', 'Hur mycket fattas till målet?', 'Hur gammal var någon vid en viss tidpunkt?'],
      example: 'Du har sparat 1 350 kr och vill köpa hörlurar för 2 000 kr. Hur mycket fattas? (1 350 + x = 2 000 → x = 650 kr)' },
    al2: { title: 'Dela lika och pris per styck', problems: ['Vad kostar en sak när du vet totalpriset?', 'Hur mycket blir det per person?', 'Jämförpris per kilo eller liter'],
      example: '4 kompisar delar på en nota på 1 240 kr. Vad betalar var och en? (4x = 1 240 → x = 310 kr)' },
    al3: { title: 'Fast + rörlig kostnad', problems: ['Abonnemang, taxi, gym, hyrbil – nästan all prissättning ser ut så här', 'Hur mycket kan jag använda för en viss budget?', 'Lön med grundbelopp plus provision'],
      example: 'Ett gym kostar 300 kr i startavgift och 80 kr per besök. Hur många gånger kan du gå för 1 100 kr? (80x + 300 = 1 100 → x = 10)' },
    al4: { title: 'Jämförelser och brytpunkter', problems: ['Vilket abonnemang lönar sig för mig?', 'Lönar sig det dyra alternativet i längden?', 'När kommer någon ikapp?'],
      example: 'Abonnemang A kostar 99 kr + 2 kr/min, B kostar 249 kr + 0,50 kr/min. Efter hur många minuter lönar sig B? (2x + 99 = 0,5x + 249 → x = 100 minuter)' },
    al5: { title: 'Paket och grupper', problems: ['Pris per person inklusive avgift', 'Samma tillägg på flera saker', 'Räkna baklänges från en totalsumma'],
      example: '5 kompisar köper var sin konsertbiljett plus 50 kr i serviceavgift. Totalt 2 250 kr. Vad kostar en biljett? (5(x + 50) = 2 250 → x = 400 kr)' },
    ge1: { title: 'Rektanglar i vardagen', problems: ['Hur mycket golv, tapet eller färg behövs?', 'Hur långt staket behövs runt en tomt?', 'Får möblerna plats?'],
      example: 'Ett rum är 4 × 3 m. Hur mycket golv behöver du köpa? (4 · 3 = 12 m²)' },
    ge2: { title: 'Trianglar', problems: ['Yta på gavlar, tak och trekantiga tomter', 'Hur mycket tyg som går åt till ett segel eller en vimpel'],
      example: 'En husgavel är en triangel med basen 8 m och höjden 3 m. Hur stor yta ska målas? (8 · 3 / 2 = 12 m²)' },
    ge3: { title: 'Cirklar', problems: ['Vilken pizza är mest prisvärd?', 'Hur långt rullar ett hjul på ett varv?', 'Yta för runda bord, rabatter och pooler'],
      example: 'Är en pizza på 40 cm mer än dubbelt så stor som en på 28 cm? (Ja: ca 1 256 cm² mot 615 cm²)' },
    ge4: { title: 'Diagonaler med Pythagoras', problems: ['Får TV:n plats? (skärmar mäts diagonalt)', 'Hur lång stege behövs?', 'Kortaste vägen tvärs över ett fält'],
      example: 'En stege står 1,5 m från väggen och når 2 m upp. Hur lång är stegen? (√(1,5² + 2²) = 2,5 m)' },
    ge5: { title: 'Pythagoras baklänges', problems: ['Hur högt når en stege av en viss längd?', 'Hur bred är en skärm med en viss diagonal och höjd?'],
      example: 'En 5 m lång stege står 3 m från väggen. Hur högt upp når den? (√(5² − 3²) = 4 m)' },
  };
  window.TRACKS.find(t => t.id === 'matte').branches.flatMap(b => b.nodes)
    .forEach(n => { if (UNLOCKS[n.id]) n.unlocks = UNLOCKS[n.id]; });
})();
