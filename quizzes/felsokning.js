// Spår: Felsökning – diagnosspel i flera steg.
// Ett fall har flera möjliga orsaker. Varje runda slumpas en dold orsak, och testerna svarar olika beroende på den.
//   causes:  [{ id, n }]
//   steps:   [{ name, cost, tests: [{ t, res: { orsaks-id: svar } } | { t, danger: true, why }] }]
//   actions: { orsaks-id: { a: rätt åtgärd, wrong: [felaktiga], danger: { t, why } } }
(window.TRACKS ||= []).push({
  id: 'felsokning', name: 'Felsökning', icon: '🔧', type: 'diag',
  cases: [
    {
      id: 'bil', name: 'Bilen startar inte', icon: '🚗',
      intro: 'Det är måndag morgon. Du sätter dig i bilen, vrider om nyckeln – och bilen startar inte. Vad är fel?',
      causes: [
        { id: 'batt', n: 'Urladdat batteri' },
        { id: 'pol', n: 'Oxiderade eller lösa batteripoler' },
        { id: 'start', n: 'Trasig startmotor' },
        { id: 'tank', n: 'Tom tank' },
      ],
      steps: [
        {
          name: 'Observera', cost: 2, tests: [
            { t: 'Vrid om nyckeln – vad händer?', res: {
              batt: 'Det klickar snabbt flera gånger – "tack-tack-tack" – men motorn snurrar inte.',
              pol: 'Ett enstaka klick – sedan ingenting.',
              start: 'Ett enstaka klick – sedan ingenting.',
              tank: 'Motorn snurrar runt helt normalt – men startar inte.' } },
            { t: 'Tänds instrumentpanelen och lamporna normalt?', res: {
              batt: 'Svagt – de är nästan släckta.',
              pol: 'De lyser först, men slocknar helt när du vrider om nyckeln.',
              start: 'Ja, de lyser starkt hela tiden.',
              tank: 'Ja, de lyser starkt hela tiden.' } },
            { t: 'Titta på bränslemätaren', res: {
              batt: 'Svår att läsa – panelen är för svag.',
              pol: 'Visar ungefär halv tank.',
              start: 'Visar ungefär halv tank.',
              tank: 'Står på noll – varningslampan för bränsle lyser.' } },
          ],
        },
        {
          name: 'Enkla kontroller', cost: 5, tests: [
            { t: 'Öppna huven och titta på batteripolerna', res: {
              batt: 'Polerna ser rena ut och sitter fast.',
              pol: 'Vitgrönt pulver runt polerna – och en kabelsko sitter löst.',
              start: 'Polerna ser rena ut och sitter fast.',
              tank: 'Polerna ser rena ut och sitter fast.' } },
            { t: 'Lys in i motorrummet med en tändare för att se bättre', danger: true,
              why: 'Bilbatterier kan avge vätgas som är explosiv. Använd alltid en ficklampa – aldrig öppen eld.' },
            { t: 'Prova starthjälp med startkablar från en annan bil', res: {
              batt: 'Bilen startar direkt!',
              pol: 'Ingen skillnad – strömmen kommer inte fram genom de dåliga polerna.',
              start: 'Fortfarande bara ett kraftigt klick.',
              tank: 'Motorn snurrar som förut – men startar inte.' } },
          ],
        },
        {
          name: 'Mät', cost: 12, tests: [
            { t: 'Mät batterispänningen med en multimeter', res: {
              batt: '11,6 V – batteriet är urladdat (fulladdat är ca 12,6 V).',
              pol: '12,5 V – batteriet i sig är laddat.',
              start: '12,6 V – batteriet är fulladdat.',
              tank: '12,5 V – batteriet är laddat.' } },
            { t: 'Kortslut startmotorns poler med en skruvmejsel', danger: true,
              why: 'Kraftiga gnistor, risk för brännskador – och står bilen i växel kan den rulla iväg. Det är ett jobb för verkstaden.' },
          ],
        },
        {
          name: 'Proffshjälp', cost: 40, tests: [
            { t: 'Bogsera bilen till en verkstad för felsökning', res: {
              batt: 'Mekanikern: "Batteriet var helt urladdat – lampan stod nog på i natt."',
              pol: 'Mekanikern: "Polerna var oxiderade och en satt löst."',
              start: 'Mekanikern: "Startmotorn har gått sönder."',
              tank: 'Mekanikern: "Tanken var tom."' } },
          ],
        },
      ],
      actions: {
        batt: { a: 'Starthjälp: plus till plus först, sist minus på en omålad metalldel i motorrummet – ladda sedan batteriet',
          wrong: ['Byt startmotorn', 'Tanka bilen'],
          danger: { t: 'Koppla startkablarna kors: plus mot minus, för mer kraft', why: 'Det kortsluter batterierna – de kan explodera och spruta syra. Plus till plus, minus till jord.' } },
        pol: { a: 'Lossa polerna (minus först), rengör dem och dra åt ordentligt (plus först när du sätter tillbaka)',
          wrong: ['Byt startmotorn', 'Tanka bilen'],
          danger: { t: 'Rengör polerna med en metallborste medan nyckeln står i tändläge', why: 'Risk för kortslutning och gnistor. Bryt alltid strömmen och lossa minuspolen först.' } },
        start: { a: 'Låt bärga bilen till verkstaden för byte av startmotor',
          wrong: ['Ladda batteriet', 'Tanka bilen'],
          danger: { t: 'Kortslut startmotorn med en skruvmejsel för att få igång den', why: 'Gnistor, brännskador och risk att bilen rullar iväg om den står i växel.' } },
        tank: { a: 'Tanka – och vrid om nyckeln till tändläge några gånger så att bränslet pumpas fram innan du startar',
          wrong: ['Byt batteriet', 'Byt startmotorn'],
          danger: { t: 'Häll bensin direkt i luftintaget så att den startar snabbare', why: 'Stor brandrisk – bensinångor kan antändas i motorrummet.' } },
      },
    },
    {
      id: 'internet', name: 'Datorn kommer inte ut på internet', icon: '🌐',
      intro: 'Du ska jobba hemifrån, men datorn kommer inte ut på internet. Vad är fel?',
      causes: [
        { id: 'flyg', n: 'Wi-Fi är avstängt på datorn (flygplansläge)' },
        { id: 'router', n: 'Routern har hängt sig' },
        { id: 'isp', n: 'Driftstörning hos internetleverantören' },
        { id: 'fel', n: 'Datorn är ansluten till fel nätverk' },
      ],
      steps: [
        {
          name: 'Observera', cost: 2, tests: [
            { t: 'Fungerar internet på mobilen via samma Wi-Fi?', res: {
              flyg: 'Ja, mobilen surfar fint.',
              router: 'Nej, mobilen kommer inte heller ut.',
              isp: 'Nej, mobilen kommer inte heller ut.',
              fel: 'Ja, mobilen surfar fint.' } },
            { t: 'Titta på Wi-Fi-ikonen i hörnet på datorn', res: {
              flyg: 'Det visas ett flygplan – Wi-Fi är avstängt.',
              router: 'Ansluten till ditt nätverk, men "Inget internet".',
              isp: 'Ansluten till ditt nätverk, men "Inget internet".',
              fel: 'Ansluten till "Grannen_Gast" – "Inget internet".' } },
          ],
        },
        {
          name: 'Enkla kontroller', cost: 5, tests: [
            { t: 'Titta på lamporna på routern', res: {
              flyg: 'Alla lampor lyser som vanligt.',
              router: 'Lamporna är släckta eller blinkar konstigt.',
              isp: 'Internetlampan lyser rött – de andra som vanligt.',
              fel: 'Alla lampor lyser som vanligt.' } },
            { t: 'Ladda ner "Fixa ditt Wi-Fi"-programmet som en popup föreslår', danger: true,
              why: 'Ett klassiskt sätt att få in skadeprogram. Installera bara program från källor du känner till.' },
            { t: 'Starta om routern (dra ur sladden i 30 sekunder)', res: {
              flyg: 'Ingen skillnad på datorn.',
              router: 'Efter två minuter fungerar allt igen!',
              isp: 'Ingen skillnad – internetlampan lyser fortfarande rött.',
              fel: 'Ingen skillnad på datorn.' } },
          ],
        },
        {
          name: 'Undersök', cost: 10, tests: [
            { t: 'Kolla leverantörens driftinformation via mobilens 4G', res: {
              flyg: 'Inga störningar rapporterade.',
              router: 'Inga störningar rapporterade.',
              isp: 'Driftstörning i ditt område – beräknas vara åtgärdad i eftermiddag.',
              fel: 'Inga störningar rapporterade.' } },
            { t: 'Stäng av brandväggen och antivirusprogrammet för gott', danger: true,
              why: 'Det löser inte felet – men gör datorn sårbar för intrång och skadeprogram.' },
          ],
        },
        {
          name: 'Proffshjälp', cost: 30, tests: [
            { t: 'Ring leverantörens support och vänta i telefonkön', res: {
              flyg: 'Supporten: "Kolla att Wi-Fi är påslaget – flygplansläget verkar vara på."',
              router: 'Supporten: "Starta om routern så ska det lösa sig."',
              isp: 'Supporten: "Vi har en driftstörning i ditt område."',
              fel: 'Supporten: "Du verkar vara ansluten till fel nätverk."' } },
          ],
        },
      ],
      actions: {
        flyg: { a: 'Stäng av flygplansläget och slå på Wi-Fi igen',
          wrong: ['Köp en ny router', 'Ring leverantören och klaga'],
          danger: { t: 'Installera drivrutinen som en okänd webbsida föreslår', why: 'Okända "drivrutiner" är ett vanligt sätt att sprida skadeprogram.' } },
        router: { a: 'Starta om routern och vänta ett par minuter',
          wrong: ['Byt dator', 'Stäng av flygplansläget'],
          danger: { t: 'Skruva isär routern och undersök den medan den är inkopplad', why: 'Risk för elchock – och garantin försvinner.' } },
        isp: { a: 'Vänta tills leverantören löst felet – använd mobilen som surfzon under tiden',
          wrong: ['Starta om routern tio gånger till', 'Köp en ny router'],
          danger: { t: 'Logga in på banken via ett okänt öppet Wi-Fi under tiden', why: 'Öppna, okända nätverk kan avlyssnas – gör aldrig bankärenden där.' } },
        fel: { a: 'Välj ditt eget nätverk och ange rätt lösenord',
          wrong: ['Starta om routern', 'Ring leverantören'],
          danger: { t: 'Ladda ner en app som "knäcker" grannens Wi-Fi-lösenord', why: 'Det är olagligt – och sådana appar innehåller ofta skadeprogram.' } },
      },
    },
  ],
});
