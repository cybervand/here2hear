// Tagalog (Filipino) — best-effort translation. A native speaker should
// review the kid-facing tone. Filipino tech UIs commonly mix English with
// Tagalog ("Taglish") — borrowed words like "Save", "Search", "Loading"
// are kept where that reads more naturally than a forced direct translation.

import type { Translations } from './en';

const tl: Record<keyof Translations, string> = {
  'app.play': '🎮 Maglaro',
  'app.teacher': '🧑‍🏫 Guro',

  'teacher.title': 'Guro',
  'teacher.subnav.library': '📚 Aklatan',
  'teacher.subnav.settings': '⚙️ Settings',
  'teacher.subtitle':
    'Magdagdag ng mga bagong tunog na puwedeng pakinggan ng mga bata. Bawat entry ay nangangailangan ng pangalan, larawan, audio file, at antas ng lakas.',

  'library.count': 'Aklatan ({n})',
  'library.empty': 'Wala pang tunog. Magdagdag ng isa sa kanan →',
  'library.loading': 'Naglo-load…',
  'library.confirmDelete': 'Burahin ang tunog na ito mula sa aklatan?',
  'library.trimmed': '✂️ pinaikli',
  'library.play': 'I-play',
  'library.delete': 'Burahin',
  'library.saveFailed': 'Hindi ma-save: {error}',

  'wizard.title': 'Magdagdag ng bagong tunog',
  'wizard.step.name': 'Pangalan',
  'wizard.step.picture': 'Larawan',
  'wizard.step.sound': 'Tunog',
  'wizard.step.trim': 'Trim',
  'wizard.step.loudness': 'Lakas',
  'wizard.next': 'Susunod →',
  'wizard.back': '← Bumalik',

  'wizard.name.title': 'Anong tunog ito?',
  'wizard.name.body': 'I-type ang pangalan (hal. "kidlat", "leon", "bulong").',
  'wizard.name.placeholder': 'Pangalan ng tunog',

  'wizard.image.title': 'Anong itsura ng "{name}"?',
  'wizard.image.dropHere': 'I-drop ang larawan dito',
  'wizard.image.different': 'Pumili ng ibang larawan',

  'wizard.audio.title': 'Anong tunog ng "{name}"?',
  'wizard.audio.dropHere': 'I-drop ang audio file dito',
  'wizard.audio.different': 'Pumili ng ibang file',

  'wizard.dropFile': 'Mag-drop ng file',
  'wizard.search': 'Maghanap',
  'wizard.searching': 'Naghahanap…',
  'wizard.clickToBrowse': 'o pindutin para mag-browse',
  'wizard.search.empty': 'Mag-type at pindutin ang Maghanap.',
  'wizard.search.placeholder.image': 'Maghanap ng larawan (hal. leon)',
  'wizard.search.placeholder.audio': 'Maghanap ng tunog (hal. kulog)',
  'wizard.search.useThis': 'Gamitin ito',
  'wizard.search.picked': '✓ Napili',
  'wizard.search.play': 'I-play',
  'wizard.search.stop': 'Itigil',

  'wizard.trim.title': 'I-trim ang tunog',
  'wizard.trim.body':
    'I-drag ang sliders para piliin kung anong parte ang maririnig ng mga bata. Gamitin ang Preview para subukan.',
  'wizard.trim.decoding': 'Dini-decode ang audio…',
  'wizard.trim.start': 'Simula',
  'wizard.trim.end': 'Dulo',
  'wizard.trim.length': 'Napiling haba: {time}',
  'wizard.trim.preview': '▶ Preview',
  'wizard.trim.stop': '■ Itigil',

  'wizard.loudness.title': 'Gaano kalakas ang "{name}"?',
  'wizard.loudness.body':
    'I-slide sa kung saan nababagay — mahina sa kaliwa, malakas sa kanan.',
  'wizard.loudness.aria': 'Lakas mula 0 hanggang 100',
  'wizard.loudness.readout': '{value} / 100',
  'wizard.loudness.save': 'I-save ang tunog',
  'wizard.loudness.saving': 'Sini-save…',

  'settings.language.title': '🌐 Wika',
  'settings.language.body': 'Pumili kung anong wika ang gagamitin ng app.',

  'settings.freesound.title': '🔊 Freesound (paghahanap ng tunog)',
  'settings.freesound.intro':
    'Nagdadagdag ng Freesound results sa paghahanap ng tunog. Kumuha ng credentials sa',
  'settings.freesound.clientId': 'Client ID',
  'settings.freesound.clientIdHint':
    'Itinatabi para sa reference. Hindi kailangan para sa paghahanap.',
  'settings.freesound.clientIdPlaceholder': 'Iyong Freesound Client ID',
  'settings.freesound.secretKey': 'Secret Key (API key)',
  'settings.freesound.secretKeyHint':
    'Ginagamit para tumawag sa Freesound search API.',
  'settings.freesound.secretKeyPlaceholder': 'Iyong Freesound API key',

  'settings.pixabay.title': '🖼️ Pixabay (paghahanap ng larawan)',
  'settings.pixabay.introBefore':
    'Nagdadagdag ng Pixabay results sa paghahanap ng larawan. Mag-sign up sa',
  'settings.pixabay.introMiddle': ', tapos ipapakita ang key sa',
  'settings.pixabay.apiDocs': 'API docs page',
  'settings.pixabay.introAfter': 'kapag naka-log in ka.',
  'settings.pixabay.apiKey': 'API Key',
  'settings.pixabay.apiKeyPlaceholder': 'Iyong Pixabay API key',

  'settings.show': 'Ipakita',
  'settings.hide': 'Itago',
  'settings.save': 'I-save',
  'settings.saved': 'Na-save ✓',
  'settings.removeCredentials': 'Tanggalin ang credentials',
  'settings.removeKey': 'Tanggalin ang key',
  'settings.note':
    'Ang credentials ay nakatabi lamang sa browser na ito. Hindi sila lalabas sa device mo maliban sa mga API request sa Freesound at Pixabay.',

  'play.loading': 'Naglo-load…',
  'play.empty.title': 'Halos handa na!',
  'play.empty.body':
    'Hilingin sa guro mo na magdagdag ng kahit 4 na tunog na may iba\'t ibang lakas sa Guro tab.',
  'play.round': 'Round {n}',
  'play.stars.aria': '{n} bituin',
  'play.greatJob': 'Galing!',
  'play.playAgain': 'Maglaro ulit',
  'play.softest': 'Pinakamahina',
  'play.loudest': 'Pinakamalakas',
  'play.tapToHear': '🔊 pindutin para marinig',
};

export default tl;
