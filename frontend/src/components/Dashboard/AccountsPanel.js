import React, { useState, useEffect } from 'react';
import { accounts } from '../../services/api';
import './AccountsPanel.css';

function AccountsPanel({ compact = false }) {
  const [accountsList, setAccountsList] = useState([]);
  const [vpData, setVpData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    postingKey: '',
    minVpThreshold: 70
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await accounts.getAll();
      setAccountsList(response.data);
      
      // Fetch VP for each account (both upvote and downvote)
      response.data.forEach(async (account) => {
        try {
          const vpResponse = await accounts.getVP(account.username);
          setVpData(prev => ({
            ...prev,
            [account.username]: {
              upvote: vpResponse.data.votingPower,
              downvote: vpResponse.data.downvotePower
            }
          }));
        } catch (err) {
          console.error(`Failed to fetch VP for ${account.username}`);
        }
      });
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);

    const masterPassword = localStorage.getItem('masterPassword');
    try {
      await accounts.add({ ...formData, masterPassword });
      setShowAddModal(false);
      setFormData({ username: '', postingKey: '', minVpThreshold: 70 });
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this account?')) return;
    
    try {
      await accounts.delete(id);
      fetchAccounts();
    } catch (err) {
      alert('Failed to delete account');
    }
  };

  const handleToggleActive = async (account) => {
    try {
      await accounts.update(account.id, {
        min_vp_threshold: account.min_vp_threshold,
        active: account.active ? 0 : 1
      });
      fetchAccounts();
    } catch (err) {
      alert('Failed to update account');
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Voting Accounts</h2>
        {!compact && (
          <button className="button button-primary" onClick={() => setShowAddModal(true)}>
            + Add Account
          </button>
        )}
      </div>

      <div className="section-body">
        {accountsList.length === 0 ? (
          <div className="empty-state">
            <img src="/snapie.png" alt="Snapie" className="empty-state-snapie" />
            <div className="empty-state-text">No accounts yet</div>
            <small>Add your Hive accounts to start voting</small>
          </div>
        ) : (
          <div className="accounts-list">
            {accountsList.map(account => (
              <div key={account.id} className="account-card">
                <div className="account-info">
                  <div className="account-username">
                    @{account.username}
                    {!account.active && <span className="inactive-badge">Paused</span>}
                  </div>
                  <div className="account-vp">
                    👍 Upvote VP: <span className="vp-value">{vpData[account.username]?.upvote || '...'}</span>%
                  </div>
                  <div className="account-vp">
                    👎 Downvote VP: <span className="vp-value">{vpData[account.username]?.downvote || '...'}</span>%
                  </div>
                  <div className="account-threshold">
                    Min VP: {account.min_vp_threshold}%
                  </div>
                </div>
                {!compact && (
                  <div className="account-actions">
                    <button
                      className={`button-small toggle-button ${account.active ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActive(account)}
                      title={account.active ? 'Click to pause' : 'Click to activate'}
                    >
                      {account.active ? '⏸ Pause' : '▶ Active'}
                    </button>
                    <button
                      className="button-small button-danger-small"
                      onClick={() => handleDelete(account.id)}
                      title="Delete permanently"
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Voting Account</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Hive Username</label>
                <input
                  type="text"
                  className="input"
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Posting Key</label>
                <input
                  type="password"
                  className="input"
                  placeholder="5..."
                  value={formData.postingKey}
                  onChange={(e) => setFormData({...formData, postingKey: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Min VP Threshold (%)</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="100"
                  value={formData.minVpThreshold}
                  onChange={(e) => setFormData({...formData, minVpThreshold: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountsPanel;
