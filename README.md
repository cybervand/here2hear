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
- a **picture** — drag it in from your desktop
- a **sound** — drag it in, or search Freesound (see below)
- a **trim** if you only want part of a long clip to play
- a **loudness** — slide from soft to loud

### Play tab — what the kids do

Four pictures appear at the bottom of the screen. The kid:

- **taps** a picture to hear it
- **drags** the loudest picture up to the big speaker
- **drags** the softest one up to the little speaker

When both are right, they get a star and the next round starts.

## Freesound (optional but recommended)

Freesound is a free online library of thousands of sounds. You can search it from inside the Teacher tab instead of hunting for audio files yourself.

1. Sign up at <https://freesound.org>
2. Get a key at <https://freesound.org/apiv2/apply> (you can fill the form with anything)
3. In the app: **Teacher → Settings**, paste the **Secret Key**, click **Save**
4. The Teacher wizard now has a "Search Freesound" option

## Where the sounds are saved

Everything you add lives on the device you set it up on — there's no cloud sync. If you build the library on the classroom laptop, that's where it stays. Clearing the browser's data will erase the library.

---

*Developers: `npm install` then `npm run dev`. React + TypeScript + Vite, IndexedDB for storage.*
