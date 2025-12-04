-- Create database
CREATE DATABASE IF NOT EXISTS event_now CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE event_now;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    passwordResetToken VARCHAR(255) DEFAULT NULL,
    passwordResetExpires DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_reset_token (passwordResetToken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create place_categories table
CREATE TABLE IF NOT EXISTS place_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Category name (e.g., Sports, Clubs, Live Bands, DJ)',
    slug VARCHAR(100) NOT NULL UNIQUE COMMENT 'URL-friendly version of the name',
    description TEXT COMMENT 'Description of the place category',
    icon VARCHAR(255) COMMENT 'Icon or image path for the category',
    color VARCHAR(7) DEFAULT '#000000' COMMENT 'Hex color code for category display',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether the category is active/visible',
    sort_order INT NOT NULL DEFAULT 0 COMMENT 'Display order of categories',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_place_categories_slug (slug),
    INDEX idx_place_categories_is_active (is_active),
    INDEX idx_place_categories_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

