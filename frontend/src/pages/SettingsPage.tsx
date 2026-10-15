import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  DollarSign,
  AlertTriangle,
  FileText,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Terminal,
  Save,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { api } from '../services/api';
import { StoreSettings, StoreSettingsUpdateInput, AIStatusResponse } from '../services/types';

interface SettingsPageProps {
  settings: StoreSettings | null;
  onSettingsUpdated: (newSettings: StoreSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [receiptFooter, setReceiptFooter] = useState('');

  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset demo modal state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name);
      setOwnerName(settings.owner_name);
      setPhone(settings.phone);
      setAddress(settings.address);
      setCity(settings.city);
      setLowStockThreshold(String(settings.default_low_stock_threshold));
      setReceiptFooter(settings.receipt_footer);
    }
    loadAIStatus();
  }, [settings]);

  const loadAIStatus = async () => {
    try {
      const status = await api.getAIStatus();
      setAiStatus(status);
    } catch {
      // fallback
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const payload: StoreSettingsUpdateInput = {
        store_name: storeName.trim(),
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        default_low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        receipt_footer: receiptFooter.trim(),
      };
      const updated = await api.updateSettings(payload);
      onSettingsUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      const res = await api.resetDemoData();
      setResetSuccessMessage(res.message);
      const freshSettings = await api.getSettings();
      onSettingsUpdated(freshSettings);
      setIsResetConfirmOpen(false);
      setTimeout(() => setResetSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Store Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure shop details, low-stock alerts, receipt layout, and AI integration.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Store settings saved successfully!</span>
        </div>
      )}

      {resetSuccessMessage && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Store Profile Card */}
        <Card title="Shop Identity & Contact" subtitle="Appears on customer receipts and application topbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Store Name *"
                placeholder="e.g. Bismillah Kiryana & General Store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Shopkeeper / Owner Name *"
                placeholder="e.g. Haji Muhammad Aslam"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Contact Phone Number *"
                placeholder="e.g. 0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Store Address *"
                placeholder="e.g. Shop #4, Main Market, Gulberg III"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="City *"
                placeholder="e.g. Lahore, Karachi, Rawalpindi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        {/* Currency & Inventory Rules */}
        <Card title="Currency & Inventory Thresholds" subtitle="National standard formatting for Pakistani Retail">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Currency Standard
              </label>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Pakistani Rupee (PKR)</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono">Rs.</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Configured strictly for Pakistani retail operations.</p>
            </div>

            <div>
              <Input
                label="Global Default Low-Stock Threshold *"
                type="number"
                min="1"
                max="1000"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                helperText="Items with stock at or below this trigger alerts unless customized per-product"
                required
              />
            </div>
          </div>
        </Card>

        {/* Receipt Customization */}
        <Card title="Thermal Receipt Customization" subtitle="Message printed at bottom of customer invoices">
          <div>
            <Input
              label="Receipt Footer Note"
              placeholder="e.g. JazakAllah Khair for your purchase! Shukriya for choosing DukaanAI."
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Store Settings
          </Button>
        </div>
      </form>

      {/* AI Readiness Card (Phase 2 Gemma / Ollama) */}
      <Card
        title="AI Intelligence Engine (Phase 2 Gemma)"
        subtitle="Zero-cost, private open-weight model integration via Ollama"
      >
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Local Ollama Connection:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold ${
                  aiStatus?.is_available
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {aiStatus?.status || 'Offline / Phase 2 Ready'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Target Model:</span>
              <span className="font-mono font-semibold text-slate-900">
                {aiStatus?.model_name || 'gemma2:2b'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Local Ollama Endpoint:</span>
              <span className="font-mono text-slate-900">{aiStatus?.ollama_url || 'http://localhost:11434'}</span>
            </div>
            <p className="text-slate-500 pt-2 border-t border-slate-200 leading-relaxed">
              {aiStatus?.message ||
                'To activate local LLM reasoning on Windows in Phase 2, install Ollama and run `ollama run gemma2:2b`. No cloud API keys or subscriptions required.'}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAIStatus}
              leftIcon={<Sparkles className="h-3.5 w-3.5 text-teal-600" />}
            >
              Re-check AI Status
            </Button>
          </div>
        </div>
      </Card>

      {/* Demo Data Management for Hackathon Presentation */}
      <Card
        title="Hackathon Demo Data Management"
        subtitle="Quickly restore sample Pakistani retail products, sales history, and expenses"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/40">
          <div>
            <h4 className="text-xs font-bold text-amber-900">Reset Demo Database</h4>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Refreshes SQLite with 25 authentic Pakistani items (Dalda, Tapal, Olpers, Shan), 7 days of sales, and operating expenses.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsResetConfirmOpen(true)}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Reset Demo Data
          </Button>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDemoData}
        title="Reset to Demo Pakistani Retail Data?"
        message="This will re-populate your DukaanAI SQLite database with realistic Pakistani retail products, sales, and operating expenses. Ideal for hackathon demonstrations."
        confirmText="Yes, Reset Data"
        isDestructive
        isLoading={isResetting}
      />
    </div>
  );
};
