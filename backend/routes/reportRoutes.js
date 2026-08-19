const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const reportController = require('../controllers/reportController');

// Authenticated user reporting routes
router.post('/', authenticate, reportController.createReport);
router.get('/my-reports', authenticate, reportController.getMyReports);

module.exports = router;
