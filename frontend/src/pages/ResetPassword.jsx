import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';
import '../styles/Form.css';

function ResetPassword() {
  const { uid, token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      await api.post('/api/reset-password/', {
        uid,
        token,
        new_password: newPassword,
      });
      setMessage('Password updated. Redirecting you to sign in…');
      setIsError(false);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setMessage('This link may be invalid or expired. Request a new reset from the login page.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card form_container">
        <div className="auth-card-header">
          <h1>Set new password</h1>
          <p className="auth-card-subtitle">
            Choose a strong password you haven&apos;t used here before.
          </p>
        </div>

        <div className="auth-field">
          <label htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            className="form-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        <div className="auth-actions">
          <button className="form-button" type="submit" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
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

export default ResetPassword;
