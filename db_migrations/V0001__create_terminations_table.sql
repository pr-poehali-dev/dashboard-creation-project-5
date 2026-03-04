CREATE TABLE terminations (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  deadline_violations INTEGER NOT NULL DEFAULT 0,
  poor_quality_service INTEGER NOT NULL DEFAULT 0,
  patient_no_contact INTEGER NOT NULL DEFAULT 0,
  patient_died INTEGER NOT NULL DEFAULT 0,
  reregistration INTEGER NOT NULL DEFAULT 0,
  complaint INTEGER NOT NULL DEFAULT 0,
  procedures_not_needed INTEGER NOT NULL DEFAULT 0,
  financial_difficulties INTEGER NOT NULL DEFAULT 0,
  refund_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO terminations (city) VALUES
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
