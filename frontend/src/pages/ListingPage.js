// pages/ListingPage.js
import { useSearchParams } from 'react-router-dom';
import FilterBar  from '../components/FilterBar';
import ProjectCard from '../components/ProjectCard';
import Pagination  from '../components/Pagination';
import useProjects from '../hooks/useProjects';

export default function ListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, pagination, loading, error } = useProjects();

  const currentPage = parseInt(searchParams.get('page') || '1');

  function handlePageChange(newPage) {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      {/* Sticky filter bar */}
      <FilterBar />

      <div className="listing-page">
        <div className="container">
          {/* Results header */}
          <div className="listing-header">
            <p className="listing-count">
              {loading ? 'Loading...' : (
                <>
                  Showing <strong>{projects.length}</strong> of{' '}
                  <strong>{pagination.total}</strong> leads
                </>
              )}
            </p>
            <p className="listing-count">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          </div>

          {/* Error state */}
          {error && (
            <div style={{ padding: 24, background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, color: '#c53030', marginBottom: 16 }}>
              ⚠️ Could not load projects. Make sure the API server is running on port 4000.
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <div>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div className="skeleton" style={{ width: 52, height: 22, borderRadius: 20 }} />
                    <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 20 }} />
                  </div>
                  <div className="skeleton" style={{ width: '65%', height: 20, marginBottom: 10 }} />
                  <div className="skeleton" style={{ width: '35%', height: 14 }} />
                </div>
              ))}
            </div>
          )}

          {/* Project cards */}
          {!loading && !error && (
            <>
              {projects.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
                  <h3>No leads found</h3>
                  <p>Try adjusting your filters or clearing search terms.</p>
                </div>
              ) : (
                <div className="projects-grid">
                  {projects.map(p => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              )}

              <Pagination
                page={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
