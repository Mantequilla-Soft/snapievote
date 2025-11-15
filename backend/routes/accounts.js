const express = require('express');
const DatabaseService = require('../services/database');
const EncryptionService = require('../services/encryption');
const HiveService = require('../services/hive');

const router = express.Router();
const dbService = new DatabaseService();
const encryptionService = new EncryptionService();
const hiveService = new HiveService();

// Get all accounts
router.get('/', (req, res) => {
  try {
    const accounts = dbService.getAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add account
router.post('/', async (req, res) => {
  try {
    const { username, postingKey, minVpThreshold, masterPassword } = req.body;

    // Validate posting key format
    if (!encryptionService.isValidPostingKey(postingKey)) {
      return res.status(400).json({ error: 'Invalid posting key format' });
    }

    // Encrypt posting key
    const { encryptedData, iv } = encryptionService.encrypt(postingKey, masterPassword);

    // Save to database
    dbService.addAccount(username, encryptedData, iv, minVpThreshold || 70);

    res.json({ message: 'Account added successfully', username });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Account already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update account
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { min_vp_threshold, active } = req.body;

    dbService.updateAccount(id, { min_vp_threshold, active });
    res.json({ message: 'Account updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    dbService.deleteAccount(id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get account VP
router.get('/:username/vp', async (req, res) => {
  try {
    const { username } = req.params;
    const vpInfo = await hiveService.getAccountVP(username);
    res.json(vpInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
