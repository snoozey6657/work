// components/ProjectCard.js
import { useNavigate } from 'react-router-dom';

// Format dollar amounts
function formatCurrency(val) {
  if (!val) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

// Format date as "Jan 15, 2025"
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// Days until deadline
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Badge color class per project type
function typeBadgeClass(type) {
  if (!type) return 'badge--type-bid';
  const t = type.toLowerCase();
  if (t === 'rfp') return 'badge--type-rfp';
  if (t === 'permit') return 'badge--type-permit';
  return 'badge--type-bid';
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const days = daysUntil(project.deadline);

  return (
    <article
      className="project-card"
      onClick={() => navigate(`/projects/${project.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
      aria-label={`View details for ${project.title}`}
    >
      {/* Left body */}
      <div className="project-card__body">
        {/* Badges */}
        <div className="project-card__badges">
          <span className={`badge ${typeBadgeClass(project.type)}`}>{project.type}</span>
          <span className="badge badge--trade">{project.trade_category}</span>
        </div>

        {/* Title */}
        <h2 className="project-card__title">{project.title}</h2>

        {/* Location */}
        <p className="project-card__location">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          {project.location}
        </p>

        {/* Meta row */}
        <div className="project-card__meta">
          <div className="meta-item">
            <div className="meta-item__label">Filing Date</div>
            <div className="meta-item__value">{formatDate(project.filing_date)}</div>
          </div>
          <div className="meta-item">
            <div className="meta-item__label">Deadline</div>
            <div className={`meta-item__value ${days !== null && days <= 14 ? 'meta-item__value--deadline' : ''}`}>
              {formatDate(project.deadline)}
              {days !== null && days >= 0 && (
                <span style={{ fontSize: '0.75rem', marginLeft: 6, color: days <= 7 ? '#e53e3e' : '#718096' }}>
                  ({days}d left)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: value */}
      <div className="project-card__right">
        <div>
          <div className="project-card__value-large">{formatCurrency(project.estimated_value)}</div>
          <div className="project-card__value-sub">est. value</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 600 }}>
          View Details
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    </article>
  );
}
