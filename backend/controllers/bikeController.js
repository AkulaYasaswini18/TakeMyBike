const Bike = require('../models/Bike');
const Booking = require('../models/Booking');
const path = require('path');
const fs = require('fs');
const r=0;
// Create a bike listing
exports.createBike = async (req, res, next) => {
  try {
    const { brand, model, type, year, registrationNumber, description, pricePerDay, securityDeposit, location, condition } = req.body;
    
    // Validate required fields
    if (!brand || !model || !type || !year || !registrationNumber || !pricePerDay) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bike = await Bike.create({
      owner: req.user._id,
      brand,
      model,
      type,
      year,
      registrationNumber,
      description,
      pricePerDay,
      securityDeposit,
      location,
      condition,
      isApproved: false,  // Default to not approved
      isAvailable: true,
      images: []
    });

    res.status(201).json({ bike });
  } catch (err) {
    next(err);
  }
};

// Get logged-in owner's bikes
exports.getMyBikes = async (req, res, next) => {
  try {
    const bikes = await Bike.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ bikes });
  } catch (err) {
    next(err);
  }
};

// Get a single bike by ID with details and reviews
exports.getBikeById = async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const bike = await Bike.findById(req.params.id).populate('owner', 'name email phone rating');
    if (!bike) return res.status(404).json({ error: 'Bike not found' });
    
    // Get reviews for this bike
    const reviews = await Review.find({ booking: { $exists: true } })
      .populate('fromUser', 'name')
      .populate('booking', 'bike');
    
    const bikeReviews = reviews.filter(r => r.booking && r.booking.bike.toString() === bike._id.toString());
    
    // Calculate bike rating
    let bikeRating = 0;
    if (bikeReviews.length > 0) {
      bikeRating = bikeReviews.reduce((sum, r) => sum + r.rating, 0) / bikeReviews.length;
    }
    
    res.json({ 
      bike, 
      reviews: bikeReviews,
      bikeRating: bikeRating.toFixed(1)
    });
  } catch (err) {
    next(err);
  }
};

// Get bike availability (blocked dates and booked ranges)
exports.getBikeAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bike = await Bike.findById(id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });
    
    // Get bookings for this bike
    const bookings = await Booking.find({
      bike: id,
      status: { $in: ['APPROVED', 'CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED'] }
    });
    
    const bookedDates = [];
    bookings.forEach(b => {
      bookedDates.push({
        start: b.startDate,
        end: b.endDate,
        type: 'booked'
      });
    });
    
    res.json({ bookedDates });
  } catch (err) {
    next(err);
  }
};

// Update a bike (owner only)
exports.updateBike = async (req, res, next) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });

    // Verify ownership
    if (bike.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this bike' });
    }

    // Update allowed fields
    const { brand, model, type, year, registrationNumber, description, pricePerDay, securityDeposit, location, condition } = req.body;
    
    if (brand) bike.brand = brand;
    if (model) bike.model = model;
    if (type) bike.type = type;
    if (year) bike.year = year;
    if (registrationNumber) bike.registrationNumber = registrationNumber;
    if (description) bike.description = description;
    if (pricePerDay) bike.pricePerDay = pricePerDay;
    if (securityDeposit !== undefined) bike.securityDeposit = securityDeposit;
    if (location) bike.location = location;
    if (condition) bike.condition = condition;

    await bike.save();
    res.json({ bike });
  } catch (err) {
    next(err);
  }
};

// Delete a bike (owner only)
exports.deleteBike = async (req, res, next) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });

    // Verify ownership
    if (bike.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this bike' });
    }

    // Delete images from disk if they exist
    if (bike.images && bike.images.length > 0) {
      bike.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await Bike.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bike deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Upload images for a bike
exports.uploadBikeImages = async (req, res, next) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });

    // Verify ownership
    if (bike.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to upload images for this bike' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Validate file count (max 10 images)
    if (bike.images.length + req.files.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 images allowed per bike' });
    }

    // Process uploaded files
    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    bike.images.push(...imagePaths);

    await bike.save();
    res.json({ bike, message: 'Images uploaded successfully' });
  } catch (err) {
    next(err);
  }
};

// Get all approved bikes (for browsing)
exports.getAllApprovedBikes = async (req, res, next) => {
  try {
    const { type, minPrice, maxPrice, area } = req.query;
    
    let filter = { isApproved: true, isAvailable: true };
    
    if (type) filter.type = type;
    if (minPrice) filter.pricePerDay = { ...filter.pricePerDay, $gte: minPrice };
    if (maxPrice) filter.pricePerDay = { ...filter.pricePerDay, $lte: maxPrice };
    if (area) filter['location.area'] = area;

    const bikes = await Bike.find(filter)
      .populate('owner', 'name phone')
      .sort({ createdAt: -1 });
    
    res.json({ bikes });
  } catch (err) {
    next(err);
  }
};

// Search bikes with advanced filtering
exports.searchBikes = async (req, res, next) => {
  try {
    const { location, startDate, endDate, minPrice, maxPrice, brand, type, minRating, sortBy } = req.query;
    
    let filter = { isApproved: true, isAvailable: true };
    
    // Basic filters
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }
    
    let bikes = await Bike.find(filter)
      .populate('owner', 'name phone rating');
    
    // Filter by owner rating if specified
    if (minRating) {
      bikes = bikes.filter(bike => (bike.owner?.rating || 0) >= Number(minRating));
    }
    
    // Filter by date range (exclude bikes with overlapping confirmed bookings)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const bookedBikeIds = await Booking.find({
        status: { $in: ['APPROVED', 'CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED'] },
        $or: [
          { startDate: { $lt: end }, endDate: { $gt: start } }
        ]
      }).distinct('bike');
      
      bikes = bikes.filter(bike => !bookedBikeIds.includes(bike._id));
    }
    
    // Apply sorting
    if (sortBy === 'price_asc') {
      bikes.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === 'price_desc') {
      bikes.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sortBy === 'rating') {
      bikes.sort((a, b) => (b.owner?.rating || 0) - (a.owner?.rating || 0));
    }
    
    res.json({ bikes });
  } catch (err) {
    next(err);
  }
};

