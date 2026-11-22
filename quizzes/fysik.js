// Spår: Fysik – ett färdighetsträd som i matte, men varje uppgift löses i fem steg:
//   1 Huvudlag → 2 Formel (rätt omskrivning) → 3 Storheter (dra in värden) → 4 Räkna i steg → 5 Enhet
// Generatorerna slumpar nya tal varje gång. g = 9,82 N/kg (som i svenska skolböcker).
(() => {
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const coin = () => Math.random() < 0.5;
  const pick = a => a[r(0, a.length - 1)];
  const nf = v => String(Math.round(v * 1000) / 1000).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const G = 9.82;

  // Huvudlagar/principer – samma lista används som alternativ i steg 1
  const LAWS = {
    hast: 'Medelhastighet (sträcka per tid)',
    acc: 'Acceleration (hastighetsändring per tid)',
    newton: 'Newtons andra lag (kraft = massa · acceleration)',
    tyngd: 'Tyngdkraft (massa · g)',
    tryck: 'Tryck (kraft per yta)',
    lage: 'Lägesenergi',
    rorelse: 'Rörelseenergi',
    effekt: 'Effekt (arbete per tid)',
    ohm: 'Ohms lag (U = R · I)',
    eleff: 'Elektrisk effekt (P = U · I)',
  };

  // Fördjupning (ⓘ) för varje lag – allmän kunskap som hjälper dig välja
  const LAW_INFO = {
    hast: 'Medelhastighet är hur lång sträcka något färdas per tidsenhet: v = s / t. Enheten är m/s.',
    acc: 'Acceleration är hur snabbt hastigheten ändras: a = Δv / t. Enheten är m/s².',
    newton: 'Newtons andra lag: en kraft ger ett föremål en acceleration – ju större massa, desto mindre acceleration. F = m · a, enheten är newton (N).',
    tyngd: 'Jorden drar i allt som har massa. Tyngdkraften är F = m · g, där g ≈ 9,82 N/kg vid jordytan.',
    tryck: 'Tryck är hur stor kraft som verkar på varje kvadratmeter: p = F / A. Enheten är pascal (Pa), alltså N/m².',
    lage: 'Lägesenergi är energi som ett föremål har på grund av sin höjd: W = m · g · h. Enheten är joule (J).',
    rorelse: 'Rörelseenergi är energi som ett föremål har på grund av sin fart: W = m · v² / 2. Dubbla farten ger fyra gånger så mycket energi!',
    effekt: 'Effekt är hur snabbt ett arbete görs: P = W / t. Enheten är watt (W), alltså joule per sekund.',
    ohm: 'Ohms lag: spänningen över en komponent är resistansen gånger strömmen, U = R · I. Större resistans ger mindre ström.',
    eleff: 'Elektrisk effekt är spänning gånger ström: P = U · I. En vattenkokare på 230 V som drar 10 A har effekten 2 300 W.',
  };

  // Formler: label = hur den skrivs, tpl = uträkningen med rutor, fn = beräkning,
  // chain = mellanstegen i uträkningen ([{ e: uttryck, v: värde }]), what = vad som blir fel om man väljer den
  const PF = {
    v: { label: 'v = s / t', tpl: '{0} / {1}', fn: (s, t) => s / t, chain: (s, t) => [{ e: `${nf(s)} / ${nf(t)}`, v: s / t }] },
    vWrong: { label: 'v = s · t', tpl: '{0} · {1}', fn: (s, t) => s * t, what: 'hastighet är sträcka DELAT med tid' },
    s: { label: 's = v · t', tpl: '{0} · {1}', fn: (v, t) => v * t, chain: (v, t) => [{ e: `${nf(v)} · ${nf(t)}`, v: v * t }] },
    t: { label: 't = s / v', tpl: '{0} / {1}', fn: (s, v) => s / v, chain: (s, v) => [{ e: `${nf(s)} / ${nf(v)}`, v: s / v }] },
    tWrong: { label: 't = v / s', tpl: '{0} / {1}', fn: (v, s) => v / s, what: 'omskrivningen är upp-och-ner – t = s / v' },
    a: { label: 'a = Δv / t', tpl: '{0} / {1}', fn: (dv, t) => dv / t, chain: (dv, t) => [{ e: `${nf(dv)} / ${nf(t)}`, v: dv / t }] },
    aWrong: { label: 'a = Δv · t', tpl: '{0} · {1}', fn: (dv, t) => dv * t, what: 'acceleration är hastighetsändring DELAT med tid' },
    F: { label: 'F = m · a', tpl: '{0} · {1}', fn: (m, a) => m * a, chain: (m, a) => [{ e: `${nf(m)} · ${nf(a)}`, v: m * a }] },
    Fwrong: { label: 'F = m / a', tpl: '{0} / {1}', fn: (m, a) => m / a, what: 'Newtons andra lag är F = m · a' },
    aF: { label: 'a = F / m', tpl: '{0} / {1}', fn: (F, m) => F / m, chain: (F, m) => [{ e: `${nf(F)} / ${nf(m)}`, v: F / m }] },
    aFwrong: { label: 'a = m / F', tpl: '{0} / {1}', fn: (m, F) => m / F, what: 'omskrivningen är upp-och-ner – a = F / m' },
    Fg: { label: 'F = m · g', tpl: '{0} · 9,82', fn: m => m * G, chain: m => [{ e: `${nf(m)} · 9,82`, v: m * G }] },
    FgWrong: { label: 'F = m / g', tpl: '{0} / 9,82', fn: m => m / G, what: 'tyngdkraften är massan GÅNGER g' },
    p: { label: 'p = F / A', tpl: '{0} / {1}', fn: (F, A) => F / A, chain: (F, A) => [{ e: `${nf(F)} / ${nf(A)}`, v: F / A }] },
    pWrong: { label: 'p = F · A', tpl: '{0} · {1}', fn: (F, A) => F * A, what: 'tryck är kraft DELAT med area' },
    Wp: { label: 'W = m · g · h', tpl: '{0} · 9,82 · {1}', fn: (m, h) => m * G * h,
      chain: (m, h) => [{ e: `${nf(m)} · 9,82`, v: m * G }, { e: `${nf(m * G)} · ${nf(h)}`, v: m * G * h }] },
    WpWrong: { label: 'W = m · h', tpl: '{0} · {1}', fn: (m, h) => m * h, what: 'g saknas – lägesenergi är m · g · h' },
    Wk: { label: 'W = m · v² / 2', tpl: '{0} · {1}² / 2', fn: (m, v) => m * v * v / 2,
      chain: (m, v) => [{ e: `${nf(v)}²`, v: v * v }, { e: `${nf(m)} · ${nf(v * v)}`, v: m * v * v }, { e: `${nf(m * v * v)} / 2`, v: m * v * v / 2 }] },
    WkWrong: { label: 'W = m · v / 2', tpl: '{0} · {1} / 2', fn: (m, v) => m * v / 2, what: 'hastigheten ska i kvadrat – v²' },
    P: { label: 'P = W / t', tpl: '{0} / {1}', fn: (W, t) => W / t, chain: (W, t) => [{ e: `${nf(W)} / ${nf(t)}`, v: W / t }] },
    Pwrong: { label: 'P = W · t', tpl: '{0} · {1}', fn: (W, t) => W * t, what: 'effekt är arbete DELAT med tid' },
    U: { label: 'U = R · I', tpl: '{0} · {1}', fn: (R, I) => R * I, chain: (R, I) => [{ e: `${nf(R)} · ${nf(I)}`, v: R * I }] },
    I: { label: 'I = U / R', tpl: '{0} / {1}', fn: (U, R) => U / R, chain: (U, R) => [{ e: `${nf(U)} / ${nf(R)}`, v: U / R }] },
    Iwrong: { label: 'I = U · R', tpl: '{0} · {1}', fn: (U, R) => U * R, what: 'I = U / R – strömmen blir MINDRE med större resistans' },
    R: { label: 'R = U / I', tpl: '{0} / {1}', fn: (U, I) => U / I, chain: (U, I) => [{ e: `${nf(U)} / ${nf(I)}`, v: U / I }] },
    Rwrong: { label: 'R = I / U', tpl: '{0} / {1}', fn: (I, U) => I / U, what: 'omskrivningen är upp-och-ner – R = U / I' },
    Pel: { label: 'P = U · I', tpl: '{0} · {1}', fn: (U, I) => U * I, chain: (U, I) => [{ e: `${nf(U)} · ${nf(I)}`, v: U * I }] },
    PelWrong: { label: 'P = U / I', tpl: '{0} / {1}', fn: (U, I) => U / I, what: 'det ger resistansen, inte effekten' },
  };
  Object.entries(PF).forEach(([id, f]) => { f.id = id; f.n = (f.tpl.match(/\{\d\}/g) || []).length; });
  const UNITS = ['m/s', 'm/s²', 'm', 's', 'N', 'kg', 'Pa', 'J', 'W', 'V', 'A', 'Ω'];

  // Bygger en fysikuppgift. o: { q, law, formula, wrongF, chips: [[etikett, värde]], sol: [värden], ask: storhet, unit }
  function physTask(o) {
    const f = PF[o.formula];
    const answer = f.fn(...o.sol);
    const lawOpts = [o.law, ...Object.keys(LAWS).filter(k => k !== o.law).sort(() => Math.random() - 0.5).slice(0, 3)];
    const unitOpts = [o.unit, ...UNITS.filter(u => u !== o.unit).sort(() => Math.random() - 0.5).slice(0, 3)];
    const tol = Number.isInteger(Math.round(answer * 1000) / 1000) ? 0 : Math.max(0.05, Math.abs(answer) * 0.005);
    return {
      text: o.q.replace(/\[\[|\]\]/g, '') + ` (svara i ${o.unit})`, answer, tol,
      phys: {
        q: o.q, law: o.law, laws: lawOpts.map(k => ({ id: k, n: LAWS[k], more: LAW_INFO[k] })),
        formula: f, formulas: [f, ...o.wrongF.map(id => PF[id])],
        chips: o.chips.map(([label, v]) => ({ label, v })), sol: o.sol,
        ask: o.ask, unit: o.unit, units: unitOpts, answer,
      },
    };
  }

  (window.TRACKS ||= []).push({
    id: 'fysik', name: 'Fysik', icon: '⚛️', type: 'tree',
    branches: [
      {
        id: 'rorelse', name: 'Rörelse', icon: '🏃',
        nodes: [
          {
            id: 'fy-me1', name: 'Medelhastighet', req: [],
            desc: 'Hur snabbt går det? Sträcka delat med tid.',
            gen: () => {
              const v = r(3, 12), t = r(10, 60), s = v * t, kg = r(55, 90);
              return physTask({
                q: `En cyklist som väger [[${kg} kg]] cyklar [[${nf(s)} m]] på [[${t} s]]. Vad är cyklistens medelhastighet?`,
                law: 'hast', formula: 'v', wrongF: ['vWrong', 't'], ask: 'v', unit: 'm/s',
                chips: [[`${nf(s)} m`, s], [`${t} s`, t], [`${kg} kg`, kg]], sol: [s, t],
              });
            },
          },
          {
            id: 'fy-me2', name: 'Sträcka och tid', req: ['fy-me1'],
            desc: 'Samma samband – men nu söks sträckan eller tiden. Välj rätt omskrivning!',
            gen: () => {
              const v = r(5, 30), t = r(10, 90), s = v * t;
              return coin()
                ? physTask({
                  q: `Ett tåg kör med den konstanta hastigheten [[${v} m/s]]. Hur lång tid tar det att köra [[${nf(s)} m]]?`,
                  law: 'hast', formula: 't', wrongF: ['tWrong', 's', 'v'], ask: 't', unit: 's',
                  chips: [[`${v} m/s`, v], [`${nf(s)} m`, s]], sol: [s, v],
                })
                : physTask({
                  q: `En löpare springer med farten [[${v % 8 + 3} m/s]] i [[${t} s]]. Hur långt springer löparen?`,
                  law: 'hast', formula: 's', wrongF: ['v', 't'], ask: 's', unit: 'm',
                  chips: [[`${v % 8 + 3} m/s`, v % 8 + 3], [`${t} s`, t]], sol: [v % 8 + 3, t],
                });
            },
          },
          {
            id: 'fy-me3', name: 'Acceleration', req: ['fy-me1'],
            desc: 'Hur snabbt ökar farten? Hastighetsändring delat med tid.',
            gen: () => {
              const a = r(1, 5), t = r(2, 10), dv = a * t;
              return physTask({
                q: `En bil står still vid rödljus. När det slår om till grönt ökar den farten till [[${dv} m/s]] på [[${t} s]]. Vad är bilens acceleration?`,
                law: 'acc', formula: 'a', wrongF: ['aWrong', 'v'], ask: 'a', unit: 'm/s²',
                chips: [[`${dv} m/s`, dv], [`${t} s`, t], ['0 m/s', 0]], sol: [dv, t],
              });
            },
          },
        ],
      },
      {
        id: 'krafter', name: 'Krafter', icon: '💪',
        nodes: [
          {
            id: 'fy-kr1', name: 'Newtons andra lag', req: [],
            desc: 'Kraft, massa och acceleration hänger ihop: F = m · a.',
            gen: () => {
              const m = r(2, 20), a = r(1, 6), F = m * a;
              return coin()
                ? physTask({
                  q: `Vilken kraft behövs för att ge en låda med massan [[${m} kg]] accelerationen [[${a} m/s²]]?`,
                  law: 'newton', formula: 'F', wrongF: ['Fwrong', 'aF'], ask: 'F', unit: 'N',
                  chips: [[`${m} kg`, m], [`${a} m/s²`, a]], sol: [m, a],
                })
                : physTask({
                  q: `En vagn med massan [[${m} kg]] dras med kraften [[${F} N]]. Vilken acceleration får vagnen?`,
                  law: 'newton', formula: 'aF', wrongF: ['aFwrong', 'F'], ask: 'a', unit: 'm/s²',
                  chips: [[`${m} kg`, m], [`${F} N`, F]], sol: [F, m],
                });
            },
          },
          {
            id: 'fy-kr2', name: 'Tyngdkraft', req: ['fy-kr1'],
            desc: 'Tyngdkraften är massan gånger g (9,82 N/kg). Se upp: massan ska vara i kg!',
            gen: () => {
              const m = r(2, 16) / 2, grams = m * 1000;
              return physTask({
                q: `En ryggsäck väger [[${nf(grams)} g]]. Hur stor är tyngdkraften på ryggsäcken? (g = 9,82 N/kg)`,
                law: 'tyngd', formula: 'Fg', wrongF: ['FgWrong', 'F'], ask: 'F', unit: 'N',
                chips: [[`${nf(grams)} g`, grams], [`${nf(m)} kg`, m]], sol: [m],
              });
            },
          },
          {
            id: 'fy-kr3', name: 'Tryck', req: ['fy-kr2'],
            desc: 'Tryck är kraft fördelad på en yta: p = F / A.',
            gen: () => {
              const A = pick([0.25, 0.5, 2, 4]), p = r(2, 20) * 50, F = p * A;
              return physTask({
                q: `En låda med tyngden [[${nf(F)} N]] står på golvet. Lådans botten har arean [[${nf(A)} m²]]. Hur stort tryck utövar lådan på golvet?`,
                law: 'tryck', formula: 'p', wrongF: ['pWrong', 'F'], ask: 'p', unit: 'Pa',
                chips: [[`${nf(F)} N`, F], [`${nf(A)} m²`, A]], sol: [F, A],
              });
            },
          },
        ],
      },
      {
        id: 'energi', name: 'Energi', icon: '🔋',
        nodes: [
          {
            id: 'fy-en1', name: 'Lägesenergi', req: ['fy-kr2'],
            desc: 'Energin ett föremål får av att lyftas: W = m · g · h. Två räknesteg!',
            gen: () => {
              const m = r(2, 12), h = r(1, 5), w = r(30, 60);
              return physTask({
                q: `En låda med massan [[${m} kg]] och bredden [[${w} cm]] lyfts [[${h} m]] upp på en hylla. Hur mycket lägesenergi får lådan? (g = 9,82 N/kg)`,
                law: 'lage', formula: 'Wp', wrongF: ['WpWrong', 'Wk'], ask: 'W', unit: 'J',
                chips: [[`${m} kg`, m], [`${h} m`, h], [`${w} cm`, w]], sol: [m, h],
              });
            },
          },
          {
            id: 'fy-en2', name: 'Rörelseenergi', req: ['fy-en1'],
            desc: 'Energin i rörelse: W = m · v² / 2. Tre räknesteg – glöm inte kvadraten!',
            gen: () => {
              const m = r(4, 10) * 10, v = r(2, 10);
              return physTask({
                q: `En cyklist och cykel väger tillsammans [[${m} kg]] och rullar i [[${v} m/s]]. Hur stor rörelseenergi har de?`,
                law: 'rorelse', formula: 'Wk', wrongF: ['WkWrong', 'Wp'], ask: 'W', unit: 'J',
                chips: [[`${m} kg`, m], [`${v} m/s`, v]], sol: [m, v],
              });
            },
          },
          {
            id: 'fy-en3', name: 'Effekt', req: ['fy-en1'],
            desc: 'Hur snabbt arbetet görs: P = W / t.',
            gen: () => {
              const P = r(2, 30) * 10, t = r(5, 60), W = P * t;
              return physTask({
                q: `En motor lyfter en last och uträttar arbetet [[${nf(W)} J]] på [[${t} s]]. Vilken effekt har motorn?`,
                law: 'effekt', formula: 'P', wrongF: ['Pwrong', 'Pel'], ask: 'P', unit: 'W',
                chips: [[`${nf(W)} J`, W], [`${t} s`, t]], sol: [W, t],
              });
            },
          },
        ],
      },
      {
        id: 'el', name: 'Elektricitet', icon: '💡',
        nodes: [
          {
            id: 'fy-el1', name: 'Ohms lag', req: [],
            desc: 'Spänning, resistans och ström: U = R · I. Tre olika omskrivningar!',
            gen: () => {
              const R = pick([2, 4, 5, 10, 20, 50]), I = r(1, 6), U = R * I;
              const k = r(0, 2);
              if (k === 0) return physTask({
                q: `En lampa med resistansen [[${R} Ω]] kopplas till ett batteri på [[${U} V]]. Hur stor ström går genom lampan?`,
                law: 'ohm', formula: 'I', wrongF: ['Iwrong', 'U'], ask: 'I', unit: 'A',
                chips: [[`${R} Ω`, R], [`${U} V`, U]], sol: [U, R],
              });
              if (k === 1) return physTask({
                q: `Genom ett motstånd på [[${R} Ω]] går strömmen [[${I} A]]. Vilken spänning ligger över motståndet?`,
                law: 'ohm', formula: 'U', wrongF: ['Iwrong', 'R'], ask: 'U', unit: 'V',
                chips: [[`${R} Ω`, R], [`${I} A`, I]], sol: [R, I],
              });
              return physTask({
                q: `Över en komponent ligger spänningen [[${U} V]] och strömmen är [[${I} A]]. Vilken resistans har komponenten?`,
                law: 'ohm', formula: 'R', wrongF: ['Rwrong', 'U'], ask: 'R', unit: 'Ω',
                chips: [[`${U} V`, U], [`${I} A`, I]], sol: [U, I],
              });
            },
          },
          {
            id: 'fy-el2', name: 'Elektrisk effekt', req: ['fy-el1'],
            desc: 'Hur mycket effekt drar en apparat? P = U · I.',
            gen: () => {
              const I = r(2, 10);
              return physTask({
                q: `En vattenkokare kopplas till ett vägguttag på [[230 V]] och drar strömmen [[${I} A]]. Vilken effekt har vattenkokaren?`,
                law: 'eleff', formula: 'Pel', wrongF: ['PelWrong', 'P'], ask: 'P', unit: 'W',
                chips: [['230 V', 230], [`${I} A`, I]], sol: [230, I],
              });
            },
          },
        ],
      },
    ],
  });
})();
