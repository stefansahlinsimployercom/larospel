// Kopplingar mellan ämnen: saker i olika delar av spelet som hör ihop.
// Referenser i samma format som Bluffkollen: { t: 'hist', n } · { t: 'geo', n } · { t: 'zoo', set, n } · { t: 'node', id }
window.CROSS_LINKS = [
  { a: { t: 'zoo', set: 'varld', n: 'Orangutang' }, b: { t: 'geo', n: 'Borneos regnskog' }, why: 'Vilda orangutanger finns bara på Borneo och Sumatra – regnskogen är deras hem.' },
  { a: { t: 'zoo', set: 'varld', n: 'Gorilla' }, b: { t: 'geo', n: 'Kongobäckenets regnskog' }, why: 'Gorillor lever i Centralafrikas regnskogar, bland annat i Kongobäckenet.' },
  { a: { t: 'zoo', set: 'varld', n: 'Snöleopard' }, b: { t: 'geo', n: 'Himalaya' }, why: 'Snöleoparden lever högt upp i Asiens berg, bland annat i Himalaya.' },
  { a: { t: 'zoo', set: 'varld', n: 'Visent' }, b: { t: 'geo', n: 'Białowieżaskogen' }, why: 'Visenten räddades från utrotning i Białowieżaskogen, där Europas största vilda flock lever i dag.' },
  { a: { t: 'zoo', set: 'varld', n: 'Grizzlybjörn' }, b: { t: 'geo', n: 'Klippiga bergen' }, why: 'Grizzlybjörnen lever i västra Nordamerika, bland annat i Klippiga bergen.' },
  { a: { t: 'zoo', set: 'varld', n: 'Alpstenbock' }, b: { t: 'geo', n: 'Alperna' }, why: 'Alpstenbocken är specialist på att klättra i Alpernas branta berg – därav namnet.' },
  { a: { t: 'zoo', set: 'varld', n: 'Andeskondor' }, b: { t: 'geo', n: 'Anderna' }, why: 'Andeskondoren seglar på uppvindarna längs Andernas berg.' },
  { a: { t: 'zoo', set: 'varld', n: 'Piraya' }, b: { t: 'geo', n: 'Amazonfloden' }, why: 'Pirayan lever i Sydamerikas floder – Amazonfloden är den mest kända.' },
  { a: { t: 'zoo', set: 'varld', n: 'Surikat' }, b: { t: 'geo', n: 'Kalahariöknen' }, why: 'Surikaten lever i flockar i Kalahariöknen och andra torra områden i södra Afrika.' },
  { a: { t: 'zoo', set: 'varld', n: 'Flodhäst' }, b: { t: 'geo', n: 'Nilen' }, why: 'Flodhästen lever i Afrikas floder och sjöar – förr fanns den längs nästan hela Nilen.' },
  { a: { t: 'hist', n: 'Columbus når Amerika' }, b: { t: 'zoo', set: 'varld', n: 'Lama' }, why: 'Lamor fanns bara i Amerika – européerna fick se dem först efter Columbus resor.' },
  { a: { t: 'hist', n: 'Columbus når Amerika' }, b: { t: 'geo', n: 'Amazonfloden' }, why: 'Efter Columbus nådde européerna Sydamerika. Spanjoren Francisco de Orellana blev 1542 den förste europé som färdades längs Amazonfloden.' },
  { a: { t: 'hist', n: 'Vikingar plundrar Lindisfarne' }, b: { t: 'geo', n: 'Skanderna (fjällen)' }, why: 'Vikingarna kom från Skandinavien, där fjällen gjorde att livet levdes vid kusterna – och färderna gick över havet.' },
  { a: { t: 'hist', n: 'Karl XII stupar vid Fredriksten' }, b: { t: 'geo', n: 'Skanderna (fjällen)' }, why: 'När Karl XII dött drog sig en svensk armé tillbaka över fjällen mitt i vintern – tusentals soldater frös ihjäl (karolinernas dödsmarsch).' },
  { a: { t: 'hist', n: 'Västromerska riket faller' }, b: { t: 'geo', n: 'Rhen' }, why: 'Rhen var länge Romarrikets gräns mot germanerna. När germanska folk tog sig över gränsen bidrog det till Västroms fall.' },
  { a: { t: 'hist', n: 'Första människan på månen' }, b: { t: 'node', id: 'fy-kr2' }, why: 'På månen är tyngdkraften bara ca 1,6 N/kg – en sjättedel av jordens. Därför kunde astronauterna skutta fram.' },
  { a: { t: 'geo', n: 'Mount Everest' }, b: { t: 'node', id: 'fy-en1' }, why: 'Att ta sig upp på Everest kräver enormt med energi: W = m · g · h ≈ 6 miljoner joule för en person på 70 kg.' },
  { a: { t: 'geo', n: 'Mount Everest' }, b: { t: 'node', id: 'fy-kr3' }, why: 'Högst upp är lufttrycket bara en tredjedel av det vid havsytan – därför andas många klättrare syrgas.' },
];
