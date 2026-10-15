import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Download,
  DollarSign,
  TrendingDown,
  PieChart as PieIcon,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { api } from '../services/api';
import { Expense, ExpenseCategoryBreakdown, ExpenseCreateInput, ExpenseUpdateInput } from '../services/types';
import { formatPKR, formatDate } from '../utils/formatters';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<ExpenseCategoryBreakdown[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [todayAmount, setTodayAmount] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getExpenses({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        limit: 200,
      });
      setExpenses(res.items);
      setCategories(res.categories);
      setCategoryBreakdown(res.category_breakdown);
      setTotalAmount(res.total_amount);
      setTodayAmount(res.today_expense_amount);
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory]);

  const handleSaveExpense = async (data: ExpenseCreateInput | ExpenseUpdateInput) => {
    if (expenseToEdit) {
      await api.updateExpense(expenseToEdit.id, data);
    } else {
      await api.createExpense(data as ExpenseCreateInput);
    }
    await loadExpenses();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await api.deleteExpense(deleteCandidate.id);
      setDeleteCandidate(null);
      await loadExpenses();
    } catch (err) {
      console.error('Delete expense error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Expenses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Log shop rent, electricity (bijli) bills, chai, helper wages, and carriage costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={api.getExportExpensesUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-medium text-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </a>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setExpenseToEdit(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Record Expense
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Expenses Recorded</p>
            <p className="text-xl font-bold text-slate-900">{formatPKR(totalAmount)}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Today's Expenses</p>
            <p className="text-xl font-bold text-amber-700">{formatPKR(todayAmount)}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <PieIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Top Expense Head</p>
            <p className="text-sm font-bold text-slate-900">
              {categoryBreakdown[0] ? categoryBreakdown[0].category : 'None yet'}
            </p>
            {categoryBreakdown[0] && (
              <p className="text-[11px] text-slate-500">
                {formatPKR(categoryBreakdown[0].total_amount)} ({categoryBreakdown[0].percentage}%)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars & Filter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">Filter by Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="All">All Categories ({expenses.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-slate-500">Showing {expenses.length} records</span>
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Amount (PKR)</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3 text-right">Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto mb-2"></div>
                        Loading expenses...
                      </td>
                    </tr>
                  ) : expenses.length > 0 ? (
                    expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div>{e.title}</div>
                          {e.notes && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{e.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-700">
                            {e.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-700">
                          {formatPKR(e.amount)}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="neutral" size="sm">
                            {e.payment_method}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          {formatDate(e.date)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setExpenseToEdit(e);
                                setIsModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-600 hover:bg-slate-100"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(e)}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-700">No expenses recorded yet</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Click "Record Expense" above to log business spending.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Category Breakdown Progress Bars (1 col) */}
        <Card title="Category Spending Breakdown" subtitle="Distribution of total shop expenditures">
          <div className="space-y-3.5">
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800">{cat.category}</span>
                    <span className="text-slate-500 font-bold">{formatPKR(cat.total_amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{cat.count} expense records</span>
                    <span>{cat.percentage}% of total</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">No category data yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        categories={categories}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense"
        message={`Delete expense "${deleteCandidate?.title}" of ${formatPKR(deleteCandidate?.amount || 0)}?`}
        confirmText="Delete"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
