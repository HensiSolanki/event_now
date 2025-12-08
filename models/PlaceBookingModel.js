const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");

const PlaceBooking = sequelize.define('PlaceBooking', {
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
                msg: 'Place is required'
            }
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'User is required'
            }
        }
    },
    booking_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Booking date is required'
            },
            isDate: {
                msg: 'Must be a valid date'
            }
        }
    },
    booking_time: {
        type: DataTypes.TIME,
        allowNull: true
    },
    number_of_guests: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: {
                args: [1],
                msg: 'Number of guests must be at least 1'
            }
        }
    },
    full_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Full name is required'
            }
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Email is required'
            },
            isEmail: {
                msg: 'Must be a valid email address'
            }
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Phone number is required'
            }
        }
    },
    special_requests: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    booking_status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        allowNull: false,
        defaultValue: 'pending'
    },
    payment_status: {
        type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
        allowNull: false,
        defaultValue: 'unpaid'
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    booking_reference: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'place_bookings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: (booking) => {
            // Auto-generate booking reference if not provided
            if (!booking.booking_reference) {
                const timestamp = Date.now();
                const random = Math.floor(Math.random() * 10000);
                booking.booking_reference = `BK${timestamp}${random}`;
            }
        }
    }
});

/**
 * Instance method to confirm booking
 */
PlaceBooking.prototype.confirm = async function () {
    this.booking_status = 'confirmed';
    return await this.save();
};

/**
 * Instance method to cancel booking
 */
PlaceBooking.prototype.cancel = async function (reason = null) {
    this.booking_status = 'cancelled';
    this.cancelled_at = new Date();
    if (reason) {
        this.cancellation_reason = reason;
    }
    return await this.save();
};

/**
 * Instance method to complete booking
 */
PlaceBooking.prototype.complete = async function () {
    this.booking_status = 'completed';
    return await this.save();
};

/**
 * Instance method to mark as paid
 */
PlaceBooking.prototype.markAsPaid = async function (amount = null) {
    this.payment_status = 'paid';
    if (amount !== null) {
        this.total_amount = amount;
    }
    return await this.save();
};

/**
 * Static method to get user bookings
 */
PlaceBooking.getUserBookings = async function (userId, options = {}) {
    const { status, limit, offset } = options;
    const where = { user_id: userId };
    
    if (status) {
        where.booking_status = status;
    }
    
    return await PlaceBooking.findAll({
        where,
        order: [['booking_date', 'DESC'], ['created_at', 'DESC']],
        limit: limit || 20,
        offset: offset || 0
    });
};

/**
 * Static method to get place bookings
 */
PlaceBooking.getPlaceBookings = async function (placeId, options = {}) {
    const { status, date, limit, offset } = options;
    const where = { place_id: placeId };
    
    if (status) {
        where.booking_status = status;
    }
    
    if (date) {
        where.booking_date = date;
    }
    
    return await PlaceBooking.findAll({
        where,
        order: [['booking_date', 'ASC'], ['booking_time', 'ASC']],
        limit: limit || 50,
        offset: offset || 0
    });
};

/**
 * Static method to find booking by reference
 */
PlaceBooking.findByReference = async function (reference) {
    return await PlaceBooking.findOne({
        where: { booking_reference: reference }
    });
};

/**
 * Static method to get upcoming bookings
 */
PlaceBooking.getUpcomingBookings = async function (userId) {
    const { Op } = require('sequelize');
    return await PlaceBooking.findAll({
        where: {
            user_id: userId,
            booking_status: ['pending', 'confirmed'],
            booking_date: {
                [Op.gte]: new Date()
            }
        },
        order: [['booking_date', 'ASC'], ['booking_time', 'ASC']]
    });
};

/**
 * Static method to get booking statistics for a place
 */
PlaceBooking.getPlaceBookingStats = async function (placeId) {
    const { Op } = require('sequelize');
    const totalBookings = await PlaceBooking.count({
        where: { place_id: placeId }
    });
    
    const confirmedBookings = await PlaceBooking.count({
        where: { 
            place_id: placeId,
            booking_status: 'confirmed'
        }
    });
    
    const pendingBookings = await PlaceBooking.count({
        where: { 
            place_id: placeId,
            booking_status: 'pending'
        }
    });
    
    const completedBookings = await PlaceBooking.count({
        where: { 
            place_id: placeId,
            booking_status: 'completed'
        }
    });
    
    return {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        completed: completedBookings
    };
};

module.exports = PlaceBooking;

