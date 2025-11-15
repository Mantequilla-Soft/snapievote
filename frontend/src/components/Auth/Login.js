import React, { useState } from 'react';
import { auth } from '../../services/api';
import './Auth.css';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await auth.login(password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('masterPassword', password); // Store for bot operations
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/snapie.png" alt="Snapie" className="snapie-logo" />
          <h1 className="snapie-title">SnapieVote</h1>
          <p className="auth-subtitle">Hive Blockchain Automation</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Master Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter your master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="button button-primary w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Secure authentication for Hive automation</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
