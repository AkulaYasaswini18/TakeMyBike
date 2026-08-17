const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'booking routes placeholder' }));

module.exports = router;
