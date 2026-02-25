import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on first load
  useEffect(() => {
    const stored = localStorage.getItem('winco_token');
    if (stored) {
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        // Check expiry
        if (payload.exp * 1000 > Date.now()) {
          setToken(stored);
          setUser({ id: payload.id, name: payload.name, email: payload.email });
        } else {
          localStorage.removeItem('winco_token');
        }
      } catch {
        localStorage.removeItem('winco_token');
      }
    }
    setLoading(false);
  }, []);

  const _storeAuth = ({ token: t, user: u }) => {
    localStorage.setItem('winco_token', t);
    setToken(t);
    setUser(u);
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    _storeAuth(data);
    return data;
  };

  const register = async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    _storeAuth(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('winco_token');
    setToken(null);
    setUser(null);
  };

  const getAuthHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthContext;
