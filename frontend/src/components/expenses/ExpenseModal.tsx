import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Expense, ExpenseCreateInput, ExpenseUpdateInput } from '../../services/types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseCreateInput | ExpenseUpdateInput) => Promise<void>;
  expenseToEdit?: Expense | null;
  categories: string[];
}

const DEFAULT_CATEGORIES = [
  'Shop Rent',
  'Electricity / Utilities',
  'Staff Wages',
  'Chai & Refreshments',
  'Transport & Carriage',
  'Packaging & Bags',
  'Repairs & Maintenance',
  'Miscellaneous',
];

const PAYMENT_METHODS = ['Cash', 'JazzCash', 'EasyPaisa', 'Bank Transfer'];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expenseToEdit,
  categories,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Chai & Refreshments');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setCategory(expenseToEdit.category);
      setAmount(String(expenseToEdit.amount));
      setPaymentMethod(expenseToEdit.payment_method);
      setDate(expenseToEdit.date ? expenseToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setNotes(expenseToEdit.notes || '');
    } else {
      setTitle('');
      setCategory(categories[0] || 'Chai & Refreshments');
      setAmount('');
      setPaymentMethod('Cash');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setErrors({});
  }, [expenseToEdit, isOpen, categories]);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!title.trim()) err.title = 'Expense title is required';
    if (!category.trim()) err.category = 'Category is required';
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) err.amount = 'Enter a valid expense amount in PKR';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: ExpenseCreateInput = {
        title: title.trim(),
        category: category.trim(),
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        notes: notes.trim() || undefined,
      };
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save expense' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Business Expense' : 'Record Business Expense'}
      subtitle="Track shop operational costs to keep net profit calculations accurate"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {expenseToEdit ? 'Save Changes' : 'Record Expense'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errors.form}
          </div>
        )}

        <div>
          <Input
            label="Expense Title *"
            placeholder="e.g. LESCO Electricity Bill, Helper Weekly Wage, Chai & Lunch"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Amount (PKR) *"
              type="number"
              step="any"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Expense Date *"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Input
            label="Notes / Receipt Reference (Optional)"
            placeholder="e.g. Paid to Landlord Malik Sahib, Consumer # 123456"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
