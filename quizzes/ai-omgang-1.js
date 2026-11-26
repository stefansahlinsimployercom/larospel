// 🤖 AI-omgång 1 (26 nov 2026): påståenden och uppskattningar skrivna av AI (Claude), förankrade i spelets kunskap.
// Märks i spelet som AI-skapade. Spelare kan flagga fel (🚩) – flaggade frågor listas på resultatsidan för granskning.
// Kontrolleras av tools/validera.js (referenser, svar, uträkningar).
(() => {
  const AI = { ai: true, batch: 'ai-1' };
  const bluff = window.TRACKS.find(t => t.id === 'bluff');
  bluff.claims.push(...[
    { id: 'ai1-mur', parts: ['Berlinmuren byggdes för att stoppa flykten västerut', ' och föll 1989.'], bad: null, types: [],
      why: 'Det stämmer – muren byggdes 1961 och öppnades den 9 november 1989.', refs: [{ t: 'hist', n: 'Berlinmuren faller' }] },
    { id: 'ai1-kilimanjaro', parts: ['Kilimanjaro är Afrikas högsta berg', ' och ligger i Kenya.'], bad: 1, types: ['fakta'],
      why: 'Kilimanjaro ligger i Tanzania, strax söder om gränsen mot Kenya.', refs: [{ t: 'geo', n: 'Kilimanjaro' }] },
    { id: 'ai1-ohm', parts: ['Enligt Ohms lag', ' blir strömmen större ju större resistansen är.'], bad: 1, types: ['samband'],
      why: 'Tvärtom: I = U / R. Större resistans ger mindre ström vid samma spänning.', refs: [{ t: 'node', id: 'fy-el1' }] },
    { id: 'ai1-fladdermus', parts: ['Fladdermusen', ' är en fågel', ' eftersom den kan flyga.'], bad: 1, types: ['fakta', 'samband'],
      why: 'Fladdermusen är ett däggdjur – den har päls och ger sina ungar di. Att kunna flyga gör inte ett djur till fågel.', refs: [{ t: 'zoo', set: 'grupper', n: 'Fladdermus' }] },
    { id: 'ai1-vanern-kaspiska', parts: ['Vänern', ' är större än Kaspiska havet.'], bad: 1, types: ['storlek', 'jamforelse'],
      why: 'Kaspiska havet är ungefär 371 000 km² – över 60 gånger större än Vänern (ca 5 650 km²).', refs: [{ t: 'geo', n: 'Vänern' }, { t: 'geo', n: 'Kaspiska havet' }] },
    { id: 'ai1-blodbad', parts: ['Stockholms blodbad', ' ledde till att Gustav Vasa blev kung tre år senare.'], bad: null, types: [],
      why: 'Det stämmer – blodbadet 1520 utlöste upproret, och Gustav Vasa valdes till kung 1523.', refs: [{ t: 'hist', n: 'Stockholms blodbad' }, { t: 'hist', n: 'Gustav Vasa väljs till kung' }] },
    { id: 'ai1-pascal', parts: ['Ett tryck på 100 000 Pa', ' är samma sak som 100 000 newton per kvadratmeter.'], bad: null, types: [],
      why: 'Det stämmer – 1 Pa är just 1 N/m², eftersom tryck är kraft delat med area.', refs: [{ t: 'node', id: 'fy-kr3' }] },
    { id: 'ai1-delfin', parts: ['Valen är ett däggdjur,', ' men delfinen är en fisk.'], bad: 1, types: ['fakta'],
      why: 'Delfinen är också ett däggdjur – den andas med lungor och ger sina ungar di.', refs: [{ t: 'zoo', set: 'grupper', n: 'Val' }, { t: 'zoo', set: 'grupper', n: 'Delfin' }] },
    { id: 'ai1-australien', parts: ['Kängurun och koalan', ' lever båda vilt i Australien.'], bad: null, types: [],
      why: 'Det stämmer – båda är pungdjur från Australien.', refs: [{ t: 'zoo', set: 'varld', n: 'Känguru' }, { t: 'zoo', set: 'varld', n: 'Koala' }] },
    { id: 'ai1-lampa', parts: ['En lampa på 60 W', ' som är kopplad till 230 V', ' drar ungefär 26 ampere.'], bad: 2, types: ['storlek'],
      why: 'I = P / U = 60 / 230 ≈ 0,26 A – hundra gånger mindre än påståendet.', refs: [{ t: 'node', id: 'fy-el2' }] },
    { id: 'ai1-revolutioner', parts: ['Franska revolutionen började', ' samma år som', ' USA:s självständighetsförklaring.'], bad: 1, types: ['tid'],
      why: 'USA:s självständighetsförklaring kom 1776 och Bastiljen stormades 1789 – 13 år senare.', refs: [{ t: 'hist', n: 'USA:s självständighetsförklaring' }, { t: 'hist', n: 'Stormningen av Bastiljen' }] },
    { id: 'ai1-himalaya', parts: ['Världens högsta berg', ' ligger i Himalaya.'], bad: null, types: [],
      why: 'Det stämmer – Mount Everest (8 849 m) ligger i Himalaya, på gränsen mellan Nepal och Kina.', refs: [{ t: 'geo', n: 'Himalaya' }, { t: 'geo', n: 'Mount Everest' }] },
  ].map(c => ({ ...c, ...AI })));

  const est = window.TRACKS.find(t => t.id === 'uppskatta');
  est.questions.push(...[
    { id: 'ai1-bil-50km', q: 'En bil kör i 25 m/s (90 km/h). Hur många minuter tar det att köra 50 km?', unit: 'minuter', answer: 50000 / 25 / 60,
      steps: ['Tid: t = s / v', '50 km = 50 000 m', '50 000 / 25 = 2 000 s ≈ 33 minuter'], refs: [{ t: 'node', id: 'fy-me2' }] },
    { id: 'ai1-manen-tyngd', q: 'På månen är g ungefär 1,6 N/kg. Hur stor är tyngdkraften på en ryggsäck på 25 kg där?', unit: 'N', answer: 25 * 1.6,
      steps: ['Tyngdkraft: F = m · g', 'g på månen ≈ 1,6 N/kg (en sjättedel av jordens)', '25 · 1,6 = 40 N – på jorden vore det ca 246 N'],
      refs: [{ t: 'node', id: 'fy-kr2' }, { t: 'hist', n: 'Första människan på månen' }] },
    { id: 'ai1-laddare', q: 'En elbilsladdare är kopplad till 230 V och drar 16 A. Vilken effekt har den?', unit: 'W', answer: 230 * 16,
      steps: ['Elektrisk effekt: P = U · I', '230 · 16 = 3 680 W ≈ 3,7 kW'], refs: [{ t: 'node', id: 'fy-el2' }] },
    { id: 'ai1-vattenkokare-ar', q: 'En vattenkokare på 2 000 W används 10 minuter om dagen. Hur många kWh blir det på ett år?', unit: 'kWh', answer: 2 * (10 / 60) * 365,
      steps: ['Energi: W = P · t', 'Per dag: 2 kW · 1/6 h ≈ 0,33 kWh', '0,33 · 365 ≈ 122 kWh per år'], refs: [{ t: 'node', id: 'fy-en3' }, { t: 'node', id: 'fy-el2' }] },
    { id: 'ai1-pool', q: 'En rund pool har diametern 6 m. Hur stor är vattenytan?', unit: 'm²', answer: 3.14 * 3 * 3,
      steps: ['Radien är halva diametern: 3 m', 'Area: A = π · r²', '3,14 · 9 ≈ 28 m²'], refs: [{ t: 'node', id: 'ge3' }] },
    { id: 'ai1-gym-ar', q: 'Ett gym kostar 300 kr i månaden plus 50 kr per besök. Vad kostar ett år om du går två gånger i veckan?', unit: 'kr', answer: 12 * 300 + 104 * 50,
      steps: ['Fast del: 12 · 300 = 3 600 kr', 'Rörlig del: 2 besök · 52 veckor = 104 besök · 50 kr = 5 200 kr', '3 600 + 5 200 = 8 800 kr'],
      refs: [{ t: 'node', id: 'al3' }, { t: 'node', id: 'ar-tabell' }] },
  ].map(q => ({ ...q, ...AI })));
})();
