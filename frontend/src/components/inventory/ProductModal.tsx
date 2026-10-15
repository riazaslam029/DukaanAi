import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Product, ProductCreateInput, ProductUpdateInput } from '../../services/types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductCreateInput | ProductUpdateInput) => Promise<void>;
  productToEdit?: Product | null;
  categories: string[];
}

const COMMON_CATEGORIES = [
  'Groceries & Staples',
  'Spices & Masalas',
  'Dairy & Breakfast',
  'Beverages & Tea',
  'Snacks & Confectionery',
  'Personal Care',
  'Household & Cleaning',
];

const COMMON_UNITS = ['piece', 'kg', 'pack', 'litre', 'bottle', 'box', 'tin', 'bag'];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
  categories,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Groceries & Staples');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('piece');
  const [purchasePrice, setPurchasePrice] = useState<string>('0');
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [stockQuantity, setStockQuantity] = useState<string>('0');
  const [minThreshold, setMinThreshold] = useState<string>('5');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setSku(productToEdit.sku || '');
      setBarcode(productToEdit.barcode || '');
      setUnit(productToEdit.unit || 'piece');
      setPurchasePrice(String(productToEdit.purchase_price));
      setSellingPrice(String(productToEdit.selling_price));
      setStockQuantity(String(productToEdit.stock_quantity));
      setMinThreshold(String(productToEdit.min_stock_threshold));
      setDescription(productToEdit.description || '');
    } else {
      setName('');
      setCategory(categories[0] || 'Groceries & Staples');
      setSku('');
      setBarcode('');
      setUnit('piece');
      setPurchasePrice('');
      setSellingPrice('');
      setStockQuantity('10');
      setMinThreshold('5');
      setDescription('');
    }
    setErrors({});
  }, [productToEdit, isOpen, categories]);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = 'Product name is required';
    if (!category.trim()) err.category = 'Category is required';

    const pPrice = parseFloat(purchasePrice);
    const sPrice = parseFloat(sellingPrice);
    const stock = parseInt(stockQuantity, 10);
    const threshold = parseInt(minThreshold, 10);

    if (isNaN(pPrice) || pPrice < 0) err.purchasePrice = 'Enter a valid purchase price (PKR)';
    if (isNaN(sPrice) || sPrice < 0) err.sellingPrice = 'Enter a valid selling price (PKR)';
    if (isNaN(stock) || stock < 0) err.stockQuantity = 'Enter valid stock count';
    if (isNaN(threshold) || threshold < 0) err.minThreshold = 'Enter valid threshold';

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: ProductCreateInput = {
        name: name.trim(),
        category: category.trim(),
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        unit: unit.trim() || 'piece',
        purchase_price: parseFloat(purchasePrice),
        selling_price: parseFloat(sellingPrice),
        stock_quantity: parseInt(stockQuantity, 10),
        min_stock_threshold: parseInt(minThreshold, 10),
        description: description.trim() || undefined,
      };
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allCategories = Array.from(new Set([...COMMON_CATEGORIES, ...categories]));

  const estProfit = parseFloat(sellingPrice || '0') - parseFloat(purchasePrice || '0');
  const estMargin = parseFloat(sellingPrice || '0') > 0 ? (estProfit / parseFloat(sellingPrice)) * 100 : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={productToEdit ? 'Edit Product' : 'Add New Product'}
      subtitle="Keep your store catalog and inventory up to date"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {productToEdit ? 'Save Changes' : 'Add Product'}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Product Title *"
              placeholder="e.g. Dalda Cooking Oil (1 Litre Pouch)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category *
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Unit of Measure *
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="SKU (Optional)"
              placeholder="e.g. OIL-DAL-1L"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Barcode / EAN (Optional)"
              placeholder="e.g. 896400010011"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Purchase Cost (PKR) *"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              error={errors.purchasePrice}
              required
            />
          </div>

          <div>
            <Input
              label="Selling Price (PKR) *"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              error={errors.sellingPrice}
              required
            />
          </div>

          <div>
            <Input
              label="Initial Stock Quantity *"
              type="number"
              min="0"
              placeholder="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              error={errors.stockQuantity}
              required
            />
          </div>

          <div>
            <Input
              label="Low-Stock Alert Threshold *"
              type="number"
              min="1"
              placeholder="5"
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
              error={errors.minThreshold}
              helperText="Alerts when stock drops to or below this"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Description / Packaging Notes (Optional)"
              placeholder="e.g. Carton of 12 pouches, supplier Akbari Mandi"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Live Margin Preview */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600">Unit Gross Profit:</span>
          <div className="flex items-center gap-3">
            <span className={`font-bold ${estProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              Rs. {estProfit.toFixed(2)}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-semibold ${
                estMargin >= 15 ? 'bg-emerald-100 text-emerald-800' : estMargin >= 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              Margin: {estMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
};
