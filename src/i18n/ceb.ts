// Cebuano (Binisaya) — best-effort translation. A native speaker should
// review the kid-facing tone, especially the encouragement phrases.
// As with Tagalog, code-switching with English is normal: borrowed words
// like "Save", "Search", "Loading" are kept where it reads more naturally
// than a forced direct translation.

import type { Translations } from './en';

const ceb: Record<keyof Translations, string> = {
  'app.play': '🎮 Magdula',
  'app.teacher': '🧑‍🏫 Magtutudlo',

  'teacher.title': 'Magtutudlo',
  'teacher.subnav.library': '📚 Library',
  'teacher.subnav.settings': '⚙️ Settings',
  'teacher.subtitle':
    'Pagdugang ug bag-ong mga tingog nga mahimo nga padulaon sa mga bata. Matag entry kinahanglan ug ngalan, hulagway, audio file, ug rating sa kakusog.',

  'library.count': 'Library ({n})',
  'library.empty': 'Wala pay tingog. Pagdugang ug usa sa tuo →',
  'library.loading': 'Nag-load…',
  'library.confirmDelete': 'Papason ang tingog nga kini gikan sa library?',
  'library.trimmed': '✂️ gipamubo',
  'library.play': 'I-play',
  'library.delete': 'Papason',
  'library.saveFailed': 'Wala na-save: {error}',

  'wizard.title': 'Pagdugang ug bag-ong tingog',
  'wizard.step.name': 'Ngalan',
  'wizard.step.picture': 'Hulagway',
  'wizard.step.sound': 'Tingog',
  'wizard.step.trim': 'Trim',
  'wizard.step.loudness': 'Kakusog',
  'wizard.next': 'Sunod →',
  'wizard.back': '← Balik',

  'wizard.name.title': 'Unsa nga tingog kini?',
  'wizard.name.body':
    'I-type ang ngalan (pananglitan "kilat", "liyon", "hunghong").',
  'wizard.name.placeholder': 'Ngalan sa tingog',

  'wizard.image.title': 'Unsay hitsura sa "{name}"?',
  'wizard.image.dropHere': 'I-drop ang hulagway diri',
  'wizard.image.different': 'Pagpili ug laing hulagway',

  'wizard.audio.title': 'Unsay tingog sa "{name}"?',
  'wizard.audio.dropHere': 'I-drop ang audio file diri',
  'wizard.audio.different': 'Pagpili ug laing file',

  'wizard.dropFile': 'I-drop ang file',
  'wizard.search': 'Pangita',
  'wizard.searching': 'Nangita…',
  'wizard.clickToBrowse': 'o i-klik aron mag-browse',
  'wizard.search.empty': 'Mag-type ug pindota ang Pangita.',
  'wizard.search.placeholder.image': 'Pangitag hulagway (pananglitan liyon)',
  'wizard.search.placeholder.audio': 'Pangitag tingog (pananglitan dalogdog)',
  'wizard.search.useThis': 'Gamiton kini',
  'wizard.search.picked': '✓ Napili',
  'wizard.search.play': 'I-play',
  'wizard.search.stop': 'Hunong',

  'wizard.trim.title': 'Pamub-an ang tingog',
  'wizard.trim.body':
    'I-drag ang sliders aron pilion kung asang parte ang madungog sa mga bata. Gamita ang Preview aron sulayan.',
  'wizard.trim.decoding': 'Nag-decode sa audio…',
  'wizard.trim.start': 'Sugod',
  'wizard.trim.end': 'Katapusan',
  'wizard.trim.length': 'Napiling gitas-on: {time}',
  'wizard.trim.preview': '▶ Preview',
  'wizard.trim.stop': '■ Hunong',

  'wizard.loudness.title': 'Unsa kakusog ang "{name}"?',
  'wizard.loudness.body':
    'I-slide kung asa nahaom — hinay sa wala, kusog sa tuo.',
  'wizard.loudness.aria': 'Kakusog gikan 0 hangtod 100',
  'wizard.loudness.readout': '{value} / 100',
  'wizard.loudness.save': 'I-save ang tingog',
  'wizard.loudness.saving': 'Nag-save…',

  'settings.language.title': '🌐 Pinulongan',
  'settings.language.body': 'Pagpili unsang pinulongan ang gamiton sa app.',

  'settings.freesound.title': '🔊 Freesound (pangita ug tingog)',
  'settings.freesound.intro':
    'Magdugang ug Freesound results sa pangita sa tingog. Kuhaa ang credentials sa',
  'settings.freesound.clientId': 'Client ID',
  'settings.freesound.clientIdHint':
    'Gitago para sa reference. Dili kinahanglan para sa pagpangita.',
  'settings.freesound.clientIdPlaceholder': 'Imong Freesound Client ID',
  'settings.freesound.secretKey': 'Secret Key (API key)',
  'settings.freesound.secretKeyHint':
    'Gigamit aron tawagan ang Freesound search API.',
  'settings.freesound.secretKeyPlaceholder': 'Imong Freesound API key',

  'settings.pixabay.title': '🖼️ Pixabay (pangita ug hulagway)',
  'settings.pixabay.introBefore':
    'Magdugang ug Pixabay results sa pangita sa hulagway. Mag-sign up sa',
  'settings.pixabay.introMiddle': ', dayon ipakita ang key sa',
  'settings.pixabay.apiDocs': 'API docs page',
  'settings.pixabay.introAfter': 'kung naka-log in na ka.',
  'settings.pixabay.apiKey': 'API Key',
  'settings.pixabay.apiKeyPlaceholder': 'Imong Pixabay API key',

  'settings.show': 'Ipakita',
  'settings.hide': 'Itago',
  'settings.save': 'I-save',
  'settings.saved': 'Na-save ✓',
  'settings.removeCredentials': 'Tangtanga ang credentials',
  'settings.removeKey': 'Tangtanga ang key',
  'settings.note':
    'Ang credentials gitago lang sa browser nga kini. Dili sila mogawas sa imong device gawas sa mga API request sa Freesound ug Pixabay.',

  'play.loading': 'Nag-load…',
  'play.empty.title': 'Hapit na!',
  'play.empty.body':
    'Hangyo-a ang imong magtutudlo nga magdugang ug kabahin 4 ka tingog nga lain-lain ug kakusog sa Magtutudlo tab.',
  'play.round': 'Round {n}',
  'play.stars.aria': '{n} ka bituon',
  'play.greatJob': 'Maayo!',
  'play.playAgain': 'Magdula pag-usab',
  'play.softest': 'Pinakahinay',
  'play.loudest': 'Pinakakusog',
  'play.tapToHear': '🔊 pindota aron madungog',
};

export default ceb;
