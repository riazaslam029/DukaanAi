import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  SlidersHorizontal,
  Edit2,
  Trash2,
  PlusCircle,
  Package,
  Layers,
  ArrowUpDown,
  Download,
  Filter,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ProductModal } from '../components/inventory/ProductModal';
import { StockAdjustModal } from '../components/inventory/StockAdjustModal';
import { api } from '../services/api';
import { Product, ProductCreateInput, ProductUpdateInput } from '../services/types';
import { formatPKR, formatPercent } from '../utils/formatters';

interface InventoryPageProps {
  onOpenAIAssistant: () => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [deleteProductCandidate, setDeleteProductCandidate] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProducts({
        search: search.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        low_stock_only: lowStockOnly,
        limit: 300,
      });
      setProducts(res.items);
      setTotalCount(res.total);
      setLowStockCount(res.low_stock_count);
      setCategories(res.categories);
      setTotalStockValue(res.total_stock_value);
    } catch (err: any) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleSaveProduct = async (data: ProductCreateInput | ProductUpdateInput) => {
    if (productToEdit) {
      await api.updateProduct(productToEdit.id, data);
    } else {
      await api.createProduct(data as ProductCreateInput);
    }
    await loadProducts();
  };

  const handleAdjustStock = async (productId: number, adjustment: number, reason: string) => {
    await api.adjustStock(productId, adjustment, reason);
    await loadProducts();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductCandidate) return;
    setIsDeleting(true);
    try {
      await api.deleteProduct(deleteProductCandidate.id);
      setDeleteProductCandidate(null);
      await loadProducts();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track stock levels, purchase costs, retail selling prices, and reorder alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={api.getExportInventoryUrl()}
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
              setProductToEdit(null);
              setIsAddEditOpen(true);
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Items Listed</p>
            <p className="text-xl font-bold text-slate-900">{totalCount} Products</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Low-Stock Warnings</p>
            <p className="text-xl font-bold text-amber-600">{lowStockCount} Items</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-navy-50 text-navy-800 border border-navy-100">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Inventory Valuation</p>
            <p className="text-xl font-bold text-slate-900">{formatPKR(totalStockValue)}</p>
          </div>
        </div>
      </div>

      {/* Search, Filter & View Controls */}
      <Card padding="sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <Input
              placeholder="Search by title, category, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="All">All Categories ({totalCount})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Low stock quick toggle button */}
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
                lowStockOnly
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Low Stock Only ({lowStockCount})</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">SKU / Barcode</th>
                <th className="py-3 px-3 text-center">Stock Level</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Margin %</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto mb-2"></div>
                    Loading inventory...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const isLow = p.is_low_stock;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLow ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="font-semibold">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {p.sku || p.barcode || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={isLow ? 'warning' : 'success'}
                          size="sm"
                          dot
                        >
                          {p.stock_quantity} {p.unit}
                        </Badge>
                        {isLow && (
                          <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                            Min: {p.min_stock_threshold}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatPKR(p.purchase_price)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatPKR(p.selling_price)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-semibold ${
                            p.profit_margin >= 15
                              ? 'text-emerald-700'
                              : p.profit_margin >= 0
                              ? 'text-amber-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {formatPercent(p.profit_margin)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setStockAdjustProduct(p)}
                            title="Quick Stock Adjustment (+/-)"
                            className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 border border-teal-200 transition-colors"
                          >
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToEdit(p);
                              setIsAddEditOpen(true);
                            }}
                            title="Edit Product"
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteProductCandidate(p)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search query or category filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSubmit={handleSaveProduct}
        productToEdit={productToEdit}
        categories={categories}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustModal
        isOpen={!!stockAdjustProduct}
        onClose={() => setStockAdjustProduct(null)}
        product={stockAdjustProduct}
        onAdjust={handleAdjustStock}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteProductCandidate}
        onClose={() => setDeleteProductCandidate(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProductCandidate?.name}"? It will be removed from your active catalog.`}
        confirmText="Delete Product"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
