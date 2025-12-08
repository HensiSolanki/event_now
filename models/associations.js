const Place = require('./PlaceModel');
const PlaceCategory = require('./PlaceCategoryModel');
const PlaceImage = require('./PlaceImageModel');
const PlaceRating = require('./PlaceRatingModel');
const User = require('./UserModel');
const FavoritePlace = require('./FavoritePlaceModel');
const PlaceBooking = require('./PlaceBookingModel');

/**
 * Define model associations
 */

// Place belongs to PlaceCategory
Place.belongsTo(PlaceCategory, {
    foreignKey: 'category_id',
    as: 'category'
});

// PlaceCategory has many Places
PlaceCategory.hasMany(Place, {
    foreignKey: 'category_id',
    as: 'places'
});

// Place has many PlaceImages
Place.hasMany(PlaceImage, {
    foreignKey: 'place_id',
    as: 'images',
    onDelete: 'CASCADE'
});

// PlaceImage belongs to Place
PlaceImage.belongsTo(Place, {
    foreignKey: 'place_id',
    as: 'place'
});

// Place has many PlaceRatings
Place.hasMany(PlaceRating, {
    foreignKey: 'place_id',
    as: 'ratings',
    onDelete: 'CASCADE'
});

// PlaceRating belongs to Place
PlaceRating.belongsTo(Place, {
    foreignKey: 'place_id',
    as: 'place'
});

// PlaceRating belongs to User
PlaceRating.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// User has many PlaceRatings
User.hasMany(PlaceRating, {
    foreignKey: 'user_id',
    as: 'ratings'
});

// Place belongs to User (creator)
Place.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'
});

// User has many Places
User.hasMany(Place, {
    foreignKey: 'created_by',
    as: 'places'
});

// User has many FavoritePlaces
User.hasMany(FavoritePlace, {
    foreignKey: 'user_id',
    as: 'favorites',
    onDelete: 'CASCADE'
});

// FavoritePlace belongs to User
FavoritePlace.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// Place has many FavoritePlaces
Place.hasMany(FavoritePlace, {
    foreignKey: 'place_id',
    as: 'favorites',
    onDelete: 'CASCADE'
});

// FavoritePlace belongs to Place
FavoritePlace.belongsTo(Place, {
    foreignKey: 'place_id',
    as: 'place'
});

// Place has many PlaceBookings
Place.hasMany(PlaceBooking, {
    foreignKey: 'place_id',
    as: 'bookings',
    onDelete: 'CASCADE'
});

// PlaceBooking belongs to Place
PlaceBooking.belongsTo(Place, {
    foreignKey: 'place_id',
    as: 'place'
});

// User has many PlaceBookings
User.hasMany(PlaceBooking, {
    foreignKey: 'user_id',
    as: 'bookings',
    onDelete: 'CASCADE'
});

// PlaceBooking belongs to User
PlaceBooking.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

module.exports = {
    Place,
    PlaceCategory,
    PlaceImage,
    PlaceRating,
    User,
    FavoritePlace,
    PlaceBooking
};

