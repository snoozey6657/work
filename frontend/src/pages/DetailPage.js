import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function typeBadgeClass(type) {
  if (!type) return 'badge--type-bid';
  const t = type.toLowerCase();
  if (t === 'rfp') return 'badge--type-rfp';
  if (t === 'permit') return 'badge--type-permit';
  return 'badge--type-bid';
}

function exportLeadCSV(project) {
  const headers = ['ID','Title','Type','Trade','Location','Filing Date','Deadline','Estimated Value','Contact Name','Contact Email','Contact Phone','Source URL','Description','Status'];
  const row = [
    project.id, project.title, project.type, project.trade_category,
    project.location, project.filing_date || '', project.deadline || '',
    project.estimated_value || '', project.contact_name || '',
    project.contact_email || '', project.contact_phone || '',
    project.source_url || '', (project.description || '').replace(/"/g,'""'),
    project.status,
  ].map(v => `"${v}"`);
  const csv  = [headers.join(','), row.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `lead-${project.id}-${project.title.replace(/[^a-z0-9]/gi,'_').slice(0,40)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { getAuthHeaders } = useAuth();

  const [project,    setProject]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // null = not saved
  const [saving,     setSaving]     = useState(false);

  // Fetch project
  useEffect(() => {
    fetch(`/api/projects/${id}`, { headers: getAuthHeaders() })
      .then(r => {
        if (!r.ok) throw new Error('Project not found');
        return r.json();
      })
      .then(data => {
        setProject(data);
        injectJsonLD(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    return () => {
      const el = document.getElementById('project-jsonld');
      if (el) el.remove();
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if already saved
  const checkSaved = useCallback(async () => {
    try {
      const res = await fetch('/api/users/saved-leads', { headers: getAuthHeaders() });
      if (!res.ok) return;
      const leads = await res.json();
      const match = leads.find(l => l.id === parseInt(id));
      if (match) setSaveStatus(match.save_status);
    } catch {}
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { checkSaved(); }, [checkSaved]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (saveStatus) {
        await fetch(`/api/users/saved-leads/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        setSaveStatus(null);
      } else {
        const res = await fetch('/api/users/saved-leads', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body:    JSON.stringify({ project_id: parseInt(id), status: 'saved' }),
        });
        const data = await res.json();
        setSaveStatus(data.status);
      }
    } catch {}
    setSaving(false);
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setSaveStatus(newStatus);
    try {
      await fetch(`/api/users/saved-leads/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body:    JSON.stringify({ status: newStatus }),
      });
    } catch {}
  };

  function injectJsonLD(p) {
    const existing = document.getElementById('project-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id   = 'project-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'GovernmentService',
      'name': p.title, 'description': p.description, 'areaServed': p.location,
      'serviceType': p.type,
      'provider': { '@type': 'GovernmentOrganization', 'name': 'Winnebago County, IL' },
    });
    document.head.appendChild(script);
  }

  if (loading) {
    return (
      <div className="detail-page"><div className="container">
        <div className="detail-layout">
          <div className="detail-main">
            <div className="skeleton" style={{ width: 80, height: 22, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '70%', height: 28 }} />
            <div className="skeleton" style={{ width: '100%', height: 120, marginTop: 24 }} />
          </div>
        </div>
      </div></div>
    );
  }

  if (error) {
    return (
      <div className="detail-page"><div className="container">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 12 }}>Project Not Found</h2>
          <p className="text-muted">{error}</p>
          <Link to="/projects" className="btn btn--primary" style={{ marginTop: 24, display: 'inline-flex' }}>
            ← Back to Listings
          </Link>
        </div>
      </div></div>
    );
  }

  return (
    <div className="detail-page">
      <div className="container">
        <button className="detail-back" onClick={() => navigate(-1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back to listings
        </button>

        <div className="detail-layout">
          {/* ── Main content ──────────────────────────────── */}
          <div className="detail-main">
            <div className="detail-main__header">
              <div className="project-card__badges">
                <span className={`badge ${typeBadgeClass(project.type)}`}>{project.type}</span>
                <span className="badge badge--trade">{project.trade_category}</span>
                <span className="badge" style={{ background: '#f7fafc', color: '#4a5568' }}>
                  📍 {project.location}
                </span>
              </div>
              <h1 className="detail-main__title">{project.title}</h1>
            </div>

            <div className="detail-main__body">
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Filing Date</label>
                  <p>{formatDate(project.filing_date)}</p>
                </div>
                <div className="detail-field">
                  <label>Deadline</label>
                  <p style={{ color: 'var(--color-warning)' }}>{formatDate(project.deadline)}</p>
                </div>
                <div className="detail-field">
                  <label>Estimated Value</label>
                  <p style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '1.1rem' }}>
                    {formatCurrency(project.estimated_value)}
                  </p>
                </div>
                <div className="detail-field">
                  <label>Status</label>
                  <p style={{ textTransform: 'capitalize' }}>{project.status}</p>
                </div>
                <div className="detail-field">
                  <label>Project ID</label>
                  <p style={{ color: 'var(--color-text-muted)' }}>#{project.id}</p>
                </div>
                <div className="detail-field">
                  <label>Listed</label>
                  <p>{formatDate(project.created_at)}</p>
                </div>
              </div>

              {project.description && (
                <div className="detail-description">
                  <h3>Project Description</h3>
                  <p>{project.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────── */}
          <div className="detail-sidebar">
            {/* Value card */}
            <div className="sidebar-card" style={{ background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }}>
              <h3 style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Estimated Value</h3>
              <div className="sidebar-value" style={{ color: '#90cdf4' }}>
                {formatCurrency(project.estimated_value)}
              </div>
            </div>

            {/* Save + Pipeline card */}
            <div className="sidebar-card">
              <h3>My Pipeline</h3>
              <button
                className={`btn ${saveStatus ? 'btn--ghost' : 'btn--primary'} detail-save-btn`}
                onClick={handleSave}
                disabled={saving}
              >
                {saveStatus ? (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> Saved</>
                ) : (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> Save This Lead</>
                )}
              </button>

              {saveStatus && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                    BID STATUS
                  </label>
                  <select
                    className={`status-select status--${saveStatus}`}
                    value={saveStatus}
                    onChange={handleStatusChange}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Contact card */}
            <div className="sidebar-card">
              <h3>Contact Information</h3>
              {project.contact_name && (
                <div className="sidebar-contact__row">
                  <label>Name</label>
                  <p>{project.contact_name}</p>
                </div>
              )}
              {project.contact_email && (
                <div className="sidebar-contact__row">
                  <label>Email</label>
                  <p><a href={`mailto:${project.contact_email}`}>{project.contact_email}</a></p>
                </div>
              )}
              {project.contact_phone && (
                <div className="sidebar-contact__row">
                  <label>Phone</label>
                  <p><a href={`tel:${project.contact_phone}`}>{project.contact_phone}</a></p>
                </div>
              )}
            </div>

            {/* Actions card */}
            <div className="sidebar-card">
              <h3>Actions</h3>
              {project.source_url && (
                <a
                  href={project.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary detail-action-btn"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  View Official Bid
                </a>
              )}
              <button
                className="btn btn--ghost detail-action-btn"
                onClick={() => exportLeadCSV(project)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export This Lead
              </button>
              <button
                className="btn btn--ghost detail-action-btn"
                onClick={() => navigate('/projects')}
              >
                ← Back to All Leads
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
