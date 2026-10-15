export interface Product {
  id: number;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  category: string;
  description?: string | null;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_threshold: number;
  unit: string;
  is_active: boolean;
  is_low_stock: boolean;
  profit_margin: number;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  low_stock_count: number;
  categories: string[];
  total_stock_value: number;
}

export interface ProductCreateInput {
  name: string;
  sku?: string;
  barcode?: string;
  category: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_threshold: number;
  unit: string;
  is_active?: boolean;
}

export interface ProductUpdateInput {
  name?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  description?: string;
  purchase_price?: number;
  selling_price?: number;
  stock_quantity?: number;
  min_stock_threshold?: number;
  unit?: string;
  is_active?: boolean;
}

export interface SaleItem {
  id: number;
  product_id?: number | null;
  product_name: string;
  quantity: number;
  unit_purchase_price: number;
  unit_selling_price: number;
  subtotal: number;
  cost_subtotal: number;
  profit: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  total_cost: number;
  gross_profit: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method: string;
  notes?: string | null;
  created_at: string;
  items: SaleItem[];
}

export interface SaleListResponse {
  items: Sale[];
  total: number;
  today_sales_amount: number;
  today_transactions_count: number;
}

export interface SaleCreateItem {
  product_id: number;
  quantity: number;
}

export interface SaleCreateInput {
  items: SaleCreateItem[];
  discount_amount: number;
  customer_name?: string;
  customer_phone?: string;
  payment_method: string;
  notes?: string;
}

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  date: string;
  notes?: string | null;
  created_at: string;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  total_amount: number;
  count: number;
  percentage: number;
}

export interface ExpenseListResponse {
  items: Expense[];
  total: number;
  total_amount: number;
  today_expense_amount: number;
  categories: string[];
  category_breakdown: ExpenseCategoryBreakdown[];
}

export interface ExpenseCreateInput {
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  date?: string;
  notes?: string;
}

export interface ExpenseUpdateInput {
  title?: string;
  category?: string;
  amount?: number;
  payment_method?: string;
  date?: string;
  notes?: string;
}

export interface DailyTrend {
  date: string;
  sales: number;
  expenses: number;
  profit: number;
}

export interface DashboardSummary {
  today_sales: number;
  today_expenses: number;
  today_profit: number;
  today_transactions_count: number;
  total_products: number;
  low_stock_count: number;
  total_inventory_value: number;
  recent_sales: Sale[];
  low_stock_items: Product[];
  weekly_trend: DailyTrend[];
}

export interface ProductSalesStat {
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
  total_profit: number;
}

export interface PaymentMethodStat {
  method: string;
  count: number;
  total_amount: number;
  percentage: number;
}

export interface ExpenseCategoryStat {
  category: string;
  amount: number;
  percentage: number;
}

export interface DailyReportPoint {
  date: string;
  sales: number;
  expenses: number;
  cogs: number;
  gross_profit: number;
  net_profit: number;
}

export interface FinancialReportSummary {
  period_label: string;
  start_date: string;
  end_date: string;
  total_sales: number;
  total_cogs: number;
  gross_profit: number;
  total_expenses: number;
  net_profit: number;
  profit_margin_pct: number;
  total_orders: number;
  average_order_value: number;
  daily_chart: DailyReportPoint[];
  top_products: ProductSalesStat[];
  expenses_by_category: ExpenseCategoryStat[];
  sales_by_payment_method: PaymentMethodStat[];
}

export interface StoreSettings {
  id: number;
  store_name: string;
  owner_name: string;
  phone: string;
  address: string;
  city: string;
  currency: string;
  currency_symbol: string;
  default_low_stock_threshold: number;
  receipt_footer: string;
  created_at: string;
  updated_at: string;
}

export interface StoreSettingsUpdateInput {
  store_name?: string;
  owner_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  currency?: string;
  currency_symbol?: string;
  default_low_stock_threshold?: number;
  receipt_footer?: string;
}

export interface AIStatusResponse {
  is_available: boolean;
  ollama_url: string;
  model_name: string;
  status: string;
  message: string;
  phase: string;
}

export interface AIQueryResponse {
  answer: string;
  source: string;
  suggested_actions: string[];
  model: string;
}
