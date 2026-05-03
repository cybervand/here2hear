// English — source of truth for translation keys. Other locales must define
// the same keys (TypeScript enforces this via `Record<keyof Translations, string>`).

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
    'Slide to where this sound belongs — soft on the left, loud on the right. The icons above are reference points.',
  'wizard.loudness.aria': 'Loudness from 0 to 100',
  'wizard.loudness.readout': '{value} / 100',
  'wizard.loudness.save': 'Save sound',
  'wizard.loudness.saving': 'Saving…',
  'wizard.loudness.anchor.sleeping': 'sleeping',
  'wizard.loudness.anchor.whisper': 'whisper',
  'wizard.loudness.anchor.bird': 'bird',
  'wizard.loudness.anchor.dog': 'dog',
  'wizard.loudness.anchor.drum': 'drum',
  'wizard.loudness.anchor.rocket': 'rocket',

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
  'play.empty.notEnough':
    'There are only {n} sounds in the library. Add at least 4 in the Teacher tab.',
  'play.empty.sameLoudness':
    'All sounds have the same loudness rating. When adding a sound, slide the Loudness slider so different sounds get different ratings (soft on the left, loud on the right).',
  'play.round': 'Round {n}',
  'play.stars.aria': '{n} stars',
  'play.greatJob': 'Great job!',
  'play.playAgain': 'Play again',
  'play.softest': 'Softest',
  'play.loudest': 'Loudest',
  'play.tapToHear': '🔊 tap to hear',
} as const;

export type Translations = typeof en;
export default en;
