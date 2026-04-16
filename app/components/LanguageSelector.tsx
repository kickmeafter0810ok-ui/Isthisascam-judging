'use client';

interface LanguageSelectorProps {
  onLanguageSelected: (language: string) => void;
}

export default function LanguageSelector({ onLanguageSelected }: LanguageSelectorProps) {
  const langs = [
    { code: 'en', name: '🇬🇧 English', full: 'English' },
    { code: 'ms', name: '🇲🇾 Bahasa Melayu', full: 'Bahasa Melayu' },
    { code: 'zh-s', name: '🇨🇳 中文简体', full: 'Simplified Chinese' },
    { code: 'ta', name: '🇮🇳 தமிழ்', full: 'Tamil' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">❓</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IsThisAScam</h1>
          <p className="text-gray-600">Check suspicious messages in seconds</p>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Select Your Language</h2>

        <div className="space-y-3">
          {langs.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageSelected(lang.code)}
              className="w-full bg-gray-50 hover:bg-red-50 border-2 border-gray-200 hover:border-red-300 rounded-lg py-3 px-4 transition-all flex items-center gap-3 text-left"
            >
              <span className="text-2xl">{lang.name.split(' ')[0]}</span>
              <span className="font-medium text-gray-900">{lang.full}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">🔒 Your Privacy First</p>
          <p>All analysis happens on your device.</p>
        </div>
      </div>
    </div>
  );
}