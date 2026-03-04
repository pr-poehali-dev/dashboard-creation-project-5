CREATE TABLE t_p56096254_dashboard_creation_p.below_price (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  barter INTEGER NOT NULL DEFAULT 0,
  charity INTEGER NOT NULL DEFAULT 0,
  vip INTEGER NOT NULL DEFAULT 0,
  couldnt_sell INTEGER NOT NULL DEFAULT 0,
  price_increase INTEGER NOT NULL DEFAULT 0,
  cost_price INTEGER NOT NULL DEFAULT 0,
  employee_discount INTEGER NOT NULL DEFAULT 0,
  approved_coordinator INTEGER NOT NULL DEFAULT 0,
  approved_management INTEGER NOT NULL DEFAULT 0,
  negative_removal INTEGER NOT NULL DEFAULT 0,
  promo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p56096254_dashboard_creation_p.below_price (city) VALUES
  ('Барнаул'),
  ('Калининград'),
  ('Кемерово'),
  ('Краснодар'),
  ('Красноярск'),
  ('Нижний Новгород'),
  ('Новокузнецк'),
  ('Новосибирск'),
  ('Омск'),
  ('Пермь'),
  ('Ростов'),
  ('Самара'),
  ('Санкт-Петербург'),
  ('Тольятти'),
  ('Улан-Удэ');