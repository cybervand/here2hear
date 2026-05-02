import { useState } from 'react';
import { getCredentials, setCredentials } from '../freesound';
import { getApiKey as getPixabayKey, setApiKey as setPixabayKey } from '../pixabay';

export default function SettingsPage() {
  return (
    <section className="settings-page">
      <FreesoundCard />
      <PixabayCard />
    </section>
  );
}

function FreesoundCard() {
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
    <div className="settings-card">
      <h3>🔊 Freesound (audio search)</h3>
      <p className="muted">
        Search sound effects from the audio step. Get credentials at{' '}
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
    </div>
  );
}

function PixabayCard() {
  const initial = getPixabayKey();
  const [apiKey, setApiKeyInput] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const save = () => {
    const next = apiKey.trim();
    setPixabayKey(next);
    setSaved(next);
    setApiKeyInput(next);
    setSavedAt(Date.now());
  };

  const clear = () => {
    setPixabayKey('');
    setSaved('');
    setApiKeyInput('');
    setSavedAt(Date.now());
  };

  const dirty = apiKey !== saved;

  return (
    <div className="settings-card">
      <h3>🖼️ Pixabay (picture search)</h3>
      <p className="muted">
        Search photos and illustrations from the picture step. Sign up at{' '}
        <a
          href="https://pixabay.com/accounts/register/"
          target="_blank"
          rel="noopener noreferrer"
        >
          pixabay.com
        </a>
        , then your key is shown on the{' '}
        <a
          href="https://pixabay.com/api/docs/"
          target="_blank"
          rel="noopener noreferrer"
        >
          API docs page
        </a>{' '}
        when you're logged in.
      </p>

      <label className="field">
        <span className="field-label">API Key</span>
        <div className="field-row">
          <input
            className="text-input"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Your Pixabay API key"
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
      </label>

      <div className="row">
        <button type="button" className="btn" onClick={save} disabled={!dirty}>
          Save
        </button>
        {apiKey && (
          <button type="button" className="btn-text" onClick={clear}>
            Remove key
          </button>
        )}
        {savedAt && !dirty && <span className="muted small">Saved ✓</span>}
      </div>

      <p className="muted small note">
        Credentials live only in this browser. They never leave your device except in the
        API requests to Freesound and Pixabay.
      </p>
    </div>
  );
}
