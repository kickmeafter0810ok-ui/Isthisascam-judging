'use client';

import { Settings, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export default function Header({ onNavigate, showBack, onBack, title }: HeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {showBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        ) : (
          <h1 className="text-xl font-bold text-gray-900">
            {title || t('app.name')}
          </h1>
        )}

        <button
          onClick={() => onNavigate?.('settings')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          aria-label="Settings"
        >
          <Settings size={20} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}