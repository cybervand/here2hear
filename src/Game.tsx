import { useState } from 'react';
import PlayMode from './PlayMode';
import TeacherMode from './TeacherMode';

type Mode = 'play' | 'teacher';

export default function Game() {
  const [mode, setMode] = useState<Mode>('play');

  return (
    <div className="game">
      <nav className="mode-nav">
        <button
          type="button"
          className={`mode-tab${mode === 'play' ? ' active' : ''}`}
          onClick={() => setMode('play')}
        >
          🎮 Play
        </button>
        <button
          type="button"
          className={`mode-tab${mode === 'teacher' ? ' active' : ''}`}
          onClick={() => setMode('teacher')}
        >
          🧑‍🏫 Teacher
        </button>
      </nav>

      <div className="mode-body">
        {mode === 'play' ? <PlayMode /> : <TeacherMode />}
      </div>
    </div>
  );
}
