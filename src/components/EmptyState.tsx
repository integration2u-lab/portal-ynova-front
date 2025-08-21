import React from 'react';
import { FileText } from 'lucide-react';

export default function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum item encontrado</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{message}</p>
      {action}
    </div>
  );
}
