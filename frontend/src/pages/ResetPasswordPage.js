import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const { token }    = useParams();
  const navigate     = useNavigate();
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 8)  return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Link to="/" className="auth-brand">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#1e3a5f"/>
              <path d="M8 22L13 12L18 19L21 15L24 22H8Z" fill="#90cdf4" opacity="0.9"/>
              <circle cx="21" cy="11" r="3" fill="#3b82f6"/>
            </svg>
            <span className="auth-brand-name">Bid<strong>Front</strong></span>
          </Link>
        </div>

        {success ? (
          <>
            <div className="auth-success-icon">🎉</div>
            <h1 className="auth-title">Password updated!</h1>
            <p className="auth-subtitle">Redirecting you to sign in...</p>
            <Link to="/login" className="btn btn--primary auth-submit" style={{ marginTop: 24 }}>
              Sign In Now →
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-subtitle">Choose a strong password for your account.</p>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="password">New password <span className="auth-hint">(8+ characters)</span></label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label htmlFor="confirm">Confirm new password</label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn--primary auth-submit"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        <p className="auth-switch" style={{ marginTop: 24 }}>
          <Link to="/login">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
