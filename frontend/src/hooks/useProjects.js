// hooks/useProjects.js
// Reusable hook that fetches projects from the API based on URL search params
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useProjects() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Pass all URL params straight to the API
    const query = searchParams.toString() || 'page=1';

    fetch(`/api/projects?${query}`)
      .then(r => {
        if (!r.ok) throw new Error('API error');
        return r.json();
      })
      .then(({ data, pagination: pg }) => {
        setProjects(data);
        setPagination(pg);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

  }, [searchParams]); // Re-fetch whenever URL params change

  return { projects, pagination, loading, error };
}
