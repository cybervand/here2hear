import { useEffect, useMemo, useRef, useState } from 'react';
import { type SoundEntry } from '../db';
import {
  getApiKey as getFreesoundKey,
  searchFreesound,
  shortLicense as freesoundLicense,
  type FreesoundResult,
} from '../freesound';
import { useT } from '../i18n';
import {
  getApiKey as getPixabayKey,
  searchPixabay,
  type PixabayResult,
} from '../pixabay';
import {
  searchAudio as searchOpenverseAudio,
  searchImages as searchOpenverseImages,
  shortLicense as openverseLicense,
  type OpenverseAudio,
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
  const { t } = useT();
  const steps: { key: Step; label: string; done: boolean }[] = [
    { key: 'name', label: t('wizard.step.name'), done: !!draft.name.trim() },
    { key: 'image', label: t('wizard.step.picture'), done: !!draft.image },
    { key: 'audio', label: t('wizard.step.sound'), done: !!draft.audio },
    { key: 'trim', label: t('wizard.step.trim'), done: draft.duration > 0 && draft.endSec > 0 },
    { key: 'loudness', label: t('wizard.step.loudness'), done: false },
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
  const { t } = useT();
  return (
    <div className="step-body">
      <h4>{t('wizard.name.title')}</h4>
      <p className="muted">{t('wizard.name.body')}</p>
      <input
        autoFocus
        className="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onNext()}
        placeholder={t('wizard.name.placeholder')}
      />
      <div className="row right">
        <button type="button" className="btn" disabled={!value.trim()} onClick={onNext}>
          {t('wizard.next')}
        </button>
      </div>
    </div>
  );
}

/* ────────── Image step ────────── */

type ImagePickerSource = 'drop' | 'search';

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
  const { t } = useT();
  const [tab, setTab] = useState<ImagePickerSource>('search');

  return (
    <div className="step-body">
      <h4>{t('wizard.image.title', { name })}</h4>
      <div className="seg-tabs">
        <button
          type="button"
          className={`seg-tab${tab === 'drop' ? ' active' : ''}`}
          onClick={() => setTab('drop')}
        >
          {t('wizard.dropFile')}
        </button>
        <button
          type="button"
          className={`seg-tab${tab === 'search' ? ' active' : ''}`}
          onClick={() => setTab('search')}
        >
          {t('wizard.search')}
        </button>
      </div>

      {/* Both panes stay mounted so toggling tabs doesn't lose search state. */}
      <div className={tab === 'drop' ? '' : 'hidden'}>
        <DropImage file={file} onFile={(f) => onImage(f, undefined)} />
      </div>
      <div className={tab === 'search' ? '' : 'hidden'}>
        <ImageSearch
          initialQuery={name}
          selectedKey={
            imageSource ? `${imageSource.provider}-${imageSource.imageId}` : null
          }
          onPick={(blob, src) => onImage(blob, src)}
        />
      </div>

      <div className="row split">
        <button type="button" className="btn-secondary" onClick={onBack}>
          {t('wizard.back')}
        </button>
        <button type="button" className="btn" disabled={!file} onClick={onNext}>
          {t('wizard.next')}
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
  const { t } = useT();
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
            <div>{t('wizard.image.dropHere')}</div>
            <div className="muted small">{t('wizard.clickToBrowse')}</div>
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
          {t('wizard.image.different')}
        </button>
      )}
    </>
  );
}

/* ────────── Unified picture search (Openverse + Pixabay) ────────── */

type ImageHit = {
  key: string;
  thumbnailUrl: string;
  largeUrl: string;
  title: string;
  author: string;
  attribution: NonNullable<SoundEntry['imageSource']>;
};

async function runImageSearch(
  query: string,
): Promise<{ hits: ImageHit[]; errors: string[] }> {
  const pixabayKey = getPixabayKey();
  const tasks: Array<{ label: string; promise: Promise<ImageHit[]> }> = [];

  tasks.push({
    label: 'Openverse',
    promise: searchOpenverseImages(query).then((rs) =>
      rs.map(
        (r): ImageHit => ({
          key: `openverse-${r.id}`,
          thumbnailUrl: r.thumbnail,
          largeUrl: r.thumbnail,
          title: r.title,
          author: r.creator || 'Unknown',
          attribution: {
            provider: 'openverse',
            imageId: r.id,
            author: r.creator || 'Unknown',
            license: r.license,
            url: r.foreign_landing_url || r.url,
          },
        }),
      ),
    ),
  });

  if (pixabayKey) {
    tasks.push({
      label: 'Pixabay',
      promise: searchPixabay(query, pixabayKey).then((rs) =>
        rs.map(
          (r: PixabayResult): ImageHit => ({
            key: `pixabay-${r.id}`,
            thumbnailUrl: r.previewURL,
            largeUrl: r.webformatURL,
            title: r.tags,
            author: r.user,
            attribution: {
              provider: 'pixabay',
              imageId: r.id,
              author: r.user,
              url: r.pageURL,
            },
          }),
        ),
      ),
    });
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.promise));
  const hits: ImageHit[] = [];
  const errors: string[] = [];
  settled.forEach((s, i) => {
    const label = tasks[i].label;
    if (s.status === 'fulfilled') hits.push(...s.value);
    else
      errors.push(
        `${label}: ${s.reason instanceof Error ? s.reason.message : String(s.reason)}`,
      );
  });
  // Pixabay first (curated quality), then Openverse to fill in the rest.
  hits.sort((a, b) => {
    const aPx = a.key.startsWith('pixabay-') ? 0 : 1;
    const bPx = b.key.startsWith('pixabay-') ? 0 : 1;
    return aPx - bPx;
  });
  return { hits, errors };
}

function ImageSearch({
  initialQuery,
  selectedKey,
  onPick,
}: {
  initialQuery: string;
  selectedKey: string | null;
  onPick: (blob: Blob, source: NonNullable<SoundEntry['imageSource']>) => void;
}) {
  const { t } = useT();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ImageHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [picking, setPicking] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrors([]);
    const { hits, errors: errs } = await runImageSearch(query.trim());
    setResults(hits);
    setErrors(errs);
    setLoading(false);
  };

  useEffect(() => {
    if (initialQuery.trim() && results.length === 0) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickResult = async (hit: ImageHit) => {
    setPicking(hit.key);
    setErrors([]);
    try {
      const res = await fetch(hit.largeUrl);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      const blob = await res.blob();
      onPick(blob, hit.attribution);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : String(e)]);
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
          placeholder={t('wizard.search.placeholder.image')}
        />
        <button type="button" className="btn" onClick={search} disabled={loading}>
          {loading ? t('wizard.searching') : t('wizard.search')}
        </button>
      </div>
      {errors.map((msg, i) => (
        <p key={i} className="error small">
          {msg}
        </p>
      ))}
      <div className="px-grid">
        {results.map((hit) => {
          const isSelected = selectedKey === hit.key;
          const isPicking = picking === hit.key;
          return (
            <button
              type="button"
              key={hit.key}
              className={`px-tile${isSelected ? ' selected' : ''}`}
              onClick={() => pickResult(hit)}
              disabled={isPicking}
              aria-label={hit.title}
              title={hit.title}
            >
              <img src={hit.thumbnailUrl} alt={hit.title} loading="lazy" />
              <div className="px-tile-author muted small">{hit.author}</div>
              {isPicking && <div className="px-tile-badge">…</div>}
              {isSelected && !isPicking && <div className="px-tile-badge">✓</div>}
            </button>
          );
        })}
        {!loading && results.length === 0 && errors.length === 0 && (
          <div className="muted small">{t('wizard.search.empty')}</div>
        )}
      </div>
    </div>
  );
}

/* ────────── Audio step ────────── */

type AudioPickerSource = 'drop' | 'search';

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
  const { t } = useT();
  const [tab, setTab] = useState<AudioPickerSource>('search');

  return (
    <div className="step-body">
      <h4>{t('wizard.audio.title', { name })}</h4>
      <div className="seg-tabs">
        <button
          type="button"
          className={`seg-tab${tab === 'drop' ? ' active' : ''}`}
          onClick={() => setTab('drop')}
        >
          {t('wizard.dropFile')}
        </button>
        <button
          type="button"
          className={`seg-tab${tab === 'search' ? ' active' : ''}`}
          onClick={() => setTab('search')}
        >
          {t('wizard.search')}
        </button>
      </div>

      <div className={tab === 'drop' ? '' : 'hidden'}>
        <DropAudio
          audio={audio}
          audioName={audioName}
          onAudio={(blob, fname) => onAudio(blob, fname, undefined)}
        />
      </div>
      <div className={tab === 'search' ? '' : 'hidden'}>
        <AudioSearch
          initialQuery={name}
          selectedKey={source ? `${source.provider}-${source.soundId}` : null}
          onPick={(blob, src, displayName) => onAudio(blob, displayName, src)}
        />
      </div>

      <div className="row split">
        <button type="button" className="btn-secondary" onClick={onBack}>
          {t('wizard.back')}
        </button>
        <button type="button" className="btn" disabled={!audio} onClick={onNext}>
          {t('wizard.next')}
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
  const { t } = useT();
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
            <div>{t('wizard.audio.dropHere')}</div>
            <div className="muted small">{t('wizard.clickToBrowse')}</div>
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
          {t('wizard.audio.different')}
        </button>
      )}
    </>
  );
}

/* ────────── Unified sound search (Openverse + Freesound) ────────── */

type AudioHit = {
  key: string;
  previewUrl: string;
  downloadUrl: string;
  title: string;
  author: string;
  durationSec?: number;
  licenseLabel: string;
  attribution: NonNullable<SoundEntry['source']>;
};

async function runAudioSearch(
  query: string,
): Promise<{ hits: AudioHit[]; errors: string[] }> {
  const freesoundKey = getFreesoundKey();
  const tasks: Array<{ label: string; promise: Promise<AudioHit[]> }> = [];

  tasks.push({
    label: 'Openverse',
    promise: searchOpenverseAudio(query).then((rs) =>
      rs.map(
        (r: OpenverseAudio): AudioHit => ({
          key: `openverse-${r.id}`,
          previewUrl: r.url,
          downloadUrl: r.url,
          title: r.title,
          author: r.creator || 'Unknown',
          durationSec: r.duration ? r.duration / 1000 : undefined,
          licenseLabel: openverseLicense(r.license),
          attribution: {
            provider: 'openverse',
            soundId: r.id,
            author: r.creator || 'Unknown',
            license: r.license,
            url: r.foreign_landing_url || r.url,
          },
        }),
      ),
    ),
  });

  if (freesoundKey) {
    tasks.push({
      label: 'Freesound',
      promise: searchFreesound(query, freesoundKey).then((rs) =>
        rs.map(
          (r: FreesoundResult): AudioHit => ({
            key: `freesound-${r.id}`,
            previewUrl: r.previews['preview-hq-mp3'],
            downloadUrl: r.previews['preview-hq-mp3'],
            title: r.name,
            author: r.username,
            durationSec: r.duration,
            licenseLabel: freesoundLicense(r.license),
            attribution: {
              provider: 'freesound',
              soundId: r.id,
              author: r.username,
              license: r.license,
              url: r.url,
            },
          }),
        ),
      ),
    });
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.promise));
  const hits: AudioHit[] = [];
  const errors: string[] = [];
  settled.forEach((s, i) => {
    const label = tasks[i].label;
    if (s.status === 'fulfilled') hits.push(...s.value);
    else
      errors.push(
        `${label}: ${s.reason instanceof Error ? s.reason.message : String(s.reason)}`,
      );
  });
  // Freesound first (curated), then Openverse to fill in.
  hits.sort((a, b) => {
    const aFs = a.key.startsWith('freesound-') ? 0 : 1;
    const bFs = b.key.startsWith('freesound-') ? 0 : 1;
    return aFs - bFs;
  });
  return { hits, errors };
}

function fmtDur(sec?: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function AudioSearch({
  initialQuery,
  selectedKey,
  onPick,
}: {
  initialQuery: string;
  selectedKey: string | null;
  onPick: (
    blob: Blob,
    source: NonNullable<SoundEntry['source']>,
    displayName: string,
  ) => void;
}) {
  const { t } = useT();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<AudioHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [picking, setPicking] = useState<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrors([]);
    const { hits, errors: errs } = await runAudioSearch(query.trim());
    setResults(hits);
    setErrors(errs);
    setLoading(false);
  };

  useEffect(() => {
    if (initialQuery.trim() && results.length === 0) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playPreview = (hit: AudioHit) => {
    if (audioRef.current) audioRef.current.pause();
    if (playingKey === hit.key) {
      setPlayingKey(null);
      return;
    }
    const a = new Audio(hit.previewUrl);
    audioRef.current = a;
    a.play().catch(() => {});
    a.addEventListener('ended', () => setPlayingKey(null), { once: true });
    setPlayingKey(hit.key);
  };

  const pickResult = async (hit: AudioHit) => {
    setPicking(hit.key);
    setErrors([]);
    try {
      const res = await fetch(hit.downloadUrl);
      if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
      const blob = await res.blob();
      onPick(blob, hit.attribution, hit.title);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrors([`${msg} — try another result.`]);
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
          placeholder={t('wizard.search.placeholder.audio')}
        />
        <button type="button" className="btn" onClick={search} disabled={loading}>
          {loading ? t('wizard.searching') : t('wizard.search')}
        </button>
      </div>
      {errors.map((msg, i) => (
        <p key={i} className="error small">
          {msg}
        </p>
      ))}
      <ul className="fs-results">
        {results.map((hit) => {
          const isSelected = selectedKey === hit.key;
          const isPlaying = playingKey === hit.key;
          const isPicking = picking === hit.key;
          return (
            <li key={hit.key} className={`fs-row${isSelected ? ' selected' : ''}`}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => playPreview(hit)}
                aria-label={isPlaying ? t('wizard.search.stop') : t('wizard.search.play')}
              >
                {isPlaying ? '■' : '▶'}
              </button>
              <div className="fs-meta">
                <div className="fs-title">{hit.title}</div>
                <div className="muted small">
                  {hit.author} • {fmtDur(hit.durationSec)} • {hit.licenseLabel}
                </div>
              </div>
              <button
                type="button"
                className={isSelected ? 'btn-secondary' : 'btn'}
                onClick={() => pickResult(hit)}
                disabled={isPicking}
              >
                {isPicking ? '…' : isSelected ? t('wizard.search.picked') : t('wizard.search.useThis')}
              </button>
            </li>
          );
        })}
        {!loading && results.length === 0 && errors.length === 0 && (
          <li className="muted small">{t('wizard.search.empty')}</li>
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
  const { t } = useT();
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
      <h4>{t('wizard.trim.title')}</h4>
      <p className="muted">{t('wizard.trim.body')}</p>
      <div className="waveform-wrap">
        <canvas ref={canvasRef} className="waveform" />
        {decoding && <div className="waveform-status">{t('wizard.trim.decoding')}</div>}
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
          <span>{t('wizard.trim.start')}</span>
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
          <span>{t('wizard.trim.end')}</span>
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
          {t('wizard.trim.length', {
            time: formatTime(Math.max(0, endSec - startSec)),
          })}
        </div>
      </div>
      <div className="row">
        <button
          type="button"
          className="btn-secondary"
          onClick={playing ? stopPreview : preview}
          disabled={decoding || duration === 0}
        >
          {playing ? t('wizard.trim.stop') : t('wizard.trim.preview')}
        </button>
      </div>
      <div className="row split">
        <button type="button" className="btn-secondary" onClick={onBack}>
          {t('wizard.back')}
        </button>
        <button type="button" className="btn" onClick={onNext} disabled={decoding}>
          {t('wizard.next')}
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

const LOUDNESS_ANCHORS = [
  { value: 0, emoji: '😴', labelKey: 'wizard.loudness.anchor.sleeping' },
  { value: 20, emoji: '🤫', labelKey: 'wizard.loudness.anchor.whisper' },
  { value: 40, emoji: '🐦', labelKey: 'wizard.loudness.anchor.bird' },
  { value: 60, emoji: '🐶', labelKey: 'wizard.loudness.anchor.dog' },
  { value: 80, emoji: '🥁', labelKey: 'wizard.loudness.anchor.drum' },
  { value: 100, emoji: '🚀', labelKey: 'wizard.loudness.anchor.rocket' },
] as const;

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
  const { t } = useT();
  const anchorRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    LOUDNESS_ANCHORS.forEach((a, i) => {
      const el = anchorRefs.current[i];
      if (el) el.style.left = `${a.value}%`;
    });
  }, []);

  return (
    <div className="step-body">
      <h4>{t('wizard.loudness.title', { name })}</h4>
      <p className="muted">{t('wizard.loudness.body')}</p>
      <div className="loudness-scale">
        {LOUDNESS_ANCHORS.map((a, i) => {
          const label = t(a.labelKey);
          return (
            <div
              key={a.value}
              ref={(el) => {
                anchorRefs.current[i] = el;
              }}
              className="loudness-anchor"
              title={label}
            >
              <span className="loudness-anchor-emoji" aria-hidden>
                {a.emoji}
              </span>
              <span className="loudness-anchor-label muted">{label}</span>
            </div>
          );
        })}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="loudness-slider"
        aria-label={t('wizard.loudness.aria')}
      />
      <div className="loudness-readout">{t('wizard.loudness.readout', { value })}</div>
      <div className="row split">
        <button type="button" className="btn-secondary" onClick={onBack} disabled={busy}>
          {t('wizard.back')}
        </button>
        <button type="button" className="btn" onClick={onSave} disabled={busy}>
          {busy ? t('wizard.loudness.saving') : t('wizard.loudness.save')}
        </button>
      </div>
    </div>
  );
}
