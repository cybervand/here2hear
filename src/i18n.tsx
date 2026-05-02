import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Locale = 'en' | 'no';

const KEY_LOCALE = 'locale';
const LOCALES: Locale[] = ['en', 'no'];

export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'no', label: 'Norsk' },
];

const en = {
  // Top-level nav
  'app.play': '🎮 Play',
  'app.teacher': '🧑‍🏫 Teacher',

  // Teacher mode shell
  'teacher.title': 'Teacher',
  'teacher.subnav.library': '📚 Library',
  'teacher.subnav.settings': '⚙️ Settings',
  'teacher.subtitle':
    'Add new sounds the children can play with. Each entry needs a name, a picture, an audio file, and a loudness rating.',

  // Library
  'library.count': 'Library ({n})',
  'library.empty': 'No sounds yet. Add one on the right →',
  'library.loading': 'Loading…',
  'library.confirmDelete': 'Delete this sound from the library?',
  'library.trimmed': '✂️ trimmed',
  'library.play': 'Play',
  'library.delete': 'Delete',
  'library.saveFailed': 'Save failed: {error}',

  // Wizard frame
  'wizard.title': 'Add a new sound',
  'wizard.step.name': 'Name',
  'wizard.step.picture': 'Picture',
  'wizard.step.sound': 'Sound',
  'wizard.step.trim': 'Trim',
  'wizard.step.loudness': 'Loudness',
  'wizard.next': 'Next →',
  'wizard.back': '← Back',

  // Name step
  'wizard.name.title': 'What is this sound?',
  'wizard.name.body': 'Type the name (e.g. "lightning", "lion", "whisper").',
  'wizard.name.placeholder': 'Sound name',

  // Image step
  'wizard.image.title': 'What does "{name}" look like?',
  'wizard.image.dropHere': 'Drop a picture here',
  'wizard.image.different': 'Choose a different picture',

  // Audio step
  'wizard.audio.title': 'What does "{name}" sound like?',
  'wizard.audio.dropHere': 'Drop an audio file here',
  'wizard.audio.different': 'Choose a different file',

  // Search (shared between picture + sound steps)
  'wizard.dropFile': 'Drop a file',
  'wizard.search': 'Search',
  'wizard.searching': 'Searching…',
  'wizard.clickToBrowse': 'or click to browse',
  'wizard.search.empty': 'Type a query and tap Search.',
  'wizard.search.placeholder.image': 'Search pictures (e.g. lion)',
  'wizard.search.placeholder.audio': 'Search sounds (e.g. thunder)',
  'wizard.search.useThis': 'Use this',
  'wizard.search.picked': '✓ Picked',
  'wizard.search.play': 'Play',
  'wizard.search.stop': 'Stop',

  // Trim step
  'wizard.trim.title': 'Trim the sound',
  'wizard.trim.body':
    'Drag the sliders to pick the part the kids will hear when they tap. Use Preview to check.',
  'wizard.trim.decoding': 'Decoding audio…',
  'wizard.trim.start': 'Start',
  'wizard.trim.end': 'End',
  'wizard.trim.length': 'Selected length: {time}',
  'wizard.trim.preview': '▶ Preview',
  'wizard.trim.stop': '■ Stop',

  // Loudness step
  'wizard.loudness.title': 'How loud is "{name}"?',
  'wizard.loudness.body':
    'Slide to where this sound belongs — soft on the left, loud on the right.',
  'wizard.loudness.aria': 'Loudness from 0 to 100',
  'wizard.loudness.readout': '{value} / 100',
  'wizard.loudness.save': 'Save sound',
  'wizard.loudness.saving': 'Saving…',

  // Settings — language
  'settings.language.title': '🌐 Language',
  'settings.language.body': 'Choose what language the app shows.',

  // Settings — Freesound
  'settings.freesound.title': '🔊 Freesound (sound search)',
  'settings.freesound.intro':
    'Adds Freesound results to the sound search. Get credentials at',
  'settings.freesound.clientId': 'Client ID',
  'settings.freesound.clientIdHint':
    'Stored for reference. Not strictly required for searching.',
  'settings.freesound.clientIdPlaceholder': 'Your Freesound Client ID',
  'settings.freesound.secretKey': 'Secret Key (API key)',
  'settings.freesound.secretKeyHint': 'Used to call the Freesound search API.',
  'settings.freesound.secretKeyPlaceholder': 'Your Freesound API key',

  // Settings — Pixabay
  'settings.pixabay.title': '🖼️ Pixabay (picture search)',
  'settings.pixabay.introBefore': 'Adds Pixabay results to the picture search. Sign up at',
  'settings.pixabay.introMiddle': ', then your key is shown on the',
  'settings.pixabay.apiDocs': 'API docs page',
  'settings.pixabay.introAfter': "when you're logged in.",
  'settings.pixabay.apiKey': 'API Key',
  'settings.pixabay.apiKeyPlaceholder': 'Your Pixabay API key',

  // Settings — common
  'settings.show': 'Show',
  'settings.hide': 'Hide',
  'settings.save': 'Save',
  'settings.saved': 'Saved ✓',
  'settings.removeCredentials': 'Remove credentials',
  'settings.removeKey': 'Remove key',
  'settings.note':
    'Credentials live only in this browser. They never leave your device except in the API requests to Freesound and Pixabay.',

  // Play mode
  'play.loading': 'Loading…',
  'play.empty.title': 'Almost ready!',
  'play.empty.body':
    'Ask your teacher to add at least 4 sounds with different loudness levels in the Teacher tab.',
  'play.round': 'Round {n}',
  'play.stars.aria': '{n} stars',
  'play.greatJob': 'Great job!',
  'play.playAgain': 'Play again',
  'play.softest': 'Softest',
  'play.loudest': 'Loudest',
  'play.tapToHear': '🔊 tap to hear',
} as const;

const no: Record<keyof typeof en, string> = {
  'app.play': '🎮 Spill',
  'app.teacher': '🧑‍🏫 Lærer',

  'teacher.title': 'Lærer',
  'teacher.subnav.library': '📚 Bibliotek',
  'teacher.subnav.settings': '⚙️ Innstillinger',
  'teacher.subtitle':
    'Legg til nye lyder barna kan leke med. Hver lyd trenger et navn, et bilde, en lydfil og en høyhetsverdi.',

  'library.count': 'Bibliotek ({n})',
  'library.empty': 'Ingen lyder enda. Legg til en på høyre side →',
  'library.loading': 'Laster…',
  'library.confirmDelete': 'Slette denne lyden fra biblioteket?',
  'library.trimmed': '✂️ trimmet',
  'library.play': 'Spill av',
  'library.delete': 'Slett',
  'library.saveFailed': 'Lagring feilet: {error}',

  'wizard.title': 'Legg til ny lyd',
  'wizard.step.name': 'Navn',
  'wizard.step.picture': 'Bilde',
  'wizard.step.sound': 'Lyd',
  'wizard.step.trim': 'Trim',
  'wizard.step.loudness': 'Høyhet',
  'wizard.next': 'Neste →',
  'wizard.back': '← Tilbake',

  'wizard.name.title': 'Hva er denne lyden?',
  'wizard.name.body': 'Skriv inn navnet (f.eks. «lyn», «løve», «hvisking»).',
  'wizard.name.placeholder': 'Lydnavn',

  'wizard.image.title': 'Hvordan ser «{name}» ut?',
  'wizard.image.dropHere': 'Slipp et bilde her',
  'wizard.image.different': 'Velg et annet bilde',

  'wizard.audio.title': 'Hvordan høres «{name}» ut?',
  'wizard.audio.dropHere': 'Slipp en lydfil her',
  'wizard.audio.different': 'Velg en annen fil',

  'wizard.dropFile': 'Slipp fil',
  'wizard.search': 'Søk',
  'wizard.searching': 'Søker…',
  'wizard.clickToBrowse': 'eller trykk for å bla',
  'wizard.search.empty': 'Skriv et søk og trykk Søk.',
  'wizard.search.placeholder.image': 'Søk bilder (f.eks. løve)',
  'wizard.search.placeholder.audio': 'Søk lyder (f.eks. torden)',
  'wizard.search.useThis': 'Bruk denne',
  'wizard.search.picked': '✓ Valgt',
  'wizard.search.play': 'Spill av',
  'wizard.search.stop': 'Stopp',

  'wizard.trim.title': 'Klipp lyden',
  'wizard.trim.body':
    'Dra glidebryterne for å velge hvilken del barna skal høre. Bruk Forhåndsvisning for å sjekke.',
  'wizard.trim.decoding': 'Dekoder lyd…',
  'wizard.trim.start': 'Start',
  'wizard.trim.end': 'Slutt',
  'wizard.trim.length': 'Valgt lengde: {time}',
  'wizard.trim.preview': '▶ Forhåndsvis',
  'wizard.trim.stop': '■ Stopp',

  'wizard.loudness.title': 'Hvor høyt er «{name}»?',
  'wizard.loudness.body':
    'Dra til hvor lyden hører hjemme — stille til venstre, høyt til høyre.',
  'wizard.loudness.aria': 'Lydstyrke fra 0 til 100',
  'wizard.loudness.readout': '{value} / 100',
  'wizard.loudness.save': 'Lagre lyd',
  'wizard.loudness.saving': 'Lagrer…',

  'settings.language.title': '🌐 Språk',
  'settings.language.body': 'Velg hvilket språk appen vises på.',

  'settings.freesound.title': '🔊 Freesound (lydsøk)',
  'settings.freesound.intro':
    'Legger Freesound-resultater til i lydsøket. Skaff legitimasjon på',
  'settings.freesound.clientId': 'Klient-ID',
  'settings.freesound.clientIdHint':
    'Lagres for referanse. Ikke nødvendig for søk.',
  'settings.freesound.clientIdPlaceholder': 'Din Freesound Klient-ID',
  'settings.freesound.secretKey': 'Hemmelig nøkkel (API-nøkkel)',
  'settings.freesound.secretKeyHint':
    'Brukes for å kalle Freesound-søke-API-et.',
  'settings.freesound.secretKeyPlaceholder': 'Din Freesound API-nøkkel',

  'settings.pixabay.title': '🖼️ Pixabay (bildesøk)',
  'settings.pixabay.introBefore':
    'Legger Pixabay-resultater til i bildesøket. Registrer deg på',
  'settings.pixabay.introMiddle': ', så vises nøkkelen på',
  'settings.pixabay.apiDocs': 'API docs-siden',
  'settings.pixabay.introAfter': 'når du er logget inn.',
  'settings.pixabay.apiKey': 'API-nøkkel',
  'settings.pixabay.apiKeyPlaceholder': 'Din Pixabay API-nøkkel',

  'settings.show': 'Vis',
  'settings.hide': 'Skjul',
  'settings.save': 'Lagre',
  'settings.saved': 'Lagret ✓',
  'settings.removeCredentials': 'Fjern legitimasjon',
  'settings.removeKey': 'Fjern nøkkel',
  'settings.note':
    'Legitimasjon lagres bare i denne nettleseren. Den forlater aldri enheten din unntatt i API-forespørsler til Freesound og Pixabay.',

  'play.loading': 'Laster…',
  'play.empty.title': 'Nesten klart!',
  'play.empty.body':
    'Be læreren legge til minst 4 lyder med ulik styrke i Lærer-fanen.',
  'play.round': 'Runde {n}',
  'play.stars.aria': '{n} stjerner',
  'play.greatJob': 'Bra jobbet!',
  'play.playAgain': 'Spill igjen',
  'play.softest': 'Stillest',
  'play.loudest': 'Høyest',
  'play.tapToHear': '🔊 trykk for å høre',
};

const STRINGS: Record<Locale, Record<keyof typeof en, string>> = { en, no };

export type TranslationKey = keyof typeof en;

type TranslateFn = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string;

function detectLocale(): Locale {
  const stored = (localStorage.getItem(KEY_LOCALE) ?? '') as Locale;
  if ((LOCALES as string[]).includes(stored)) return stored;
  const browserLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return (LOCALES as string[]).includes(browserLang) ? (browserLang as Locale) : 'en';
}

function applyVars(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return out;
}

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TranslateFn;
}>({
  locale: 'en',
  setLocale: () => {},
  t: (key, vars) => applyVars(en[key] ?? String(key), vars),
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(KEY_LOCALE, next);
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: ((key, vars) =>
        applyVars(STRINGS[locale][key] ?? STRINGS.en[key] ?? String(key), vars)) as TranslateFn,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useT() {
  return useContext(LocaleContext);
}
