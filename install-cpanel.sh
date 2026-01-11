#!/bin/bash

# Batch Installation Script for cPanel
# This script installs npm packages in small batches to avoid EAGAIN errors

echo "=========================================="
echo "cPanel-Optimized NPM Installation Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect Node.js environment in cPanel
# cPanel uses nodevenv directory structure
if [ -d "$HOME/nodevenv" ]; then
    # Find the nodevenv path for current directory
    CURRENT_DIR=$(pwd)
    # Extract the relative path from public_html
    RELATIVE_PATH=${CURRENT_DIR#$HOME/public_html/}
    
    # Try to find Node.js version directory (usually named with version number like 18, 20, etc.)
    for VERSION in 20 18 16 14; do
        NODE_ENV_PATH="$HOME/nodevenv/public_html/$RELATIVE_PATH/$VERSION"
        if [ -d "$NODE_ENV_PATH" ]; then
            echo -e "${GREEN}Found Node.js environment: $NODE_ENV_PATH${NC}"
            
            # Source the Node.js environment
            source "$NODE_ENV_PATH/bin/activate"
            
            # Set paths
            export PATH="$NODE_ENV_PATH/bin:$PATH"
            export npm="$NODE_ENV_PATH/bin/npm"
            export node="$NODE_ENV_PATH/bin/node"
            
            echo "Node version: $($node --version)"
            echo "NPM version: $($npm --version)"
            echo ""
            break
        fi
    done
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm command not found!${NC}"
    echo ""
    echo "Please make sure:"
    echo "1. Node.js is set up in cPanel's Node.js Selector"
    echo "2. You are in the correct application directory"
    echo "3. Run this from the application root directory"
    echo ""
    echo "Or manually set the Node.js environment:"
    echo "  source \$HOME/nodevenv/public_html/YOUR_APP_PATH/VERSION/bin/activate"
    echo ""
    exit 1
fi

# Function to install packages with retry logic
install_batch() {
    local batch_name=$1
    shift
    local packages=("$@")
    
    echo -e "${YELLOW}Installing batch: ${batch_name}${NC}"
    echo "Packages: ${packages[*]}"
    
    # Try up to 3 times
    for attempt in 1 2 3; do
        if [ $attempt -gt 1 ]; then
            echo -e "${YELLOW}Retry attempt ${attempt}/3${NC}"
            sleep 5
        fi
        
        if npm install --prefer-offline --no-audit --no-fund "${packages[@]}"; then
            echo -e "${GREEN}✓ Successfully installed ${batch_name}${NC}"
            echo ""
            return 0
        fi
    done
    
    echo -e "${RED}✗ Failed to install ${batch_name} after 3 attempts${NC}"
    echo ""
    return 1
}

# Clear npm cache first
echo "Cleaning npm cache..."
npm cache clean --force
echo ""

# Batch 1: Core Express and Database
install_batch "Core Express & Database" \
    express@4.18.2 \
    sequelize@^6.37.7 \
    mysql2@^3.6.5 \
    dotenv@16.0.3

# Batch 2: Authentication & Security
install_batch "Authentication & Security" \
    bcryptjs@2.4.3 \
    passport@0.6.0 \
    passport-local@1.0.0 \
    jsonwebtoken@9.0.0 \
    validator@13.9.0

# Batch 3: Middleware & Parsers
install_batch "Middleware & Parsers" \
    body-parser@1.20.2 \
    cookie-parser@1.4.6 \
    express-session@1.17.3 \
    connect-flash@0.1.1

# Batch 4: File Handling
install_batch "File Handling" \
    multer@1.4.5-lts.1 \
    express-fileupload@1.4.0 \
    fs@0.0.1-security \
    fs-extra@11.1.1 \
    path@0.12.7

# Batch 5: Template Engine
install_batch "Template Engine" \
    ejs@^3.1.9 \
    express-ejs-layouts@2.5.1

# Batch 6: Email & Scheduling
install_batch "Email & Scheduling" \
    nodemailer@^6.9.9 \
    node-cron@^3.0.3 \
    node-localstorage@2.2.1

# Batch 7: Frontend Libraries
install_batch "Frontend Libraries" \
    apexcharts@^3.45.0 \
    echarts@^5.4.3 \
    bootstrap@^5.3.2 \
    jquery@^3.6.3 \
    simplebar@^6.2.5

# Batch 8: Build Tools - Gulp Core
install_batch "Gulp Core" \
    gulp@^4.0.2 \
    merge-stream@^2.0.0

# Batch 9: Build Tools - Babel
install_batch "Babel" \
    @babel/core@^7.14.3 \
    @babel/preset-env@^7.14.2 \
    gulp-babel@^8.0.0

# Batch 10: Build Tools - SASS/CSS
install_batch "SASS & CSS Tools" \
    sass@1.63.6 \
    gulp-sass@^5.1.0 \
    rtlcss@^4.1.1 \
    gulp-rtlcss@^2.0.0

# Batch 11: Build Tools - CSS Processing
install_batch "CSS Processing" \
    gulp-autoprefixer@^7.0.1 \
    gulp-clean-css@^4.3.0 \
    gulp-cssbeautify@^3.0.0 \
    gulp-cssmin@^0.2.0 \
    css-loader@^6.8.1 \
    mini-css-extract-plugin@^2.7.6 \
    sass-loader@^13.3.2

# Batch 12: Build Tools - JS Processing
install_batch "JavaScript Processing" \
    gulp-uglify@^3.0.2 \
    gulp-minify@^3.1.0 \
    gulp-sourcemaps@^3.0.0

# Batch 13: Build Tools - HTML Processing
install_batch "HTML Processing" \
    gulp-file-include@^2.3.0 \
    gulp-htmlmin@^5.0.1 \
    gulp-inject@^5.0.5

# Batch 14: Build Tools - Utilities
install_batch "Build Utilities" \
    gulp-rename@^2.0.0 \
    gulp-rev@^9.0.0 \
    gulp-install@^1.1.0 \
    gulp-smushit@^1.2.0 \
    del@6.1.0

# Batch 15: Development Tools
install_batch "Development Tools" \
    nodemon@^3.0.2 \
    browser-sync@^2.23.7

echo "=========================================="
echo -e "${GREEN}Installation Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify installation: npm list --depth=0"
echo "2. Start your application: npm start"
echo ""

