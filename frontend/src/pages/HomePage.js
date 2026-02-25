// pages/HomePage.js
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [stats, setStats]       = useState({ total: 0, trades: 0 });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // Load a few featured projects for the homepage
    Promise.all([
      fetch('/api/projects?limit=3&page=1').then(r => r.json()),
      fetch('/api/projects/meta/filters').then(r => r.json()),
    ])
      .then(([projects, meta]) => {
        setFeatured(projects.data || []);
        setStats({
          total:  projects.pagination?.total || 0,
          trades: meta.trade_categories?.length || 0,
          locs:   meta.locations?.length || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <p className="hero__eyebrow">Winnebago County, Illinois</p>
          <h1 className="hero__title">
            Find Local Construction<br />Bids & Project Leads
          </h1>
          <p className="hero__sub">
            Aggregate public bids, permits, and RFPs from Winnebago County government agencies,
            municipalities, and school districts — all in one searchable database.
          </p>

          <Link to="/projects" className="btn btn--primary" style={{ height: 48, fontSize: '1rem', padding: '0 28px' }}>
            Browse All Leads →
          </Link>

          {/* Stats row */}
          <div className="hero__stats" style={{ marginTop: 48 }}>
            <div>
              <div className="stat__num">{loading ? '—' : stats.total}</div>
              <div className="stat__label">Active Leads</div>
            </div>
            <div>
              <div className="stat__num">{loading ? '—' : stats.trades}</div>
              <div className="stat__label">Trade Categories</div>
            </div>
            <div>
              <div className="stat__num">{loading ? '—' : stats.locs}</div>
              <div className="stat__label">Locations</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature callouts ─────────────────────────────────── */}
      <section style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { icon: '🔍', title: 'Aggregated & Searchable', desc: 'Bids and permits from Winnebago County, Rockford, and surrounding municipalities.' },
              { icon: '📊', title: 'Filter by Trade', desc: 'Electrical, Plumbing, HVAC, Paving — quickly narrow to your specialty.' },
              { icon: '📥', title: 'CSV Export', desc: 'Download filtered results instantly for your CRM or bidding workflow.' },
            ].map(f => (
              <div key={f.title} style={{ padding: 24, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ─────────────────────────────────── */}
      <section style={{ padding: '48px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.25rem' }}>Recent Leads</h2>
            <Link to="/projects" style={{ fontSize: '0.875rem', fontWeight: 600 }}>View all →</Link>
          </div>

          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="skeleton-card" style={{ marginBottom: 16 }}>
                <div className="skeleton" style={{ width: '60%', height: 18, marginBottom: 10 }} />
                <div className="skeleton" style={{ width: '30%', height: 14 }} />
              </div>
            ))
          ) : (
            <div className="projects-grid">
              {featured.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
