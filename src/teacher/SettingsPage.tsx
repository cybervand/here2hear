import { useState } from 'react';
import { getCredentials, setCredentials } from '../freesound';

export default function SettingsPage() {
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
