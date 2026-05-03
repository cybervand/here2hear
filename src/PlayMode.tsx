import { useEffect, useMemo, useRef, useState } from 'react';
import { listSounds, pickRound, type SoundEntry } from './db';
import { useT } from './i18n';

type SlotKey = 'loudest' | 'softest';
type Placement = Partial<Record<SlotKey, string>>;
type Phase = 'loading' | 'empty' | 'playing' | 'celebrate';

const TAP_THRESHOLD_PX = 8;

export default function PlayMode() {
  const { t } = useT();
  const [library, setLibrary] = useState<SoundEntry[] | null>(null);
  const [picks, setPicks] = useState<SoundEntry[]>([]);
  const [placement, setPlacement] = useState<Placement>({});
  const [phase, setPhase] = useState<Phase>('loading');
  const [stars, setStars] = useState(0);
  const [round, setRound] = useState(0);
  const [wrongFlash, setWrongFlash] = useState<SlotKey | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    listSounds().then((items) => {
      setLibrary(items);
      const r = pickRound(items, 4);
      if (r) {
        setPicks(r);
        setPhase('playing');
      } else {
        setPhase('empty');
      }
    });
  }, []);

  const correct = useMemo(() => {
    if (picks.length === 0) return { loudest: '', softest: '' };
    const loudest = picks.reduce((a, b) => (a.loudness >= b.loudness ? a : b));
    const softest = picks.reduce((a, b) => (a.loudness <= b.loudness ? a : b));
    return { loudest: loudest.id, softest: softest.id };
  }, [picks]);

  const placedIds = new Set(Object.values(placement));

  // Single in-flight playback. New taps pre-empt the previous one so spam-tapping
  // doesn't stack overlapping audio.
  const currentRef = useRef<{
    audio: HTMLAudioElement;
    url: string;
    timer: number | null;
  } | null>(null);

  const stopCurrent = () => {
    const cur = currentRef.current;
    if (!cur) return;
    if (cur.timer !== null) window.clearTimeout(cur.timer);
    cur.audio.pause();
    URL.revokeObjectURL(cur.url);
    currentRef.current = null;
    setPlayingId(null);
  };

  useEffect(() => () => stopCurrent(), []);

  const playEntry = (entry: SoundEntry) => {
    stopCurrent();

    const url = URL.createObjectURL(entry.audio);
    const a = new Audio(url);
    const start = entry.startSec ?? 0;
    const end = entry.endSec;
    const trimmed = end !== undefined && end > start;

    const handle = { audio: a, url, timer: null as number | null };
    currentRef.current = handle;
    setPlayingId(entry.id);

    a.addEventListener(
      'loadedmetadata',
      () => {
        // Bail if a newer tap already replaced us.
        if (currentRef.current !== handle) return;
        if (start > 0) a.currentTime = start;
        a.play().catch(() => {});
        if (trimmed) {
          handle.timer = window.setTimeout(
            () => {
              if (currentRef.current === handle) stopCurrent();
            },
            (end - start) * 1000 + 50,
          );
        }
      },
      { once: true },
    );
    a.addEventListener('ended', () => {
      if (currentRef.current === handle) stopCurrent();
    });
  };

  const onDrop = (entry: SoundEntry, slot: SlotKey) => {
    const isRight = correct[slot] === entry.id;
    if (!isRight) {
      setWrongFlash(slot);
      setTimeout(() => setWrongFlash(null), 600);
      return;
    }
    const next = { ...placement, [slot]: entry.id };
    setPlacement(next);
    if (next.loudest && next.softest) {
      setStars((s) => s + 1);
      setTimeout(() => setPhase('celebrate'), 500);
    }
  };

  const nextRound = () => {
    if (!library) return;
    const r = pickRound(library, 4);
    if (!r) {
      setPhase('empty');
      return;
    }
    setPicks(r);
    setPlacement({});
    setRound((n) => n + 1);
    setPhase('playing');
  };

  if (phase === 'loading') {
    return (
      <div className="overlay">
        <p>{t('play.loading')}</p>
      </div>
    );
  }

  if (phase === 'empty') {
    const count = library?.length ?? 0;
    const distinctLoudnesses = new Set((library ?? []).map((e) => e.loudness)).size;
    const allSame = count > 0 && distinctLoudnesses === 1;
    return (
      <div className="overlay">
        <h1>{t('play.empty.title')}</h1>
        {count < 4 && <p>{t('play.empty.notEnough', { n: count })}</p>}
        {count >= 4 && allSame && <p>{t('play.empty.sameLoudness')}</p>}
        {count >= 4 && !allSame && <p>{t('play.empty.body')}</p>}
      </div>
    );
  }

  if (phase === 'celebrate') {
    return (
      <div className="overlay celebrate">
        <h1>{t('play.greatJob')}</h1>
        <div className="star-row" aria-hidden>
          {Array.from({ length: Math.min(stars, 10) }).map((_, i) => (
            <span key={i} className="star">
              ⭐
            </span>
          ))}
        </div>
        <button type="button" className="btn" onClick={nextRound}>
          {t('play.playAgain')}
        </button>
      </div>
    );
  }

  return (
    <Board
      picks={picks}
      placement={placement}
      placedIds={placedIds}
      stars={stars}
      round={round}
      wrongFlash={wrongFlash}
      playingId={playingId}
      onTap={playEntry}
      onDrop={onDrop}
    />
  );
}

type BoardProps = {
  picks: SoundEntry[];
  placement: Placement;
  placedIds: Set<string>;
  stars: number;
  round: number;
  wrongFlash: SlotKey | null;
  playingId: string | null;
  onTap: (e: SoundEntry) => void;
  onDrop: (e: SoundEntry, slot: SlotKey) => void;
};

function Board({
  picks,
  placement,
  placedIds,
  stars,
  round,
  wrongFlash,
  playingId,
  onTap,
  onDrop,
}: BoardProps) {
  const { t } = useT();
  const slotRefs = {
    loudest: useRef<HTMLDivElement>(null),
    softest: useRef<HTMLDivElement>(null),
  };

  const [drag, setDrag] = useState<{
    id: string;
    x: number;
    y: number;
    overSlot: SlotKey | null;
  } | null>(null);

  const lookup = useMemo(() => {
    const m = new Map<string, SoundEntry>();
    picks.forEach((p) => m.set(p.id, p));
    return m;
  }, [picks]);

  return (
    <div className="board">
      <div className="topbar">
        <span>{t('play.round', { n: round + 1 })}</span>
        <span aria-label={t('play.stars.aria', { n: stars })}>
          {'⭐'.repeat(Math.min(stars, 5))}
        </span>
      </div>

      <div className="slots">
        <Slot
          kind="softest"
          label={t('play.softest')}
          icon="🔈"
          filled={placement.softest ? lookup.get(placement.softest) : undefined}
          highlight={drag?.overSlot === 'softest'}
          wrong={wrongFlash === 'softest'}
          slotRef={slotRefs.softest}
        />
        <Slot
          kind="loudest"
          label={t('play.loudest')}
          icon="📢"
          filled={placement.loudest ? lookup.get(placement.loudest) : undefined}
          highlight={drag?.overSlot === 'loudest'}
          wrong={wrongFlash === 'loudest'}
          slotRef={slotRefs.loudest}
        />
      </div>

      <div className="cards">
        {picks.map((entry) => (
          <Card
            key={entry.id}
            entry={entry}
            placed={placedIds.has(entry.id)}
            slotRefs={slotRefs}
            onTap={onTap}
            onDrop={onDrop}
            onDragChange={setDrag}
            isDraggingThis={drag?.id === entry.id}
            isPlaying={playingId === entry.id}
          />
        ))}
      </div>
    </div>
  );
}

type CardProps = {
  entry: SoundEntry;
  placed: boolean;
  slotRefs: Record<SlotKey, React.RefObject<HTMLDivElement>>;
  onTap: (e: SoundEntry) => void;
  onDrop: (e: SoundEntry, slot: SlotKey) => void;
  onDragChange: (
    d: { id: string; x: number; y: number; overSlot: SlotKey | null } | null,
  ) => void;
  isDraggingThis: boolean;
  isPlaying: boolean;
};

function Card({
  entry,
  placed,
  slotRefs,
  onTap,
  onDrop,
  onDragChange,
  isDraggingThis,
  isPlaying,
}: CardProps) {
  const { t } = useT();
  const ref = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  // Keep the URL alive for the lifetime of the tab. Revoking on unmount races
  // with React's StrictMode simulated remount and can break the <img>.
  const imageUrl = useMemo(() => URL.createObjectURL(entry.image), [entry.image]);

  const hitSlot = (clientX: number, clientY: number): SlotKey | null => {
    for (const key of ['loudest', 'softest'] as SlotKey[]) {
      const el = slotRefs[key].current;
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (
        clientX >= r.left &&
        clientX <= r.right &&
        clientY >= r.top &&
        clientY <= r.bottom
      ) {
        return key;
      }
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (placed) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    draggingRef.current = false;
  };

  const clearTransform = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current || placed) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (!draggingRef.current && Math.hypot(dx, dy) > TAP_THRESHOLD_PX) {
      draggingRef.current = true;
    }
    if (draggingRef.current) {
      if (ref.current) {
        ref.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
      }
      onDragChange({
        id: entry.id,
        x: e.clientX,
        y: e.clientY,
        overSlot: hitSlot(e.clientX, e.clientY),
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const wasDrag = draggingRef.current;
    const start = startRef.current;
    startRef.current = null;
    draggingRef.current = false;
    clearTransform();
    onDragChange(null);

    if (!wasDrag) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) <= TAP_THRESHOLD_PX) onTap(entry);
      return;
    }
    const slot = hitSlot(e.clientX, e.clientY);
    if (slot) onDrop(entry, slot);
  };

  const onPointerCancel = () => {
    startRef.current = null;
    draggingRef.current = false;
    clearTransform();
    onDragChange(null);
  };

  return (
    <div
      ref={ref}
      className={`card${placed ? ' placed' : ''}${isDraggingThis ? ' dragging' : ''}${isPlaying ? ' playing' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      role="button"
      aria-label={entry.name}
    >
      <div className="card-image-wrap">
        <img src={imageUrl} alt={entry.name} className="card-image" draggable={false} />
      </div>
      <div className="card-label">{entry.name}</div>
      <div className="card-hint" aria-hidden>
        {t('play.tapToHear')}
      </div>
    </div>
  );
}

type SlotProps = {
  kind: SlotKey;
  label: string;
  icon: string;
  filled?: SoundEntry;
  highlight: boolean;
  wrong: boolean;
  slotRef: React.RefObject<HTMLDivElement>;
};

function Slot({ kind, label, icon, filled, highlight, wrong, slotRef }: SlotProps) {
  const filledImageUrl = useMemo(
    () => (filled ? URL.createObjectURL(filled.image) : null),
    [filled],
  );

  return (
    <div
      ref={slotRef}
      className={`slot slot-${kind}${highlight ? ' over' : ''}${wrong ? ' wrong' : ''}${
        filled ? ' filled' : ''
      }`}
    >
      <div className="slot-icon" aria-hidden>
        {icon}
      </div>
      <div className="slot-label">{label}</div>
      {filled && filledImageUrl && (
        <img className="slot-filled-image" src={filledImageUrl} alt={filled.name} />
      )}
    </div>
  );
}
