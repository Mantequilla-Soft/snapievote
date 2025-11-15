import React, { useState, useEffect, useRef } from 'react';
import { bot } from '../../services/api';
import './LogViewer.css';

function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const fetchLogs = async () => {
    try {
      const response = await bot.getLogs();
      setLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const getLevelEmoji = (level) => {
    const emojis = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      vote: '🗳️',
      detect: '📝',
      block: '🔗'
    };
    return emojis[level] || 'ℹ️';
  };

  const getLevelClass = (level) => {
    return `log-level-${level}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="section log-viewer">
      <div className="log-header">
        <h2 className="section-title">Bot Logs</h2>
        <label className="auto-scroll-toggle">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll
        </label>
      </div>

      <div className="logs-container">
        {logs.length === 0 ? (
          <div className="empty-state">
            <img src="/snapie.png" alt="Snapie" className="empty-snapie" />
            <p>No logs yet. Start the bot to see activity.</p>
          </div>
        ) : (
          <div className="logs-list">
            {logs.map((log, index) => (
              <div key={index} className={`log-entry ${getLevelClass(log.level)}`}>
                <span className="log-emoji">{getLevelEmoji(log.level)}</span>
                <span className="log-time">{formatTime(log.timestamp)}</span>
                <span className="log-message">{log.message}</span>
                {log.data && (
                  <span className="log-data">{JSON.stringify(log.data)}</span>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

export default LogViewer;
