export interface ColumnDef {
  key: string;
  label: string;
}

export interface DashboardConfig {
  id: number;
  title: string;
  slug: string;
  api_url: string;
  columns: ColumnDef[];
}

export interface ExtraTableConfig {
  id: number;
  dashboard_id: number;
  title: string;
  slug: string;
  columns: ColumnDef[];
  has_city_month?: boolean;
}

export const MANAGE_DASHBOARDS_URL = "https://functions.poehali.dev/fdef226b-b22c-4ef6-9a1e-746956272ec5";
export const DASHBOARD_DATA_URL = "https://functions.poehali.dev/1c235369-17da-479b-a236-5fdf30d0f43b";
export const EXTRA_TABLES_URL = "https://functions.poehali.dev/4dfc7866-d991-41b8-9d2f-9d2de25329f1";