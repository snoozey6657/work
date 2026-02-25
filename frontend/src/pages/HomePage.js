import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState({ total: 0, trades: 0, locs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/meta/filters')
      .then(r => r.json())
      .then(meta => {
        setStats({
          trades: meta.trade_categories?.length || 0,
          locs:   meta.locations?.length || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const features = [
    { icon: '🔍', title: 'Aggregated & Searchable', desc: 'Bids and permits from Winnebago County, Rockford, and surrounding municipalities — all in one place.' },
    { icon: '🏗️', title: 'Filter by Trade', desc: 'Electrical, Plumbing, HVAC, Paving — instantly narrow down to your specialty.' },
    { icon: '🔖', title: 'Save & Track Leads', desc: 'Bookmark leads you want to bid and track your pipeline from interested all the way to won.' },
    { icon: '📄', title: 'Direct Bid Links', desc: 'Every lead links directly to the official government source — plans, specs, and contact info.' },
  ];

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

          <div className="hero__cta-group">
            {user ? (
              <Link to="/projects" className="btn btn--hero-primary">Browse All Leads →</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn--hero-primary">Get Started Free →</Link>
                <Link to="/login"    className="btn btn--hero-secondary">Sign In</Link>
              </>
            )}
          </div>

          <div className="hero__stats" style={{ marginTop: 52 }}>
            <div>
              <div className="stat__num">{loading ? '—' : '12+'}</div>
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
            <div>
              <div className="stat__num">Free</div>
              <div className="stat__label">Always</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature callouts ─────────────────────────────────── */}
      <section className="features-section" id="how-it-works">
        <div className="container">
          <h2 className="features-section__title">Everything a contractor needs</h2>
          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      {!user && (
        <section className="cta-banner">
          <div className="container">
            <h2 className="cta-banner__title">Ready to start winning more bids?</h2>
            <p className="cta-banner__sub">Create your free account and browse every open lead in Winnebago County.</p>
            <Link to="/register" className="btn btn--hero-primary">Create Free Account →</Link>
          </div>
        </section>
      )}
    </>
  );
}
