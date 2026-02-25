// hooks/useProjects.js
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function useProjects() {
  const [searchParams] = useSearchParams();
  const [projects,   setProjects]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);

    const query = searchParams.toString() || 'page=1';

    fetch(`/api/projects?${query}`, { headers: getAuthHeaders() })
      .then(r => {
        if (r.status === 401) throw new Error('auth');
        if (!r.ok) throw new Error('API error');
        return r.json();
      })
      .then(({ data, pagination: pg }) => {
        setProjects(data);
        setPagination(pg);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

  }, [searchParams]); // eslint-disable-line

  return { projects, pagination, loading, error };
}
