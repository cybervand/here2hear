import { useEffect, useMemo, useRef, useState } from 'react';
import { type SoundEntry } from '../db';
import {
  fetchPreviewBlob,
  formatDuration,
  getApiKey,
  searchFreesound,
  shortLicense,
  type FreesoundResult,
} from '../freesound';
import {
  fetchImageBlob,
  getApiKey as getPixabayKey,
  searchPixabay,
  type PixabayResult,
} from '../pixabay';
import {
  fetchBlob as fetchOpenverseBlob,
  formatDurationMs as formatOpenverseDuration,
  searchAudio as searchOpenverseAudio,
  searchImages as searchOpenverseImages,
  shortLicense as openverseLicense,
  type OpenverseAudio,
  type OpenverseImage,
} from '../openverse';

export type Step = 'name' | 'image' | 'audio' | 'trim' | 'loudness';

export type Draft = {
  name: string;
  image: Blob | null;
  audio: Blob | null;
  audioName: string;
  startSec: number;
  endSec: number;
  duration: number;
  source?: SoundEntry['source'];
  imageSource?: SoundEntry['imageSource'];
  loudness: number;
};

export const EMPTY_DRAFT: Draft = {
  name: '',
  image: null,
  audio: null,
  audioName: '',
  startSec: 0,
  endSec: 0,
  duration: 0,
  loudness: 50,
};

type WizardProps = {
  step: Step;
  draft: Draft;
  busy: boolean;
  onStep: (s: Step) => void;
  onDraft: (d: Draft) => void;
  onSave: () => void;
};

export default function Wizard({
  step,
  draft,
  busy,
  onStep,
  onDraft,
  onSave,
}: WizardProps) {
  return (
    <>
      <Stepper step={step} draft={draft} />
      {step === 'name' && (
        <NameStep
          value={draft.name}
          onChange={(name) => onDraft({ ...draft, name })}
          onNext={() => draft.name.trim() && onStep('image')}
        />
      )}
      {step === 'image' && (
        <ImageStep
          file={draft.image}
          imageSource={draft.imageSource}
          name={draft.name}
          onImage={(file, source) =>
            onDraft({ ...draft, image: file, imageSource: source })
          }
          onBack={() => onStep('name')}
          onNext={() => draft.image && onStep('audio')}
        />
      )}
      {step === 'audio' && (
        <AudioStep
          audio={draft.audio}
          audioName={draft.audioName}
          source={draft.source}
          name={draft.name}
          onAudio={(audio, audioName, source) =>
            onDraft({
              ...draft,
              audio,
              audioName,
              source,
              startSec: 0,
              endSec: 0,
              duration: 0,
            })
          }
          onBack={() => onStep('image')}
          onNext={() => draft.audio && onStep('trim')}
        />
      )}
      {step === 'trim' && draft.audio && (
        <TrimStep
          audio={draft.audio}
          startSec={draft.startSec}
          endSec={draft.endSec}
          duration={draft.duration}
          onChange={(t) => onDraft({ ...draft, ...t })}
          onBack={() => onStep('audio')}
          onNext={() => onStep('loudness')}
        />
      )}
      {step === 'loudness' && (
        <LoudnessStep
          value={draft.loudness}
          onChange={(loudness) => onDraft({ ...draft, loudness })}
          onBack={() => onStep('trim')}
          onSave={onSave}
          busy={busy}
          name={draft.name}
        />
      )}
    </>
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

/* ────────── Image step (drop OR Openverse / Pixabay search) ────────── */

type ImagePickerSource = 'drop' | 'openverse' | 'pixabay';

function ImageStep({
  file,
  imageSource,
  name,
  onImage,
  onBack,
  onNext,
}: {
  file: Blob | null;
  imageSource?: SoundEntry['imageSource'];
  name: string;
  onImage: (file: Blob | null, source?: SoundEntry['imageSource']) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const pixabayKey = getPixabayKey();
  // Default to the configured key-based provider if any, otherwise Openverse.
  const [tab, setTab] = useState<ImagePickerSource>(
    pixabayKey ? 'pixabay' : 'openverse',
  );

  return (
    <div className="step-body">
      <h4>What does "{name}" look like?</h4>
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
          className={`seg-tab${tab === 'openverse' ? ' active' : ''}`}
          onClick={() => setTab('openverse')}
        >
          Openverse
        </button>
        {pixabayKey && (
          <button
            type="button"
            className={`seg-tab${tab === 'pixabay' ? ' active' : ''}`}
            onClick={() => setTab('pixabay')}
          >
            Pixabay
          </button>
        )}
      </div>

      {/* All panes stay mounted so toggling tabs doesn't lose search state. */}
      <div className={tab === 'drop' ? '' : 'hidden'}>
        <DropImage file={file} onFile={(f) => onImage(f, undefined)} />
      </div>
      <div className={tab === 'openverse' ? '' : 'hidden'}>
        <OpenverseImageSearch
          query={name}
          selected={
            imageSource?.provider === 'openverse' ? imageSource.imageId : null
          }
          onPick={(blob, src) => onImage(blob, src)}
        />
      </div>
      {pixabayKey && (
        <div className={tab === 'pixabay' ? '' : 'hidden'}>
          <PixabaySearch
            query={name}
            apiKey={pixabayKey}
            selected={
              imageSource?.provider === 'pixabay' ? imageSource.imageId : null
            }
            onPick={(blob, src) => onImage(blob, src)}
          />
        </div>
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

function DropImage({
  file,
  onFile,
}: {
  file: Blob | null;
  onFile: (f: File | null) => void;
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
    <>
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
          <img className="preview-image" src={previewUrl} alt="" />
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
    </>
  );
}

function OpenverseImageSearch({
  query: initialQuery,
  selected,
  onPick,
}: {
  query: string;
  selected: string | null;
  onPick: (blob: Blob, source: NonNullable<SoundEntry['imageSource']>) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<OpenverseImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await searchOpenverseImages(query.trim());
      setResults(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery.trim() && results.length === 0) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickResult = async (r: OpenverseImage) => {
    setPicking(r.id);
    setError(null);
    try {
      const blob = await fetchOpenverseBlob(r.thumbnail || r.url);
      onPick(blob, {
        provider: 'openverse',
        imageId: r.id,
        author: r.creator || 'Unknown',
        license: r.license,
        url: r.foreign_landing_url || r.url,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPicking(null);
    }
  };

  return (
    <div className="pixabay-search">
      <div className="row">
        <input
          className="text-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search Openverse (e.g. lion)"
        />
        <button type="button" className="btn" onClick={search} disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error && <p className="error small">{error}</p>}
      <div className="px-grid">
        {results.map((r) => {
          const isSelected = selected === r.id;
          const isPicking = picking === r.id;
          return (
            <button
              type="button"
              key={r.id}
              className={`px-tile${isSelected ? ' selected' : ''}`}
              onClick={() => pickResult(r)}
              disabled={isPicking}
              aria-label={`Use ${r.title} by ${r.creator}`}
              title={`${r.title}\nby ${r.creator || 'Unknown'} • ${openverseLicense(r.license)}`}
            >
              <img src={r.thumbnail} alt={r.title} loading="lazy" />
              <div className="px-tile-author muted small">
                {r.creator || 'Unknown'}
              </div>
              {isPicking && <div className="px-tile-badge">…</div>}
              {isSelected && !isPicking && <div className="px-tile-badge">✓</div>}
            </button>
          );
        })}
        {!loading && results.length === 0 && !error && (
          <div className="muted small">Type a query and tap Search.</div>
        )}
      </div>
    </div>
  );
}

function OpenverseAudioSearch({
  query: initialQuery,
  selected,
  onPick,
}: {
  query: string;
  selected: string | null;
  onPick: (
    blob: Blob,
    source: NonNullable<SoundEntry['source']>,
    displayName: string,
  ) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<OpenverseAudio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
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
      const r = await searchOpenverseAudio(query.trim());
      setResults(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery.trim() && results.length === 0) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playPreview = (r: OpenverseAudio) => {
    if (audioRef.current) audioRef.current.pause();
    if (playingId === r.id) {
      setPlayingId(null);
      return;
    }
    const a = new Audio(r.url);
    audioRef.current = a;
    a.play().catch(() => {});
    a.addEventListener('ended', () => setPlayingId(null), { once: true });
    setPlayingId(r.id);
  };

  const pickResult = async (r: OpenverseAudio) => {
    setPicking(r.id);
    setError(null);
    try {
      const blob = await fetchOpenverseBlob(r.url);
      onPick(
        blob,
        {
          provider: 'openverse',
          soundId: r.id,
          author: r.creator || 'Unknown',
          license: r.license,
          url: r.foreign_landing_url || r.url,
        },
        r.title,
      );
    } catch (e) {
      // Some Openverse audio sources don't allow direct browser download (CORS).
      // Surface a helpful hint.
      const msg = e instanceof Error ? e.message : String(e);
      setError(`${msg} — try another result.`);
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
          placeholder="Search Openverse (e.g. thunder)"
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
                <div className="fs-title">{r.title}</div>
                <div className="muted small">
                  {r.creator || 'Unknown'} •{' '}
                  {r.duration ? formatOpenverseDuration(r.duration) : '—'} •{' '}
                  {openverseLicense(r.license)}
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

function PixabaySearch({
  query: initialQuery,
  apiKey,
  selected,
  onPick,
}: {
  query: string;
  apiKey: string;
  selected: number | null;
  onPick: (blob: Blob, source: NonNullable<SoundEntry['imageSource']>) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PixabayResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<number | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await searchPixabay(query.trim(), apiKey);
      setResults(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery.trim() && results.length === 0) {
      search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickResult = async (r: PixabayResult) => {
    setPicking(r.id);
    setError(null);
    try {
      const blob = await fetchImageBlob(r.webformatURL);
      onPick(blob, {
        provider: 'pixabay',
        imageId: r.id,
        author: r.user,
        url: r.pageURL,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPicking(null);
    }
  };

  return (
    <div className="pixabay-search">
      <div className="row">
        <input
          className="text-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search Pixabay (e.g. lion)"
        />
        <button type="button" className="btn" onClick={search} disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error && <p className="error small">{error}</p>}
      <div className="px-grid">
        {results.map((r) => {
          const isSelected = selected === r.id;
          const isPicking = picking === r.id;
          return (
            <button
              type="button"
              key={r.id}
              className={`px-tile${isSelected ? ' selected' : ''}`}
              onClick={() => pickResult(r)}
              disabled={isPicking}
              aria-label={`Use ${r.tags} by ${r.user}`}
            >
              <img src={r.previewURL} alt={r.tags} />
              <div className="px-tile-author muted small">by {r.user}</div>
              {isPicking && <div className="px-tile-badge">…</div>}
              {isSelected && !isPicking && <div className="px-tile-badge">✓</div>}
            </button>
          );
        })}
        {!loading && results.length === 0 && !error && (
          <div className="muted small">Type a query and tap Search.</div>
        )}
      </div>
    </div>
  );
}

/* ────────── Audio step ────────── */

type AudioPickerSource = 'drop' | 'openverse' | 'freesound';

function AudioStep({
  audio,
  audioName,
  source,
  name,
  onAudio,
  onBack,
  onNext,
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
}) {
  const freesoundKey = getApiKey();
  const [tab, setTab] = useState<AudioPickerSource>(
    freesoundKey ? 'freesound' : 'openverse',
  );

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
          className={`seg-tab${tab === 'openverse' ? ' active' : ''}`}
          onClick={() => setTab('openverse')}
        >
          Openverse
        </button>
        {freesoundKey && (
          <button
            type="button"
            className={`seg-tab${tab === 'freesound' ? ' active' : ''}`}
            onClick={() => setTab('freesound')}
          >
            Freesound
          </button>
        )}
      </div>

      {/* All panes stay mounted so toggling tabs doesn't lose search state. */}
      <div className={tab === 'drop' ? '' : 'hidden'}>
        <DropAudio
          audio={audio}
          audioName={audioName}
          onAudio={(blob, fname) => onAudio(blob, fname, undefined)}
        />
      </div>
      <div className={tab === 'openverse' ? '' : 'hidden'}>
        <OpenverseAudioSearch
          query={name}
          selected={source?.provider === 'openverse' ? source.soundId : null}
          onPick={(blob, src, displayName) => onAudio(blob, displayName, src)}
        />
      </div>
      {freesoundKey && (
        <div className={tab === 'freesound' ? '' : 'hidden'}>
          <FreesoundSearch
            query={name}
            apiKey={freesoundKey}
            selected={source?.provider === 'freesound' ? source.soundId : null}
            onPick={(blob, src, displayName) => onAudio(blob, displayName, src)}
          />
        </div>
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
