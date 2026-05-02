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
- a **picture** — drag it in from your desktop, or search Openverse / Pixabay
- a **sound** — drag it in, or search Openverse / Freesound
- a **trim** if you only want part of a long clip to play
- a **loudness** — slide from soft to loud

### Play tab — what the kids do

Four pictures appear at the bottom of the screen. The kid:

- **taps** a picture to hear it
- **drags** the loudest picture up to the big speaker
- **drags** the softest one up to the little speaker

When both are right, they get a star and the next round starts.

## Built-in search

You can search for pictures and sounds without leaving the app.

### Openverse — works out of the box

[Openverse](https://openverse.org) is a free CC-licensed media library that aggregates Wikimedia, Flickr, Smithsonian, Freesound and others. **No signup or key needed** — just type a query in the picture or sound step and tap Search.

This is the default. You don't have to do anything to use it.

### Optional upgrades

If Openverse doesn't have what you want, you can add a free key for one of these to get a second search option in the same step:

**Pixabay** — for pictures. Photos and friendly illustrations.

1. Sign up at <https://pixabay.com/accounts/register/>
2. Once logged in, your API key shows on <https://pixabay.com/api/docs/> (auto-generated)
3. In the app: **Teacher → Settings**, paste the key into the Pixabay card, click **Save**

**Freesound** — for sounds. Larger curated library of sound effects.

1. Sign up at <https://freesound.org>
2. Get a key at <https://freesound.org/apiv2/apply> (you can fill the form with anything)
3. In the app: **Teacher → Settings**, paste the **Secret Key**, click **Save**

## Where the sounds are saved

Everything you add lives on the device you set it up on — there's no cloud sync. If you build the library on the classroom laptop, that's where it stays. Clearing the browser's data will erase the library.

---

*Developers: `npm install` then `npm run dev`. React + TypeScript + Vite, IndexedDB for storage.*
