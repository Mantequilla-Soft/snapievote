import React, { useState } from 'react';
import { auth } from '../../services/api';
import './Auth.css';

function Setup({ onSetupComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await auth.setup(password);
      onSetupComplete();
    } catch (err) {
      setError(err.response?.data?.error || 'Setup failed');
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
          <p className="auth-subtitle">Setup Master Password</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Master Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <small className="hint">This password encrypts your posting keys</small>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              className="input"
              placeholder="Confirm master password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="button button-primary w-full"
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Create Master Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p>⚠️ Important: Store this password safely. If lost, you cannot recover your accounts.</p>
        </div>
      </div>
    </div>
  );
}

export default Setup;
