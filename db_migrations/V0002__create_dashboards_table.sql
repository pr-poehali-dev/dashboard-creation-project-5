CREATE TABLE t_p56096254_dashboard_creation_p.dashboards (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  api_url TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p56096254_dashboard_creation_p.dashboards (title, slug, api_url, columns) VALUES
(
  'Причины расторжений',
  'terminations',
  'https://functions.poehali.dev/f8817ea5-4b71-410d-8ce1-257b80d75df0',
  '[
    {"key":"deadline_violations","label":"Нарушены сроки выполнения работы"},
    {"key":"poor_quality_service","label":"Некачественно оказанные услуги"},
    {"key":"patient_no_contact","label":"Пациент не выходит на связь"},
    {"key":"patient_died","label":"Пациент умер"},
    {"key":"reregistration","label":"Переоформление"},
    {"key":"complaint","label":"Претензия"},
    {"key":"procedures_not_needed","label":"Процедуры не понадобились"},
    {"key":"financial_difficulties","label":"Финансовые трудности"},
    {"key":"refund_completed","label":"Возврат за пройденные"}
  ]'
),
(
  'Причины стоимости ниже прайса',
  'below-price',
  'https://functions.poehali.dev/f8817ea5-4b71-410d-8ce1-257b80d75df0',
  '[
    {"key":"barter","label":"Бартер"},
    {"key":"charity","label":"Благотворительность"},
    {"key":"vip","label":"Вип"},
    {"key":"couldnt_sell","label":"Не смогли продать по цене прайса"},
    {"key":"price_increase","label":"Прайс до повышения"},
    {"key":"cost_price","label":"Себестоимость"},
    {"key":"employee_discount","label":"Скидка сотруднику"},
    {"key":"approved_coordinator","label":"Согласовано с координатором"},
    {"key":"approved_management","label":"Согласовано с руководством"},
    {"key":"negative_removal","label":"Устранение негатива"},
    {"key":"promo","label":"Акции/сертификат"}
  ]'
);
