import { useNavigate } from 'react-router-dom';

function formatCurrency(val) {
  if (!val) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function typeBadgeClass(type) {
  if (!type) return 'badge--type-bid';
  const t = type.toLowerCase();
  if (t === 'rfp') return 'badge--type-rfp';
  if (t === 'permit') return 'badge--type-permit';
  return 'badge--type-bid';
}

export default function ProjectCard({ project, isSaved = false, onSave }) {
  const navigate = useNavigate();
  const days     = daysUntil(project.deadline);

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onSave) onSave(project.id);
  };

  return (
    <article
      className="project-card"
      onClick={() => navigate(`/projects/${project.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
      aria-label={`View details for ${project.title}`}
    >
      <div className="project-card__body">
        <div className="project-card__badges">
          <span className={`badge ${typeBadgeClass(project.type)}`}>{project.type}</span>
          <span className="badge badge--trade">{project.trade_category}</span>
        </div>

        <h2 className="project-card__title">{project.title}</h2>

        <p className="project-card__location">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          {project.location}
        </p>

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

      <div className="project-card__right">
        {/* Bookmark button */}
        <button
          className={`btn--bookmark${isSaved ? ' is-saved' : ''}`}
          onClick={handleSaveClick}
          aria-label={isSaved ? 'Unsave lead' : 'Save lead'}
          title={isSaved ? 'Unsave' : 'Save lead'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
        </button>

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
