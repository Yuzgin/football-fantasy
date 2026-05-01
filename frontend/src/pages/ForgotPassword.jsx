import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import '../styles/Form.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      await api.post('/api/password-reset/', { email });
      setMessage('If an account exists for that email, we’ve sent a reset link. Check your inbox.');
      setIsError(false);
    } catch {
      setMessage('Something went wrong. Please try again in a moment.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card form_container">
        <div className="auth-card-header">
          <h1>Forgot password</h1>
          <p className="auth-card-subtitle">
            Enter your email and we&apos;ll send you a link to choose a new password.
          </p>
        </div>

        <div className="auth-field">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="auth-actions">
          <button className="form-button" type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </div>

        {message ? (
          <p className={isError ? 'form-error' : 'form-success'} role="status">
            {message}
          </p>
        ) : null}

        <div className="auth-footer-links">
          <Link to="/login" className="auth-link auth-link-emphasis">
            ← Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ForgotPassword;
