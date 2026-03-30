CREATE TABLE extra_tables (
  id SERIAL PRIMARY KEY,
  dashboard_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dashboard_id, slug)
);

CREATE TABLE extra_table_rows (
  id SERIAL PRIMARY KEY,
  extra_table_id INTEGER NOT NULL,
  city VARCHAR(100) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_extra_tables_dashboard_id ON extra_tables(dashboard_id);
CREATE INDEX idx_extra_table_rows_table_id ON extra_table_rows(extra_table_id);