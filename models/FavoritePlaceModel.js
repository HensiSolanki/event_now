const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");

const FavoritePlace = sequelize.define('FavoritePlace', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'User ID is required'
            }
        }
    },
    place_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Place ID is required'
            }
        }
    }
}, {
    tableName: 'favorite_places',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'place_id'],
            name: 'unique_user_place'
        },
        {
            fields: ['user_id'],
            name: 'idx_user_id'
        },
        {
            fields: ['place_id'],
            name: 'idx_place_id'
        }
    ]
});

/**
 * Static method to check if a place is favorited by user
 */
FavoritePlace.isFavorited = async function (userId, placeId) {
    const favorite = await FavoritePlace.findOne({
        where: {
            user_id: userId,
            place_id: placeId
        }
    });
    return !!favorite;
};

/**
 * Static method to get user's favorite count
 */
FavoritePlace.getUserFavoriteCount = async function (userId) {
    return await FavoritePlace.count({
        where: { user_id: userId }
    });
};

/**
 * Static method to get place's favorite count
 */
FavoritePlace.getPlaceFavoriteCount = async function (placeId) {
    return await FavoritePlace.count({
        where: { place_id: placeId }
    });
};

/**
 * Static method to add favorite
 */
FavoritePlace.addFavorite = async function (userId, placeId) {
    const [favorite, created] = await FavoritePlace.findOrCreate({
        where: {
            user_id: userId,
            place_id: placeId
        },
        defaults: {
            user_id: userId,
            place_id: placeId
        }
    });
    return { favorite, created };
};

/**
 * Static method to remove favorite
 */
FavoritePlace.removeFavorite = async function (userId, placeId) {
    const deleted = await FavoritePlace.destroy({
        where: {
            user_id: userId,
            place_id: placeId
        }
    });
    return deleted > 0;
};

module.exports = FavoritePlace;

