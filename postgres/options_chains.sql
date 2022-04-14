CREATE SCHEMA exchange;

CREATE TYPE exchange.EXCHANGE AS ENUM ('binance', 'bitmex', 'coinbase', 'deribit', 'hitbtc', 'ftx', 'kucoin', 'huobi');
CREATE TYPE exchange.ASSET AS ENUM ('BTC', 'ETC');

CREATE TABLE exchange.options_chains(
             trade_at TIMESTAMP WITH TIME ZONE NOT NULL,
             exchange exchange.EXCHANGE NOT NULL,
             asset exchange.ASSET NOT NULL,
             symbol VARCHAR NOT NULL,
             strike_price INT NOT NULL,
             last_price DECIMAL NOT NULL,
             underlying_price DECIMAL NOT NULL,
             timestamp BIGINT NOT NULL,
             local_timestamp BIGINT NOT NULL,
             PRIMARY KEY(trade_at, symbol)) PARTITION BY RANGE (trade_at);

CREATE INDEX options_chains_brin_index
    ON exchange.options_chains
 USING BRIN (trade_at)
  WITH (pages_per_range = 32);

-- CREATE SCHEMA partman;
-- CREATE EXTENSION pg_partman WITH SCHEMA partman;
-- SELECT partman.create_parent('options_chains', 'trade_at', 'native', 'hourly', 60);
SELECT partman.create_parent( p_parent_table => 'exchange.options_chains',
 p_control => 'trade_at',
 p_type => 'native',
 p_interval=> 'hourly',
 p_premake => 60);

CREATE EXTENSION pg_cron;
UPDATE partman.part_config
SET infinite_time_partitions = true,
    retention = '6 months',
    retention_keep_table=true
WHERE parent_table = 'options_chains';
SELECT cron.schedule('@hourly', $$CALL partman.run_maintenance_proc()$$);
