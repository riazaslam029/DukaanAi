import React from 'react';
import { Menu, Plus, ShoppingCart, Sparkles, Store } from 'lucide-react';
import { Button } from '../ui/Button';
import { StoreSettings } from '../../services/types';

interface TopbarProps {
  onToggleSidebar: () => void;
  settings: StoreSettings | null;
  onOpenNewSale: () => void;
  onOpenAddProduct: () => void;
  onOpenAIAssistant: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  settings,
  onOpenNewSale,
  onOpenAddProduct,
  onOpenAIAssistant,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm lg:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Store className="h-4 w-4 text-teal-600 hidden sm:inline" />
              <span>{settings?.store_name || 'Bismillah Kiryana Store'}</span>
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {settings?.city || 'Pakistan'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {settings?.address || 'Main Market'} • Currency: {settings?.currency || 'PKR'} ({settings?.currency_symbol || 'Rs.'})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Ask AI button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAIAssistant}
          leftIcon={<Sparkles className="h-3.5 w-3.5 text-teal-600" />}
          className="hidden sm:inline-flex border-teal-200 text-teal-800 bg-teal-50/50 hover:bg-teal-50"
        >
          AI Advisor
        </Button>

        {/* Quick Add Product */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAddProduct}
          leftIcon={<Plus className="h-3.5 w-3.5 text-slate-600" />}
          className="hidden md:inline-flex"
        >
          Product
        </Button>

        {/* Quick New Sale */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewSale}
          leftIcon={<ShoppingCart className="h-3.5 w-3.5" />}
        >
          New Sale
        </Button>
      </div>
    </header>
  );
};
