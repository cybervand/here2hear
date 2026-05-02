import { useEffect, useMemo, useRef, useState } from 'react';
import { addSound, deleteSound, listSounds, type SoundEntry } from './db';
import { shortLicense as freesoundLicense } from './freesound';
import { useT } from './i18n';
import { shortLicense as openverseLicense } from './openverse';
import SettingsPage from './teacher/SettingsPage';
import Wizard, { EMPTY_DRAFT, type Draft, type Step } from './teacher/Wizard';

type View = 'library' | 'settings';

export default function TeacherMode() {
  const { t } = useT();
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
        ...(draft.imageSource ? { imageSource: draft.imageSource } : {}),
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
    if (!confirm(t('library.confirmDelete'))) return;
    await deleteSound(id);
    await refresh();
  };

  return (
    <div className="teacher">
      <header className="teacher-header">
        <div className="teacher-title-row">
          <h2>{t('teacher.title')}</h2>
          <nav className="teacher-subnav">
            <button
              type="button"
              className={`subnav-tab${view === 'library' ? ' active' : ''}`}
              onClick={() => setView('library')}
            >
              {t('teacher.subnav.library')}
            </button>
            <button
              type="button"
              className={`subnav-tab${view === 'settings' ? ' active' : ''}`}
              onClick={() => setView('settings')}
            >
              {t('teacher.subnav.settings')}
            </button>
          </nav>
        </div>
        {view === 'library' && <p className="teacher-sub">{t('teacher.subtitle')}</p>}
      </header>

      {view === 'settings' && <SettingsPage />}

      {view === 'library' && (
        <section className="teacher-grid">
          <div className="library-panel">
            <h3>{t('library.count', { n: library?.length ?? 0 })}</h3>
            {library === null && <p className="muted">{t('library.loading')}</p>}
            {library && library.length === 0 && (
              <p className="muted">{t('library.empty')}</p>
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
            <h3>{t('wizard.title')}</h3>
            <Wizard
              step={step}
              draft={draft}
              busy={busy}
              onStep={setStep}
              onDraft={setDraft}
              onSave={save}
            />
            {error && <p className="error">{t('library.saveFailed', { error })}</p>}
          </div>
        </section>
      )}
    </div>
  );
}

/* ────────── Library row ────────── */

function LibraryRow({ entry, onDelete }: { entry: SoundEntry; onDelete: () => void }) {
  const { t } = useT();
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
          {trimmed && (
            <span className="trimmed-badge muted small">{t('library.trimmed')}</span>
          )}
        </div>
        <div className="loudness-bar" title={`Loudness ${entry.loudness}/100`}>
          <div className="loudness-fill" ref={fillRef} />
        </div>
        {entry.source && (
          <div className="muted small">
            🔊 {entry.source.author} •{' '}
            <a href={entry.source.url} target="_blank" rel="noopener noreferrer">
              {entry.source.provider === 'freesound' ? 'Freesound' : 'Openverse'}
            </a>{' '}
            •{' '}
            {entry.source.provider === 'freesound'
              ? freesoundLicense(entry.source.license)
              : openverseLicense(entry.source.license)}
          </div>
        )}
        {entry.imageSource && (
          <div className="muted small">
            🖼️ {entry.imageSource.author} •{' '}
            <a
              href={entry.imageSource.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {entry.imageSource.provider === 'pixabay' ? 'Pixabay' : 'Openverse'}
            </a>
            {entry.imageSource.provider === 'openverse' && (
              <> • {openverseLicense(entry.imageSource.license)}</>
            )}
          </div>
        )}
      </div>
      <button type="button" className="icon-btn" onClick={play} aria-label={t('library.play')}>
        ▶
      </button>
      <button
        type="button"
        className="icon-btn danger"
        onClick={onDelete}
        aria-label={t('library.delete')}
      >
        ✕
      </button>
      <audio ref={audioRef} src={audioUrl} preload="none" />
    </li>
  );
}
