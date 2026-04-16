'use client';

import { Settings } from 'lucide-react';

interface HomePageProps {
  language: string;
  onNavigate: (page: string) => void;
}

export default function HomePage({ language, onNavigate }: HomePageProps) {
  const t = (key: string) => {
    const text: Record<string, Record<string, string>> = {
      en: {
        'home.headline': 'Is This A Scam?',
        'home.subheadline': 'Check suspicious messages in seconds',
        'home.analyzeBtn': 'Analyze Now',
        'home.historyBtn': 'View History',
      },
      ms: {
        'home.headline': 'Adakah Ini Scam?',
        'home.subheadline': 'Periksa mesej mencurigakan dalam beberapa saat',
        'home.analyzeBtn': 'Analisis Sekarang',
        'home.historyBtn': 'Lihat Sejarah',
      },
      'zh-s': {
        'home.headline': '这是诈骗吗?',
        'home.subheadline': '在几秒内检查可疑信息',
        'home.analyzeBtn': '立即分析',
        'home.historyBtn': '查看历史',
      },
      ta: {
        'home.headline': 'இது ஒரு மோசடியா?',
        'home.subheadline': 'சந்தேகத்திற்குரிய செய்திகளை சில விநாடிகளில் சரிபார்க்கவும்',
        'home.analyzeBtn': 'இப்போது பகுப்பாய்வு செய்யவும்',
        'home.historyBtn': 'வரலாற்றைப் பார்க்கவும்',
      },
    };
    return text[language]?.[key] || text['en'][key];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between border-b">
        <h1 className="text-2xl font-bold">IsThisAScam</h1>
        <button onClick={() => onNavigate('settings')} className="p-2 hover:bg-gray-100 rounded">
          <Settings size={20} />
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('home.headline')}</h1>
          <p className="text-lg text-gray-600">{t('home.subheadline')}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onNavigate('scan')}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-lg"
          >
            🔍 {t('home.analyzeBtn')}
          </button>
          <button
            onClick={() => onNavigate('history')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-xl text-lg"
          >
            📋 {t('home.historyBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}