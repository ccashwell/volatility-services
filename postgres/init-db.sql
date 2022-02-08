-- Create databases for all environments
SELECT 'CREATE DATABASE volatility_development'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'volatility_development')\gexec
SELECT 'CREATE DATABASE volatility_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'volatility_test')\gexec
SELECT 'CREATE DATABASE volatility_production'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'volatility_production')\gexec
