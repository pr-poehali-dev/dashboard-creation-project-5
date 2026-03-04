export interface ColumnDef {
  key: string;
  label: string;
}

export interface DashboardConfig {
  id: string;
  title: string;
  path: string;
  apiUrl: string;
  columns: ColumnDef[];
}

export const CITIES = [
  "Барнаул",
  "Калининград",
  "Кемерово",
  "Краснодар",
  "Красноярск",
  "Нижний Новгород",
  "Новокузнецк",
  "Новосибирск",
  "Омск",
  "Пермь",
  "Ростов",
  "Самара",
  "Санкт-Петербург",
  "Тольятти",
  "Улан-Удэ",
];

export const DASHBOARDS: DashboardConfig[] = [
  {
    id: "terminations",
    title: "Причины расторжений",
    path: "/terminations",
    apiUrl: "https://functions.poehali.dev/f8817ea5-4b71-410d-8ce1-257b80d75df0",
    columns: [
      { key: "deadline_violations", label: "Нарушены сроки выполнения работы" },
      { key: "poor_quality_service", label: "Некачественно оказанные услуги" },
      { key: "patient_no_contact", label: "Пациент не выходит на связь" },
      { key: "patient_died", label: "Пациент умер" },
      { key: "reregistration", label: "Переоформление" },
      { key: "complaint", label: "Претензия" },
      { key: "procedures_not_needed", label: "Процедуры не понадобились" },
      { key: "financial_difficulties", label: "Финансовые трудности" },
      { key: "refund_completed", label: "Возврат за пройденные" },
    ],
  },
  {
    id: "below_price",
    title: "Причины стоимости ниже прайса",
    path: "/below-price",
    apiUrl: "https://functions.poehali.dev/f8817ea5-4b71-410d-8ce1-257b80d75df0",
    columns: [
      { key: "barter", label: "Бартер" },
      { key: "charity", label: "Благотворительность" },
      { key: "vip", label: "Вип" },
      { key: "couldnt_sell", label: "Не смогли продать по цене прайса" },
      { key: "price_increase", label: "Прайс до повышения" },
      { key: "cost_price", label: "Себестоимость" },
      { key: "employee_discount", label: "Скидка сотруднику" },
      { key: "approved_coordinator", label: "Согласовано с координатором" },
      { key: "approved_management", label: "Согласовано с руководством" },
      { key: "negative_removal", label: "Устранение негатива" },
      { key: "promo", label: "Акции/сертификат" },
    ],
  },
  // Добавляй новые дашборды здесь по образцу выше
];
