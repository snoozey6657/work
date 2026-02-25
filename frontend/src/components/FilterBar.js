// components/FilterBar.js
// Sticky filter bar with search, dropdowns, and CSV export button
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function FilterBar({ onExport }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search:         searchParams.get('search')         || '',
    trade_category: searchParams.get('trade_category') || '',
    location:       searchParams.get('location')       || '',
    deadline_before: searchParams.get('deadline_before') || '',
  });
  const [meta, setMeta] = useState({ trade_categories: [], locations: [], types: [] });

  // Load filter options from API
  useEffect(() => {
    fetch('/api/projects/meta/filters')
      .then(r => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);

  // Push filter changes to URL (triggers parent re-fetch)
  function apply(updated) {
    const next = { ...filters, ...updated };
    setFilters(next);
    const params = {};
    Object.entries(next).forEach(([k, v]) => { if (v) params[k] = v; });
    params.page = '1'; // reset to page 1 on filter change
    setSearchParams(params);
  }

  function clearAll() {
    setFilters({ search: '', trade_category: '', location: '', deadline_before: '' });
    setSearchParams({ page: '1' });
  }

  // Build export URL with current filters
  function handleExport() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    window.location.href = `/api/projects/export?${params.toString()}`;
  }

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="filters-bar">
      <div className="container">
        <div className="filters-bar__inner">
          {/* Keyword search */}
          <div className="field-group filters-bar__search">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search project titles..."
              value={filters.search}
              onChange={e => apply({ search: e.target.value })}
            />
          </div>

          {/* Trade category */}
          <div className="field-group">
            <label htmlFor="trade">Trade Category</label>
            <select
              id="trade"
              value={filters.trade_category}
              onChange={e => apply({ trade_category: e.target.value })}
            >
              <option value="">All Trades</option>
              {meta.trade_categories.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="field-group">
            <label htmlFor="location">Location</label>
            <select
              id="location"
              value={filters.location}
              onChange={e => apply({ location: e.target.value })}
            >
              <option value="">All Locations</option>
              {meta.locations.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Deadline before */}
          <div className="field-group">
            <label htmlFor="deadline">Deadline By</label>
            <input
              id="deadline"
              type="date"
              value={filters.deadline_before}
              onChange={e => apply({ deadline_before: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'flex-end' }}>
            <button className="btn btn--export" onClick={handleExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Export CSV
            </button>
            {hasFilters && (
              <button className="btn btn--ghost btn--sm" onClick={clearAll}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
