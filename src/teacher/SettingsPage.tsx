import { useState } from 'react';
import { getCredentials, setCredentials } from '../freesound';
import { SUPPORTED_LOCALES, useT, type Locale } from '../i18n';
import { getApiKey as getPixabayKey, setApiKey as setPixabayKey } from '../pixabay';

export default function SettingsPage() {
  return (
    <section className="settings-page">
      <LanguageCard />
      <FreesoundCard />
      <PixabayCard />
    </section>
  );
}

function LanguageCard() {
  const { t, locale, setLocale } = useT();
  return (
    <div className="settings-card">
      <h3>{t('settings.language.title')}</h3>
      <p className="muted">{t('settings.language.body')}</p>
      <div className="seg-tabs">
        {SUPPORTED_LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            className={`seg-tab${locale === l.code ? ' active' : ''}`}
            onClick={() => setLocale(l.code as Locale)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FreesoundCard() {
  const { t } = useT();
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
      <h3>{t('settings.freesound.title')}</h3>
      <p className="muted">
        {t('settings.freesound.intro')}{' '}
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
        <span className="field-label">{t('settings.freesound.clientId')}</span>
        <input
          className="text-input"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder={t('settings.freesound.clientIdPlaceholder')}
          autoComplete="off"
        />
        <span className="field-hint muted small">
          {t('settings.freesound.clientIdHint')}
        </span>
      </label>

      <label className="field">
        <span className="field-label">{t('settings.freesound.secretKey')}</span>
        <div className="field-row">
          <input
            className="text-input"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={t('settings.freesound.secretKeyPlaceholder')}
            autoComplete="off"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowKey((v) => !v)}
          >
            {showKey ? t('settings.hide') : t('settings.show')}
          </button>
        </div>
        <span className="field-hint muted small">
          {t('settings.freesound.secretKeyHint')}
        </span>
      </label>

      <div className="row">
        <button type="button" className="btn" onClick={save} disabled={!dirty}>
          {t('settings.save')}
        </button>
        {(clientId || apiKey) && (
          <button type="button" className="btn-text" onClick={clear}>
            {t('settings.removeCredentials')}
          </button>
        )}
        {savedAt && !dirty && <span className="muted small">{t('settings.saved')}</span>}
      </div>
    </div>
  );
}

function PixabayCard() {
  const { t } = useT();
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
      <h3>{t('settings.pixabay.title')}</h3>
      <p className="muted">
        {t('settings.pixabay.introBefore')}{' '}
        <a
          href="https://pixabay.com/accounts/register/"
          target="_blank"
          rel="noopener noreferrer"
        >
          pixabay.com
        </a>
        {t('settings.pixabay.introMiddle')}{' '}
        <a
          href="https://pixabay.com/api/docs/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('settings.pixabay.apiDocs')}
        </a>{' '}
        {t('settings.pixabay.introAfter')}
      </p>

      <label className="field">
        <span className="field-label">{t('settings.pixabay.apiKey')}</span>
        <div className="field-row">
          <input
            className="text-input"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={t('settings.pixabay.apiKeyPlaceholder')}
            autoComplete="off"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowKey((v) => !v)}
          >
            {showKey ? t('settings.hide') : t('settings.show')}
          </button>
        </div>
      </label>

      <div className="row">
        <button type="button" className="btn" onClick={save} disabled={!dirty}>
          {t('settings.save')}
        </button>
        {apiKey && (
          <button type="button" className="btn-text" onClick={clear}>
            {t('settings.removeKey')}
          </button>
        )}
        {savedAt && !dirty && <span className="muted small">{t('settings.saved')}</span>}
      </div>

      <p className="muted small note">{t('settings.note')}</p>
    </div>
  );
}
