
ALTER TABLE t_p56096254_dashboard_creation_p.terminations
ADD COLUMN month varchar(20) NOT NULL DEFAULT '';

UPDATE t_p56096254_dashboard_creation_p.terminations SET month = 'Январь';

INSERT INTO t_p56096254_dashboard_creation_p.terminations (city, month, deadline_violations, poor_quality_service, patient_no_contact, patient_died, reregistration, complaint, procedures_not_needed, financial_difficulties, refund_completed)
SELECT city, m.month, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM t_p56096254_dashboard_creation_p.terminations t
CROSS JOIN (VALUES ('Февраль'), ('Март'), ('Апрель'), ('Май'), ('Июнь'), ('Июль'), ('Август'), ('Сентябрь'), ('Октябрь'), ('Ноябрь'), ('Декабрь')) AS m(month)
WHERE t.month = 'Январь';

ALTER TABLE t_p56096254_dashboard_creation_p.below_price
ADD COLUMN month varchar(20) NOT NULL DEFAULT '';

UPDATE t_p56096254_dashboard_creation_p.below_price SET month = 'Январь';

INSERT INTO t_p56096254_dashboard_creation_p.below_price (city, month, barter, charity, vip, couldnt_sell, price_increase, cost_price, employee_discount, approved_coordinator, approved_management, negative_removal, promo)
SELECT city, m.month, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM t_p56096254_dashboard_creation_p.below_price t
CROSS JOIN (VALUES ('Февраль'), ('Март'), ('Апрель'), ('Май'), ('Июнь'), ('Июль'), ('Август'), ('Сентябрь'), ('Октябрь'), ('Ноябрь'), ('Декабрь')) AS m(month)
WHERE t.month = 'Январь';
