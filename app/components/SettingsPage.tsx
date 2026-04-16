'use client';

import { useState } from 'react';

interface SettingsPageProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  onNavigate: (page: string) => void;
}

export default function SettingsPage({ language, onLanguageChange, onNavigate }: SettingsPageProps) {
  const langs = [
    { code: 'en', name: '🇬🇧 English' },
    { code: 'ms', name: '🇲🇾 Bahasa Melayu' },
    { code: 'zh-s', name: '🇨🇳 中文简体' },
    { code: 'ta', name: '🇮🇳 தமிழ்' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-4 border-b">
        <button onClick={() => onNavigate('home')} className="text-blue-600">← Back</button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <h2 className="font-bold text-lg mb-4">Language</h2>
        <div className="space-y-2">
          {langs.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={`w-full p-3 rounded-lg border-2 text-left ${
                language === lang.code ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}
            >
              {lang.name}
              {language === lang.code && <span className="float-right">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}