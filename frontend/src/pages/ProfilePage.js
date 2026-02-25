import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, getAuthHeaders } = useAuth();
  const [prefs,   setPrefs]   = useState({ trade_categories: [], locations: [] });
  const [meta,    setMeta]    = useState({ trade_categories: [], locations: [] });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/meta/filters').then(r => r.json()),
      fetch('/api/users/alert-preferences', { headers: getAuthHeaders() }).then(r => r.json()),
    ]).then(([metaData, prefsData]) => {
      setMeta({
        trade_categories: metaData.trade_categories || [],
        locations: metaData.locations || [],
      });
      setPrefs({
        trade_categories: prefsData.trade_categories || [],
        locations: prefsData.locations || [],
      });
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const togglePref = (field, value) => {
    setPrefs(prev => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch('/api/users/alert-preferences', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body:    JSON.stringify(prefs),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="profile-page">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 32 }}>My Profile</h1>

        {/* Account info */}
        <div className="profile-card">
          <h2 className="profile-card__title">Account</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
            <div className="detail-field">
              <label>Name</label>
              <p style={{ fontWeight: 600 }}>{user?.name}</p>
            </div>
            <div className="detail-field">
              <label>Email</label>
              <p>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Alert preferences */}
        <div className="profile-card">
          <h2 className="profile-card__title">Alert Preferences</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 4, marginBottom: 24 }}>
            We'll notify you when new leads match your criteria. (Email delivery coming soon.)
          </p>

          {loading ? (
            <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <p className="profile-section-header">Trade Categories</p>
                <div className="pref-grid">
                  {meta.trade_categories.map(t => (
                    <label key={t} className={`pref-checkbox${prefs.trade_categories.includes(t) ? ' is-checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={prefs.trade_categories.includes(t)}
                        onChange={() => togglePref('trade_categories', t)}
                        style={{ display: 'none' }}
                      />
                      {prefs.trade_categories.includes(t) ? '✓ ' : ''}{t}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p className="profile-section-header">Locations</p>
                <div className="pref-grid">
                  {meta.locations.map(l => (
                    <label key={l} className={`pref-checkbox${prefs.locations.includes(l) ? ' is-checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={prefs.locations.includes(l)}
                        onChange={() => togglePref('locations', l)}
                        style={{ display: 'none' }}
                      />
                      {prefs.locations.includes(l) ? '✓ ' : ''}{l}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
                {saved && <span style={{ color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: 600 }}>✓ Saved!</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
