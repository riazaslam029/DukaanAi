import {
  Product,
  ProductListResponse,
  ProductCreateInput,
  ProductUpdateInput,
  Sale,
  SaleListResponse,
  SaleCreateInput,
  Expense,
  ExpenseListResponse,
  ExpenseCreateInput,
  ExpenseUpdateInput,
  DashboardSummary,
  FinancialReportSummary,
  StoreSettings,
  StoreSettingsUpdateInput,
  AIStatusResponse,
  AIQueryResponse,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // fallback
      }
      throw new Error(errorMessage);
    }
    return (await response.json()) as T;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/api/dashboard/summary'),

  // Products & Inventory
  getProducts: (params?: { search?: string; category?: string; low_stock_only?: boolean; skip?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.low_stock_only) query.append('low_stock_only', 'true');
    if (params?.skip !== undefined) query.append('skip', String(params.skip));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    const qs = query.toString();
    return request<ProductListResponse>(`/api/products${qs ? `?${qs}` : ''}`);
  },

  getProduct: (id: number) => request<Product>(`/api/products/${id}`),

  createProduct: (data: ProductCreateInput) =>
    request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: number, data: ProductUpdateInput) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: number) =>
    request<{ message: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),

  adjustStock: (id: number, adjustment: number, reason: string = 'Manual Adjustment') =>
    request<Product>(`/api/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ product_id: id, adjustment, reason }),
    }),

  // Sales & Checkout
  getSales: (params?: { start_date?: string; end_date?: string; payment_method?: string; skip?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.payment_method) query.append('payment_method', params.payment_method);
    if (params?.skip !== undefined) query.append('skip', String(params.skip));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    const qs = query.toString();
    return request<SaleListResponse>(`/api/sales${qs ? `?${qs}` : ''}`);
  },

  getSale: (id: number) => request<Sale>(`/api/sales/${id}`),

  createSale: (data: SaleCreateInput) =>
    request<Sale>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Expenses
  getExpenses: (params?: { category?: string; start_date?: string; end_date?: string; skip?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.skip !== undefined) query.append('skip', String(params.skip));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    const qs = query.toString();
    return request<ExpenseListResponse>(`/api/expenses${qs ? `?${qs}` : ''}`);
  },

  getExpense: (id: number) => request<Expense>(`/api/expenses/${id}`),

  createExpense: (data: ExpenseCreateInput) =>
    request<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateExpense: (id: number, data: ExpenseUpdateInput) =>
    request<Expense>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteExpense: (id: number) =>
    request<{ message: string }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    }),

  // Reports
  getReportsSummary: (params?: { period?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return request<FinancialReportSummary>(`/api/reports/summary${qs ? `?${qs}` : ''}`);
  },

  getExportSalesUrl: (startDate?: string, endDate?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.append('start_date', startDate);
    if (endDate) q.append('end_date', endDate);
    return `${API_BASE_URL}/api/reports/export/sales${q.toString() ? `?${q.toString()}` : ''}`;
  },

  getExportExpensesUrl: (startDate?: string, endDate?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.append('start_date', startDate);
    if (endDate) q.append('end_date', endDate);
    return `${API_BASE_URL}/api/reports/export/expenses${q.toString() ? `?${q.toString()}` : ''}`;
  },

  getExportInventoryUrl: () => `${API_BASE_URL}/api/reports/export/inventory`,

  // Settings
  getSettings: () => request<StoreSettings>('/api/settings'),

  updateSettings: (data: StoreSettingsUpdateInput) =>
    request<StoreSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  resetDemoData: () =>
    request<{ message: string }>('/api/settings/reset-demo', {
      method: 'POST',
    }),

  // AI Interface (Phase 2 Gemma Ready)
  getAIStatus: () => request<AIStatusResponse>('/api/ai/status'),

  queryAI: (prompt: string, context_type: string = 'general') =>
    request<AIQueryResponse>('/api/ai/query', {
      method: 'POST',
      body: JSON.stringify({ prompt, context_type }),
    }),
};
