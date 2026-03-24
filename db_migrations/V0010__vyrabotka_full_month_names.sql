
UPDATE t_p56096254_dashboard_creation_p.dashboard_rows SET city = REPLACE(city, ' — янв', ' — Январь') WHERE dashboard_id = 6 AND city LIKE '% — янв';
UPDATE t_p56096254_dashboard_creation_p.dashboard_rows SET city = REPLACE(city, ' — фев', ' — Февраль') WHERE dashboard_id = 6 AND city LIKE '% — фев';
UPDATE t_p56096254_dashboard_creation_p.dashboard_rows SET city = REPLACE(city, ' — мар', ' — Март') WHERE dashboard_id = 6 AND city LIKE '% — мар';
