const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'bike routes placeholder' }));

module.exports = router;
