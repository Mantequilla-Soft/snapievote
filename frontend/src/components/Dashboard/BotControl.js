import React, { useState, useEffect } from 'react';
import { bot } from '../../services/api';
import './BotControl.css';

function BotControl() {
  const [botStatus, setBotStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await bot.getStatus();
      setBotStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    setError('');
    
    const masterPassword = localStorage.getItem('masterPassword');
    if (!masterPassword) {
      setError('Master password not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      await bot.start(masterPassword);
      await fetchStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start bot');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError('');

    try {
      await bot.stop();
      await fetchStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to stop bot');
    } finally {
      setLoading(false);
    }
  };

  const isRunning = botStatus?.isRunning;

  return (
    <div className="section bot-control">
      <div className="bot-status-header">
        <div className="bot-status-info">
          <h2 className="section-title">Bot Control</h2>
          <div className="status-badge">
            <span className={`status-indicator ${isRunning ? 'active' : 'inactive'}`}></span>
            {isRunning ? 'Running' : 'Stopped'}
          </div>
        </div>
        
        <button
          className={`button bot-toggle ${isRunning ? 'button-danger' : 'button-primary'}`}
          onClick={isRunning ? handleStop : handleStart}
          disabled={loading}
        >
          {loading ? '...' : isRunning ? '⏸ PAUSE' : '▶ START'}
        </button>
      </div>

      {botStatus && (
        <div className="bot-stats">
          <div className="bot-stat">
            <span className="stat-label">Last Block</span>
            <span className="stat-value">{botStatus.lastBlock || 'N/A'}</span>
          </div>
          <div className="bot-stat">
            <span className="stat-label">Pending Votes</span>
            <span className="stat-value">{botStatus.runtime?.pendingVotes || 0}</span>
          </div>
          <div className="bot-stat">
            <span className="stat-label">Status</span>
            <span className="stat-value">
              {isRunning ? '🟢 Active' : '🔴 Inactive'}
            </span>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default BotControl;
