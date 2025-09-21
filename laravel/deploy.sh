#!/bin/bash

# Laravel Deployment Script for Production
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# 1. Install/Update Dependencies
echo "📦 Installing dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# 2. Clear and cache configurations
echo "⚙️ Optimizing configuration..."
php artisan config:clear
php artisan config:cache

# 3. Clear and cache routes
echo "🛣️ Optimizing routes..."
php artisan route:clear
php artisan route:cache

# 4. Clear and cache views
echo "👁️ Optimizing views..."
php artisan view:clear
php artisan view:cache

# 5. Run database migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# 6. Clear application cache
echo "🧹 Clearing application cache..."
php artisan cache:clear

# 7. Optimize autoloader
echo "🔧 Optimizing autoloader..."
composer dump-autoload --optimize

# 8. Set proper permissions
echo "🔒 Setting file permissions..."
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs

# 9. Create symbolic link for storage (if needed)
if [ ! -L public/storage ]; then
    echo "🔗 Creating storage symlink..."
    php artisan storage:link
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Your Laravel app is ready for $ENVIRONMENT"

# Optional: Restart services (uncomment if needed)
# echo "🔄 Restarting services..."
# sudo systemctl restart nginx
# sudo systemctl restart php8.2-fpm
