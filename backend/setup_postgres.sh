#!/bin/bash
# PostgreSQL Database Setup Script for ICPAC Booking System

echo "🗄️ Setting up PostgreSQL for ICPAC Booking System..."
echo "=================================================="

# Database configuration
DB_NAME="icpac_booking_db"
DB_USER="icpac_user" 
DB_PASSWORD="icpac_password123"
DB_HOST="localhost"
DB_PORT="5432"

echo "📋 Database Details:"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "❌ PostgreSQL server is not running!"
    echo "Please start PostgreSQL service:"
    echo "   sudo systemctl start postgresql"
    echo "   sudo systemctl enable postgresql"
    exit 1
fi

echo "✅ PostgreSQL server is running"

# Function to run SQL as postgres user
run_sql() {
    sudo -u postgres psql -c "$1"
}

# Create database user
echo "👤 Creating database user: $DB_USER"
run_sql "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "   User might already exist"

# Create database
echo "🗄️ Creating database: $DB_NAME"
run_sql "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "   Database might already exist"

# Grant privileges
echo "🔐 Granting privileges to user"
run_sql "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
run_sql "ALTER USER $DB_USER CREATEDB;"  # Allow user to create test databases

echo ""
echo "✅ PostgreSQL setup completed!"
echo "=================================================="
echo "🔑 Database Credentials:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""
echo "📝 Connection URL:"
echo "   postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: python manage.py migrate"
echo "   2. Run: python create_superuser.py"
echo "   3. Start server: python manage.py runserver 8001"