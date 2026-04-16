'use client';

interface HistoryPageProps {
  history: any[];
  language: string;
  onNavigate: (page: string) => void;
  onDelete: (id: number) => void;
}

export default function HistoryPage({ history, language, onNavigate, onDelete }: HistoryPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-4 border-b">
        <button onClick={() => onNavigate('home')} className="text-blue-600">← Back</button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">📋</p>
            <p className="text-gray-600">No scans yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="border-2 border-gray-200 rounded-lg p-4 flex justify-between">
                <div>
                  <p className="font-bold">{item.verdict === 'scam' ? '🚨' : item.verdict === 'safe' ? '✅' : '⚠️'} {item.verdict.toUpperCase()}</p>
                  <p className="text-sm text-gray-600 truncate">{item.text.substring(0, 50)}...</p>
                </div>
                <button onClick={() => onDelete(item.id)} className="text-red-600">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}