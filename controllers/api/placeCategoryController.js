const PlaceCategory = require('../../models/PlaceCategoryModel');
const fs = require('fs');
const path = require('path');

/**
 * Place Category Controller
 * Handles all operations related to place categories
 */

const placeCategoryController = {
    /**
     * Get all categories (with optional filtering)
     * GET /api/place-categories
     */
    getAllCategories: async (req, res) => {
        try {
            const { active_only } = req.query;
            
            let categories;
            if (active_only === 'true') {
                categories = await PlaceCategory.getActiveCategories();
            } else {
                categories = await PlaceCategory.findAll({
                    order: [['sort_order', 'ASC'], ['name', 'ASC']]
                });
            }

            res.status(200).json({
                success: true,
                count: categories.length,
                data: categories
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching categories',
                error: error.message
            });
        }
    },

    /**
     * Get single category by ID
     * GET /api/place-categories/:id
     */
    getCategoryById: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await PlaceCategory.findByPk(id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            res.status(200).json({
                success: true,
                data: category
            });
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching category',
                error: error.message
            });
        }
    },

    /**
     * Create new category
     * POST /api/place-categories
     */
    createCategory: async (req, res) => {
        try {
            const { name, slug, description, color, is_active, sort_order } = req.body;

            // Validate required fields
            if (!name) {
                // Delete uploaded file if validation fails
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Category name is required'
                });
            }

            // Get icon path from uploaded file
            const icon = req.file ? `uploads/categories/${req.file.filename}` : null;

            const category = await PlaceCategory.create({
                name,
                slug: slug || undefined, // Will auto-generate from name if not provided
                description,
                icon,
                color,
                is_active: is_active !== undefined ? is_active : true,
                sort_order: sort_order || 0
            });

            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: category
            });
        } catch (error) {
            console.error('Error creating category:', error);
            
            // Delete uploaded file if error occurs
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            
            // Handle validation errors
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors.map(e => ({
                        field: e.path,
                        message: e.message
                    }))
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creating category',
                error: error.message
            });
        }
    },

    /**
     * Update category
     * PUT /api/place-categories/:id
     */
    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, slug, description, color, is_active, sort_order } = req.body;

            const category = await PlaceCategory.findByPk(id);

            if (!category) {
                // Delete uploaded file if category not found
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            // Store old icon path to delete if new one is uploaded
            const oldIcon = category.icon;

            // Update fields
            if (name !== undefined) category.name = name;
            if (slug !== undefined) category.slug = slug;
            if (description !== undefined) category.description = description;
            if (color !== undefined) category.color = color;
            if (is_active !== undefined) category.is_active = is_active;
            if (sort_order !== undefined) category.sort_order = sort_order;
            
            // Update icon if new file uploaded
            if (req.file) {
                category.icon = `uploads/categories/${req.file.filename}`;
                
                // Delete old icon file if it exists
                if (oldIcon) {
                    const oldIconPath = path.join('public', oldIcon);
                    if (fs.existsSync(oldIconPath)) {
                        fs.unlinkSync(oldIconPath);
                    }
                }
            }

            await category.save();

            res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                data: category
            });
        } catch (error) {
            console.error('Error updating category:', error);
            
            // Delete uploaded file if error occurs
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            
            // Handle validation errors
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors.map(e => ({
                        field: e.path,
                        message: e.message
                    }))
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error updating category',
                error: error.message
            });
        }
    },

    /**
     * Toggle category active status
     * PATCH /api/place-categories/:id/toggle
     */
    toggleCategoryStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await PlaceCategory.findByPk(id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            await category.toggleActive();

            res.status(200).json({
                success: true,
                message: `Category ${category.is_active ? 'activated' : 'deactivated'} successfully`,
                data: category
            });
        } catch (error) {
            console.error('Error toggling category status:', error);
            res.status(500).json({
                success: false,
                message: 'Error toggling category status',
                error: error.message
            });
        }
    },

    /**
     * Delete category
     * DELETE /api/place-categories/:id
     */
    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await PlaceCategory.findByPk(id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            // Delete icon file if it exists
            if (category.icon) {
                const iconPath = path.join('public', category.icon);
                if (fs.existsSync(iconPath)) {
                    fs.unlinkSync(iconPath);
                }
            }

            await category.destroy();

            res.status(200).json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting category',
                error: error.message
            });
        }
    }
};

module.exports = placeCategoryController;

