import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function FilterBar() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search:          searchParams.get('search')          || '',
    trade_category:  searchParams.get('trade_category')  || '',
    location:        searchParams.get('location')        || '',
    deadline_before: searchParams.get('deadline_before') || '',
  });
  const [meta, setMeta] = useState({ trade_categories: [], locations: [] });

  useEffect(() => {
    fetch('/api/meta/filters')
      .then(r => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []); // eslint-disable-line

  function apply(updated) {
    const next = { ...filters, ...updated };
    setFilters(next);
    const params = {};
    Object.entries(next).forEach(([k, v]) => { if (v) params[k] = v; });
    params.page = '1';
    setSearchParams(params);
  }

  function clearAll() {
    setFilters({ search: '', trade_category: '', location: '', deadline_before: '' });
    setSearchParams({ page: '1' });
  }

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="filters-bar">
      <div className="container">
        <div className="filters-bar__inner">
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

          <div className="field-group">
            <label htmlFor="trade">Trade Category</label>
            <select
              id="trade"
              value={filters.trade_category}
              onChange={e => apply({ trade_category: e.target.value })}
            >
              <option value="">All Trades</option>
              {meta.trade_categories?.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="location">Location</label>
            <select
              id="location"
              value={filters.location}
              onChange={e => apply({ location: e.target.value })}
            >
              <option value="">All Locations</option>
              {meta.locations?.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="deadline">Deadline By</label>
            <input
              id="deadline"
              type="date"
              value={filters.deadline_before}
              onChange={e => apply({ deadline_before: e.target.value })}
            />
          </div>

          {hasFilters && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button className="btn btn--ghost btn--sm" onClick={clearAll}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
