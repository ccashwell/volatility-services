-- CREATE ROLE r_example_ro NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;
-- GRANT USAGE ON SCHEMA example to r_example_ro;
-- GRANT SELECT ON ALL TABLES IN SCHEMA example to r_example_ro;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA example GRANT SELECT ON TABLES TO r_example_ro;
-- setup scripts which will only run when the postgres container is setup for the first time, re: no data
-- psql -U postgres -tc "SELECT 1 FROM methodology_indices WHERE datname = 'methodology_indices'" | grep -q 1 | psql -U postgres -c "CREATE DATABASE methodology_indices"

SELECT 'CREATE DATABASE methodology_indices_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'methodology_indices_test')\gexec
SELECT 'CREATE DATABASE methodology_indices_development'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'methodology_indices_development')\gexec
SELECT 'CREATE DATABASE ipfs_transactions_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ipfs_transactions_test')\gexec
SELECT 'CREATE DATABASE volatility_mfiv_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'volatility_mfiv_test')\gexec
SELECT 'CREATE DATABASE volatility_mfiv_development'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'volatility_mfiv_development')\gexec
SELECT 'CREATE DATABASE volatility_development'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'volatility_development')\gexec
SELECT 'CREATE DATABASE volatility_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'volatility_test')\gexec
SELECT 'CREATE DATABASE volatility_production'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'volatility_production')\gexec

-- volatility_mfiv_development
CREATE ROLE r_mfiv_ro NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;

GRANT USAGE ON SCHEMA methodology_indices TO r_mfiv_ro;
GRANT USAGE ON SCHEMA ipfs_transactions TO r_mfiv_ro;
GRANT USAGE ON SCHEMA fleek_transactions TO r_mfiv_ro;
GRANT USAGE ON SCHEMA volatility_mfiv TO r_mfiv_ro;

GRANT SELECT ON ALL TABLES IN SCHEMA methodology_indices TO r_mfiv_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA ipfs_transactions TO r_mfiv_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA fleek_transactions TO r_mfiv_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA volatility_mfiv TO r_mfiv_ro;

CREATE ROLE g_mfiv_ro NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;

GRANT r_mfiv_ro TO g_mfiv_ro;

CREATE ROLE mfiv_user WITH LOGIN;

ALTER ROLE mfiv_user WITH PASSWORD 'At5DHGHgG$dQlCwN6q1#e*5a';

ALTER ROLE mfiv_user VALID UNTIL 'infinity';

CREATE ROLE volatility WITH LOGIN;

ALTER ROLE volatility WITH PASSWORD 'At5DHGHgG$dQlCwN6q1#e*5a';

ALTER ROLE volatility VALID UNTIL 'infinity';

GRANT g_mfiv_ro TO mfiv_user;

GRANT g_mfiv_ro TO volatility;