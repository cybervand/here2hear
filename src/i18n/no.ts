// Norwegian Bokmål. Refine any phrase that doesn't read naturally — the
// English file (en.ts) is the source of truth for which keys must exist.

import type { Translations } from './en';

const no: Record<keyof Translations, string> = {
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
    'Dra til hvor lyden hører hjemme — stille til venstre, høyt til høyre. Ikonene over er referansepunkter.',
  'wizard.loudness.aria': 'Lydstyrke fra 0 til 100',
  'wizard.loudness.readout': '{value} / 100',
  'wizard.loudness.save': 'Lagre lyd',
  'wizard.loudness.saving': 'Lagrer…',
  'wizard.loudness.anchor.sleeping': 'sover',
  'wizard.loudness.anchor.whisper': 'hvisking',
  'wizard.loudness.anchor.bird': 'fugl',
  'wizard.loudness.anchor.dog': 'hund',
  'wizard.loudness.anchor.drum': 'tromme',
  'wizard.loudness.anchor.rocket': 'rakett',

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
    'Be læreren legge til minst 2 lyder med ulik styrke i Lærer-fanen.',
  'play.empty.notEnough':
    'Det er bare {n} lyder i biblioteket. Legg til minst 2 i Lærer-fanen.',
  'play.empty.sameLoudness':
    'Alle lydene har samme styrke. Når du legger til en lyd, dra Lydstyrke-bryteren slik at forskjellige lyder får forskjellige verdier (stille til venstre, høyt til høyre).',
  'play.round': 'Runde {n}',
  'play.stars.aria': '{n} stjerner',
  'play.greatJob': 'Bra jobbet!',
  'play.playAgain': 'Spill igjen',
  'play.softest': 'Stille',
  'play.loudest': 'Høyt',
  'play.tapToHear': '🔊 trykk for å høre',
};

export default no;
