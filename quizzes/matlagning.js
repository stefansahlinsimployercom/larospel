// Spår: Matlagning – lär dig klassiska grundrecept i fyra steg.
// Recepten följer de klassiska grundproportionerna som de flesta svenska kokböcker utgår från.
//
// Ett recept:
//   ingredients: { n, e (emoji), amt (mängd i receptet), opt: true = valfri (räknas inte som fel) }
//   decoys:      ingredienser som INTE ska med – why förklarar varför
//   steps:       arbetsgången; o = ordningsnummer (samma nummer = valfri inbördes ordning)
//   wrongSteps:  steg som inte ska göras – why förklarar
//   values:      { q: fråga, a: rätt svar, opts: alternativ }
//   done:        { q, a, opts, why } – hur vet man att det är klart?
(window.TRACKS ||= []).push({
  id: 'matlagning', name: 'Matlagning', icon: '🍳', type: 'recipe',
  recipes: [
    {
      id: 'sockerkaka', name: 'Sockerkaka', icon: '🍰',
      desc: 'Den klassiska 3-3-3-sockerkakan: 3 ägg, 3 dl socker, 3 dl mjöl.',
      ingredients: [
        { n: 'Ägg', e: '🥚', amt: '3 st' },
        { n: 'Strösocker', e: '🍬', amt: '3 dl' },
        { n: 'Vetemjöl', e: '🌾', amt: '3 dl' },
        { n: 'Bakpulver', e: '🥄', amt: '2 tsk' },
        { n: 'Smör', e: '🧈', amt: '75 g' },
        { n: 'Mjölk', e: '🥛', amt: '1 dl' },
        { n: 'Vaniljsocker', e: '🌼', amt: '1 tsk', opt: true },
      ],
      decoys: [
        { n: 'Jäst', e: '🍞', why: 'Jäst används till bröd. Sockerkakan jäser av bakpulver (och luften du vispar in).' },
        { n: 'Florsocker', e: '❄️', why: 'Florsocker är till glasyr och pudring – i smeten används strösocker.' },
        { n: 'Kakao', e: '🍫', why: 'Kakao gör det till en chokladkaka – inte med i grundreceptet.' },
        { n: 'Riven ost', e: '🧀', why: 'Ost hör inte hemma i en sockerkaka.' },
      ],
      steps: [
        { t: 'Sätt ugnen på och låt den bli varm', o: 1 },
        { t: 'Smörj och bröa formen', o: 1 },
        { t: 'Smält smöret och låt det svalna lite', o: 1 },
        { t: 'Vispa ägg och socker riktigt pösigt', o: 2 },
        { t: 'Blanda mjöl, bakpulver (och vaniljsocker) i en egen skål', o: 2 },
        { t: 'Rör ner smör och mjölk i äggsmeten', o: 3 },
        { t: 'Vänd försiktigt ner mjölblandningen', o: 4 },
        { t: 'Häll smeten i formen och grädda i nedre delen av ugnen', o: 5 },
        { t: 'Låt kakan svalna en stund innan du stjälper upp den', o: 6 },
      ],
      wrongSteps: [
        { t: 'Låt smeten jäsa under bakduk i 30 minuter', why: 'Det gör man med jäst deg. Bakpulvret börjar verka direkt – in i ugnen!' },
        { t: 'Vispa smeten kraftigt länge efter att mjölet är i', why: 'Då blir kakan seg och kompakt. Mjölet ska vändas ner försiktigt.' },
      ],
      values: [
        { q: 'Ugnstemperatur', a: '175 °C', opts: ['125 °C', '175 °C', '225 °C', '275 °C'] },
        { q: 'Tid i ugnen', a: 'ca 40 min', opts: ['ca 10 min', 'ca 20 min', 'ca 40 min', 'ca 90 min'] },
        { q: 'Mängd strösocker', a: '3 dl', opts: ['1 msk', '1 dl', '3 dl', '6 dl'] },
        { q: 'Mängd bakpulver', a: '2 tsk', opts: ['2 krm', '2 tsk', '2 msk', '2 dl'] },
      ],
      done: {
        q: 'Hur vet du att kakan är klar?',
        a: 'En sticka som du sticker i mitten kommer ut torr',
        opts: ['En sticka som du sticker i mitten kommer ut torr', 'Ytan har blivit mörkbrun', 'Smeten har slutat bubbla', 'Timern har ringt – mer behöver man inte kolla'],
        why: 'Ugnar är olika – sticktestet visar om mitten är genomgräddad. Kladdig sticka = några minuter till.',
      },
    },
    {
      id: 'pannkakor', name: 'Pannkakor', icon: '🥞',
      desc: 'Klassiska tunna pannkakor i stekpanna – ca 12 stycken.',
      ingredients: [
        { n: 'Vetemjöl', e: '🌾', amt: '2½ dl' },
        { n: 'Mjölk', e: '🥛', amt: '6 dl' },
        { n: 'Ägg', e: '🥚', amt: '3 st' },
        { n: 'Salt', e: '🧂', amt: '½ tsk' },
        { n: 'Smör till stekning', e: '🧈', amt: 'lite per pannkaka' },
        { n: 'Socker', e: '🍬', amt: '1 msk', opt: true },
      ],
      decoys: [
        { n: 'Bakpulver', e: '🥄', why: 'Tunna pannkakor ska inte jäsa – inget bakpulver behövs.' },
        { n: 'Jäst', e: '🍞', why: 'Jäst är till bröd, inte pannkakor.' },
        { n: 'Riven ost', e: '🧀', why: 'Ost hör inte hemma i en klassisk pannkakssmet.' },
      ],
      steps: [
        { t: 'Blanda mjöl och salt i en bunke', o: 1 },
        { t: 'Vispa i hälften av mjölken till en slät smet', o: 2 },
        { t: 'Vispa i resten av mjölken och äggen', o: 3 },
        { t: 'Låt smeten vila en stund', o: 4 },
        { t: 'Hetta upp pannan och smält lite smör', o: 5 },
        { t: 'Häll i ett tunt lager smet och stek tills kanten släpper', o: 6 },
        { t: 'Vänd och stek andra sidan en kort stund', o: 7 },
      ],
      wrongSteps: [
        { t: 'Häll smeten i en ugnsform och grädda i 225 °C', why: 'Då blir det ugnspannkaka – ett annat recept!' },
        { t: 'Häll i ett ordentligt tjockt lager smet, cirka 2 cm', why: 'Tunna pannkakor kräver ett tunt lager – annars blir de degiga i mitten.' },
      ],
      values: [
        { q: 'Mängd mjölk', a: '6 dl', opts: ['2 dl', '4 dl', '6 dl', '1 liter'] },
        { q: 'Antal ägg', a: '3 st', opts: ['1 st', '3 st', '6 st', '10 st'] },
        { q: 'Mängd vetemjöl', a: '2½ dl', opts: ['1 dl', '2½ dl', '5 dl', '1 liter'] },
        { q: 'Värme på plattan', a: 'Medelhög', opts: ['Låg', 'Medelhög', 'Högsta möjliga'] },
      ],
      done: {
        q: 'När är det dags att vända pannkakan?',
        a: 'När kanten släpper och undersidan är gyllenbrun',
        opts: ['När kanten släpper och undersidan är gyllenbrun', 'När det börjar ryka från pannan', 'Efter exakt 5 minuter', 'Direkt när smeten är i pannan'],
        why: 'Kanten som släpper betyder att undersidan har stelnat – då går den att vända hel.',
      },
    },
    {
      id: 'omelett', name: 'Fransk omelett', icon: '🍳',
      desc: 'Den klassiska franska omeletten – krämig inuti och utan brun yta.',
      ingredients: [
        { n: 'Ägg', e: '🥚', amt: '3 st' },
        { n: 'Smör', e: '🧈', amt: '1 msk' },
        { n: 'Salt', e: '🧂', amt: '1 nypa' },
        { n: 'Vitpeppar', e: '🌶️', amt: '1 nypa', opt: true },
        { n: 'Gräslök', e: '🌿', amt: 'lite hackad', opt: true },
      ],
      decoys: [
        { n: 'Mjölk', e: '🥛', why: 'Den klassiska franska omeletten görs utan mjölk – bara ägg, smör och salt.' },
        { n: 'Vetemjöl', e: '🌾', why: 'Mjöl gör det till en pannkakssmet, inte en omelett.' },
        { n: 'Bakpulver', e: '🥄', why: 'Omeletten ska inte jäsa – bakpulver hör inte hemma här.' },
      ],
      steps: [
        { t: 'Knäck äggen i en skål, salta och vispa lätt med en gaffel', o: 1 },
        { t: 'Smält smöret i pannan tills det slutat skumma', o: 2 },
        { t: 'Häll i äggen och rör snabbt med gaffeln medan du skakar pannan', o: 3 },
        { t: 'Sluta röra när äggen nästan stelnat men fortfarande är krämiga', o: 4 },
        { t: 'Rulla ihop omeletten och vänd upp den på tallriken', o: 5 },
      ],
      wrongSteps: [
        { t: 'Låt omeletten steka i 10 minuter tills den är brun', why: 'En fransk omelett ska vara ljus och krämig – den tar bara ett par minuter.' },
        { t: 'Vispa äggen med elvisp i 5 minuter till ett fast skum', why: 'Det blir en sufflé-omelett. Klassiskt vispas äggen bara lätt med gaffel.' },
      ],
      values: [
        { q: 'Antal ägg (en portion)', a: '3 st', opts: ['1 st', '3 st', '6 st', '10 st'] },
        { q: 'Mängd smör', a: '1 msk', opts: ['1 krm', '1 msk', '1 dl', '250 g'] },
        { q: 'Värme på plattan', a: 'Medelvärme', opts: ['Låg värme', 'Medelvärme', 'Högsta möjliga'] },
        { q: 'Total stektid', a: '1–2 min', opts: ['10 sek', '1–2 min', '10 min', '30 min'] },
      ],
      done: {
        q: 'Hur ska en klassisk fransk omelett vara när den är klar?',
        a: 'Ljus utsida utan brun färg, krämig inuti',
        opts: ['Ljus utsida utan brun färg, krämig inuti', 'Genomstekt och gyllenbrun', 'Torr och fast rakt igenom', 'Rinnig och helt ostekt'],
        why: 'Fransk omelett tas av värmen medan insidan fortfarande är krämig – den eftergarar på tallriken.',
      },
    },
  ],
});

// ---------- Vad gick fel? (andra läget) ----------
// Varje fel: sym = symptomet, cause = rätt orsak, wrong = troliga men felaktiga orsaker,
// why = varför det blir så, fix = hur man undviker det.
(() => {
  const FAULTS = {
    sockerkaka: [
      { sym: 'Kakan sjönk ihop i mitten', e: '📉', cause: 'Ugnsluckan öppnades innan kakan hunnit stelna',
        wrong: ['För lite socker i smeten', 'Formen var för stor', 'Smöret var för kallt'],
        why: 'Kakan reser sig av gas och luft. Om temperaturen sjunker innan strukturen stelnat faller den ihop.',
        fix: 'Låt luckan vara stängd de första 25–30 minuterna och gör sticktestet först mot slutet.' },
      { sym: 'Kakan blev kompakt och seg', e: '🧱', cause: 'Smeten rördes för mycket efter att mjölet kom i',
        wrong: ['Ugnen var för varm', 'Det var för mycket mjölk', 'Formen var inte smord'],
        why: 'När man rör länge i mjöl bildas gluten, som gör kakan seg och tät.',
        fix: 'Vänd ner mjölblandningen försiktigt – bara tills allt mjöl är blandat.' },
      { sym: 'Kakan är bränd utanpå men kladdig i mitten', e: '🔥', cause: 'Ugnstemperaturen var för hög',
        wrong: ['Den fick för kort tid', 'Det var för mycket bakpulver', 'Det var för få ägg'],
        why: 'Ytan blir klar långt innan värmen hunnit in till mitten.',
        fix: 'Grädda i 175 °C i nedre delen av ugnen. Blir ytan för mörk – lägg på bakplåtspapper.' },
      { sym: 'Kakan reste sig knappt alls', e: '🫓', cause: 'Bakpulvret glömdes eller var för gammalt',
        wrong: ['Det var för mycket smör', 'Formen var för liten', 'Äggen var för färska'],
        why: 'Bakpulvret är det som bildar gasen som får kakan att resa sig.',
        fix: 'Kolla bäst-före-datum – och blanda bakpulvret med mjölet så det fördelas jämnt.' },
      { sym: 'Kakan sitter fast i formen', e: '🧲', cause: 'Formen smordes och bröades inte ordentligt',
        wrong: ['Det var för mycket mjölk', 'Det var fel sorts mjöl', 'Äggen var för kalla'],
        why: 'Smör plus ströbröd bildar ett skikt som gör att kakan släpper.',
        fix: 'Smörj hela formen, även kanterna, och strö ströbröd så att allt täcks.' },
    ],
    pannkakor: [
      { sym: 'Smeten är full av mjölklumpar', e: '🫧', cause: 'All mjölk hälldes i på en gång',
        wrong: ['Mjölet var för gammalt', 'Äggen var för kalla', 'Smeten fick vila'],
        why: 'Med lite vätska blir det en tjock smet som är lätt att vispa slät – med mycket bildas klumpar som flyter runt.',
        fix: 'Vispa i hälften av mjölken först, till en slät smet, och sedan resten.' },
      { sym: 'Pannkakan går sönder när du vänder den', e: '💔', cause: 'Den vändes innan undersidan hunnit stelna',
        wrong: ['Det var för mycket salt', 'Pannan var för stor', 'Smeten hade vilat'],
        why: 'Så länge undersidan är mjuk håller pannkakan inte ihop.',
        fix: 'Vänta tills kanten släpper och undersidan är gyllenbrun.' },
      { sym: 'Pannkakan fastnar i pannan', e: '🧲', cause: 'Pannan var inte tillräckligt varm eller saknade smör',
        wrong: ['Det var för många ägg', 'Smeten var för salt', 'Det var för lite mjöl'],
        why: 'I en kall eller torr panna hinner smeten fastna innan den stelnar.',
        fix: 'Hetta upp pannan ordentligt och smält lite smör före varje pannkaka.' },
      { sym: 'Pannkakan är bränd utanpå och rå i mitten', e: '🔥', cause: 'För hög värme och för tjockt lager smet',
        wrong: ['Det var för lite salt', 'Det var för många ägg', 'Smeten vilade för länge'],
        why: 'Ytan bränns innan värmen hunnit igenom den tjocka smeten.',
        fix: 'Medelhög värme och ett tunt lager smet – vicka pannan så det sprids.' },
      { sym: 'Pannkakorna blir tjocka och degiga', e: '🧽', cause: 'Smeten är för tjock – för lite mjölk eller för mycket mjöl',
        wrong: ['Pannan var för varm', 'Det var för mycket smör i pannan', 'Äggen var för små'],
        why: 'En tjock smet går inte att sprida ut tunt.',
        fix: 'Mät noga: 2½ dl mjöl på 6 dl mjölk. Späd med lite mjölk om den känns tjock.' },
    ],
    omelett: [
      { sym: 'Omeletten blev brun och gummiaktig', e: '🟫', cause: 'För hög värme och för lång tid i pannan',
        wrong: ['Det var för få ägg', 'Äggen var för kalla', 'Det var för lite smör'],
        why: 'Ägg blir sega och bruna när de steks för hårt och för länge.',
        fix: 'Medelvärme och bara 1–2 minuter. Den ska vara ljus.' },
      { sym: 'Omeletten blev torr och fast rakt igenom', e: '🏜️', cause: 'Den låg kvar i pannan tills den stelnat helt',
        wrong: ['Det var för mycket smör', 'Äggen vispades för lite', 'Pannan var av fel sort'],
        why: 'Ägg fortsätter att stelna av sin egen värme även efter att de tagits från plattan.',
        fix: 'Ta av den medan insidan fortfarande är krämig – den eftergarar på tallriken.' },
      { sym: 'Det blev äggröra i stället för en omelett', e: '🍳', cause: 'Du fortsatte röra tills äggen stelnat helt',
        wrong: ['Det var för många ägg', 'Det var för lite salt', 'Pannan var för liten'],
        why: 'Rörandet ger krämighet – men någon gång måste man sluta så att omeletten håller ihop.',
        fix: 'Sluta röra när äggen nästan stelnat, låt den sätta sig en stund och rulla sedan ihop den.' },
      { sym: 'Omeletten fastnar i pannan', e: '🧲', cause: 'Smöret hade inte blivit varmt innan äggen hälldes i',
        wrong: ['Äggen var för färska', 'Det var för mycket salt', 'Äggen vispades med gaffel'],
        why: 'I för kallt smör hinner äggen fastna innan de stelnar.',
        fix: 'Vänta tills smöret slutat skumma – då är pannan lagom varm.' },
    ],
  };
  window.TRACKS.find(t => t.id === 'matlagning').recipes.forEach(r => { r.faults = FAULTS[r.id] || []; });
})();
