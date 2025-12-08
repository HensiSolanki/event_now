const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");

const PlaceImage = sequelize.define('PlaceImage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    place_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Place ID is required'
            }
        }
    },
    image_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Image path cannot be empty'
            }
        }
    },
    caption: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    is_primary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'place_images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

/**
 * Instance method to set as primary image
 */
PlaceImage.prototype.setAsPrimary = async function () {
    const { Op } = require('sequelize');
    
    // First, unset all other images for this place
    await PlaceImage.update(
        { is_primary: false },
        { 
            where: { 
                place_id: this.place_id,
                id: { [Op.ne]: this.id }
            } 
        }
    );
    
    // Set this image as primary
    this.is_primary = true;
    return await this.save();
};

/**
 * Static method to get images for a place
 */
PlaceImage.getPlaceImages = async function (placeId) {
    return await PlaceImage.findAll({
        where: { place_id: placeId },
        order: [['is_primary', 'DESC'], ['sort_order', 'ASC']]
    });
};

/**
 * Static method to get primary image for a place
 */
PlaceImage.getPrimaryImage = async function (placeId) {
    return await PlaceImage.findOne({
        where: { 
            place_id: placeId,
            is_primary: true 
        }
    });
};

/**
 * Static method to bulk create images
 */
PlaceImage.bulkCreateImages = async function (placeId, imagePaths, transaction = null) {
    const images = imagePaths.map((path, index) => ({
        place_id: placeId,
        image_path: path,
        is_primary: index === 0, // First image is primary by default
        sort_order: index
    }));
    
    return await PlaceImage.bulkCreate(images, { transaction });
};

module.exports = PlaceImage;

