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

function hostLabel(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export default function ProjectCard({ project, isSaved = false, onSave }) {
  const navigate = useNavigate();
  const days     = daysUntil(project.deadline);
  const urgency  = days !== null && days <= 7 ? 'urgent' : days !== null && days <= 14 ? 'soon' : 'normal';

  const handleCardClick = (e) => {
    // Don't navigate if clicking interactive elements
    if (e.target.closest('a, button')) return;
    navigate(`/projects/${project.id}`);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onSave) onSave(project.id);
  };

  return (
    <article
      className={`project-card project-card--${urgency}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
      aria-label={`View details for ${project.title}`}
    >
      {/* Left accent bar (color by urgency) */}
      <div className="project-card__accent" />

      <div className="project-card__body">
        {/* Row 1: Badges */}
        <div className="project-card__badges">
          <span className={`badge ${typeBadgeClass(project.type)}`}>{project.type}</span>
          <span className="badge badge--trade">{project.trade_category}</span>
          {project.source_url && (
            <span className="badge badge--source">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 3 }}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              {hostLabel(project.source_url)}
            </span>
          )}
        </div>

        {/* Row 2: Title */}
        <h2 className="project-card__title">{project.title}</h2>

        {/* Row 3: Location + Meta */}
        <div className="project-card__info-row">
          <span className="project-card__location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            {project.location}
          </span>
          <span className="project-card__divider">·</span>
          <span className="meta-item__label">Filed {formatDate(project.filing_date)}</span>
          <span className="project-card__divider">·</span>
          <span className={`project-card__deadline${urgency !== 'normal' ? ` project-card__deadline--${urgency}` : ''}`}>
            Due {formatDate(project.deadline)}
            {days !== null && days >= 0 && (
              <span className="project-card__days-left">
                {days === 0 ? ' (today!)' : ` (${days}d)`}
              </span>
            )}
            {days !== null && days < 0 && (
              <span className="project-card__days-left project-card__days-left--past"> (closed)</span>
            )}
          </span>
        </div>
      </div>

      {/* Right column */}
      <div className="project-card__right">
        <div className="project-card__value-large">{formatCurrency(project.estimated_value)}</div>
        <div className="project-card__value-sub">est. value</div>

        <div className="project-card__actions">
          {/* Bookmark */}
          <button
            className={`btn--bookmark${isSaved ? ' is-saved' : ''}`}
            onClick={handleSaveClick}
            aria-label={isSaved ? 'Unsave lead' : 'Save lead'}
            title={isSaved ? 'Remove from saved' : 'Save this lead'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>

          {/* View Bid — goes to source URL in new tab */}
          {project.source_url ? (
            <a
              href={project.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--view-bid"
              title="Open official bid source"
              onClick={e => e.stopPropagation()}
            >
              View Bid
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          ) : (
            <span className="btn btn--view-bid btn--view-bid-ghost" onClick={() => navigate(`/projects/${project.id}`)}>
              Details →
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
