'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Page, Lang, Verdict, Result } from '@/lib/types';
import { T, LANGS } from '@/lib/translations';
import {
  FREE_LIMIT, VERDICT_STYLE, SCAM_LESSONS,
  HISTORY_KEY, LANG_KEY, CONSENT_KEY, DISCLAIMER_KEY, DEVICE_KEY, ONBOARDING_KEY, DARK_MODE_KEY,
  usageKey, loadHistory, persistHistory, loadUsage, bumpUsage, getDeviceId,
} from '@/lib/constants';
import { FeedbackPage } from '@/app/components/FeedbackPage';
import { LearnPage } from '@/app/components/LearnPage';

export default function App() {
  const [page, setPage]                 = useState<Page>('language');
  const [lang, setLang]                 = useState<Lang>('en');
  const [tab, setTab]                   = useState<'text' | 'photo'>('text');
  const [inputText, setInputText]       = useState('');
  const [imageBase64, setImageBase64]   = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [result, setResult]             = useState<Result | null>(null);
  const [history, setHistory]           = useState<Result[]>([]);
  const [usage, setUsage]               = useState(0);
  const [mounted, setMounted]           = useState(false);
  const [showConsent, setShowConsent]   = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [feedback, setFeedback]         = useState<'pending' | 'given' | null>(null);
  const [showMarkAs, setShowMarkAs]     = useState(false);
  const [darkMode, setDarkMode]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useCallback((k: string) => T[lang][k] ?? T.en[k], [lang]);

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
    if (savedLang) { setLang(savedLang); setPage('home'); }
    setHistory(loadHistory());
    setUsage(loadUsage());
    const hasConsent = localStorage.getItem(CONSENT_KEY);
    if (!hasConsent && savedLang) setShowConsent(true);
    const hasDisclaimer = localStorage.getItem(DISCLAIMER_KEY);
    if (!hasDisclaimer && savedLang) setShowDisclaimer(true);
    // Sync dark mode React state with DOM class applied by the anti-flash script
    const savedDark = localStorage.getItem(DARK_MODE_KEY) === 'true';
    setDarkMode(savedDark);
    setMounted(true);
  }, []);

  // Clear inputs every time scan page is entered
  useEffect(() => {
    if (page === 'scan') {
      setInputText('');
      setImageBase64(null);
      setImagePreview(null);
      setError('');
      setTab('text');
    }
  }, [page]);

  if (!mounted) return null;

  const remaining = FREE_LIMIT - usage;
  const limitReached = usage >= FREE_LIMIT;

const selectLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem(LANG_KEY, l);
    if (!localStorage.getItem(ONBOARDING_KEY)) setShowOnboarding(true);
    if (!localStorage.getItem(CONSENT_KEY)) setShowConsent(true);
    if (!localStorage.getItem(DISCLAIMER_KEY)) setShowDisclaimer(true);
    setPage('home');
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem(DARK_MODE_KEY, String(next));
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleRateApp = () => {
    const appId = 'com.jagatech.isthisascam';
    const marketUrl = `market://details?id=${appId}`;
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${appId}`;
    try {
      const isAndroid = /android/i.test(navigator.userAgent);
      // On Android, use market:// so the Play Store app opens directly.
      // The '_system' target tells Capacitor to route via Android Intent.
      // On web/other platforms, open the Play Store web page instead.
      window.open(isAndroid ? marketUrl : playStoreUrl, '_system');
    } catch {
      // Fallback: open Play Store web URL in a new tab
      window.open(playStoreUrl, '_blank');
    }
  };

  const handleConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setShowConsent(false);
  };

 const handleImage = (file: File) => {
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large. Please use an image under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      // Convert to JPEG via canvas to ensure compatibility
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Resize if too large (max 1920px wide)
        const maxWidth = 1920;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const jpegUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImagePreview(jpegUrl);
        setImageBase64(jpegUrl.split(',')[1]);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
  setLoading(true); setError(''); setFeedback(null);

  if (limitReached) {
    setError('monthly_limit');
    setLoading(false);
    return;
  }

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
  text: tab === 'text' ? inputText : '', 
  imageBase64: tab === 'photo' ? imageBase64 : null, 
  language: lang, 
  deviceId: getDeviceId() 
}),
    });

    const data = await res.json();

    if (res.status === 429) throw new Error('rate_limit');
    if (!res.ok) throw new Error(data.error || 'Analysis failed');

    const partial = data;
    bumpUsage();
    setUsage(loadUsage());

    setResult({
      ...partial,
      id: Date.now(),
      timestamp: Date.now(),
      isImage: !!imageBase64,
      text: imageBase64 ? (partial.storedText || '[Screenshot]') : inputText,
    });
    setFeedback('pending');
    setPage('results');
  } catch (e: any) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};


  const submitFeedback = async (isCorrect: boolean, correctVerdict?: Verdict) => {
    if (!result) { console.log('No result'); return; }
    setFeedback('given');
    setShowMarkAs(false);
    const payload = {
      scanId: result.scanId || null,
      correctVerdict: isCorrect ? result.verdict : correctVerdict,
      originalVerdict: result.verdict,
      originalText: result.text,
      deviceId: getDeviceId(),
    };
    console.log('Submitting feedback:', payload);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('Feedback response:', data);
    } catch (e: any) {
      console.error('Feedback error:', e.message);
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

  const goToScan = () => setPage('scan');

  const Header = ({ title, back = true, backTo = 'home' as Page }: { title?: string; back?: boolean; backTo?: Page }) => (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        {back
          ? <button onClick={() => setPage(backTo)} className="text-blue-600 font-medium">{t('back')}</button>
          : <span className="text-xl font-bold text-gray-900">IsThisAScam</span>}
        {title && <span className="font-semibold text-gray-900">{title}</span>}
        <button onClick={() => setPage('settings')} className="text-xl">⚙️</button>
      </div>
    </div>
  );

  const OnboardingModal = () => (
  <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-end justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
      <div className="p-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🛡️</div>
          <h2 className="text-xl font-bold text-gray-900">{t('onboardingTitle')}</h2>
        </div>

        <div className="mb-4">
          <p className="font-semibold text-green-700 mb-2">{t('onboardingCan')}</p>
          <ul className="space-y-1.5">
            {['onboardingCan1','onboardingCan2','onboardingCan3','onboardingCan4'].map(k => (
              <li key={k} className="flex gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5 shrink-0">•</span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <p className="font-semibold text-orange-600 mb-2">{t('onboardingCannot')}</p>
          <ul className="space-y-1.5">
            {['onboardingCannot1','onboardingCannot2','onboardingCannot3','onboardingCannot4'].map(k => (
              <li key={k} className="flex gap-2 text-sm text-gray-700">
                <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-5">
          <p className="font-semibold text-blue-700 mb-2">{t('onboardingHow')}</p>
          <ol className="space-y-1.5">
            {['onboardingHow1','onboardingHow2','onboardingHow3','onboardingHow4','onboardingHow5','onboardingHow6'].map((k, i) => (
              <li key={k} className="flex gap-2 text-sm text-gray-700">
                <span className="text-blue-500 font-bold shrink-0">{i+1}.</span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs text-gray-400 text-center mb-4">
          ⚠️ {t('aiDisclaimer')}
        </p>

        <button
          onClick={() => {
            localStorage.setItem(ONBOARDING_KEY, 'true');
            setShowOnboarding(false);
          }}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl text-base transition">
          {t('onboardingBtn')}
        </button>
      </div>
    </div>
  </div>
);

  const ConsentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-3">{t('consentTitle')}</h2>
        <p className="text-sm text-gray-900 mb-4 leading-relaxed">{t('consentBody')}</p>
        <p className="text-xs text-gray-900 mb-5">🏛️ {t('consentPDPA')}</p>
        
        <button onClick={handleConsent} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl">
          {t('consentAgree')}
        </button>
      </div>
    </div>
  );

const DisclaimerModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-3">⚠️ {t('disclaimerTitle')}</h2>
        <p className="text-xs text-gray-900 mb-4 leading-relaxed whitespace-pre-line">{t('disclaimerBody')}</p>
        <p className="text-xs text-gray-500 mb-4 italic">* English version prevails in case of discrepancy between translations.</p>
        <button onClick={() => { localStorage.setItem(DISCLAIMER_KEY, 'true'); setShowDisclaimer(false); }}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl">
          {t('disclaimerAgree')}
        </button>
      </div>
    </div>
  );

  if (page === 'language') return (
    <>
     {showOnboarding && <OnboardingModal />}
      {showConsent && <ConsentModal />}
      {showDisclaimer && <DisclaimerModal />}
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">❓</div>
            <h1 className="text-2xl font-bold text-gray-900">IsThisAScam</h1>
          </div>
          <p className="text-center font-semibold text-gray-900 mb-4">{t('selectLang')}</p>
          <div className="space-y-2 mb-6">
            {LANGS.map(l => (
              <button key={l.code} onClick={() => selectLang(l.code)}
                className="w-full py-3 px-4 rounded-xl border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 font-medium text-left transition text-gray-900">
                {l.label}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-900">{t('privacy')}</p>
        </div>
      </div>
    </>
  );

  if (page === 'home') return (
    <>
      {showOnboarding && <OnboardingModal />}
      {showConsent && <ConsentModal />}
      {showDisclaimer && <DisclaimerModal />}
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <Header back={false} />
        <div className="max-w-lg mx-auto px-4 py-10 text-center">
          <div className="text-7xl mb-4">❓</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('headline')}</h1>
          <p className="text-gray-900 mb-8">{t('sub')}</p>
          {limitReached && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6 text-sm text-yellow-800">{t('limitReached')}</div>
          )}
          <div className="space-y-3 mb-6">
            <button onClick={() => setPage('scan')} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-lg transition">
              {t('analyzeBtn')}
            </button>
            <button onClick={() => setPage('history')} className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-900 font-bold py-4 rounded-xl text-lg transition">
              {t('historyBtn')}
            </button>
            <button onClick={() => setPage('learn')} className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-900 font-bold py-4 rounded-xl text-lg transition">
              {t('learnBtn')}
            </button>
            <button onClick={() => setPage('feedback')}
  className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-900 font-bold py-4 rounded-xl text-lg transition">
  {t('feedbackBtn')}
</button>
          </div>
          </div>
          
        </div>
    </>
  );

  if (page === 'scan') return (
    <div className="min-h-screen bg-white">
      <Header title={tab === 'text' ? t('textTab') : t('photoTab')} />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex justify-between text-xs text-gray-900 mb-1">
          <span>{t('usageTitle')}</span>
          <span>{Math.max(remaining, 0)} {t('usageDesc')}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
          <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((usage / FREE_LIMIT) * 100, 100)}%` }} />
        </div>
        <div className="flex gap-2 mb-5">
          {(['text', 'photo'] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition ${tab === tb ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
              {tb === 'text' ? t('textTab') : t('photoTab')}
            </button>
          ))}
        </div>
        {tab === 'text' ? (
          <div>
            <textarea value={inputText} onChange={e => setInputText(e.target.value.slice(0, 2000))}
              placeholder={t('placeholder')}
              className="w-full h-44 p-4 border-2 border-gray-300 rounded-xl focus:border-red-400 focus:outline-none resize-none text-sm text-gray-900" />
            <p className="text-xs text-gray-900 mt-1 text-right">{inputText.length}/2000</p>
          </div>
        ) : (
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} />
            {imagePreview
              ? <img src={imagePreview} alt="preview" className="w-full rounded-xl mb-3 border border-gray-200 max-h-64 object-contain" />
              : <div onClick={() => fileRef.current?.click()}
                  className="w-full h-44 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-red-400 transition">
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-gray-900 text-sm">{t('uploadPhoto')}</span>
                </div>
            }
            {imagePreview && (
              <button onClick={() => fileRef.current?.click()} className="w-full py-2 text-sm text-blue-600 underline">{t('uploadPhoto')}</button>
            )}
          </div>
        )}
        {error && (
  <div className={`mt-3 rounded-xl p-4 text-sm ${
    error === 'rate_limit' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
    error === 'monthly_limit' ? 'bg-orange-50 border border-orange-200 text-orange-800' :
    'bg-red-50 border border-red-200 text-red-600'}`}>
    {error === 'rate_limit'
      ? '⚠️ Too many scans today. Please try again tomorrow.'
      : error === 'monthly_limit'
      ? '⚠️ You have used your 20 free AI scans this month. Premium coming soon for unlimited scans.'
      : `⚠️ ${error}`}
  </div>
)}
        <button onClick={analyze} disabled={loading || (!inputText.trim() && !imageBase64)}
          className="w-full mt-4 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition">
          {loading ? t('analyzing') : t('analyze')}
        </button>
        
      </div>
    </div>
  );

  if (page === 'results' && result) {
    const v = VERDICT_STYLE[result.verdict];

    // No text detected in image — ask user to retake
    if (result.verdict === 'no_text') return (
      <div className="min-h-screen bg-white">
        <Header title="Result" />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center mb-5">
            <div className="text-5xl mb-3">📷</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Readable Text Found</h1>
            <p className="text-gray-900 text-sm mb-4">The image doesn't contain clear text or a readable QR code. Please try again with a clearer photo.</p>
            <p className="text-xs text-gray-900">Tips: Ensure good lighting, hold camera steady, make sure text is in focus.</p>
          </div>
          <button onClick={goToScan} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl">
            📷 Try Again
          </button>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-white">
        <Header title="Result" />
        <div className="max-w-lg mx-auto px-4 py-6">
          
          <div className={`${v.bg} ${v.border} border-2 rounded-2xl p-6 text-center mb-5`}>
            <div className="text-5xl mb-2">{v.icon}</div>
            <h1 className={`text-3xl font-bold ${v.color}`}>{t(result.verdict)}</h1>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-white rounded-full h-2 border border-gray-200">
                <div className={`h-2 rounded-full ${v.bar}`} style={{ width: `${result.confidence}%` }} />
              </div>
              <span className="text-sm font-bold text-gray-900">{result.confidence}% {t('confidence')}</span>
            </div>
          </div>
          {result.isImage && result.text && result.text !== '[Screenshot]' && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
               <p className="text-xs font-semibold text-gray-900 uppercase mb-1">
                {result.isQRCode ? t('extractedURL') : 'Extracted Text'}
              </p>
                <p className="text-xs text-gray-900 break-all font-mono bg-white p-2 rounded border border-gray-200">
                {result.text}
                </p>
              {result.isQRCode && (
      <p className="text-xs text-red-600 mt-2 font-medium">{t('disclaimerQR')}</p>
    )}
  </div>
)}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-gray-900 uppercase mb-1">
  {t('aiAnalysis')}
</p>
            <p className="text-sm text-gray-900">{result.reason}</p>
          </div>
          {result.tactics?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-gray-900 uppercase mb-2">{t('tacticsFound')}</p>
              <div className="flex flex-wrap gap-2">
                {result.tactics.map(tactic => (
                  <span key={tactic} className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full">
                    {tactic.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
            {feedback === 'given' ? (
              <p className="text-sm text-blue-800 text-center font-medium">{t('feedbackThanks')}</p>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-900 mb-1">{t('feedbackTitle')}</p>
                <p className="text-xs text-gray-900 mb-3">{t('feedbackSub')}</p>
                {!showMarkAs ? (
                  <div className="flex gap-2">
                    <button onClick={() => submitFeedback(true)}
                      className="flex-1 bg-green-500 text-white font-semibold py-2 rounded-lg text-sm">
                      {t('thumbsUp')}
                    </button>
                    <button onClick={() => setShowMarkAs(true)}
                      className="flex-1 bg-red-100 text-red-700 font-semibold py-2 rounded-lg text-sm">
                      {t('thumbsDown')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-2">{t('markAs')}</p>
                    <div className="flex gap-2">
                      {(['scam', 'suspicious', 'safe'] as Verdict[]).filter(vv => vv !== result.verdict).map(vv => (
                        <button key={vv} onClick={() => submitFeedback(false, vv)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold ${VERDICT_STYLE[vv].bg} ${VERDICT_STYLE[vv].color} border ${VERDICT_STYLE[vv].border}`}>
                          {t(vv)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="space-y-3">
            <button onClick={saveResult} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition">{t('save')}</button>
            <button onClick={goToScan} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl transition">{t('checkAnother')}</button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">⚠️ {t('aiDisclaimer')}</p>
        </div>
      </div>
    );
  }

  if (page === 'history') return (
    <div className="min-h-screen bg-white">
      <Header title="History" />
      <div className="max-w-lg mx-auto px-4 py-6">
        {history.length === 0
          ? <div className="text-center py-20"><p className="text-5xl mb-4">📋</p><p className="text-gray-900">{t('noHistory')}</p></div>
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
                          <span className="text-xs text-gray-900">{item.confidence}%</span>
                          {item.isImage && <span className="text-xs bg-gray-200 text-gray-900 px-1.5 rounded">📷</span>}
                        </div>
                        <p className="text-xs text-gray-900 truncate">{item.text.substring(0, 60)}</p>
                        <p className="text-xs text-gray-900 mt-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => deleteItem(item.id)} className="text-gray-900 hover:text-red-500 text-lg">🗑️</button>
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

  if (page === 'learn') return (
    <LearnPage lang={lang} t={t} onBack={() => setPage('home')} />
  );
  
  if (page === 'settings') return (
    <div className="min-h-screen bg-white">
      {showDisclaimer && <DisclaimerModal />}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setPage('home')} className="text-blue-600 font-medium">{t('back')}</button>
          <span className="font-semibold text-gray-900">{t('settings')}</span>
          <div />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-xs font-semibold text-gray-900 uppercase mb-3">{t('language')}</p>
        <div className="space-y-2 mb-8">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => selectLang(l.code)}
              className={`w-full p-3.5 rounded-xl border-2 font-medium text-left transition text-gray-900 ${lang === l.code ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300 bg-white'}`}>
              {l.label} {lang === l.code && '✔'}
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-gray-900 uppercase mb-3">{t('usageTitle')}</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-2">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-900">{usage} / {FREE_LIMIT} AI scans used</span>
            <span className="text-sm font-bold text-red-500">{Math.max(remaining, 0)} left</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((usage / FREE_LIMIT) * 100, 100)}%` }} />
          </div>
        </div>
        
        <p className="text-xs font-semibold text-gray-900 uppercase mt-6 mb-3">{t('appearance')}</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{darkMode ? '🌙' : '☀️'}</span>
            <span className="text-sm font-medium text-gray-900">{t('darkMode')}</span>
          </div>
          <button
            onClick={toggleDarkMode}
            role="switch"
            aria-checked={darkMode}
            aria-label={t('darkMode')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${darkMode ? 'bg-red-500' : 'bg-gray-300'}`}
          >
            {/* inline style keeps the thumb white in both modes */}
            <span
              style={{ backgroundColor: 'white' }}
              className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform duration-200 ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        <a href="/terms" target="_blank" rel="noopener noreferrer"
  className="w-full mt-6 py-3 border-2 border-gray-400 rounded-xl text-sm text-gray-900 font-medium bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
  📄 {t('termsLink')}
</a>
        <a href="/privacy" target="_blank" rel="noopener noreferrer"
          className="w-full mt-3 py-3 border-2 border-gray-400 rounded-xl text-sm text-gray-900 font-medium bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
          🔒 {t('privacyPolicy')}
        </a>
        <button
          onClick={handleRateApp}
          className="w-full mt-3 py-3 border-2 border-yellow-400 rounded-xl text-sm text-gray-900 font-medium bg-yellow-50 hover:bg-yellow-100 flex items-center justify-center transition">
          ⭐ {t('rateApp')}
        </button>
      </div>
    </div>
  );

  if (page === 'feedback') return (
    <FeedbackPage lang={lang} onBack={() => setPage('home')} />
  );

  return null;
}