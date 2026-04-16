'use client';

import { useState } from 'react';

interface ScanPageProps {
  language: string;
  onAnalyze: (text: string) => void;
  onNavigate: (page: string) => void;
}

export default function ScanPage({ language, onAnalyze, onNavigate }: ScanPageProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setTimeout(() => {
      onAnalyze(text);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-4 border-b flex justify-between">
        <button onClick={() => onNavigate('home')} className="text-blue-600">← Back</button>
        <h1 className="font-bold">Check Message</h1>
        <div />
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste suspicious message here..."
          className="w-full h-40 p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
        />
        
        <p className="text-sm text-gray-500 mt-2">{text.length}/1000</p>

        <button
          onClick={handleAnalyze}
          disabled={loading || text.length === 0}
          className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? '⏳ Analyzing...' : '🔍 Analyze'}
        </button>
      </div>
    </div>
  );
}