'use client';

import { useState, useEffect } from 'react';
import type { Lang } from '@/lib/types';
import { TACTIC_LABELS } from '@/lib/translations';
import { SCAM_LESSONS } from '@/lib/constants';

export function LearnPage({ lang, t, onBack }: { lang: Lang; t: (k: string) => string; onBack: () => void }) {
  const [intelItems, setIntelItems] = useState<any[]>([]);
  const [intelLoading, setIntelLoading] = useState(true);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    fetch('/api/intel')
      .then(r => r.json())
      .then(data => { setIntelItems(data); setIntelLoading(false); })
      .catch(() => setIntelLoading(false));
  }, []);

  const getSummary  = (item: any) => lang === 'ms' ? item.summary_ms  : lang === 'zh-s' ? item.summary_zh  : lang === 'ta' ? item.summary_ta  : item.summary_en;
  const getHeadline = (item: any) => lang === 'ms' && item.headline_ms ? item.headline_ms : lang === 'zh-s' && item.headline_zh ? item.headline_zh : lang === 'ta' && item.headline_ta ? item.headline_ta : item.headline;
  const getShareText = (item: any) => lang === 'ms' ? item.share_text_ms : lang === 'zh-s' ? item.share_text_zh : lang === 'ta' ? item.share_text_ta : item.share_text_en;

  const handleShare = (item: any) => {
    const text = getShareText(item) || getSummary(item);
    if (navigator.share) navigator.share({ title: item.headline, text });
    else { navigator.clipboard.writeText(text); alert('Copied to clipboard!'); }
  };

  const statusIcon = (status: string) => status === 'emerging' ? '🚨' : status === 'active' ? '⚠️' : '✅';

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-blue-600 font-medium">{t('back')}</button>
          <span className="font-semibold text-gray-900">{t('learnTitle')}</span>
          <div />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-6">{t('learnSub')}</p>

        {/* Latest Scam Alerts */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-1">🔴 Latest Scam Alerts</h2>
          <p className="text-xs text-gray-500 mb-4">AI-curated from Malaysian news sources · Updated daily</p>

          {intelLoading && <div className="text-center py-6 text-gray-400 text-sm">Loading alerts...</div>}
          {!intelLoading && intelItems.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">No alerts yet</div>}

          <div className="space-y-3">
            {intelItems.slice(0, showAllAlerts ? intelItems.length : 3).map((item, i) => (
              <div key={i} className={`rounded-xl border p-4 ${item.status === 'emerging' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 flex-wrap flex-1 mr-2">
                    <span className="text-xs font-bold">
                      {statusIcon(item.status)} {item.status === 'emerging' ? t('emerging') : item.status === 'active' ? t('active') : t('resolved')}
                    </span>
                    {item.tactic_tags?.slice(0, 2).map((tag: string) => (
                      <span key={tag} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {TACTIC_LABELS[tag]?.[lang] || tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                  {item.occurrence_count > 2 && <span className="text-xs text-gray-400 shrink-0">{item.occurrence_count}x reported</span>}
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{getHeadline(item)}</p>
                <p className="text-xs text-gray-600 mb-3">{getSummary(item)}</p>
                <div className="flex gap-2 text-xs text-gray-400 mb-3">
                  {item.platform && <span>📱 {item.platform}</span>}
                  {item.target_demographic && <span>👥 {item.target_demographic}</span>}
                </div>
                <div className="flex gap-2">
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold py-2 rounded-lg transition text-center">
                      {t('readArticle')}
                    </a>
                  )}
                  <button onClick={() => handleShare(item)}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold py-2 rounded-lg transition">
                    {t('shareWarning')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {intelItems.length > 3 && (
            <button onClick={() => setShowAllAlerts(!showAllAlerts)}
              className="w-full mt-3 py-2 text-sm text-red-500 font-semibold border border-red-200 rounded-xl hover:bg-red-50 transition">
              {showAllAlerts ? '▲ Show less' : `▼ Show all ${intelItems.length} alerts`}
            </button>
          )}
        </div>

        {/* Scam Guide */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-1">📚 Scam Guide</h2>
          <p className="text-xs text-gray-500 mb-4">Learn how common scams work</p>
          <div className="space-y-4">
            {SCAM_LESSONS.map((lesson, i) => (
              <details key={i} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <summary className="p-4 cursor-pointer font-semibold text-gray-900 flex justify-between items-center">
                  <span>{t(`lesson${i + 1}Title`)}</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full ml-2 shrink-0">{t(`lesson${i + 1}Tag`)}</span>
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-900 mb-3">{lesson.content}</p>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-900 mb-1">Example:</p>
                    <p className="text-xs text-gray-900 whitespace-pre-line">{lesson.example}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Helplines */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-gray-900 mb-1">🚨 {t('reportScams')}</p>
          <p className="text-xs text-gray-900">🚨 NSRC (Scam Emergency): <strong>997</strong> (24/7)</p>
          <p className="text-xs text-gray-900">🏦 BNM LINK: <strong>1-300-88-5465</strong></p>
          <p className="text-xs text-gray-900">🏦 {t('yourBank')}</p>
          <p className="text-xs text-gray-900">👮 Police (CCID): <strong>03-2610 1559</strong></p>
          <p className="text-xs text-gray-900">📡 MCMC Hotline: <strong>1-800-188-030</strong></p>
          <p className="text-xs text-gray-900">🌐 MCMC Online: <strong>aduan.mcmc.gov.my</strong></p>
          <p className="text-xs text-gray-900">🔍 Semak Mule: <strong>ccid.rmp.gov.my</strong></p>
        </div>
      </div>
    </div>
  );
}
