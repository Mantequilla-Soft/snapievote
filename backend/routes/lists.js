const express = require('express');
const DatabaseService = require('../services/database');

const router = express.Router();
const dbService = new DatabaseService();

// Get Good List
router.get('/good', (req, res) => {
  try {
    const list = dbService.getGoodList();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to Good List
router.post('/good', (req, res) => {
  try {
    const data = req.body;
    dbService.addToGoodList(data);
    res.json({ message: 'Added to Good List successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username already in Good List' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update Good List item
router.put('/good/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    dbService.updateGoodListItem(id, data);
    res.json({ message: 'Good List item updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Good List item
router.delete('/good/:id', (req, res) => {
  try {
    const { id } = req.params;
    dbService.deleteGoodListItem(id);
    res.json({ message: 'Removed from Good List successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Shit List
router.get('/shit', (req, res) => {
  try {
    const list = dbService.getShitList();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to Shit List
router.post('/shit', (req, res) => {
  try {
    const data = req.body;
    dbService.addToShitList(data);
    res.json({ message: 'Added to Shit List successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username already in Shit List' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update Shit List item
router.put('/shit/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    dbService.updateShitListItem(id, data);
    res.json({ message: 'Shit List item updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Shit List item
router.delete('/shit/:id', (req, res) => {
  try {
    const { id } = req.params;
    dbService.deleteShitListItem(id);
    res.json({ message: 'Removed from Shit List successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
