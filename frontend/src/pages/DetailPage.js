// pages/DetailPage.js
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

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

export default function DetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Project not found');
        return r.json();
      })
      .then(data => {
        setProject(data);
        // Inject JSON-LD structured data into <head> for SEO
        injectJsonLD(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    // Cleanup JSON-LD on unmount
    return () => {
      const el = document.getElementById('project-jsonld');
      if (el) el.remove();
    };
  }, [id]);

  function injectJsonLD(p) {
    const existing = document.getElementById('project-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id   = 'project-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'GovernmentService',
      'name': p.title,
      'description': p.description,
      'areaServed': p.location,
      'serviceType': p.type,
      'provider': { '@type': 'GovernmentOrganization', 'name': 'Winnebago County, IL' },
    });
    document.head.appendChild(script);
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="detail-page">
        <div className="container">
          <div className="detail-layout">
            <div className="detail-main">
              <div className="detail-main__header">
                <div className="skeleton" style={{ width: 80, height: 22, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: '70%', height: 28 }} />
              </div>
              <div className="detail-main__body">
                <div className="skeleton" style={{ width: '100%', height: 120 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="detail-page">
        <div className="container">
          <div style={{ padding: 40, textAlign: 'center' }}>
            <h2 style={{ marginBottom: 12 }}>Project Not Found</h2>
            <p className="text-muted">{error}</p>
            <Link to="/projects" className="btn btn--primary" style={{ marginTop: 24, display: 'inline-flex' }}>
              ← Back to Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="container">
        {/* Back button */}
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
              {/* Key fields grid */}
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

              {/* Description */}
              {project.description && (
                <div className="detail-description">
                  <h3>Project Description</h3>
                  <p>{project.description}</p>
                </div>
              )}

              {/* Source link */}
              {project.source_url && (
                <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--color-accent-lt)', borderRadius: 'var(--radius-sm)', border: '1px solid #bee3f8' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                    Official Source Document
                  </p>
                  <a
                    href={project.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 600, fontSize: '0.925rem', wordBreak: 'break-all' }}
                  >
                    {project.source_url} ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────── */}
          <div className="detail-sidebar">
            {/* Value card */}
            <div className="sidebar-card" style={{ background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }}>
              <h3 style={{ color: 'rgba(255,255,255,0.6)' }}>Estimated Value</h3>
              <div className="sidebar-value" style={{ color: '#90cdf4' }}>
                {formatCurrency(project.estimated_value)}
              </div>
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
              {!project.contact_name && !project.contact_email && !project.contact_phone && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No contact info available. See source document.
                </p>
              )}
            </div>

            {/* Action card */}
            <div className="sidebar-card">
              <h3>Actions</h3>
              {project.source_url && (
                <a
                  href={project.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
                >
                  View Official Bid →
                </a>
              )}
              <button
                className="btn btn--ghost"
                style={{ width: '100%', justifyContent: 'center' }}
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
