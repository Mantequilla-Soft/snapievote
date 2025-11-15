const express = require('express');
const DatabaseService = require('../services/database');

const router = express.Router();
const dbService = new DatabaseService();

let votingService = null;

// Start bot
router.post('/start', async (req, res) => {
  try {
    const { masterPassword } = req.body;

    if (!masterPassword) {
      return res.status(400).json({ error: 'Master password required' });
    }

    if (votingService && votingService.isRunning) {
      return res.status(400).json({ error: 'Bot is already running' });
    }

    // Import here to avoid circular dependency
    const VotingService = require('../services/voting');
    votingService = new VotingService(masterPassword);
    
    await votingService.start();
    res.json({ message: 'Bot started successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop bot
router.post('/stop', (req, res) => {
  try {
    if (!votingService || !votingService.isRunning) {
      return res.status(400).json({ error: 'Bot is not running' });
    }

    votingService.stop();
    res.json({ message: 'Bot stopped successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bot status
router.get('/status', (req, res) => {
  try {
    const dbStatus = dbService.getBotStatus();
    const runtimeStatus = votingService ? votingService.getStatus() : null;
    
    // Trust runtime state over DB state (DB can get stale)
    const actuallyRunning = votingService && votingService.isRunning;
    
    // Sync DB if out of sync
    if (actuallyRunning !== (dbStatus.is_running === 1)) {
      dbService.updateBotStatus(actuallyRunning ? 1 : 0);
    }
    
    res.json({
      isRunning: actuallyRunning,
      lastBlock: dbStatus.last_block,
      updatedAt: dbStatus.updated_at,
      runtime: runtimeStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent vote history
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = dbService.getRecentVoteHistory(limit);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bot logs
router.get('/logs', (req, res) => {
  try {
    const logger = require('../services/logger');
    const limit = parseInt(req.query.limit) || 50;
    const logs = logger.getLogs(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
