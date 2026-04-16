'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type Page = 'language' | 'home' | 'scan' | 'results' | 'history' | 'settings';
type Verdict = 'scam' | 'suspicious' | 'safe';
type Lang = 'en' | 'ms' | 'zh-s' | 'ta';

interface Result {
  id: number;
  verdict: Verdict;
  confidence: number;
  reason: string;
  tactics: string[];
  text: string;
  isImage: boolean;
  timestamp: number;
}

const FREE_LIMIT = 10;

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ms', label: '🇲🇾 Bahasa Melayu' },
  { code: 'zh-s', label: '🇨🇳 中文简体' },
  { code: 'ta', label: '🇮🇳 தமிழ்' },
];

const T: Record<Lang, Record<string, string>> = {
  en: {
    selectLang: 'Select Your Language', privacy: '🔒 All analysis stays on your device',
    headline: 'Is This A Scam?', sub: 'Check suspicious messages instantly',
    analyzeBtn: '🔍 Analyze Now', historyBtn: '📋 View History', back: '← Back',
    textTab: 'Paste Text', photoTab: 'Upload Photo',
    placeholder: 'Paste suspicious message here...',
    analyze: '🔍 Analyze', analyzing: '⏳ Analyzing...',
    uploadPhoto: '📷 Choose Screenshot',
    scam: 'SCAM', suspicious: 'SUSPICIOUS', safe: 'SAFE',
    confidence: 'confidence', whyFlagged: 'Why flagged:',
    tacticsFound: 'Tactics detected:', save: '💾 Save to History',
    checkAnother: '🔍 Check Another', noHistory: 'No scans yet',
    settings: 'Settings', language: 'Language',
    usageTitle: 'Usage This Month', usageDesc: 'free AI scans remaining',
    premiumSoon: '⭐ Premium coming soon — unlimited scans + priority analysis',
    limitReached: '⚠️ Free limit reached. Using basic detection this month.',
    limitInfo: 'Premium coming soon for unlimited AI scans.',
    deleteAll: '🗑️ Clear All History', aiAnalysis: 'AI Analysis',
    basicAnalysis: 'Basic Analysis (AI limit reached)',
  },
  ms: {
    selectLang: 'Pilih Bahasa Anda', privacy: '🔒 Semua analisis kekal di peranti anda',
    headline: 'Adakah Ini Scam?', sub: 'Semak mesej mencurigakan dengan segera',
    analyzeBtn: '🔍 Analisis Sekarang', historyBtn: '📋 Lihat Sejarah', back: '← Kembali',
    textTab: 'Tampal Teks', photoTab: 'Muat Naik Foto',
    placeholder: 'Tampal mesej mencurigakan di sini...',
    analyze: '🔍 Analisis', analyzing: '⏳ Menganalisis...',
    uploadPhoto: '📷 Pilih Tangkapan Skrin',
    scam: 'SCAM', suspicious: 'MENCURIGAKAN', safe: 'SELAMAT',
    confidence: 'keyakinan', whyFlagged: 'Sebab ditandakan:',
    tacticsFound: 'Taktik dikesan:', save: '💾 Simpan ke Sejarah',
    checkAnother: '🔍 Semak Lagi', noHistory: 'Tiada imbasan lagi',
    settings: 'Tetapan', language: 'Bahasa',
    usageTitle: 'Penggunaan Bulan Ini', usageDesc: 'imbasan AI percuma berbaki',
    premiumSoon: '⭐ Premium akan datang — imbasan tanpa had',
    limitReached: '⚠️ Had percuma dicapai. Menggunakan pengesanan asas.',
    limitInfo: 'Premium akan datang untuk imbasan AI tanpa had.',
    deleteAll: '🗑️ Padam Semua Sejarah', aiAnalysis: 'Analisis AI',
    basicAnalysis: 'Analisis Asas (had AI dicapai)',
  },
  'zh-s': {
    selectLang: '选择您的语言', privacy: '🔒 所有分析保留在您的设备上',
    headline: '这是诈骗吗?', sub: '立即检查可疑信息',
    analyzeBtn: '🔍 立即分析', historyBtn: '📋 查看历史', back: '← 返回',
    textTab: '粘贴文字', photoTab: '上传照片',
    placeholder: '在此粘贴可疑消息...',
    analyze: '🔍 分析', analyzing: '⏳ 正在分析...',
    uploadPhoto: '📷 选择截图',
    scam: '诈骗', suspicious: '可疑', safe: '安全',
    confidence: '置信度', whyFlagged: '标记原因:',
    tacticsFound: '检测到的手段:', save: '💾 保存到历史',
    checkAnother: '🔍 检查另一个', noHistory: '还没有扫描',
    settings: '设置', language: '语言',
    usageTitle: '本月使用情况', usageDesc: '免费AI扫描剩余',
    premiumSoon: '⭐ 即将推出高级版 — 无限扫描',
    limitReached: '⚠️ 已达免费限制。使用基本检测。',
    limitInfo: '即将推出高级版，提供无限AI扫描。',
    deleteAll: '🗑️ 清除所有历史', aiAnalysis: 'AI分析',
    basicAnalysis: '基本分析（已达AI限制）',
  },
  ta: {
    selectLang: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்', privacy: '🔒 அனைத்து பகுப்பாய்வும் உங்கள் சாதனத்தில்',
    headline: 'இது மோசடியா?', sub: 'சந்தேகத்திற்குரிய செய்திகளை உடனே சரிபார்க்கவும்',
    analyzeBtn: '🔍 இப்போது பகுப்பாய்வு செய்யவும்', historyBtn: '📋 வரலாற்றைப் பார்க்கவும்', back: '← திரும்பவும்',
    textTab: 'உரையை ஒட்டவும்', photoTab: 'புகைப்படம் பதிவேற்றவும்',
    placeholder: 'சந்தேகத்திற்குரிய செய்தியை இங்கே ஒட்டவும்...',
    analyze: '🔍 பகுப்பாய்வு', analyzing: '⏳ பகுப்பாய்வு செய்கிறது...',
    uploadPhoto: '📷 ஸ்கிரீன்ஷாட் தேர்ந்தெடுக்கவும்',
    scam: 'மோசடி', suspicious: 'சந்தேகம்', safe: 'பாதுகாப்பான',
    confidence: 'நம்பிக்கை', whyFlagged: 'ஏன் கொடியிடப்பட்டது:',
    tacticsFound: 'கண்டறியப்பட்ட தந்திரங்கள்:', save: '💾 வரலாற்றில் சேமிக்கவும்',
    checkAnother: '🔍 மற்றொன்றை சரிபார்க்கவும்', noHistory: 'இன்னும் ஸ்கேன் இல்லை',
    settings: 'அமைப்புகள்', language: 'மொழி',
    usageTitle: 'இந்த மாத பயன்பாடு', usageDesc: 'இலவச AI ஸ்கேன்கள் மீதமுள்ளன',
    premiumSoon: '⭐ பிரீமியம் விரைவில் — வரம்பற்ற ஸ்கேன்கள்',
    limitReached: '⚠️ இலவச வரம்பை அடைந்தது. அடிப்படை கண்டறிதல் பயன்படுத்தப்படுகிறது.',
    limitInfo: 'வரம்பற்ற AI ஸ்கேன்களுக்கு பிரீமியம் விரைவில்.',
    deleteAll: '🗑️ அனைத்து வரலாற்றையும் அழிக்கவும்', aiAnalysis: 'AI பகுப்பாய்வு',
    basicAnalysis: 'அடிப்படை பகுப்பாய்வு (AI வரம்பை அடைந்தது)',
  },
};

const VERDICT_STYLE: Record<Verdict, { icon: string; color: string; bg: string; border: string; bar: string }> = {
  scam:       { icon: '🚨', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    bar: 'bg-red-500' },
  suspicious: { icon: '⚠️', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', bar: 'bg-yellow-500' },
  safe:       { icon: '✅', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  bar: 'bg-green-500' },
};

const HISTORY_KEY = 'itsascam_history';
const usageKey = () => `itsascam_usage_${new Date().toISOString().slice(0, 7)}`;
const LANG_KEY = 'itsascam_lang';

const loadHistory = (): Result[] => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } };
const persistHistory = (h: Result[]) => localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
const loadUsage = (): number => parseInt(localStorage.getItem(usageKey()) || '0');
const bumpUsage = () => localStorage.setItem(usageKey(), String(loadUsage() + 1));

function keywordFallback(text: string): Pick<Result, 'verdict' | 'confidence' | 'reason' | 'tactics'> {
  const t = text.toLowerCase();
  let score = 0;
  const tactics: string[] = [];
  if (/urgent|segera|立即|உடனே|act now|immediately/.test(t))                          { score += 25; tactics.push('urgency'); }
  if (/bit\.ly|tinyurl|http:\/\/|goo\.gl/.test(t))                                    { score += 30; tactics.push('phishing_link'); }
  if (/(dbs|maybank|cimb|uob|bsn|rhb|ocbc).{0,30}(account|akaun|verify|suspend)/.test(t)) { score += 35; tactics.push('impersonation'); }
  if (/\botp\b|password|kata sandi|密码|\bpin\b|\bcvv\b/.test(t))                     { score += 30; tactics.push('credential_harvesting'); }
  if (/won|winner|prize|lucky|congratulations|tahniah/.test(t))                        { score += 25; tactics.push('prize_scam'); }
  const confidence = Math.min(score, 100);
  const verdict: Verdict = score >= 60 ? 'scam' : score >= 35 ? 'suspicious' : 'safe';
  return { verdict, confidence, reason: tactics.length ? `Detected: ${tactics.join(', ')}` : 'No threats found', tactics };
}

export default function App() {
  const [page, setPage]               = useState<Page>('language');
  const [lang, setLang]               = useState<Lang>('en');
  const [tab, setTab]                 = useState<'text' | 'photo'>('text');
  const [inputText, setInputText]     = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [result, setResult]           = useState<Result | null>(null);
  const [history, setHistory]         = useState<Result[]>([]);
  const [usage, setUsage]             = useState(0);
  const [mounted, setMounted]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useCallback((k: string) => T[lang][k] ?? T.en[k], [lang]);

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
    if (savedLang) { setLang(savedLang); setPage('home'); }
    setHistory(loadHistory());
    setUsage(loadUsage());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const remaining = FREE_LIMIT - usage;
  const limitReached = usage >= FREE_LIMIT;

  const selectLang = (l: Lang) => { setLang(l); localStorage.setItem(LANG_KEY, l); setPage('home'); };

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      setImagePreview(url);
      setImageBase64(url.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    setLoading(true); setError('');
    try {
      let partial: Pick<Result, 'verdict' | 'confidence' | 'reason' | 'tactics'>;

      if (limitReached) {
        partial = keywordFallback(inputText);
      } else {
        const res = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: inputText, imageBase64, language: lang }),
});
const data = await res.json();
if (!res.ok) throw new Error(data.error || 'Analysis failed');
partial = data;
        bumpUsage();
        setUsage(loadUsage());
      }

      setResult({
        ...partial,
        id: Date.now(),
        timestamp: Date.now(),
        isImage: !!imageBase64,
        text: imageBase64 ? '[Screenshot]' : inputText,
      });
      setPage('results');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveResult = () => {
    if (!result) return;
    const updated = [result, ...history].slice(0, 50);
    setHistory(updated); persistHistory(updated); setPage('home');
  };

  const deleteItem = (id: number) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated); persistHistory(updated);
  };

  const resetScan = () => { setInputText(''); setImageBase64(null); setImagePreview(null); setError(''); setPage('scan'); };

  const Header = ({ title, back = true }: { title?: string; back?: boolean }) => (
    <div className="sticky top-0 bg-white border-b border-black z-10">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        {back
  ? <button onClick={() => setPage('home')} className="text-blue-600 font-medium">{t('back')}</button>
  : <span className="text-xl font-bold text-black">IsThisAScam</span>}
{title && <span className="font-semibold text-black">{title}</span>}
        <button onClick={() => setPage('settings')} className="text-xl">⚙️</button>
      </div>
    </div>
  );

  if (page === 'language') return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8"><div className="text-6xl mb-3">❓</div><h1 className="text-2xl font-bold">IsThisAScam</h1></div>
        <p className="text-center font-semibold text-black mb-4">{t('selectLang')}</p>
        <div className="space-y-2 mb-6">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => selectLang(l.code)}
              className="w-full py-3 px-4 rounded-xl border-2 border-black hover:border-red-400 hover:bg-red-50 font-medium text-left transition text-black">
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-black">{t('privacy')}</p>
      </div>
    </div>
  );

  if (page === 'home') return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <Header back={false} />
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="text-7xl mb-4">❓</div>
        <h1 className="text-2xl font-bold text-black">IsThisAScam</h1>
        <p className="text-black mb-8">{t('sub')}</p>
        {limitReached && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6 text-sm text-yellow-800">{t('limitReached')}</div>
        )}
        <div className="space-y-3 mb-8">
          <button onClick={() => setPage('scan')} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-lg transition">
            {t('analyzeBtn')}
          </button>
          <button onClick={() => setPage('history')} className="w-full bg-white hover:bg-gray-50 border-2 border-black text-black font-bold py-4 rounded-xl text-lg transition">
            {t('historyBtn')}
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 border border-black text-sm text-black">{t('premiumSoon')}</div>
      </div>
    </div>
  );

  if (page === 'scan') return (
    <div className="min-h-screen bg-white">
      <Header title={tab === 'text' ? t('textTab') : t('photoTab')} />
      <div className="max-w-lg mx-auto px-4 py-6">

        <div className="flex justify-between text-xs text-black mb-1">
          <span>{t('usageTitle')}</span>
          <span>{Math.max(remaining, 0)} {t('usageDesc')}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
          <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((usage / FREE_LIMIT) * 100, 100)}%` }} />
        </div>

        <div className="flex gap-2 mb-5">
          {(['text', 'photo'] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition ${tab === tb ? 'bg-red-500 text-white' : 'bg-gray-100 text-black'}`}>
              {tb === 'text' ? t('textTab') : t('photoTab')}
            </button>
          ))}
        </div>

        {tab === 'text' ? (
          <div>
            <textarea value={inputText} onChange={e => setInputText(e.target.value.slice(0, 2000))}
              placeholder={t('placeholder')}
              className="w-full h-44 p-4 border-2 border-black rounded-xl focus:border-red-400 focus:outline-none resize-none text-sm" />
            <p className="text-xs text-black mt-1 text-right">{inputText.length}/2000</p>
          </div>
        ) : (
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} />
            {imagePreview
              ? <img src={imagePreview} alt="preview" className="w-full rounded-xl mb-3 border border-black max-h-64 object-contain" />
              : <div onClick={() => fileRef.current?.click()}
                  className="w-full h-44 border-2 border-dashed border-black rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-red-400 transition">
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-black text-sm">{t('uploadPhoto')}</span>
                </div>
            }
            {imagePreview && (
              <button onClick={() => fileRef.current?.click()} className="w-full py-2 text-sm text-blue-600 underline">{t('uploadPhoto')}</button>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-3">⚠️ {error}</p>}

        <button onClick={analyze} disabled={loading || (!inputText.trim() && !imageBase64)}
          className="w-full mt-4 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition">
          {loading ? t('analyzing') : t('analyze')}
        </button>

        {limitReached && <p className="text-center text-xs text-black mt-3">{t('limitInfo')}</p>}
      </div>
    </div>
  );

  if (page === 'results' && result) {
    const v = VERDICT_STYLE[result.verdict];
    return (
      <div className="min-h-screen bg-white">
        <Header title="Result" />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className={`${v.bg} ${v.border} border-2 rounded-2xl p-6 text-center mb-5`}>
            <div className="text-5xl mb-2">{v.icon}</div>
            <h1 className={`text-3xl font-bold ${v.color}`}>{t(result.verdict)}</h1>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-white rounded-full h-2 border border-black">
                <div className={`h-2 rounded-full ${v.bar}`} style={{ width: `${result.confidence}%` }} />
              </div>
              <span className="text-sm font-bold text-black">{result.confidence}% {t('confidence')}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-black uppercase mb-1">{limitReached ? t('basicAnalysis') : t('aiAnalysis')}</p>
            <p className="text-sm text-black">{result.reason}</p>
          </div>

          {result.tactics?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-black uppercase mb-2">{t('tacticsFound')}</p>
              <div className="flex flex-wrap gap-2">
                {result.tactics.map(tactic => (
                  <span key={tactic} className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full">
                    {tactic.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button onClick={saveResult} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition">{t('save')}</button>
            <button onClick={resetScan} className="w-full bg-gray-100 hover:bg-gray-200 font-bold py-3 rounded-xl transition">{t('checkAnother')}</button>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'history') return (
    <div className="min-h-screen bg-white">
      <Header title="History" />
      <div className="max-w-lg mx-auto px-4 py-6">
        {history.length === 0
          ? <div className="text-center py-20"><p className="text-5xl mb-4">📋</p><p className="-text-black">{t('noHistory')}</p></div>
          : <>
              <div className="space-y-3 mb-6">
                {history.map(item => {
                  const v = VERDICT_STYLE[item.verdict];
                  return (
                    <div key={item.id} className={`${v.bg} ${v.border} border rounded-xl p-4 flex justify-between items-start`}>
                      <div className="flex-1 mr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{v.icon}</span>
                          <span className={`font-bold text-sm ${v.color}`}>{t(item.verdict)}</span>
                          <span className="text-xs text-black">{item.confidence}%</span>
                          {item.isImage && <span className="text-xs bg-gray-200 px-1.5 rounded">📷</span>}
                        </div>
                        <p className="text-xs text-black truncate">{item.text.substring(0, 60)}</p>
                        <p className="text-xs text-black mt-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => deleteItem(item.id)} className="text-black hover:text-red-500 text-lg">🗑️</button>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { setHistory([]); persistHistory([]); }} className="w-full py-3 border-2 border-red-200 text-red-500 rounded-xl font-medium">
                {t('deleteAll')}
              </button>
            </>
        }
      </div>
    </div>
  );

  if (page === 'settings') return (
    <div className="min-h-screen bg-white">
      <Header title={t('settings')} />
      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-xs font-semibold text-black uppercase mb-3">{t('language')}</p>
        <div className="space-y-2 mb-8">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => selectLang(l.code)}
              className={`w-full p-3.5 rounded-xl border-2 font-medium text-left transition text-black ${lang === l.code ? 'border-red-500 bg-red-50 text-red-600' : 'border-black'}`}
              {l.label} {lang === l.code && '✓'}
            </button>
          ))}
        </div>

        <p className="text-xs font-semibold text-black uppercase mb-3">{t('usageTitle')}</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-2">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-black">{usage} / {FREE_LIMIT} AI scans used</span>
            <span className="text-sm font-bold text-red-500">{Math.max(remaining, 0)} left</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((usage / FREE_LIMIT) * 100, 100)}%` }} />
          </div>
        </div>
        <p className="text-xs text-black text-center mt-2">{t('premiumSoon')}</p>
      </div>
    </div>
  );

  return null;
}