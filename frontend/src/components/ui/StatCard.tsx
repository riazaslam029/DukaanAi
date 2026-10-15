import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  colorScheme?: 'teal' | 'navy' | 'emerald' | 'amber' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = 'teal',
}) => {
  const iconBgStyles = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    navy: 'bg-navy-50 text-navy-800 border-navy-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  }[colorScheme];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${iconBgStyles}`}>{icon}</div>
      </div>
      {trend && (
        <div className="mt-3.5 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isNeutral
                ? 'text-slate-600'
                : trend.isPositive
                ? 'text-emerald-700'
                : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-500">vs historical average</span>
        </div>
      )}
    </div>
  );
};
