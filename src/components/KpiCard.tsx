import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color?: 'blue' | 'orange' | 'green' | 'purple' | 'indigo' | 'teal' | 'red';
}

export default function KpiCard({ title, value, icon: Icon, color = 'blue' }: KpiCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-[#FE5200]/10 text-[#FE5200]',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    teal: 'bg-teal-50 text-teal-600',
    red: 'bg-red-50 text-red-600',
  } as const;

  return (
    <div className="bg-white dark:bg-[#1a1f24] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-[#2b3238]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
