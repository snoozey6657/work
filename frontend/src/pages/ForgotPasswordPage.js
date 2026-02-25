import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [resetLink, setResetLink] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setResetLink(data.resetUrl || '');
      setSubmitted(true);
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

        {!submitted ? (
          <>
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-subtitle">Enter your email and we'll generate a reset link for you.</p>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn--primary auth-submit"
                disabled={loading}
              >
                {loading ? 'Generating link...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-success-icon">✅</div>
            <h1 className="auth-title">Reset link ready</h1>
            <p className="auth-subtitle">Click the link below to set a new password. It expires in 1 hour.</p>
            {resetLink && (
              <div className="auth-reset-link-box">
                <Link to={resetLink.replace(window.location.origin, '')} className="btn btn--primary auth-submit">
                  Reset My Password →
                </Link>
              </div>
            )}
          </>
        )}

        <p className="auth-switch" style={{ marginTop: 24 }}>
          <Link to="/login">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
