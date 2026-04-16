'use client';

interface ResultsPageProps {
  result: any;
  language: string;
  onNavigate: (page: string) => void;
  onSave: () => void;
}

export default function ResultsPage({ result, language, onNavigate, onSave }: ResultsPageProps) {
  if (!result) return <div>No result</div>;

  const config: Record<string, any> = {
    scam: { icon: '🚨', color: 'text-red-600', bg: 'bg-red-50', label: 'SCAM' },
    safe: { icon: '✅', color: 'text-green-600', bg: 'bg-green-50', label: 'SAFE' },
    suspicious: { icon: '⚠️', color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'SUSPICIOUS' },
  };

  const c = config[result.verdict];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-4 border-b">
        <button onClick={() => onNavigate('home')} className="text-blue-600">← Back</button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className={`${c.bg} border-2 rounded-xl p-6 mb-6 text-center`}>
          <div className="text-5xl mb-3">{c.icon}</div>
          <h1 className={`text-3xl font-bold ${c.color}`}>{c.label}</h1>
          <p className="mt-2">{result.confidence}% confidence</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => { onSave(); onNavigate('home'); }}
            className="w-full bg-green-500 text-white font-bold py-3 rounded-lg"
          >
            💾 Save to History
          </button>
          <button onClick={() => onNavigate('scan')} className="w-full bg-gray-100 text-gray-900 font-bold py-3 rounded-lg">
            🔍 Check Another
          </button>
        </div>
      </div>
    </div>
  );
}