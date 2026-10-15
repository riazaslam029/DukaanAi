import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
  Store,
  X
} from 'lucide-react';

export type NavTab = 'dashboard' | 'inventory' | 'sales' | 'expenses' | 'reports' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  lowStockCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAIAssistant: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  lowStockCount = 0,
  isOpenMobile,
  onCloseMobile,
  onOpenAIAssistant,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Package className="h-5 w-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: 'sales', label: 'Sales (POS)', icon: <ShoppingCart className="h-5 w-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="h-5 w-5" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/40">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg text-white tracking-tight">DukaanAI</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Retail ERP Pakistan</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-teal-700' : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Assistant Phase 2 Card */}
        <div className="p-4 border-t border-navy-800">
          <div className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-700">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-semibold text-white">Gemma 2 AI</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Phase 2 Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Ask inventory insights or restock advice for your Kiryana store.
            </p>
            <button
              onClick={onOpenAIAssistant}
              className="w-full text-xs font-medium py-1.5 px-3 rounded-lg bg-teal-600/30 text-teal-200 hover:bg-teal-600 hover:text-white border border-teal-500/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask DukaanAI</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
