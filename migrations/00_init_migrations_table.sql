-- Initialize migration tracking table (run this first!)
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  execution_time_ms INT,
  status TEXT DEFAULT 'success'
);

-- Index for querying recent migrations
CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON schema_migrations(executed_at DESC);

-- Grant permissions if needed (optional for Neon)
-- GRANT SELECT, INSERT ON schema_migrations TO public;
