# here2hear

A drag-and-drop sound game for kindergarten classrooms. Kids hear four sounds and pick the **loudest** and the **softest**. You add your own pictures and sounds, so the game can fit whatever you're teaching.

## Getting it running

1. Install Node.js from <https://nodejs.org> — click the green **LTS** button and run the installer.
2. Download this project: click the green **Code** button at the top of this page → **Download ZIP** → unzip it somewhere.
3. Open the unzipped folder and double-click **start.bat**.
4. Your browser opens with the game.

The first time takes a minute or two to set itself up. After that it starts in seconds.

## How to use it

There are two tabs at the top of the screen.

### Teacher tab — set up the sounds

Add at least 4 sounds. For each one, the wizard asks you for:

- a **name** ("lion", "whisper", "thunder")
- a **picture** — drag it in from your desktop, or **Search**
- a **sound** — drag it in, or **Search**
- a **trim** if you only want part of a long clip to play
- a **loudness** — slide from soft to loud

### Play tab — what the kids do

Four pictures appear at the bottom of the screen. The kid:

- **taps** a picture to hear it
- **drags** the loudest picture up to the big speaker
- **drags** the softest one up to the little speaker

When both are right, they get a star and the next round starts.

## Built-in search

The picture and sound steps both have a **Search** tab. Type what you're looking for, tap a result, done. Out of the box this searches [Openverse](https://openverse.org) — a free CC-licensed media library that aggregates Wikimedia, Flickr, Smithsonian, Freesound, Jamendo and others. **No signup, no key.**

### Optional: add more results

If Openverse alone isn't enough, you can plug in free API keys for Pixabay (more curated pictures) and Freesound (larger sound-effect library). Each one *adds* its results to the same Search; there's no extra tab to learn.

**Pixabay** — for pictures.

1. Sign up at <https://pixabay.com/accounts/register/>
2. Once logged in, your API key shows on <https://pixabay.com/api/docs/> (auto-generated)
3. In the app: **Teacher → Settings**, paste the key into the Pixabay card, click **Save**

**Freesound** — for sounds.

1. Sign up at <https://freesound.org>
2. Get a key at <https://freesound.org/apiv2/apply> (you can fill the form with anything)
3. In the app: **Teacher → Settings**, paste the **Secret Key**, click **Save**

## Languages

The app starts in your browser's language if it's supported (currently English, Norwegian Bokmål, Tagalog, and Cebuano); otherwise English. You can switch any time in **Teacher → Settings**, top card.

Translations live in [src/i18n/](src/i18n/) — one file per language. To add a new one, copy `no.ts`, translate the values (the keys must match `en.ts` exactly — TypeScript will tell you if anything's missing), then register it in `index.tsx`.

## Where the sounds are saved

Everything you add lives on the device you set it up on — there's no cloud sync. If you build the library on the classroom laptop, that's where it stays. Clearing the browser's data will erase the library.

---

*Developers: `npm install` then `npm run dev`. React + TypeScript + Vite, IndexedDB for storage.*
