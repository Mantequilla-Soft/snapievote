import React, { useState } from 'react';
import BotControl from './BotControl';
import AccountsPanel from './AccountsPanel';
import ListsPanel from './ListsPanel';
import VoteHistory from './VoteHistory';
import LogViewer from './LogViewer';
import './Dashboard.css';

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <img src="/snapie.png" alt="Snapie" className="nav-logo" />
          <h1>SnapieVote</h1>
        </div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`nav-tab ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            Accounts
          </button>
          <button
            className={`nav-tab ${activeTab === 'lists' ? 'active' : ''}`}
            onClick={() => setActiveTab('lists')}
          >
            Lists
          </button>
          <button
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
        <button className="button button-secondary logout-btn" onClick={onLogout}>
          Logout
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-layout">
            <BotControl />
            <AccountsPanel compact />
            <VoteHistory limit={10} />
            <LogViewer />
          </div>
        )}
        {activeTab === 'accounts' && <AccountsPanel />}
        {activeTab === 'lists' && <ListsPanel />}
        {activeTab === 'history' && <VoteHistory />}
      </div>
    </div>
  );
}

export default Dashboard;
