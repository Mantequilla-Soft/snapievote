import React, { useState, useEffect } from 'react';
import { lists } from '../../services/api';
import './ListsPanel.css';

function ListsPanel() {
  const [activeList, setActiveList] = useState('good');
  const [goodList, setGoodList] = useState([]);
  const [shitList, setShitList] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    vote_weight: 50,
    delay_minutes: 5,
    max_votes_per_day: 10,
    include_comments: 0
  });

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const [goodRes, shitRes] = await Promise.all([
        lists.getGood(),
        lists.getShit()
      ]);
      setGoodList(goodRes.data);
      setShitList(shitRes.data);
    } catch (err) {
      console.error('Failed to fetch lists:', err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeList === 'good') {
        await lists.addGood(formData);
      } else {
        // For shit list, respect the form's vote_weight (do not force 100%)
        await lists.addShit(formData);
      }
      setShowAddModal(false);
      setFormData({
        username: '',
        vote_weight: activeList === 'good' ? 50 : 100,
        delay_minutes: 5,
        max_votes_per_day: activeList === 'good' ? 10 : 50,
        include_comments: 0
      });
      fetchLists();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add to list');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this user from the list?')) return;
    
    try {
      if (activeList === 'good') {
        await lists.deleteGood(id);
      } else {
        await lists.deleteShit(id);
      }
      fetchLists();
    } catch (err) {
      alert('Failed to remove from list');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const updatedData = {
        ...item,
        active: item.active ? 0 : 1
      };
      
      if (activeList === 'good') {
        await lists.updateGood(item.id, updatedData);
      } else {
        await lists.updateShit(item.id, updatedData);
      }
      fetchLists();
    } catch (err) {
      alert('Failed to update list item');
    }
  };

  const openAddModal = (listType) => {
    setActiveList(listType);
    setFormData({
      username: '',
      vote_weight: listType === 'good' ? 50 : 100,
      delay_minutes: 5,
      max_votes_per_day: listType === 'good' ? 10 : 50,
      include_comments: 0
    });
    setShowAddModal(true);
  };

  const currentList = activeList === 'good' ? goodList : shitList;

  return (
    <div className="lists-panel">
      <div className="lists-tabs">
        <button
          className={`list-tab good-tab ${activeList === 'good' ? 'active' : ''}`}
          onClick={() => setActiveList('good')}
        >
          <span className="tab-icon">👍</span>
          <span className="tab-label">Good List</span>
          <span className="tab-count">
            {goodList.filter(i => i.active).length}/{goodList.length}
          </span>
        </button>
        <button
          className={`list-tab shit-tab ${activeList === 'shit' ? 'active' : ''}`}
          onClick={() => setActiveList('shit')}
        >
          <span className="tab-icon">💩</span>
          <span className="tab-label">Shit List</span>
          <span className="tab-count">
            {shitList.filter(i => i.active).length}/{shitList.length}
          </span>
        </button>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">
            {activeList === 'good' ? 'Good List (Upvote)' : 'Shit List (Downvote)'}
          </h2>
          <button
            className="button button-primary"
            onClick={() => openAddModal(activeList)}
          >
            + Add User
          </button>
        </div>

        <div className="section-body">
          {currentList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                {activeList === 'good' ? '👍' : '💩'}
              </div>
              <div className="empty-state-text">No users yet</div>
              <small>Add usernames to {activeList === 'good' ? 'upvote' : 'downvote'}</small>
            </div>
          ) : (
            <div className="list-items">
              {currentList.map(item => (
                <div key={item.id} className="list-item-card">
                  <div className="list-item-header">
                    <div className="list-item-username">
                      @{item.username}
                      {!item.active && <span className="inactive-badge">Paused</span>}
                    </div>
                    <div className="list-item-actions">
                      <button
                        className={`button-small toggle-button ${item.active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleActive(item)}
                        title={item.active ? 'Click to pause' : 'Click to activate'}
                      >
                        {item.active ? '⏸ Pause' : '▶ Active'}
                      </button>
                      <button
                        className="button-small button-danger-small"
                        onClick={() => handleDelete(item.id)}
                        title="Delete permanently"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                  <div className="list-item-details">
                    <span>Weight: {item.vote_weight}%</span>
                    <span>Delay: {item.delay_minutes}m</span>
                    <span>Max/day: {item.max_votes_per_day}</span>
                    <span>{item.include_comments ? '📝 Comments' : '📄 Posts only'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add to {activeList === 'good' ? 'Good' : 'Shit'} List</h3>
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
                <label>Vote Weight (%)</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="100"
                  value={formData.vote_weight}
                  onChange={(e) => setFormData({...formData, vote_weight: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Delay (minutes)</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="1440"
                  value={formData.delay_minutes}
                  onChange={(e) => setFormData({...formData, delay_minutes: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Max Votes Per Day</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="1000"
                  value={formData.max_votes_per_day}
                  onChange={(e) => setFormData({...formData, max_votes_per_day: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.include_comments === 1}
                    onChange={(e) => setFormData({...formData, include_comments: e.target.checked ? 1 : 0})}
                  />
                  <span>Include comments (not just posts)</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListsPanel;
