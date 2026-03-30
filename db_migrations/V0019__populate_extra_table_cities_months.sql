UPDATE t_p56096254_dashboard_creation_p.extra_tables SET has_city_month = true WHERE id = 1;

UPDATE t_p56096254_dashboard_creation_p.extra_table_rows 
SET city = 'Барнаул', month = 'Январь', data = '{}'::jsonb 
WHERE id = 1;

INSERT INTO t_p56096254_dashboard_creation_p.extra_table_rows (extra_table_id, city, month, data)
SELECT 1, cities.city, months.month, '{}'::jsonb
FROM (VALUES ('Барнаул'), ('Калининград'), ('Кемерово'), ('Краснодар'), ('Красноярск'), ('Нижний Новгород'), ('Новокузнецк'), ('Новосибирск'), ('Омск'), ('Пермь'), ('Ростов'), ('Самара'), ('Санкт-Петербург'), ('Тольятти'), ('Улан-Удэ')) AS cities(city)
CROSS JOIN (VALUES ('Январь'), ('Февраль'), ('Март'), ('Апрель'), ('Май'), ('Июнь'), ('Июль'), ('Август'), ('Сентябрь'), ('Октябрь'), ('Ноябрь'), ('Декабрь')) AS months(month)
WHERE NOT (cities.city = 'Барнаул' AND months.month = 'Январь');