import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Product } from '../../services/types';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAdjust: (productId: number, adjustment: number, reason: string) => Promise<void>;
}

const COMMON_REASONS = [
  'Wholesale Delivery / Restock',
  'Damaged or Expired Stock Write-off',
  'Customer Return / Exchange',
  'Physical Audit Stock Correction',
  'Sample / Promotion Given',
];

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  product,
  onAdjust,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  const [quantity, setQuantity] = useState<string>('5');
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const currentStock = product.stock_quantity;
  const parsedQty = parseInt(quantity, 10) || 0;
  const delta = adjustmentType === 'add' ? parsedQty : -parsedQty;
  const resultingStock = currentStock + delta;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedQty <= 0) {
      setError('Please enter a quantity greater than 0');
      return;
    }
    if (resultingStock < 0) {
      setError(`Cannot deduct ${parsedQty}. Only ${currentStock} in stock.`);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onAdjust(product.id, delta, reason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Stock Adjustment"
      subtitle={`Adjusting stock for: ${product.name}`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={adjustmentType === 'add' ? 'primary' : 'danger'}
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {adjustmentType === 'add' ? 'Add to Stock' : 'Deduct from Stock'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
          <button
            type="button"
            onClick={() => setAdjustmentType('add')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              adjustmentType === 'add' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Add Stock (Restock)
          </button>
          <button
            type="button"
            onClick={() => setAdjustmentType('deduct')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              adjustmentType === 'deduct' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            - Deduct Stock (Write-off)
          </button>
        </div>

        <div>
          <Input
            label="Quantity Units *"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Reason *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            {COMMON_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Math Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Current Available Stock:</span>
            <span className="font-semibold text-slate-900">
              {currentStock} {product.unit}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Adjustment:</span>
            <span
              className={`font-semibold ${
                delta >= 0 ? 'text-teal-700' : 'text-rose-600'
              }`}
            >
              {delta >= 0 ? `+${delta}` : delta} {product.unit}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
            <span>New Stock Level:</span>
            <span className={resultingStock <= product.min_stock_threshold ? 'text-amber-600' : 'text-emerald-700'}>
              {resultingStock} {product.unit}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
};
