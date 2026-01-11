const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = {
    categories: 'public/uploads/categories',
    places: 'public/uploads/places',
    activities: 'public/uploads/activities'
};

Object.values(uploadDirs).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage for categories
const categoryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirs.categories);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure storage for places
const placeStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirs.places);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'place-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure storage for activities
const activityStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirs.activities);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'activity-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp, svg) are allowed!'));
    }
};

// Configure multer for categories
const categoryUpload = multer({
    storage: categoryStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: fileFilter
});

// Configure multer for places (multiple images)
const placeUpload = multer({
    storage: placeStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size per image
    },
    fileFilter: fileFilter
});

// Configure multer for activities (single image)
const activityUpload = multer({
    storage: activityStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    },
    fileFilter: fileFilter
});

module.exports = {
    // For backward compatibility
    single: categoryUpload.single.bind(categoryUpload),
    
    // Category uploads
    categoryUpload,
    
    // Place uploads
    placeUpload,
    
    // Activity uploads
    activityUpload
};

