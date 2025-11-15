const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const DatabaseService = require('../services/database');

const router = express.Router();
const dbService = new DatabaseService();

// Setup master password (first time only)
router.post('/setup', async (req, res) => {
  try {
    const { password } = req.body;

    // Check if password already exists
    const existingHash = dbService.getMasterPasswordHash();
    if (existingHash) {
      return res.status(400).json({ error: 'Master password already set' });
    }

    // Hash and save password
    const hashedPassword = await bcrypt.hash(password, 10);
    dbService.setMasterPassword(hashedPassword);

    res.json({ message: 'Master password set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    const hashedPassword = dbService.getMasterPasswordHash();
    if (!hashedPassword) {
      return res.status(400).json({ error: 'Master password not set. Please setup first.' });
    }

    const isValid = await bcrypt.compare(password, hashedPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ authenticated: true }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if setup is needed
router.get('/check-setup', (req, res) => {
  const hashedPassword = dbService.getMasterPasswordHash();
  res.json({ setupRequired: !hashedPassword });
});

module.exports = router;
