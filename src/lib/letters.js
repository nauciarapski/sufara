// 28 slova + 5 porodica + hareke + praktični tekstovi. Jedan izvor istine za sve ekrane.
const RAW = [
  ["alif", "ا", "Elif", "ā", "ا", "ا", "ـا", "ـا", "Uspravan stup, bez tačke. Ne spaja se ulijevo.", "Allah · اَللّٰه"],
  ["ba", "ب", "Bâ", "b", "ب", "بـ", "ـبـ", "ـب", "Jedan čamčić, tačka ISPOD.", "Bismilla · بِسْمِ"],
  ["ta", "ت", "Tâ", "t", "ت", "تـ", "ـتـ", "ـت", "Čamčić sa DVIJE tačke gore.", "Tevba · تَوْبَة"],
  ["tha", "ث", "Sâ (TH)", "th", "ث", "ثـ", "ـثـ", "ـث", "Čamčić sa TRI tačke gore.", "Sevab · ثَوَاب"],
  ["jim", "ج", "Džîm", "dž", "ج", "جـ", "ـجـ", "ـج", "Stomačić sa tačkom u stomaku.", "Džennet · جَنَّة"],
  ["ha", "ح", "Hâ", "h", "ح", "حـ", "ـحـ", "ـح", "Čist stomačić, bez ijedne tačke.", "Hadž · حَجّ"],
  ["kha", "خ", "Khâ", "kh", "خ", "خـ", "ـخـ", "ـخ", "Stomačić sa tačkom na glavi.", "Hajr · خَيْر"],
  ["dal", "د", "Dâl", "d", "د", "د", "ـد", "ـد", "Mali repić, bez tačke.", "Dîn · دِين"],
  ["zal", "ذ", "Zâl", "z", "ذ", "ذ", "ـذ", "ـذ", "Repić sa tačkom gore.", "Zikr · ذِكْر"],
  ["ra", "ر", "Râ", "r", "ر", "ر", "ـر", "ـر", "Bumerang — kratak, zaobljen rep.", "Rahman · رَحْمَٰن"],
  ["za", "ز", "Zâ", "z", "ز", "ز", "ـز", "ـز", "Bumerang sa tačkom gore.", "Zekât · زَكَاة"],
  ["sin", "س", "Sîn", "s", "س", "سـ", "ـسـ", "ـس", "Tri zubića, bez tačaka.", "Selam · سَلَام"],
  ["shin", "ش", "Šîn", "š", "ش", "شـ", "ـشـ", "ـش", "Tri zubića sa TRI tačke gore.", "Šukr · شُكْر"],
  ["sad", "ص", "Sâd", "s", "ص", "صـ", "ـصـ", "ـص", "Krupan zubić, bez tačke.", "Sabr · صَبْر"],
  ["dad", "ض", "Dâd", "d", "ض", "ضـ", "ـضـ", "ـض", "Krupan zubić sa tačkom gore.", "Dâd · ضَوْء"],
  ["tta", "ط", "Tâ (krupno)", "t", "ط", "طـ", "ـطـ", "ـط", "Krupan zubić, bez tačke.", "Tavaf · طَوَاف"],
  ["zha", "ظ", "Zâ (krupno)", "z", "ظ", "ظـ", "ـظـ", "ـظ", "Krupan zubić sa tačkom gore.", "Zuhur · ظُهْر"],
  ["ajn", "ع", "Ajn", "a (grleno)", "ع", "عـ", "ـعـ", "ـع", "Krug otvoren prema gore.", "Ilm · عِلْم"],
  ["gajn", "غ", "Gajn", "g", "غ", "غـ", "ـغـ", "ـغ", "Krug sa tačkom na glavi.", "Gajb · غَيْب"],
  ["fa", "ف", "Fâ", "f", "ف", "فـ", "ـفـ", "ـف", "Krug sa JEDNOM tačkom gore.", "Feth · فَتْح"],
  ["qaf", "ق", "Qâf", "k (duboko)", "ق", "قـ", "ـقـ", "ـق", "Krug sa DVIJE tačke gore.", "Kur'an · قُرْآن"],
  ["kaf", "ك", "Kâf", "k", "ك", "كـ", "ـكـ", "ـك", "Vrat sa krovom, bez tačke.", "Kitâb · كِتَاب"],
  ["lam", "ل", "Lâm", "l", "ل", "لـ", "ـلـ", "ـل", "Visoka kuka, bez tačke.", "Lâ ilâhe · لَا"],
  ["mim", "م", "Mîm", "m", "م", "مـ", "ـمـ", "ـم", "Mali krug, kao uvo.", "Mu'min · مُؤْمِن"],
  ["nun", "ن", "Nûn", "n", "ن", "نـ", "ـنـ", "ـن", "Čamčić sa JEDNOM tačkom gore.", "Nûr · نُور"],
  ["he", "ه", "Hâ (meko)", "h", "ه", "هـ", "ـهـ", "ـه", "Krug u sredini — meko H.", "Hudâ · هُدَى"],
  ["vav", "و", "Vâv", "v", "و", "و", "ـو", "ـو", "Krug sa repom. Ne spaja se ulijevo.", "Vahj · وَحْي"],
  ["ja", "ي", "Jâ", "j", "ي", "يـ", "ـيـ", "ـي", "Čamčić sa DVIJE tačke ISPOD.", "Jakîn · يَقِين"],
];

export const ALL_LETTERS = RAW.map(([id, glyph, name, sound, isolated, initial, medial, final, hint, word]) => ({
  id,
  glyph,
  name,
  sound,
  forms: { isolated, initial, medial, final },
  hint,
  word,
}));

export function letterById(id) {
  return ALL_LETTERS.find((letter) => letter.id === id) || null;
}

export const FORMS = [
  { id: "isolated", label: "Samostalno", note: "Slovo stoji samo." },
  { id: "initial", label: "Na početku", note: "Pruža ruku sljedećem slovu." },
  { id: "medial", label: "U sredini", note: "Ruke s obje strane." },
  { id: "final", label: "Na kraju", note: "Ruka dolazi s desne strane." },
];

export const LESSONS = [
  {
    id: "cas1",
    no: "1.",
    title: "Tačkovići",
    sub: "Jedan čamčić — pet slova",
    ids: ["ba", "nun", "ta", "ja", "tha"],
    mnemonic:
      "Zamisli mali čamčić na vodi. Tačka ispod = B, jedna tačka gore = N, dvije gore = T, dvije dole = J, tri gore = TH.",
    compare: "Kao naša C, Ć i Č — gotovo isti oblik, razlikuje ih samo kvačica.",
    tip: "Prvo nauči čamčić, pa onda samo broji tačke. Nikad ne uči pet oblika — uči jedan i pet tačaka.",
  },
  {
    id: "cas2",
    no: "2.",
    title: "Stomačići i kukice",
    sub: "Vrh strijele — tri slova",
    ids: ["jim", "ha", "kha"],
    mnemonic:
      "Sva tri slova imaju isti stomačić i kukicu. Tačka u stomaku = Dž, čist stomak = H, tačka na glavi = Kh.",
    compare: "Kao trouglasti šiljak sa ravnom rukom koja pruža prema sljedećem slovu.",
    tip: "Ako vidiš tačku — pitaj se samo: gdje stoji? Unutra, nigdje, ili na tjemenu.",
  },
  {
    id: "cas3",
    no: "3.",
    title: "Repići i uglasti parovi",
    sub: "Par sa tačkom i bez tačke",
    ids: ["dal", "zal", "ra", "za", "vav"],
    mnemonic:
      "Dâl i Zâl su isti repić — jedan bez tačke, drugi sa tačkom. Râ i Zâ su isti bumerang — jedan bez, drugi sa tačkom. Vâv je krug sa repom.",
    compare: "Kao P i B, ili D i DŽ — isti kostur, tačka odlučuje.",
    tip: "Ova slova se ne spajaju ulijevo — zapamti ih već sada, trebat će ti u +1 času.",
  },
  {
    id: "cas4",
    no: "4.",
    title: "Zubići i petlje",
    sub: "Tri zubića, tri krupna slova",
    ids: ["sin", "shin", "sad", "dad", "tta", "zha"],
    mnemonic:
      "Sîn je tri mala zubića. Dodaj tri tačke odozgo — Šîn. Isti zubići ali krupni i puni = Sâd, sa tačkom Dâd. Krupno i prazno = Tâ, sa tačkom Zâ.",
    compare: "Kao S i Š — isti zubići, razlika je u tačkama.",
    tip: "Uvijek gledaj prvo krupno ili sitno, pa onda broji tačke.",
  },
  {
    id: "cas5",
    no: "5.",
    title: "Krugovi, vratovi i hareke",
    sub: "Preostala slova i vokali",
    ids: ["alif", "ajn", "gajn", "fa", "qaf", "kaf", "lam", "mim", "he"],
    mnemonic:
      "Ajn je otvoren krug, Gajn isti krug sa tačkom. Fâ, Qâf i Kâf su krugovi i vratovi — jedan, dvije ili nijedna tačka. Elif, Lâm, Mîm i Hâ zatvaraju priču.",
    compare: "Kao O, U i V — kruženje i visina, bez novih ideja.",
    tip: "Na kraju časa uzmi hareke: fetha gore, kasra dole, damma kao kukica. One mijenjaju glas, ne slovo.",
    harakat: true,
  },
];

export const HARAKAT = [
  { sign: "ـَ", name: "Fetha", tr: "a", note: "Kratka crtica IZNAD slova — glas „a”." },
  { sign: "ـِ", name: "Kasra", tr: "i", note: "Kratka crtica ISPOD slova — glas „i”." },
  { sign: "ـُ", name: "Damma", tr: "u", note: "Mala kukica iznad — glas „u”." },
  { sign: "ـْ", name: "Sukun", tr: "—", note: "Slovo stane, nema vokala." },
  { sign: "ـّ", name: "Tešdid", tr: "duplo", note: "Slovo se izgovara dva puta." },
];

export const NO_CONNECT = ["alif", "dal", "zal", "ra", "za", "vav"];

export const PRACTICE = [
  {
    id: "bismilla",
    title: "Bismilla",
    ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    tr: "Bismillāhir-raḥmānir-raḥīm",
    meaning: "U ime Allaha, Milostivog, Samilosnog",
    words: [
      { ar: "بِ", tr: "bi", tip: "Bâ sa kasrom ispod = „bi”." },
      { ar: "سْمِ", tr: "smi", tip: "Sîn se spaja lijevo, Mîm nosi kasru." },
      { ar: "اللَّهِ", tr: "llāhi", tip: "Elif + Lâm + Lâm sa tešdidom." },
      { ar: "الرَّحِيمِ", tr: "r-raḥīm", tip: "Râ se NE spaja ulijevo — zato pravimo mali prekid." },
    ],
  },
  {
    id: "ihlas",
    title: "Sura El-Ihlas",
    ar: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    tr: "Qul huwallāhu eḥad",
    meaning: "Reci: On je Allah, Jedan!",
    words: [
      { ar: "قُلْ", tr: "qul", tip: "Qâf (dvije tačke gore) + Lâm + sukun." },
      { ar: "هُوَ", tr: "huwe", tip: "Hâ meko + damma, Vâv se ne spaja ulijevo." },
      { ar: "أَحَدٌ", tr: "eḥad", tip: "Elif sa hamzom, Hâ čist stomak, Dâl bez tačke." },
    ],
  },
  {
    id: "rabbi",
    title: "Dova „Rabbi jessir”",
    ar: "رَبِّ يَسِّرْ وَلَا تُعَسِّرْ",
    tr: "Rabbi jessir we lā tu'assir",
    meaning: "Gospodaru, olakšaj i ne otežavaj!",
    words: [
      { ar: "رَبِّ", tr: "rabbi", tip: "Râ ne spaja ulijevo, Bâ sa tešdidom." },
      { ar: "يَسِّرْ", tr: "jessir", tip: "Jâ (dvije tačke dole) + Sîn sa tešdidom." },
      { ar: "وَلَا", tr: "we lā", tip: "Vâv + Lâm + elif." },
    ],
  },
];

const ARROW = {
  jim: { dotPos: "ispod", dotHint: "Tačka u stomaku", rule: "Vrh strijele sa jednom tačkom ispod." },
  ha: { dotPos: "nema", dotHint: "Bez ijedne tačke", rule: "Čisti vrh strijele, potpuno čist." },
  kha: { dotPos: "iznad", dotHint: "Tačka na tjemenu", rule: "Vrh strijele sa tačkom na samom vrhu." },
};

export const LETTERS = Object.keys(ARROW).map((id) => ({ ...letterById(id), ...ARROW[id] }));

export function makeQuestion() {
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const form = FORMS[Math.floor(Math.random() * FORMS.length)];
  return {
    key: `${letter.id}-${form.id}-${Math.random().toString(36).slice(2, 8)}`,
    letter,
    form,
    glyph: letter.forms[form.id],
  };
}

export function pointsFor(remaining, duration) {
  const ratio = duration > 0 ? Math.min(1, Math.max(0, remaining / duration)) : 0;
  return 100 + Math.round(ratio * 100);
}