
INSERT INTO t_p56096254_dashboard_creation_p.extra_tables (dashboard_id, title, slug, columns, has_city_month)
VALUES (
  2,
  'Детализация',
  'below-price-detail',
  '[{"key":"col_patient","label":"Пациент"},{"key":"col_plan","label":"План лечения"},{"key":"col_nomenclature","label":"Номенклатура"},{"key":"col_price","label":"Цена"},{"key":"col_discount","label":"Процент снижения"}]'::jsonb,
  true
);

INSERT INTO t_p56096254_dashboard_creation_p.extra_table_rows (extra_table_id, city, month, data)
SELECT
  (SELECT id FROM t_p56096254_dashboard_creation_p.extra_tables WHERE slug = 'below-price-detail'),
  c.city,
  m.month,
  '{}'::jsonb
FROM
  (VALUES ('Барнаул'),('Калининград'),('Кемерово'),('Краснодар'),('Красноярск'),('Нижний Новгород'),('Новокузнецк'),('Новосибирск'),('Омск'),('Пермь'),('Ростов'),('Самара'),('Санкт-Петербург'),('Тольятти'),('Улан-Удэ')) AS c(city),
  (VALUES ('Январь'),('Февраль'),('Март'),('Апрель'),('Май'),('Июнь'),('Июль'),('Август'),('Сентябрь'),('Октябрь'),('Ноябрь'),('Декабрь')) AS m(month);
