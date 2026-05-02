import { useState } from 'react';
import PlayMode from './PlayMode';
import TeacherMode from './TeacherMode';
import { useT } from './i18n';

type Mode = 'play' | 'teacher';

export default function Game() {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>('play');

  return (
    <div className="game">
      <nav className="mode-nav">
        <button
          type="button"
          className={`mode-tab${mode === 'play' ? ' active' : ''}`}
          onClick={() => setMode('play')}
        >
          {t('app.play')}
        </button>
        <button
          type="button"
          className={`mode-tab${mode === 'teacher' ? ' active' : ''}`}
          onClick={() => setMode('teacher')}
        >
          {t('app.teacher')}
        </button>
      </nav>

      <div className="mode-body">
        {mode === 'play' ? <PlayMode /> : <TeacherMode />}
      </div>
    </div>
  );
}
