import { useTheme } from "@/context/ThemeContext";
import type { ColumnDef } from "@/config/dashboards";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import DashboardKpiCards from "@/components/dashboard/DashboardKpiCards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardAnalytics, { AnomaliesBlock, ConcentrationBlock } from "@/components/dashboard/DashboardAnalytics";
import DashboardDataTable from "@/components/dashboard/DashboardDataTable";
import DashboardEfficiency from "@/components/dashboard/DashboardEfficiency";
import DashboardReasonsTrend from "@/components/dashboard/DashboardReasonsTrend";
import useDashboardData, { PIE_COLORS } from "@/hooks/useDashboardData";
import useDashboardKpi from "@/hooks/useDashboardKpi";
import useDashboardActions from "@/hooks/useDashboardActions";

interface Props {
  apiUrl: string;
  columns: ColumnDef[];
  title: string;
  dashboardId?: number;
  readonly?: boolean;
}

export default function DashboardView({ apiUrl, columns, title, dashboardId, readonly = false }: Props) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const axisColor = isLight ? "rgba(20,10,40,0.4)" : "rgba(255,255,255,0.35)";
  const gradId = `gradViolet-${apiUrl.slice(-8)}`;

  const data = useDashboardData(apiUrl, columns, dashboardId);

  const { saving, saved, dirty, handleChange, handleSave } = useDashboardActions(
    data.allRows, data.setAllRows, data.fetchUrl, data.isUniversalApi,
  );

  const kpiKey = `${data.selectedCity || "all"}-${data.selectedMonth || "all"}`;

  const kpiCards = useDashboardKpi({
    selectedCity: data.selectedCity,
    selectedMonth: data.selectedMonth,
    title,
    grandTotal: data.grandTotal,
    monthOverMonth: data.monthOverMonth,
    aggregatedByCityRows: data.aggregatedByCityRows,
    rowTotal: data.rowTotal,
    top1: data.top1,
    top2: data.top2,
    top1Trend: data.top1Trend,
    top2Trend: data.top2Trend,
    cityRank: data.cityRank,
    totalCities: data.totalCities,
    cities: data.cities,
    cityShare: data.cityShare,
    allRowsTotal: data.allRowsTotal,
  });

  return (
    <div className="space-y-4">
      {data.hasMonths && (
        <DashboardFilters
          cities={data.cities}
          allMonths={data.allMonths}
          selectedCity={data.selectedCity}
          selectedMonth={data.selectedMonth}
          onCityChange={data.setSelectedCity}
          onMonthChange={data.setSelectedMonth}
        />
      )}

      <DashboardKpiCards cards={kpiCards} loading={data.loading} kpiKey={kpiKey} />

      <DashboardEfficiency
        selectedCity={data.selectedCity}
        loading={data.loading}
        columns={columns}
        aggregatedByCityRows={data.allCitiesAggregated2}
        rowTotal={data.rowTotal}
        grandTotal={data.allCitiesGrandTotal}
        isLight={isLight}
      />

      <ConcentrationBlock
        top3Reasons={data.top3Reasons}
        concentrationPct={data.concentrationPct}
        grandTotal={data.grandTotal}
        loading={data.loading}
        isLight={isLight}
      />

      <DashboardCharts
        selectedCity={data.selectedCity}
        selectedMonth={data.selectedMonth}
        hasMonths={data.hasMonths}
        loading={data.loading}
        isLight={isLight}
        axisColor={axisColor}
        gradId={gradId}
        columns={columns}
        aggregatedByMonthRows={data.aggregatedByMonthRows}
        cityBarData={data.cityBarData}
        colTotals={data.colTotals}
        sorted={data.sorted}
        grandTotal={data.grandTotal}
        monthlyTrendData={data.monthlyTrendData}
        reasonsByMonth={data.reasonsByMonth}
        aggregatedByCityRows={data.aggregatedByCityRows}
        rowTotal={data.rowTotal}
        showAllCities={data.showAllCities}
        onShowAllCitiesToggle={() => data.setShowAllCities(v => !v)}
        PIE_COLORS={PIE_COLORS}
        anomaliesSlot={<AnomaliesBlock anomalies={data.anomalies} isLight={isLight} selectedCity={data.selectedCity} />}
      />

      <DashboardAnalytics
        anomalies={data.anomalies}
        top3Reasons={data.top3Reasons}
        concentrationPct={data.concentrationPct}
        grandTotal={data.grandTotal}
        loading={data.loading}
        isLight={isLight}
        axisColor={axisColor}
        selectedCity={data.selectedCity}
        selectedMonth={data.selectedMonth}
        cityProfileData={data.cityProfileData}
      />

      <DashboardReasonsTrend
        selectedCity={data.selectedCity}
        selectedMonth={data.selectedMonth}
        hasMonths={data.hasMonths}
        columns={columns}
        reasonsByMonth={data.reasonsByMonth}
        PIE_COLORS={PIE_COLORS}
      />

      <DashboardDataTable
        title={title}
        selectedCity={data.selectedCity}
        selectedMonth={data.selectedMonth}
        hasMonths={data.hasMonths}
        readonly={readonly}
        loading={data.loading}
        saving={saving}
        saved={saved}
        dirty={dirty}
        columns={columns}
        filteredRows={data.filteredRows}
        aggregatedByCityRows={data.aggregatedByCityRows}
        rowTotal={data.rowTotal}
        colTotal={data.colTotal}
        grandTotal={data.grandTotal}
        onSave={handleSave}
        onChange={handleChange}
      />
    </div>
  );
}
