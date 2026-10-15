import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Sparkles,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { DashboardSummary, Product } from '../services/types';
import { formatPKR, formatDate, formatShortDate } from '../utils/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
  onOpenNewSale: () => void;
  onOpenAddProduct: () => void;
  onOpenExpense: () => void;
  onSelectProductForRestock: (product: Product) => void;
  onOpenAIAssistant: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenNewSale,
  onOpenAddProduct,
  onOpenExpense,
  onSelectProductForRestock,
  onOpenAIAssistant,
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <p className="text-sm text-slate-500">Loading store analytics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 my-8 max-w-lg mx-auto">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 mb-1">Could not connect to DukaanAI Backend</h3>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <Button variant="primary" size="sm" onClick={loadDashboard}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Today's Overview</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Store
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sales, inventory alerts, and expense calculations for your store.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            leftIcon={<RefreshCw className="h-3.5 w-3.5 text-slate-500" />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExpense}
            leftIcon={<Plus className="h-3.5 w-3.5 text-slate-600" />}
          >
            Expense
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAddProduct}
            leftIcon={<Plus className="h-3.5 w-3.5 text-slate-600" />}
          >
            Product
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewSale}
            leftIcon={<ShoppingBag className="h-3.5 w-3.5" />}
          >
            Point of Sale
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatPKR(data?.today_sales || 0)}
          subtitle={`${data?.today_transactions_count || 0} counter transactions`}
          icon={<TrendingUp className="h-5 w-5" />}
          colorScheme="teal"
          trend={{ value: `${data?.today_transactions_count || 0} orders`, isPositive: true }}
        />

        <StatCard
          title="Today's Expenses"
          value={formatPKR(data?.today_expenses || 0)}
          subtitle="Operating & shop costs"
          icon={<TrendingDown className="h-5 w-5" />}
          colorScheme="rose"
          trend={{ value: 'Daily expenses', isNeutral: true }}
        />

        <StatCard
          title="Estimated Net Profit"
          value={formatPKR(data?.today_profit || 0)}
          subtitle="Sales margin minus expenses"
          icon={<Wallet className="h-5 w-5" />}
          colorScheme={((data?.today_profit || 0) >= 0) ? 'emerald' : 'rose'}
          trend={{
            value: (data?.today_profit || 0) >= 0 ? 'Profitable' : 'Deficit today',
            isPositive: (data?.today_profit || 0) >= 0,
          }}
        />

        <StatCard
          title="Low Stock Alerts"
          value={data?.low_stock_count || 0}
          subtitle={`Out of ${data?.total_products || 0} total catalog items`}
          icon={<AlertTriangle className="h-5 w-5" />}
          colorScheme={(data?.low_stock_count || 0) > 0 ? 'amber' : 'emerald'}
          trend={{
            value: (data?.low_stock_count || 0) > 0 ? 'Attention Needed' : 'Inventory Healthy',
            isPositive: (data?.low_stock_count || 0) === 0,
          }}
        />
      </div>

      {/* Middle Row: Trend Chart & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Expenses Chart (2 cols) */}
        <Card
          className="lg:col-span-2"
          title="Revenue & Expense Trend (Last 7 Days)"
          subtitle="Daily sales performance compared to operating costs in PKR"
          action={
            <Button variant="ghost" size="sm" onClick={() => onNavigate('reports')}>
              Full Reports <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          }
        >
          <div className="h-72 w-full pt-2">
            {data?.weekly_trend && data.weekly_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.weekly_trend}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00A896" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00A896" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    stroke="#94A3B8"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatPKR(Number(val)), '']}
                    labelFormatter={(label: any) => formatShortDate(String(label))}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales (PKR)"
                    stroke="#00A896"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses (PKR)"
                    stroke="#E11D48"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No weekly trend data available yet
              </div>
            )}
          </div>
        </Card>

        {/* Low Stock Urgent Items (1 col) */}
        <Card
          title="Low Stock Watchlist"
          subtitle="Items near or below safety threshold"
          action={
            <Button variant="ghost" size="sm" onClick={() => onNavigate('inventory')}>
              View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          }
        >
          <div className="space-y-3">
            {data?.low_stock_items && data.low_stock_items.length > 0 ? (
              data.low_stock_items.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-xl border border-amber-200/60 bg-amber-50/40 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{prod.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Threshold: {prod.min_stock_threshold} {prod.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {prod.stock_quantity} left
                    </span>
                    <button
                      onClick={() => onSelectProductForRestock(prod)}
                      className="text-xs font-medium text-teal-700 hover:text-teal-900 bg-white border border-teal-200 px-2 py-1 rounded hover:bg-teal-50 transition-colors"
                    >
                      + Restock
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Package className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-xs font-medium text-slate-700">All stock levels healthy!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No items currently below minimum threshold.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Recent Sales Transactions */}
      <Card
        title="Recent Counter Transactions"
        subtitle="Latest customer purchases and receipts recorded"
        action={
          <Button variant="ghost" size="sm" onClick={() => onNavigate('sales')}>
            Sales Register <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Invoice</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-center">Items</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">Profit</th>
                <th className="py-2.5 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recent_sales && data.recent_sales.length > 0 ? (
                data.recent_sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {sale.invoice_number}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {sale.customer_name || 'Walk-in Customer'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          sale.payment_method === 'Cash'
                            ? 'neutral'
                            : sale.payment_method === 'JazzCash' || sale.payment_method === 'EasyPaisa'
                            ? 'primary'
                            : 'info'
                        }
                        size="sm"
                      >
                        {sale.payment_method}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {sale.items.length} items
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatPKR(sale.net_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                      +{formatPKR(sale.gross_profit)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {formatDate(sale.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions recorded today yet. Click "Point of Sale" to make your first sale!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
