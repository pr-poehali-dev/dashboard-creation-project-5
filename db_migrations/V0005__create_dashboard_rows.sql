CREATE TABLE t_p56096254_dashboard_creation_p.dashboard_rows (
  id SERIAL PRIMARY KEY,
  dashboard_id INTEGER NOT NULL,
  city VARCHAR(100) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_dashboard_rows_dashboard_id ON t_p56096254_dashboard_creation_p.dashboard_rows(dashboard_id);