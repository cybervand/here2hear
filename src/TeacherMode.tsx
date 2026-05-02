import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addSound,
  deleteSound,
  listSounds,
  type SoundEntry,
} from './db';
import {
  fetchPreviewBlob,
  formatDuration,
  getApiKey,
  getCredentials,
  searchFreesound,
  setCredentials,
  shortLicense,
  type FreesoundResult,
} from './freesound';

type View = 'library' | 'settings';

type Step = 'name' | 'image' | 'audio' | 'trim' | 'loudness';

type Draft = {
  name: string;
  image: File | null;
  audio: Blob | null;
  audioName: string;
  startSec: number;
  endSec: number;
  duration: number;
  source?: SoundEntry['source'];
  loudness: number;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  image: null,
  audio: null,
  audioName: '',
  startSec: 0,
  endSec: 0,
  duration: 0,
  loudness: 50,
};

export default function TeacherMode() {
  const [view, setView] = useState<View>('library');
  const [library, setLibrary] = useState<SoundEntry[] | null>(null);
  const [step, setStep] = useState<Step>('name');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const items = await listSounds();
    setLibrary(items);
  };

  useEffect(() => {
    refresh();
  }, []);

  const reset = () => {
    setDraft(EMPTY_DRAFT);
    setStep('name');
    setError(null);
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.image || !draft.audio) return;
    setBusy(true);
    setError(null);
    try {
      const trimmed =
        draft.startSec > 0 || (draft.endSec > 0 && draft.endSec < draft.duration);
      await addSound({
        name: draft.name.trim(),
        image: draft.image,
        audio: draft.audio,
        loudness: draft.loudness,
        ...(trimmed ? { startSec: draft.startSec, endSec: draft.endSec } : {}),
        ...(draft.source ? { source: draft.source } : {}),
      });
      await refresh();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this sound from the library?')) return;
    await deleteSound(id);
    await refresh();
  };

  return (
    <div className="teacher">
      <header className="teacher-header">
        <div className="teacher-title-row">
          <h2>Teacher</h2>
          <nav className="teacher-subnav">
            <button
              type="button"
              className={`subnav-tab${view === 'library' ? ' active' : ''}`}
              onClick={() => setView('library')}
            >
              📚 Library
            </button>
            <button
              type="button"
              className={`subnav-tab${view === 'settings' ? ' active' : ''}`}
              onClick={() => setView('settings')}
            >
              ⚙️ Settings
            </button>
          </nav>
        </div>
        {view === 'library' && (
          <p className="teacher-sub">
            Add new sounds the children can play with. Each entry needs a name, a picture,
            an audio file, and a loudness rating.
          </p>
        )}
      </header>

      {view === 'settings' && <SettingsPage />}

      {view === 'library' && (
        <section className="teacher-grid">
          <div className="library-panel">
            <h3>Library ({library?.length ?? 0})</h3>
            {library === null && <p className="muted">Loading…</p>}
            {library && library.length === 0 && (
              <p className="muted">No sounds yet. Add one on the right →</p>
            )}
            {library && library.length > 0 && (
              <ul className="library-list">
                {library.map((e) => (
                  <LibraryRow key={e.id} entry={e} onDelete={() => remove(e.id)} />
                ))}
              </ul>
            )}
          </div>

          <div className="wizard-panel">
            <h3>Add a new sound</h3>
            <Stepper step={step} draft={draft} />
            {step === 'name' && (
              <NameStep
                value={draft.name}
                onChange={(name) => setDraft({ ...draft, name })}
                onNext={() => draft.name.trim() && setStep('image')}
              />
            )}
            {step === 'image' && (
              <ImageStep
                file={draft.image}
                onFile={(f) => setDraft({ ...draft, image: f })}
                onBack={() => setStep('name')}
                onNext={() => draft.image && setStep('audio')}
                name={draft.name}
              />
            )}
            {step === 'audio' && (
              <AudioStep
                audio={draft.audio}
                audioName={draft.audioName}
                source={draft.source}
                name={draft.name}
                onAudio={(audio, audioName, source) =>
                  setDraft({
                    ...draft,
                    audio,
                    audioName,
                    source,
                    // Reset trim when audio changes
                    startSec: 0,
                    endSec: 0,
                    duration: 0,
                  })
                }
                onBack={() => setStep('image')}
                onNext={() => draft.audio && setStep('trim')}
                onOpenSettings={() => setView('settings')}
              />
            )}
            {step === 'trim' && draft.audio && (
              <TrimStep
                audio={draft.audio}
                startSec={draft.startSec}
                endSec={draft.endSec}
                duration={draft.duration}
                onChange={(t) => setDraft({ ...draft, ...t })}
                onBack={() => setStep('audio')}
                onNext={() => setStep('loudness')}
              />
            )}
            {step === 'loudness' && (
              <LoudnessStep
                value={draft.loudness}
                onChange={(loudness) => setDraft({ ...draft, loudness })}
                onBack={() => setStep('trim')}
                onSave={save}
                busy={busy}
                name={draft.name}
              />
            )}
            {error && <p className="error">Save failed: {error}</p>}
          </div>
        </section>
      )}
    </div>
  );
}

/* ────────── Settings page ────────── */

function SettingsPage() {
  const initial = getCredentials();
  const [clientId, setClientId] = useState(initial.clientId);
  const [apiKey, setApiKeyInput] = useState(initial.apiKey);
  const [saved, setSaved] = useState<{ clientId: string; apiKey: string }>(initial);
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const save = () => {
    const next = { clientId: clientId.trim(), apiKey: apiKey.trim() };
    setCredentials(next);
    setSaved(next);
    setClientId(next.clientId);
    setApiKeyInput(next.apiKey);
    setSavedAt(Date.now());
  };

  const clear = () => {
    setCredentials({ clientId: '', apiKey: '' });
    setSaved({ clientId: '', apiKey: '' });
    setClientId('');
    setApiKeyInput('');
    setSavedAt(Date.now());
  };

  const dirty = clientId !== saved.clientId || apiKey !== saved.apiKey;

  return (
    <section className="settings-page">
      <div className="settings-card">
        <h3>🔊 Freesound</h3>
        <p className="muted">
          Connect your Freesound account so you can search sound effects from the audio
          step. Get credentials at{' '}
          <a
            href="https://freesound.org/apiv2/apply/"
            target="_blank"
            rel="noopener noreferrer"
          >
            freesound.org/apiv2/apply
          </a>
          .
        </p>

        <label className="field">
          <span className="field-label">Client ID</span>
          <input
            className="text-input"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Your Freesound Client ID"
            autoComplete="off"
          />
          <span className="field-hint muted small">
            Stored for reference. Not strictly required for searching.
          </span>
        </label>

        <label className="field">
          <span className="field-label">Secret Key (API key)</span>
          <div className="field-row">
            <input
              className="text-input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Your Freesound API key"
              autoComplete="off"
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowKey((v) => !v)}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <span className="field-hint muted small">
            Used to call the Freesound search API.
          </span>
        </label>

        <div className="row">
          <button type="button" className="btn" onClick={save} disabled={!dirty}>
            Save
          </button>
          {(clientId || apiKey) && (
            <button type="button" className="btn-text" onClick={clear}>
              Remove credentials
            </button>
          )}
          {savedAt && !dirty && <span className="muted small">Saved ✓</span>}
        </div>

        <p className="muted small note">
          Credentials are stored only in this browser (localStorage). They never leave your
          device except in the API requests sent to Freesound.
        </p>
      </div>
    </section>
  );
}

/* ────────── Stepper ────────── */

function Stepper({ step, draft }: { step: Step; draft: Draft }) {
  const steps: { key: Step; label: string; done: boolean }[] = [
    { key: 'name', label: 'Name', done: !!draft.name.trim() },
    { key: 'image', label: 'Picture', done: !!draft.image },
    { key: 'audio', label: 'Sound', done: !!draft.audio },
    { key: 'trim', label: 'Trim', done: draft.duration > 0 && draft.endSec > 0 },
    { key: 'loudness', label: 'Loudness', done: false },
  ];
  return (
    <ol className="stepper">
      {steps.map((s, i) => (
        <li
          key={s.key}
          className={`step${s.key === step ? ' current' : ''}${s.done ? ' done' : ''}`}
        >
          <span className="step-num">{s.done ? '✓' : i + 1}</span>
          <span className="step-label">{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

/* ────────── Name step ────────── */

function NameStep({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="step-body">
      <h4>What is this sound?</h4>
      <p className="muted">Type the name (e.g. "lightning", "lion", "whisper").</p>
      <input
        autoFocus
        className="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onNext()}
        placeholder="Sound name"
      />
      <div className="row right">
        <button type="button" className="btn" disabled={!value.trim()} onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

/* ────────── Image step (drop only) ────────── */

function ImageStep({
  file,
  onFile,
  onBack,
  onNext,
  name,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  onBack: () => void;
  onNext: () => void;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) onFile(f);
  };

  return (
    <div className="step-body">
      <h4>What does "{name}" look like?</h4>
      <p className="muted">Drag a picture here, or tap to choose one.</p>
      <div
        className={`dropzone${over ? ' over' : ''}${file ? ' has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {!file && (
          <>
            <div className="dropzone-icon" aria-hidden>
              🖼️
            </div>
            <div>Drop a picture here</div>
            <div className="muted small">or click to browse</div>
          </>
        )}
        {file && previewUrl && (
          <img className="preview-image" src={previewUrl} alt={file.name} />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {file && (
        <button type="button" className="btn-text" onClick={() => onFile(null)}>
          Choose a different picture
        </button>
      )}
      <div className="row split">
        <button type="button" className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn" disabled={!file} onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

/* ────────── Audio step (drop OR Freesound search) ────────── */

type AudioSource = 'drop' | 'freesound';

function AudioStep({
  audio,
  audioName,
  source,
  name,
  onAudio,
  onBack,
  onNext,
  onOpenSettings,
}: {
  audio: Blob | null;
  audioName: string;
  source?: SoundEntry['source'];
  name: string;
  onAudio: (
    audio: Blob | null,
    audioName: string,
    source?: SoundEntry['source'],
  ) => void;
  onBack: () => void;
  onNext: () => void;
  onOpenSettings: () => void;
}) {
  const apiKey = getApiKey();
  const [tab, setTab] = useState<AudioSource>(apiKey ? 'freesound' : 'drop');

  return (
    <div className="step-body">
      <h4>What does "{name}" sound like?</h4>
      <div className="seg-tabs">
        <button
          type="button"
          className={`seg-tab${tab === 'drop' ? ' active' : ''}`}
          onClick={() => setTab('drop')}
        >
          Drop a file
        </button>
        <button
          type="button"
          className={`seg-tab${tab === 'freesound' ? ' active' : ''}`}
          onClick={() => (apiKey ? setTab('freesound') : onOpenSettings())}
          title={apiKey ? '' : 'Add your Freesound key in Settings'}
        >
          Search Freesound{apiKey ? '' : ' →'}
        </button>
      </div>

      {tab === 'drop' && (
        <DropAudio
          audio={audio}
          audioName={audioName}
          onAudio={(blob, fname) => onAudio(blob, fname, undefined)}
        />
      )}
      {tab === 'freesound' && (
        <FreesoundSearch
          query={name}
          apiKey={apiKey}
          selected={source?.provider === 'freesound' ? source.soundId : null}
          onPick={(blob, src, displayName) => onAudio(blob, displayName, src)}
        />
      )}

      <div className="row split">
        <button type="button" className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn" disabled={!audio} onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

function DropAudio({
  audio,
  audioName,
  onAudio,
}: {
  audio: Blob | null;
  audioName: string;
  onAudio: (a: Blob | null, name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const previewUrl = useMemo(() => (audio ? URL.createObjectURL(audio) : null), [audio]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('audio/')) onAudio(f, f.name);
  };

  return (
    <>
      <div
        className={`dropzone${over ? ' over' : ''}${audio ? ' has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {!audio && (
          <>
            <div className="dropzone-icon" aria-hidden>
              🎵
            </div>
            <div>Drop an audio file here</div>
            <div className="muted small">or click to browse</div>
          </>
        )}
        {audio && previewUrl && (
          <div className="preview-audio">
            <div className="dropzone-icon" aria-hidden>
              🎵
            </div>
            <div className="filename">{audioName}</div>
            <audio
              controls
              src={previewUrl}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAudio(f, f.name);
          }}
        />
      </div>
      {audio && (
        <button type="button" className="btn-text" onClick={() => onAudio(null, '')}>
          Choose a different file
        </button>
      )}
    </>
  );
}

function FreesoundSearch({
  query: initialQuery,
  apiKey,
  selected,
  onPick,
}: {
  query: string;
  apiKey: string;
  selected: number | null;
  onPick: (
    blob: Blob,
    source: NonNullable<SoundEntry['source']>,
    displayName: string,
  ) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<FreesoundResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await searchFreesound(query.trim(), apiKey);
      setResults(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on first mount if there's an initial query
  useEffect(() => {
    if (initialQuery.trim() && results.length === 0) {
      search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playPreview = (r: FreesoundResult) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (playingId === r.id) {
      setPlayingId(null);
      return;
    }
    const a = new Audio(r.previews['preview-hq-mp3']);
    audioRef.current = a;
    a.play().catch(() => {});
    a.addEventListener('ended', () => setPlayingId(null), { once: true });
    setPlayingId(r.id);
  };

  const pickResult = async (r: FreesoundResult) => {
    setPicking(r.id);
    setError(null);
    try {
      const blob = await fetchPreviewBlob(r.previews['preview-hq-mp3']);
      onPick(
        blob,
        {
          provider: 'freesound',
          soundId: r.id,
          author: r.username,
          license: r.license,
          url: r.url,
        },
        r.name,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPicking(null);
    }
  };

  return (
    <div className="freesound-search">
      <div className="row">
        <input
          className="text-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search Freesound (e.g. thunder)"
        />
        <button type="button" className="btn" onClick={search} disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error && <p className="error small">{error}</p>}
      <ul className="fs-results">
        {results.map((r) => {
          const isSelected = selected === r.id;
          const isPlaying = playingId === r.id;
          const isPicking = picking === r.id;
          return (
            <li
              key={r.id}
              className={`fs-row${isSelected ? ' selected' : ''}`}
            >
              <button
                type="button"
                className="icon-btn"
                onClick={() => playPreview(r)}
                aria-label={isPlaying ? 'Stop' : 'Play'}
              >
                {isPlaying ? '■' : '▶'}
              </button>
              <div className="fs-meta">
                <div className="fs-title">{r.name}</div>
                <div className="muted small">
                  {r.username} • {formatDuration(r.duration)} • {shortLicense(r.license)}
                </div>
              </div>
              <button
                type="button"
                className={isSelected ? 'btn-secondary' : 'btn'}
                onClick={() => pickResult(r)}
                disabled={isPicking}
              >
                {isPicking ? '…' : isSelected ? '✓ Picked' : 'Use this'}
              </button>
            </li>
          );
        })}
        {!loading && results.length === 0 && !error && (
          <li className="muted small">Type a query and tap Search.</li>
        )}
      </ul>
    </div>
  );
}

/* ────────── Trim step ────────── */

function TrimStep({
  audio,
  startSec,
  endSec,
  duration,
  onChange,
  onBack,
  onNext,
}: {
  audio: Blob;
  startSec: number;
  endSec: number;
  duration: number;
  onChange: (t: { startSec: number; endSec: number; duration: number }) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopTimerRef = useRef<number | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [decoding, setDecoding] = useState(true);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const audioUrl = useMemo(() => URL.createObjectURL(audio), [audio]);
  useEffect(() => () => URL.revokeObjectURL(audioUrl), [audioUrl]);

  // Decode once per audio Blob
  useEffect(() => {
    let cancelled = false;
    setDecoding(true);
    setDecodeError(null);
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ac = new Ctor();
    audio
      .arrayBuffer()
      .then((ab) => ac.decodeAudioData(ab))
      .then((buf) => {
        if (cancelled) return;
        const dur = buf.duration;
        setPeaks(computePeaks(buf.getChannelData(0), 240));
        onChange({
          startSec: 0,
          endSec: dur,
          duration: dur,
        });
        setDecoding(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setDecodeError(e instanceof Error ? e.message : String(e));
        setDecoding(false);
      })
      .finally(() => {
        ac.close().catch(() => {});
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio]);

  // Draw waveform
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || peaks.length === 0 || duration === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const startX = (startSec / duration) * w;
    const endX = (endSec / duration) * w;

    // Selection background
    ctx.fillStyle = 'rgba(79, 140, 255, 0.18)';
    ctx.fillRect(startX, 0, endX - startX, h);

    // Waveform bars
    const barW = w / peaks.length;
    for (let i = 0; i < peaks.length; i++) {
      const x = i * barW;
      const inSel = x >= startX && x <= endX;
      ctx.fillStyle = inSel ? '#4f8cff' : '#3a4a72';
      const bh = peaks[i] * h * 0.9;
      ctx.fillRect(x, (h - bh) / 2, Math.max(1, barW - 0.5), bh);
    }

    // Selection edges
    ctx.strokeStyle = '#4f8cff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, h);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, h);
    ctx.stroke();
  }, [peaks, startSec, endSec, duration]);

  const stopPreview = () => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    audioRef.current?.pause();
    setPlaying(false);
  };

  useEffect(() => {
    return () => stopPreview();
  }, []);

  const preview = () => {
    const a = audioRef.current;
    if (!a || duration === 0) return;
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    // Snapshot trim window so a slider change mid-playback can't mutate the timer.
    const start = startSec;
    const length = Math.max(0, endSec - startSec);

    const startPlayback = () => {
      a.pause();
      a.currentTime = start;
      a.play()
        .then(() => {
          setPlaying(true);
          stopTimerRef.current = window.setTimeout(() => {
            a.pause();
            setPlaying(false);
            stopTimerRef.current = null;
          }, length * 1000 + 50);
        })
        .catch((e) => {
          setDecodeError(`Couldn't play preview: ${e instanceof Error ? e.message : e}`);
          setPlaying(false);
        });
    };

    if (a.readyState >= 1 /* HAVE_METADATA */) {
      startPlayback();
    } else {
      // Audio element hasn't loaded enough to honor a seek yet — wait for metadata.
      a.addEventListener('loadedmetadata', startPlayback, { once: true });
      a.load();
    }
  };

  const setStart = (v: number) => {
    const next = Math.min(v, endSec - 0.1);
    onChange({ startSec: Math.max(0, next), endSec, duration });
  };
  const setEnd = (v: number) => {
    const next = Math.max(v, startSec + 0.1);
    onChange({ startSec, endSec: Math.min(duration, next), duration });
  };

  return (
    <div className="step-body">
      <h4>Trim the sound</h4>
      <p className="muted">
        Drag the sliders to pick the part the kids will hear when they tap. Use Preview to
        check.
      </p>
      <div className="waveform-wrap">
        <canvas ref={canvasRef} className="waveform" />
        {decoding && <div className="waveform-status">Decoding audio…</div>}
        {decodeError && <div className="waveform-status error">{decodeError}</div>}
      </div>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        onEnded={() => {
          if (stopTimerRef.current !== null) {
            window.clearTimeout(stopTimerRef.current);
            stopTimerRef.current = null;
          }
          setPlaying(false);
        }}
      />
      <div className="trim-controls">
        <label className="trim-row">
          <span>Start</span>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={startSec}
            onChange={(e) => setStart(Number(e.target.value))}
            disabled={decoding || duration === 0}
          />
          <span className="trim-readout">{formatTime(startSec)}</span>
        </label>
        <label className="trim-row">
          <span>End</span>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={endSec}
            onChange={(e) => setEnd(Number(e.target.value))}
            disabled={decoding || duration === 0}
          />
          <span className="trim-readout">{formatTime(endSec)}</span>
        </label>
        <div className="trim-summary muted small">
          Selected length: {formatTime(Math.max(0, endSec - startSec))}
        </div>
      </div>
      <div className="row">
        <button
          type="button"
          className="btn-secondary"
          onClick={playing ? stopPreview : preview}
          disabled={decoding || duration === 0}
        >
          {playing ? '■ Stop' : '▶ Preview'}
        </button>
      </div>
      <div className="row split">
        <button type="button" className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn" onClick={onNext} disabled={decoding}>
          Next →
        </button>
      </div>
    </div>
  );
}

function computePeaks(channel: Float32Array, count: number): number[] {
  const block = Math.max(1, Math.floor(channel.length / count));
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    let max = 0;
    const start = i * block;
    const end = Math.min(channel.length, start + block);
    for (let j = start; j < end; j++) {
      const v = Math.abs(channel[j]);
      if (v > max) max = v;
    }
    peaks.push(max);
  }
  // Normalize so the loudest peak fills the canvas
  const top = Math.max(...peaks, 0.001);
  return peaks.map((p) => p / top);
}

function formatTime(sec: number): string {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

/* ────────── Loudness step ────────── */

function LoudnessStep({
  value,
  onChange,
  onBack,
  onSave,
  busy,
  name,
}: {
  value: number;
  onChange: (v: number) => void;
  onBack: () => void;
  onSave: () => void;
  busy: boolean;
  name: string;
}) {
  return (
    <div className="step-body">
      <h4>How loud is "{name}"?</h4>
      <p className="muted">
        Slide to where this sound belongs — soft on the left, loud on the right.
      </p>
      <div className="loudness-scale" aria-hidden>
        <span>🤫</span>
        <span>🔉</span>
        <span>🔊</span>
        <span>📢</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="loudness-slider"
        aria-label="Loudness from 0 to 100"
      />
      <div className="loudness-readout">{value} / 100</div>
      <div className="row split">
        <button type="button" className="btn-secondary" onClick={onBack} disabled={busy}>
          ← Back
        </button>
        <button type="button" className="btn" onClick={onSave} disabled={busy}>
          {busy ? 'Saving…' : 'Save sound'}
        </button>
      </div>
    </div>
  );
}

/* ────────── Library row ────────── */

function LibraryRow({ entry, onDelete }: { entry: SoundEntry; onDelete: () => void }) {
  // URLs are intentionally not revoked. Browser reclaims them on tab close, and
  // revoking here races with React's StrictMode simulated remount (see PlayMode).
  const imageUrl = useMemo(() => URL.createObjectURL(entry.image), [entry.image]);
  const audioUrl = useMemo(() => URL.createObjectURL(entry.audio), [entry.audio]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const stopTimerRef = useRef<number | null>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = `${entry.loudness}%`;
  }, [entry.loudness]);

  const play = () => {
    const a = audioRef.current;
    if (!a) return;
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    const start = entry.startSec ?? 0;
    const end = entry.endSec;
    a.currentTime = start;
    a.play().catch(() => {});
    if (end !== undefined && end > start) {
      stopTimerRef.current = window.setTimeout(() => {
        a.pause();
        stopTimerRef.current = null;
      }, (end - start) * 1000 + 50);
    }
  };

  const trimmed = entry.startSec !== undefined || entry.endSec !== undefined;

  return (
    <li className="library-row">
      <img src={imageUrl} alt={entry.name} className="library-thumb" />
      <div className="library-meta">
        <div className="library-name">
          {entry.name}
          {trimmed && <span className="trimmed-badge muted small">✂️ trimmed</span>}
        </div>
        <div className="loudness-bar" title={`Loudness ${entry.loudness}/100`}>
          <div className="loudness-fill" ref={fillRef} />
        </div>
        {entry.source && (
          <div className="muted small">
            {entry.source.author} •{' '}
            <a href={entry.source.url} target="_blank" rel="noopener noreferrer">
              Freesound
            </a>{' '}
            • {shortLicense(entry.source.license)}
          </div>
        )}
      </div>
      <button type="button" className="icon-btn" onClick={play} aria-label="Play">
        ▶
      </button>
      <button
        type="button"
        className="icon-btn danger"
        onClick={onDelete}
        aria-label="Delete"
      >
        ✕
      </button>
      <audio ref={audioRef} src={audioUrl} preload="none" />
    </li>
  );
}
