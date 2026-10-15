import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AIAssistantModal } from './components/ai/AIAssistantModal';
import { ProductModal } from './components/inventory/ProductModal';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { StockAdjustModal } from './components/inventory/StockAdjustModal';
import { api } from './services/api';
import { StoreSettings, Product, ProductCreateInput, ExpenseCreateInput } from './services/types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Global Quick Modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);

  const loadGlobalSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch {
      // Backend not yet reachable or starting up
    }
  };

  const loadLowStockBadge = async () => {
    try {
      const res = await api.getProducts({ low_stock_only: true, limit: 1 });
      setLowStockCount(res.low_stock_count);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadGlobalSettings();
    loadLowStockBadge();
  }, [currentTab]);

  const handleCreateProduct = async (data: ProductCreateInput) => {
    await api.createProduct(data);
    await loadLowStockBadge();
  };

  const handleCreateExpense = async (data: ExpenseCreateInput) => {
    await api.createExpense(data);
  };

  const handleAdjustStock = async (productId: number, adjustment: number, reason: string) => {
    await api.adjustStock(productId, adjustment, reason);
    await loadLowStockBadge();
  };

  return (
    <div className="min-h-screen bg-surface-base flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        lowStockCount={lowStockCount}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onOpenAIAssistant={() => setIsAIModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Topbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          settings={settings}
          onOpenNewSale={() => setCurrentTab('sales')}
          onOpenAddProduct={() => setIsAddProductOpen(true)}
          onOpenAIAssistant={() => setIsAIModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenNewSale={() => setCurrentTab('sales')}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              onOpenExpense={() => setIsAddExpenseOpen(true)}
              onSelectProductForRestock={(prod) => setSelectedProductForRestock(prod)}
              onOpenAIAssistant={() => setIsAIModalOpen(true)}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryPage onOpenAIAssistant={() => setIsAIModalOpen(true)} />
          )}

          {currentTab === 'sales' && <SalesPage settings={settings} />}

          {currentTab === 'expenses' && <ExpensesPage />}

          {currentTab === 'reports' && <ReportsPage />}

          {currentTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onSettingsUpdated={(newSettings) => setSettings(newSettings)}
            />
          )}
        </main>
      </div>

      {/* Global AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
      />

      {/* Quick Add Product Modal */}
      <ProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSubmit={handleCreateProduct as any}
        categories={[]}
      />

      {/* Quick Add Expense Modal */}
      <ExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSubmit={handleCreateExpense as any}
        categories={[]}
      />

      {/* Quick Stock Adjustment Modal from Dashboard */}
      <StockAdjustModal
        isOpen={!!selectedProductForRestock}
        onClose={() => setSelectedProductForRestock(null)}
        product={selectedProductForRestock}
        onAdjust={handleAdjustStock}
      />
    </div>
  );
};

export default App;
