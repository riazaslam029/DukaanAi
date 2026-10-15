import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Printer, CheckCircle, ShoppingBag } from 'lucide-react';
import { Sale, StoreSettings } from '../../services/types';
import { formatPKR, formatDate } from '../../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: StoreSettings | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings,
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle className="h-5 w-5" />
          <span className="text-slate-900 font-bold">Sale Completed</span>
        </div>
      }
      subtitle={`Invoice: ${sale.invoice_number}`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer className="h-4 w-4" />}>
            Print Receipt
          </Button>
        </>
      }
    >
      {/* Printable Receipt Paper */}
      <div id="printable-receipt" className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 font-mono text-xs text-slate-800">
        {/* Store Header */}
        <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {settings?.store_name || 'Bismillah Kiryana Store'}
          </h2>
          <p className="text-[11px] text-slate-500">
            {settings?.address || 'Main Market, Gulberg III, Lahore'}
          </p>
          <p className="text-[11px] text-slate-500">Phone: {settings?.phone || '0300-1234567'}</p>
        </div>

        {/* Invoice Info */}
        <div className="flex justify-between text-[11px] text-slate-600 border-b border-dashed border-slate-200 pb-2">
          <div>
            <p><span className="font-semibold">Invoice:</span> {sale.invoice_number}</p>
            <p><span className="font-semibold">Date:</span> {formatDate(sale.created_at)}</p>
          </div>
          <div className="text-right">
            <p><span className="font-semibold">Customer:</span> {sale.customer_name || 'Counter Sale'}</p>
            <p><span className="font-semibold">Payment:</span> {sale.payment_method}</p>
          </div>
        </div>

        {/* Itemised Table */}
        <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
          <div className="grid grid-cols-12 font-bold text-[11px] text-slate-700 border-b border-slate-200 pb-1">
            <span className="col-span-6">Item</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Price</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {sale.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 text-[11px] py-0.5">
              <span className="col-span-6 truncate font-sans text-slate-900">{item.product_name}</span>
              <span className="col-span-2 text-center">{item.quantity}</span>
              <span className="col-span-2 text-right">Rs.{item.unit_selling_price.toFixed(0)}</span>
              <span className="col-span-2 text-right font-semibold">Rs.{item.subtotal.toFixed(0)}</span>
            </div>
          ))}
        </div>

        {/* Financial Totals */}
        <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
          <div className="flex justify-between text-slate-600">
            <span>Gross Total:</span>
            <span>{formatPKR(sale.total_amount)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>Discount:</span>
              <span>- {formatPKR(sale.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
            <span>Net Paid:</span>
            <span>{formatPKR(sale.net_amount)}</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[10px] text-slate-500 pt-1 space-y-1">
          <p>{settings?.receipt_footer || 'JazakAllah Khair for your purchase! Shukriya.'}</p>
          <p className="text-[9px] text-slate-400">Powered by DukaanAI • Phase 1 MVP</p>
        </div>
      </div>
    </Modal>
  );
};
