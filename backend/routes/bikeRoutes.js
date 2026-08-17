const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');
const bikeController = require('../controllers/bikeController');

// Owner routes (require authentication) - must come before :id routes
router.get('/my-bikes', authenticate, authorize('owner'), bikeController.getMyBikes);
router.post('/', authenticate, authorize('owner'), bikeController.createBike);

// Public routes - search must come before :id to avoid conflicts
router.get('/search', bikeController.searchBikes);
router.get('/', bikeController.getAllApprovedBikes);
router.get('/:id', bikeController.getBikeById);
router.put('/:id', authenticate, authorize('owner'), bikeController.updateBike);
router.delete('/:id', authenticate, authorize('owner'), bikeController.deleteBike);
router.post('/:id/images', authenticate, authorize('owner'), upload.array('images', 10), bikeController.uploadBikeImages);

module.exports = router;
