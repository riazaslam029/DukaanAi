import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  ShoppingBag,
  CreditCard,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { api } from '../services/api';
import { FinancialReportSummary } from '../services/types';
import { formatPKR, formatPercent, formatShortDate } from '../utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'last_30_days', label: 'Last 30 Days' },
  { id: 'this_month', label: 'This Month' },
];

const PIE_COLORS = ['#00A896', '#028090', '#1C2541', '#E11D48', '#F59E0B', '#64748B', '#8B5CF6'];

export const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('last_7_days');
  const [report, setReport] = useState<FinancialReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReportsSummary({ period: selectedPeriod });
      setReport(data);
    } catch (err: any) {
      console.error('Failed to load financial report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedPeriod]);

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Reports & P&L</h1>
          <p className="text-xs text-slate-500 mt-1">
            Financial analytics, gross margins, operating expenses, and exportable statements for tax & audit.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedPeriod === p.id
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* CSV Export Bar */}
      <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-teal-700" />
          <span className="text-xs font-semibold text-teal-900">Download Data Reports (CSV Format):</span>
          <span className="text-xs text-teal-700">Period: {report?.period_label || selectedPeriod}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={api.getExportSalesUrl()}
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-800 font-semibold hover:bg-teal-50 transition-colors shadow-sm"
          >
            Sales CSV
          </a>
          <a
            href={api.getExportExpensesUrl()}
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-800 font-semibold hover:bg-teal-50 transition-colors shadow-sm"
          >
            Expenses CSV
          </a>
          <a
            href={api.getExportInventoryUrl()}
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-800 font-semibold hover:bg-teal-50 transition-colors shadow-sm"
          >
            Inventory Valuation CSV
          </a>
        </div>
      </div>

      {/* Key Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Recorded Sales"
          value={formatPKR(report?.total_sales || 0)}
          subtitle={`${report?.total_orders || 0} customer orders`}
          icon={<TrendingUp className="h-5 w-5" />}
          colorScheme="teal"
        />

        <StatCard
          title="Cost of Goods (COGS)"
          value={formatPKR(report?.total_cogs || 0)}
          subtitle="Inventory wholesale purchase cost"
          icon={<Layers className="h-5 w-5" />}
          colorScheme="navy"
        />

        <StatCard
          title="Operating Expenses"
          value={formatPKR(report?.total_expenses || 0)}
          subtitle="Rent, electricity, wages, carriage"
          icon={<DollarSign className="h-5 w-5" />}
          colorScheme="rose"
        />

        <StatCard
          title="Net Business Profit"
          value={formatPKR(report?.net_profit || 0)}
          subtitle={`Margin: ${formatPercent(report?.profit_margin_pct || 0)}`}
          icon={<ShoppingBag className="h-5 w-5" />}
          colorScheme={(report?.net_profit || 0) >= 0 ? 'emerald' : 'rose'}
          trend={{
            value: (report?.net_profit || 0) >= 0 ? 'Net Positive' : 'Deficit Period',
            isPositive: (report?.net_profit || 0) >= 0,
          }}
        />
      </div>

      {/* Chart 1: Daily Sales vs Expenses Breakdown */}
      <Card
        title={`Daily Revenue, Expenses & Net Profit — ${report?.period_label || ''}`}
        subtitle="Daily comparison calculated directly from recorded sales and operational expense ledger"
      >
        <div className="h-80 w-full pt-4">
          {report?.daily_chart && report.daily_chart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.daily_chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val: any) => [formatPKR(Number(val)), '']}
                  labelFormatter={(lbl: any) => formatShortDate(String(lbl))}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="sales" name="Sales (PKR)" fill="#00A896" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses (PKR)" fill="#E11D48" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_profit" name="Net Profit (PKR)" fill="#1C2541" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No financial chart points available for this period.
            </div>
          )}
        </div>
      </Card>

      {/* Middle Row: Top Products & Expenses Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products Table */}
        <Card
          title="Top Selling Products"
          subtitle="Highest grossing items during selected period"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report?.top_products && report.top_products.length > 0 ? (
                  report.top_products.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.product_name}</td>
                      <td className="py-2.5 px-3 text-center text-slate-700">{item.quantity_sold}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatPKR(item.total_revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                        +{formatPKR(item.total_profit)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No product sales recorded in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Expenses by Category Donut Chart */}
        <Card
          title="Expense Breakdown by Head"
          subtitle="Proportion of spending across categories"
        >
          <div className="h-64 w-full flex items-center justify-center">
            {report?.expenses_by_category && report.expenses_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.expenses_by_category}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {report.expenses_by_category.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatPKR(Number(val)), '']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No expense records in this period.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <Card
        title="Sales by Payment Method"
        subtitle="How customers are paying (Cash, JazzCash, EasyPaisa, Bank, Udhaar)"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          {report?.sales_by_payment_method && report.sales_by_payment_method.length > 0 ? (
            report.sales_by_payment_method.map((pm, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-xs font-semibold text-slate-600 uppercase">{pm.method}</span>
                <p className="text-lg font-bold text-slate-900">{formatPKR(pm.total_amount)}</p>
                <p className="text-[11px] text-slate-500">
                  {pm.count} transactions ({pm.percentage}%)
                </p>
              </div>
            ))
          ) : (
            <p className="col-span-full py-4 text-center text-xs text-slate-400">
              No sales data for payment methods.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
