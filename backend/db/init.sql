-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS thesis_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if it doesn't exist
CREATE USER IF NOT EXISTS 'thesis_user'@'%' IDENTIFIED BY 'thesis_pass';

-- Grant privileges
GRANT ALL PRIVILEGES ON thesis_db.* TO 'thesis_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;