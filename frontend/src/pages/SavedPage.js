import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  saved:         'Saved',
  interested:    'Interested',
  bid_submitted: 'Bid Submitted',
  won:           'Won',
  lost:          'Lost',
};

function formatCurrency(val) {
  if (!val) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export default function SavedPage() {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users/saved-leads', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => setLeads(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const handleStatusChange = async (projectId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === projectId ? { ...l, save_status: newStatus } : l));
    await fetch(`/api/users/saved-leads/${projectId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body:    JSON.stringify({ status: newStatus }),
    });
  };

  const handleUnsave = async (projectId) => {
    setLeads(prev => prev.filter(l => l.id !== projectId));
    await fetch(`/api/users/saved-leads/${projectId}`, { method: 'DELETE', headers: getAuthHeaders() });
  };

  return (
    <div className="saved-page">
      <div className="container">
        <div className="saved-page__header">
          <h1 className="saved-page__title">
            My Saved Leads
            {!loading && <span className="saved-count-badge">{leads.length}</span>}
          </h1>
          <Link to="/projects" className="btn btn--primary">Browse More Leads</Link>
        </div>

        {loading && (
          <div>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton-card" style={{ marginBottom: 12, height: 80 }} />
            ))}
          </div>
        )}

        {!loading && leads.length === 0 && (
          <div className="empty-state" style={{ marginTop: 48 }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔖</div>
            <h3>No saved leads yet</h3>
            <p>Browse leads and click the bookmark icon to save them here.</p>
            <Link to="/projects" className="btn btn--primary" style={{ marginTop: 20, display: 'inline-flex' }}>
              Browse Leads
            </Link>
          </div>
        )}

        {!loading && leads.length > 0 && (
          <div>
            {leads.map(lead => (
              <div key={lead.id} className="saved-lead-row">
                <div className="saved-lead-info" onClick={() => navigate(`/projects/${lead.id}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span className={`badge badge--type-${lead.type?.toLowerCase() || 'bid'}`}>{lead.type}</span>
                    <span className="badge badge--trade">{lead.trade_category}</span>
                  </div>
                  <p className="saved-lead-title">{lead.title}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {lead.location} · Deadline: {formatDate(lead.deadline)} · {formatCurrency(lead.estimated_value)}
                  </p>
                </div>

                <div className="saved-actions">
                  <select
                    className={`status-select status--${lead.save_status}`}
                    value={lead.save_status}
                    onChange={e => handleStatusChange(lead.id, e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleUnsave(lead.id)}
                    title="Remove from saved"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
