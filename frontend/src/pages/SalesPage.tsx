import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  Phone,
  Receipt,
  FileText,
  DollarSign,
  Package,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { ReceiptModal } from '../components/sales/ReceiptModal';
import { api } from '../services/api';
import { Product, Sale, SaleCreateInput, StoreSettings } from '../services/types';
import { formatPKR } from '../utils/formatters';

interface CartItem {
  product: Product;
  quantity: number;
}

interface SalesPageProps {
  settings: StoreSettings | null;
}

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash (Naqd)', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { id: 'JazzCash', label: 'JazzCash', color: 'border-rose-300 bg-rose-50 text-rose-800' },
  { id: 'EasyPaisa', label: 'EasyPaisa', color: 'border-teal-300 bg-teal-50 text-teal-800' },
  { id: 'Bank Transfer', label: 'Bank Transfer', color: 'border-sky-300 bg-sky-50 text-sky-800' },
  { id: 'Udhaar/Credit', label: 'Udhaar (Khata)', color: 'border-amber-300 bg-amber-50 text-amber-800' },
];

export const SalesPage: React.FC<SalesPageProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  // Checkout execution
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProducts({
        search: search.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        limit: 200,
      });
      setProducts(res.items);
      setCategories(res.categories);
    } catch (err: any) {
      console.error('Failed to load products for POS:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  // Cart operations
  const addToCart = (product: Product) => {
    setErrorMessage('');
    if (product.stock_quantity <= 0) {
      setErrorMessage(`Cannot add "${product.name}" — Out of stock!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          setErrorMessage(`Cannot add more. Only ${product.stock_quantity} available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, newQty: number) => {
    setErrorMessage('');
    const targetItem = cart.find((i) => i.product.id === productId);
    if (!targetItem) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > targetItem.product.stock_quantity) {
      setErrorMessage(
        `Insufficient stock for "${targetItem.product.name}". Max available is ${targetItem.product.stock_quantity}.`
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount('0');
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setErrorMessage('');
  };

  // Calculations
  const grossSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.product.selling_price, 0);
  const parsedDiscount = Math.max(0, parseFloat(discountAmount) || 0);
  const netPayable = Math.max(0, grossSubtotal - parsedDiscount);

  const handleCheckout = async () => {
    setErrorMessage('');
    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please select products to sell.');
      return;
    }

    // Double check stock constraints before sending
    for (const item of cart) {
      if (item.quantity > item.product.stock_quantity) {
        setErrorMessage(
          `Stock error: You selected ${item.quantity} of "${item.product.name}", but only ${item.product.stock_quantity} are left.`
        );
        return;
      }
    }

    if (parsedDiscount > grossSubtotal) {
      setErrorMessage('Discount cannot exceed the total bill amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SaleCreateInput = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        discount_amount: parsedDiscount,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      };

      const sale = await api.createSale(payload);
      setCompletedSale(sale);
      setIsReceiptOpen(true);
      clearCart();
      // Reload products so updated stocks reflect in catalog immediately
      await loadProducts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Point of Sale (POS)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Fast counter checkout with automatic stock deduction and thermal receipt generation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearCart}>
              Clear Cart
            </Button>
          )}
        </div>
      </div>

      {/* POS Grid: Catalog on Left, Checkout Cart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Product Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="sm">
            <div className="space-y-3">
              {/* Search */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Scan barcode or type item title (e.g. Tapal, Dalda, Olpers)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>
                <Button variant="secondary" size="md" type="submit">
                  Search
                </Button>
              </form>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {isLoading ? (
              <div className="col-span-full py-16 text-center text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto mb-2"></div>
                Loading catalog...
              </div>
            ) : products.length > 0 ? (
              products.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id);
                const isOutOfStock = p.stock_quantity <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`p-3 rounded-xl border bg-white shadow-sm transition-all text-left flex flex-col justify-between cursor-pointer select-none ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                        : inCart
                        ? 'border-teal-500 ring-2 ring-teal-500/20'
                        : 'border-slate-200/80 hover:border-teal-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] font-medium text-slate-500 truncate">{p.category}</span>
                        {inCart && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-600 text-white">
                            {inCart.quantity} in cart
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">{p.name}</h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-teal-800">{formatPKR(p.selling_price)}</p>
                        <p className="text-[10px] text-slate-400">per {p.unit}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-800'
                            : p.is_low_stock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : `${p.stock_quantity} left`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">No items matching criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Counter Bill & Checkout Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title={
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-teal-600" />
                <span>Current Bill / Cart</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 ml-auto">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
                </span>
              </div>
            }
          >
            {errorMessage && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Cart Line Items */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatPKR(item.product.selling_price)} × {item.quantity} ={' '}
                        <span className="font-bold text-slate-800">
                          {formatPKR(item.quantity * item.product.selling_price)}
                        </span>
                      </p>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-700">Counter Cart is Empty</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click items in the catalog to add them to this sale.
                  </p>
                </div>
              )}
            </div>

            {/* Bill Financial Summary */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatPKR(grossSubtotal)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Special Discount (PKR):</span>
                <div className="w-28">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full text-right rounded border border-slate-300 py-1 px-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Net Payable Large */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-bold text-slate-900">
                <span>Net Payable:</span>
                <span className="text-xl text-teal-800">{formatPKR(netPayable)}</span>
              </div>
            </div>

            {/* Customer & Payment Details */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Customer Name (Optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  leftIcon={<User className="h-3.5 w-3.5" />}
                />
                <Input
                  placeholder="Phone (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  leftIcon={<Phone className="h-3.5 w-3.5" />}
                />
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`text-xs p-2 rounded-lg border font-medium text-left transition-all ${
                        paymentMethod === pm.id
                          ? `${pm.color} ring-2 ring-offset-1 ring-slate-400 font-bold`
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout Action Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full mt-2"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                isLoading={isSubmitting}
                leftIcon={<CheckCircle2 className="h-5 w-5" />}
              >
                Complete Sale ({formatPKR(netPayable)})
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Sale Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={completedSale}
        settings={settings}
      />
    </div>
  );
};
