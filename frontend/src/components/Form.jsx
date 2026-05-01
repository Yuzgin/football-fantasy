import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';
import '../styles/Form.css';

function Form({ route, method }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const name = method === 'login' ? 'Login' : 'Register';
  const isRegister = method === 'register';

  const handleSubmit = async (e) => {
    setLoading(true);
    setErrorMessage('');
    e.preventDefault();

    if (isRegister) {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await api.post(route, { email, password });
      if (method === 'login') {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (error) {
      const status = error.response?.status;
      if (method === 'login' && status === 401) {
        setErrorMessage('Email or password is incorrect.');
      } else {
        const detail = error.response?.data?.detail;
        setErrorMessage(
          typeof detail === 'string'
            ? detail
            : 'Something went wrong. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card form_container">
        <div className="auth-card-header">
          <h1>{name}</h1>
          <p className="auth-card-subtitle">
            {isRegister
              ? 'Create an account to build a fantasy team.'
              : 'Sign in to access Langwith Fantasy.'}
          </p>
        </div>

        {errorMessage ? (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="auth-field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
          />
        </div>

        {isRegister ? (
          <div className="auth-field">
            <label htmlFor="auth-confirm-password">Confirm password</label>
            <input
              id="auth-confirm-password"
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              aria-invalid={confirmPassword.length > 0 && password !== confirmPassword}
              required
            />
          </div>
        ) : null}

        <div className="auth-actions">
          <button className="form-button" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>

          {method === 'login' ? (
            <>
              <Link to="/register" className="form-button form-button-secondary">
                Create an account
              </Link>
            </>
          ) : (
            <Link to="/login" className="form-button form-button-secondary">
              Back to sign in
            </Link>
          )}
        </div>

        {method === 'login' ? (
          <div className="auth-footer-links">
            <Link to="/forgot-password" className="auth-link">
              Forgot your password?
            </Link>
          </div>
        ) : null}
      </form>
    </div>
  );
}

export default Form;
