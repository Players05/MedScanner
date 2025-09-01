const express = require('express');
const History = require('../models/History');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const items = await History.find({}).sort({ createdAt: -1 }).limit(100);
        res.json(items);
    } catch (e) {
        res.status(500).json({ error: 'Failed to load history', details: e.message });
    }
});

module.exports = router;



