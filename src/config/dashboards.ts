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

export const MANAGE_DASHBOARDS_URL = "https://functions.poehali.dev/fdef226b-b22c-4ef6-9a1e-746956272ec5";
