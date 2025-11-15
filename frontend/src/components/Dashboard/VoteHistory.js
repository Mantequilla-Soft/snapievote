import React, { useState, useEffect } from 'react';
import { bot } from '../../services/api';
import './VoteHistory.css';

function VoteHistory({ limit = 50 }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const fetchHistory = async () => {
    try {
      const response = await bot.getHistory(limit);
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Recent Votes</h2>
        <button className="button button-secondary" onClick={fetchHistory}>
          ↻ Refresh
        </button>
      </div>

      <div className="section-body">
        {loading ? (
          <div className="loading-state">Loading votes...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <img src="/snapie.png" alt="Snapie" className="empty-state-snapie" />
            <div className="empty-state-text">No votes yet</div>
            <small>Votes will appear here once the bot is running</small>
          </div>
        ) : (
          <div className="vote-history-list">
            {history.map(vote => (
              <div key={vote.id} className={`vote-item ${vote.list_type}`}>
                <div className="vote-icon">
                  {vote.list_type === 'good' ? '👍' : '👎'}
                </div>
                <div className="vote-details">
                  <div className="vote-main">
                    <span className="vote-voter">@{vote.voter_account}</span>
                    <span className="vote-arrow">→</span>
                    <span className="vote-target">@{vote.target_author}</span>
                  </div>
                  <div className="vote-meta">
                    <span className="vote-weight">
                      {vote.vote_weight > 0 ? '+' : ''}{(vote.vote_weight / 100).toFixed(1)}%
                    </span>
                    <span className="vote-time">{formatDate(vote.voted_at)}</span>
                    {!vote.success && <span className="vote-error">❌ Failed</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VoteHistory;
