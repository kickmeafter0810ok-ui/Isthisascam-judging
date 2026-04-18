'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type Page = 'language' | 'home' | 'scan' | 'results' | 'history' | 'settings' | 'learn';
type Verdict = 'scam' | 'suspicious' | 'safe' | 'no_text';
type Lang = 'en' | 'ms' | 'zh-s' | 'ta';

interface Result {
  id: number;
  scanId?: string;
  storedText?: string;
  verdict: Verdict;
  confidence: number;
  reason: string;
  tactics: string[];
  text: string;
  isImage: boolean;
  timestamp: number;
  limitReached?: boolean;
  limitMessage?: string;
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
    selectLang: 'Select Your Language',
    privacy: '🔒 Your data is never stored. Analysis powered by AI.',
    headline: 'Is This A Scam?', sub: 'Check suspicious messages instantly',
    analyzeBtn: '🔍 Analyze Now', historyBtn: '📋 View History',
    learnBtn: '📚 Learn About Scams', back: '← Back',
    textTab: 'Paste Text', photoTab: '📷 Photo / QR Code',
    placeholder: 'Paste suspicious message here...',
    analyze: '🔍 Analyze', analyzing: '⏳ Analyzing...',
    uploadPhoto: '📷 Choose Screenshot',
    scam: 'SCAM', suspicious: 'SUSPICIOUS', safe: 'SAFE',
    confidence: 'confidence', tacticsFound: 'Tactics detected:',
    save: '💾 Save to History', checkAnother: '🔍 Check Another',
    noHistory: 'No scans yet', settings: 'Settings', language: 'Language',
    usageTitle: 'Usage This Month', usageDesc: 'free AI scans remaining',
    premiumSoon: '⭐ Premium coming soon — unlimited scans + priority analysis',
    limitReached: '⚠️ Free limit reached. Using basic detection this month.',
    limitInfo: 'Premium coming soon for unlimited AI scans.',
    deleteAll: '🗑️ Clear All History', aiAnalysis: 'AI Analysis',
    basicAnalysis: 'Basic Analysis (AI limit reached)',
    feedbackTitle: 'Was this correct?',
    feedbackSub: 'Your feedback helps protect other Malaysians from scams',
    thumbsUp: '✅ Yes, correct', thumbsDown: '❌ No, wrong',
    feedbackThanks: '🙏 Thank you! Your feedback improves our detection.',
    markAs: 'What should this be?',
    consentTitle: 'Before You Start',
    consentBody: 'IsThisAScam uses OpenAI\'s ChatGPT to analyze your messages. Your message content is transmitted to OpenAI (USA) for analysis and is subject to OpenAI\'s privacy policy (openai.com/privacy). We do not store your message content. Anonymous usage statistics (verdict, language, country) are collected via Supabase to improve our service. User feedback and corrections are reviewed by the IsThisAScam team to improve detection accuracy. By continuing, you consent to this data processing under Malaysian PDPA.',
    consentAgree: 'I Understand, Continue',
    consentPDPA: 'This complies with Malaysian PDPA guidelines.',
    learnTitle: '📚 Learn About Scams',
    learnSub: 'Stay protected — know the latest scam tactics',
    disclaimerTitle: 'Important Disclaimer',
    disclaimerBody: 'IsThisAScam is an AI-powered tool designed to help identify potentially suspicious messages. It is provided for informational purposes only.\n\n• Results are not guaranteed to be accurate\n• This app does not constitute legal or financial advice\n• Do not rely solely on this app to make decisions\n• Always verify with official sources (your bank, PDRM, MCMC)\n• The developer is not liable for any losses arising from use of this app\n\nBy using this app, you accept these terms.',
    disclaimerAgree: 'I Understand & Accept',
    disclaimerQR: '⚠️ QR Code detected. Never click unknown links. Verify with the official website directly.',
    extractedURL: 'URL found in QR:',
    aiDisclaimer: 'AI-powered analysis. Not guaranteed accurate. Always verify with official sources.',
    termsLink: 'Terms of Use',
  },
  ms: {
    selectLang: 'Pilih Bahasa Anda',
    privacy: '🔒 Data anda tidak disimpan. Analisis dikuasakan oleh AI.',
    headline: 'Adakah Ini Scam?', sub: 'Semak mesej mencurigakan dengan segera',
    analyzeBtn: '🔍 Analisis Sekarang', historyBtn: '📋 Lihat Sejarah',
    learnBtn: '📚 Pelajari Tentang Scam', back: '← Kembali',
    textTab: 'Tampal Teks', photoTab: '📷 Foto / Kod QR',
    placeholder: 'Tampal mesej mencurigakan di sini...',
    analyze: '🔍 Analisis', analyzing: '⏳ Menganalisis...',
    uploadPhoto: '📷 Pilih Tangkapan Skrin',
    scam: 'SCAM', suspicious: 'MENCURIGAKAN', safe: 'SELAMAT',
    confidence: 'keyakinan', tacticsFound: 'Taktik dikesan:',
    save: '💾 Simpan ke Sejarah', checkAnother: '🔍 Semak Lagi',
    noHistory: 'Tiada imbasan lagi', settings: 'Tetapan', language: 'Bahasa',
    usageTitle: 'Penggunaan Bulan Ini', usageDesc: 'imbasan AI percuma berbaki',
    premiumSoon: '⭐ Premium akan datang — imbasan tanpa had',
    limitReached: '⚠️ Had percuma dicapai. Menggunakan pengesanan asas.',
    limitInfo: 'Premium akan datang untuk imbasan AI tanpa had.',
    deleteAll: '🗑️ Padam Semua Sejarah', aiAnalysis: 'Analisis AI',
    basicAnalysis: 'Analisis Asas (had AI dicapai)',
    feedbackTitle: 'Adakah ini betul?',
    feedbackSub: 'Maklum balas anda membantu melindungi rakyat Malaysia daripada scam',
    thumbsUp: '✅ Ya, betul', thumbsDown: '❌ Tidak, salah',
    feedbackThanks: '🙏 Terima kasih! Maklum balas anda meningkatkan pengesanan kami.',
    markAs: 'Apakah yang sepatutnya?',
    consentTitle: 'Sebelum Anda Mula',
    consentBody: 'IsThisAScam menggunakan ChatGPT OpenAI untuk menganalisis mesej anda. Kandungan mesej anda dihantar ke OpenAI (USA) untuk analisis dan tertakluk kepada dasar privasi OpenAI (openai.com/privacy). Kami tidak menyimpan kandungan mesej anda. Statistik penggunaan tanpa nama dikumpul melalui Supabase. Maklum balas dan pembetulan pengguna disemak oleh pasukan IsThisAScam untuk meningkatkan ketepatan pengesanan. Dengan meneruskan, anda bersetuju dengan pemprosesan data ini di bawah PDPA Malaysia.',
    consentAgree: 'Saya Faham, Teruskan',
    consentPDPA: 'Ini mematuhi garis panduan PDPA Malaysia.',
    learnTitle: '📚 Pelajari Tentang Scam',
    learnSub: 'Kekal dilindungi — kenali taktik scam terkini',
    disclaimerTitle: 'Penafian Penting',
    disclaimerBody: 'IsThisAScam adalah alat berkuasa AI untuk membantu mengenal pasti mesej yang mencurigakan. Ia disediakan untuk tujuan maklumat sahaja.\n\n• Keputusan tidak dijamin tepat\n• Aplikasi ini bukan nasihat undang-undang atau kewangan\n• Jangan bergantung sepenuhnya pada aplikasi ini\n• Sentiasa sahkan dengan sumber rasmi (bank anda, PDRM, MCMC)\n• Pembangun tidak bertanggungjawab atas sebarang kerugian\n\nDengan menggunakan aplikasi ini, anda menerima syarat-syarat ini.',
    disclaimerAgree: 'Saya Faham & Terima',
    disclaimerQR: '⚠️ Kod QR dikesan. Jangan klik pautan yang tidak dikenali. Sahkan terus dengan laman web rasmi.',
    extractedURL: 'URL dalam kod QR:',
    aiDisclaimer: 'Analisis berkuasa AI. Tidak dijamin tepat. Sentiasa sahkan dengan sumber rasmi.',
    termsLink: 'Terma Penggunaan',
  },
  'zh-s': {
    selectLang: '选择您的语言',
    privacy: '🔒 您的数据不会被存储。分析由AI提供支持。',
    headline: '这是诈骗吗?', sub: '立即检查可疑信息',
    analyzeBtn: '🔍 立即分析', historyBtn: '📋 查看历史',
    learnBtn: '📚 了解诈骗', back: '← 返回',
    textTab: '粘贴文字', photoTab: '📷 照片 / 二维码',
    placeholder: '在此粘贴可疑消息...',
    analyze: '🔍 分析', analyzing: '⏳ 正在分析...',
    uploadPhoto: '📷 选择截图',
    scam: '诈骗', suspicious: '可疑', safe: '安全',
    confidence: '置信度', tacticsFound: '检测到的手段:',
    save: '💾 保存到历史', checkAnother: '🔍 检查另一个',
    noHistory: '还没有扫描', settings: '设置', language: '语言',
    usageTitle: '本月使用情况', usageDesc: '免费AI扫描剩余',
    premiumSoon: '⭐ 即将推出高级版 — 无限扫描',
    limitReached: '⚠️ 已达免费限制。使用基本检测。',
    limitInfo: '即将推出高级版，提供无限AI扫描。',
    deleteAll: '🗑️ 清除所有历史', aiAnalysis: 'AI分析',
    basicAnalysis: '基本分析（已达AI限制）',
    feedbackTitle: '这个结果正确吗?',
    feedbackSub: '您的反馈有助于保护其他马来西亚人免受诈骗',
    thumbsUp: '✅ 是，正确', thumbsDown: '❌ 不，错误',
    feedbackThanks: '🙏 谢谢！您的反馈改善了我们的检测。',
    markAs: '应该是什么?',
    consentTitle: '开始之前',
    consentBody: 'IsThisAScam使用AI分析消息。您的消息内容会发送给OpenAI进行分析，但我们不会存储。用户反馈和更正由IsThisAScam团队审核，以提高检测准确性, 继续即表示您同意根据马来西亚PDPA进行数据处理。',
    consentAgree: '我明白，继续',
    consentPDPA: '这符合马来西亚PDPA指南。',
    learnTitle: '📚 了解诈骗',
    learnSub: '保持保护 — 了解最新的诈骗手段',
    disclaimerTitle: '重要免责声明',
    disclaimerBody: 'IsThisAScam是一个AI驱动的工具，旨在帮助识别可疑消息。仅供参考。\n\n• 结果不保证准确\n• 本应用不构成法律或财务建议\n• 请勿单独依赖本应用做决定\n• 请始终向官方来源核实（您的银行、警察、MCMC）\n• 开发者对使用本应用造成的任何损失不承担责任\n\n使用本应用即表示您接受这些条款。',
    disclaimerAgree: '我理解并接受',
    disclaimerQR: '⚠️ 检测到二维码。切勿点击未知链接。请直接通过官方网站核实。',
    extractedURL: '二维码中的网址:',
    aiDisclaimer: 'AI驱动分析。不保证准确。请始终向官方来源核实。',
    termsLink: '使用条款',
  },
  ta: {
    selectLang: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    privacy: '🔒 உங்கள் தரவு சேமிக்கப்படவில்லை. AI மூலம் பகுப்பாய்வு செய்யப்படுகிறது.',
    headline: 'இது மோசடியா?', sub: 'சந்தேகத்திற்குரிய செய்திகளை உடனே சரிபார்க்கவும்',
    analyzeBtn: '🔍 இப்போது பகுப்பாய்வு செய்யவும்', historyBtn: '📋 வரலாற்றைப் பார்க்கவும்',
    learnBtn: '📚 மோசடிகளைப் பற்றி அறியுங்கள்', back: '← திரும்பவும்',
    textTab: 'உரையை ஒட்டவும்', photoTab: '📷 புகைப்படம் / QR குறியீடு',
    placeholder: 'சந்தேகத்திற்குரிய செய்தியை இங்கே ஒட்டவும்...',
    analyze: '🔍 பகுப்பாய்வு', analyzing: '⏳ பகுப்பாய்வு செய்கிறது...',
    uploadPhoto: '📷 ஸ்கிரீன்ஷாட் தேர்ந்தெடுக்கவும்',
    scam: 'மோசடி', suspicious: 'சந்தேகம்', safe: 'பாதுகாப்பான',
    confidence: 'நம்பிக்கை', tacticsFound: 'கண்டறியப்பட்ட தந்திரங்கள்:',
    save: '💾 வரலாற்றில் சேமிக்கவும்', checkAnother: '🔍 மற்றொன்றை சரிபார்க்கவும்',
    noHistory: 'இன்னும் ஸ்கேன் இல்லை', settings: 'அமைப்புகள்', language: 'மொழி',
    usageTitle: 'இந்த மாத பயன்பாடு', usageDesc: 'இலவச AI ஸ்கேன்கள் மீதமுள்ளன',
    premiumSoon: '⭐ பிரீமியம் விரைவில் — வரம்பற்ற ஸ்கேன்கள்',
    limitReached: '⚠️ இலவச வரம்பை அடைந்தது. அடிப்படை கண்டறிதல் பயன்படுத்தப்படுகிறது.',
    limitInfo: 'வரம்பற்ற AI ஸ்கேன்களுக்கு பிரீமியம் விரைவில்.',
    deleteAll: '🗑️ அனைத்து வரலாற்றையும் அழிக்கவும்', aiAnalysis: 'AI பகுப்பாய்வு',
    basicAnalysis: 'அடிப்படை பகுப்பாய்வு (AI வரம்பை அடைந்தது)',
    feedbackTitle: 'இது சரியானதா?',
    feedbackSub: 'உங்கள் கருத்து மற்ற மலேசியர்களை மோசடியிலிருந்து பாதுகாக்க உதவுகிறது',
    thumbsUp: '✅ ஆம், சரி', thumbsDown: '❌ இல்லை, தவறு',
    feedbackThanks: '🙏 நன்றி! உங்கள் கருத்து எங்கள் கண்டறிதலை மேம்படுத்துகிறது.',
    markAs: 'இது என்னவாக இருக்க வேண்டும்?',
    consentTitle: 'தொடங்கும் முன்',
    consentBody: 'IsThisAScam செய்திகளை பகுப்பாய்வு செய்ய AI பயன்படுத்துகிறது. உங்கள் செய்தி உள்ளடக்கம் OpenAI க்கு அனுப்பப்படுகிறது ஆனால் எங்களால் சேமிக்கப்படவில்லை.பயனர் கருத்து மற்றும் திருத்தங்கள் கண்டறிதல் துல்லியத்தை மேம்படுத்த IsThisAScam குழுவால் மதிப்பாய்வு செய்யப்படுகின்றன.',
    consentAgree: 'புரிகிறது, தொடரவும்',
    consentPDPA: 'இது பயனர் கருத்து மற்றும் திருத்தங்கள் கண்டறிதல் துல்லியத்தை மேம்படுத்த IsThisAScam குழுவால் மதிப்பாய்வு செய்யப்படுகின்றன. மலேசிய PDPA இன் கீழ் தொடர்வதன் மூலம் நீங்கள் இந்த தரவு செயலாக்கத்திற்கு சம்மதிக்கிறீர்கள்.',
    learnTitle: '📚 மோசடிகளைப் பற்றி அறியுங்கள்',
    learnSub: 'பாதுகாப்பாக இருங்கள் — சமீபத்திய மோசடி தந்திரங்களை அறியுங்கள்',
    disclaimerTitle: 'முக்கியமான மறுப்பு',
    disclaimerBody: 'IsThisAScam என்பது சந்தேகத்திற்குரிய செய்திகளை அடையாளம் காண உதவும் AI கருவி. தகவல் நோக்கங்களுக்காக மட்டுமே.\n\n• முடிவுகள் துல்லியமாக இருப்பதற்கு உத்தரவாதம் இல்லை\n• இந்த பயன்பாடு சட்ட அல்லது நிதி ஆலோசனை அல்ல\n• இந்த பயன்பாட்டை மட்டுமே நம்பி முடிவு எடுக்காதீர்கள்\n• எப்போதும் அதிகாரப்பூர்வ ஆதாரங்களுடன் சரிபார்க்கவும்\n• டெவலப்பர் எந்த இழப்புக்கும் பொறுப்பு அல்ல\n\nஇந்த பயன்பாட்டை பயன்படுத்துவதன் மூலம் நீங்கள் இந்த விதிமுறைகளை ஏற்கிறீர்கள்.',
    disclaimerAgree: 'நான் புரிந்துகொண்டேன் & ஏற்கிறேன்',
    disclaimerQR: '⚠️ QR குறியீடு கண்டறியப்பட்டது. அறியாத இணைப்புகளை கிளிக் செய்யாதீர்கள்.',
    extractedURL: 'QR இல் உள்ள URL:',
    aiDisclaimer: 'AI பகுப்பாய்வு. துல்லியம் உத்தரவாதப்படுத்தப்படவில்லை.',
    termsLink: 'பயன்பாட்டு விதிமுறைகள்',
  },
};

const VERDICT_STYLE: Record<Verdict, { icon: string; color: string; bg: string; border: string; bar: string }> = {
  scam:       { icon: '🚨', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    bar: 'bg-red-500' },
  suspicious: { icon: '⚠️', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', bar: 'bg-yellow-500' },
  safe:       { icon: '✅', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  bar: 'bg-green-500' },
  no_text:    { icon: '📷', color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200',   bar: 'bg-gray-400' },
};

const SCAM_LESSONS = [
  { title: '🏦 Bank Impersonation SMS', tag: 'Common in Malaysia', content: 'Real banks NEVER send links asking you to verify accounts. Legitimate bank SMS contains your card last 4 digits and specific merchant names. If you receive a link, call your bank directly using the number on the back of your card.', example: 'SCAM: "Your Maybank account suspended. Click bit.ly/verify"\nSAFE: "HLB: Card 0088 debited MYR220 at PETRONAS. Call if not you."' },
  { title: '💼 Job Scams', tag: 'Rising trend', content: 'Scammers offer high-paying part-time jobs requiring no skills — typically liking YouTube videos or Shopee products. They ask you to top up a wallet first before earning. You will never get paid back.', example: 'Red flags: Work from home, RM500/day, no experience needed, must top up first.' },
  { title: '❤️ Love Scams', tag: 'Most losses in Malaysia', content: 'Scammers build romantic relationships online over weeks or months, then claim an emergency requiring money. Malaysians lost over RM1.2 billion to this in 2023.', example: 'Red flags: Never meets in person, always has emergencies, asks for money transfers.' },
  { title: '🎰 Prize & Lucky Draw Scams', tag: 'Very common', content: 'You win a prize from Shopee, TnG, or Petronas, but must pay a fee to claim it. Real companies never ask winners to pay fees.', example: 'SCAM: "Tahniah! You won RM5,000. Pay RM50 admin fee to claim."' },
  { title: '📱 Parcel Delivery Scams', tag: 'Post-pandemic surge', content: 'Fake notifications from Pos Malaysia, J&T, or DHL claiming your parcel is held. They direct you to a fake website to pay a small release fee and steal your card details.', example: 'Red flags: Unexpected parcel, small payment required, link not from official domain.' },
  { title: '🏛️ Government Impersonation', tag: 'Very serious', content: 'Scammers impersonate LHDN, PDRM, or MCMC claiming you have unpaid taxes or are under investigation. Government agencies NEVER demand payment via phone or WhatsApp.', example: 'Red flags: Urgent arrest threat, demand for immediate bank transfer, secrecy required.' },
];

const HISTORY_KEY = 'itsascam_history';
const usageKey = () => `itsascam_usage_${new Date().toISOString().slice(0, 7)}`;
const LANG_KEY = 'itsascam_lang';
const CONSENT_KEY = 'itsascam_consent';
const DISCLAIMER_KEY = 'itsascam_disclaimer';
const DEVICE_KEY = 'itsascam_device';

const loadHistory = (): Result[] => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } };
const persistHistory = (h: Result[]) => localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
const loadUsage = (): number => parseInt(localStorage.getItem(usageKey()) || '0');
const bumpUsage = () => localStorage.setItem(usageKey(), String(loadUsage() + 1));
const getDeviceId = (): string => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) { id = `d_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem(DEVICE_KEY, id); }
  return id;
};

function keywordFallback(text: string): Pick<Result, 'verdict' | 'confidence' | 'reason' | 'tactics'> {
  const t = text.toLowerCase();
  let score = 0;
  const tactics: string[] = [];
  if (/urgent|segera|act now|immediately/.test(t))                                         { score += 25; tactics.push('urgency'); }
  if (/bit\.ly|tinyurl|http:\/\/|goo\.gl/.test(t))                                        { score += 30; tactics.push('phishing_link'); }
  if (/(dbs|hlb|maybank|cimb|uob|bsn|rhb|ocbc).{0,30}(account|akaun|verify|suspend)/.test(t)) { score += 35; tactics.push('impersonation'); }
  if (/\botp\b|password|kata sandi|\bpin\b|\bcvv\b/.test(t))                              { score += 30; tactics.push('credential_harvesting'); }
  if (/won|winner|prize|lucky|congratulations|tahniah/.test(t))                            { score += 25; tactics.push('prize_scam'); }
  const confidence = Math.min(score, 100);
  const verdict: Verdict = score >= 60 ? 'scam' : score >= 35 ? 'suspicious' : 'safe';
  return { verdict, confidence, reason: tactics.length ? `Detected: ${tactics.join(', ')}` : 'No threats found', tactics };
}

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
  const [feedback, setFeedback]         = useState<'pending' | 'given' | null>(null);
  const [showMarkAs, setShowMarkAs]     = useState(false);
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
    if (!localStorage.getItem(CONSENT_KEY)) setShowConsent(true);
    if (!localStorage.getItem(DISCLAIMER_KEY)) setShowDisclaimer(true);
    setPage('home');
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
    try {
      let partial: Pick<Result, 'verdict' | 'confidence' | 'reason' | 'tactics'> & { scanId?: string; storedText?: string };
      if (limitReached) {
        partial = keywordFallback(inputText);
      } else {
        console.log('Image base64 length:', imageBase64?.length, 'starts with:', imageBase64?.substring(0, 50));
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText, imageBase64, language: lang, deviceId: getDeviceId() }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Analysis failed');
        partial = data;
        bumpUsage();
        setUsage(loadUsage());
      }
      setResult({ ...partial, id: Date.now(), timestamp: Date.now(), isImage: !!imageBase64, text: imageBase64 ? (partial.storedText || '[Screenshot]') : inputText });
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
            <a href="https://tally.so/r/2ExkNj" target="_blank" rel="noopener noreferrer"
              className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-900 font-bold py-4 rounded-xl text-lg transition flex items-center justify-center">
              💬 Give Feedback
            </a>
          </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-sm text-gray-900">{t('premiumSoon')}</div>
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
        {error && <p className="text-red-500 text-sm mt-3">⚠️ {error}</p>}
        <button onClick={analyze} disabled={loading || (!inputText.trim() && !imageBase64)}
          className="w-full mt-4 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition">
          {loading ? t('analyzing') : t('analyze')}
        </button>
        {limitReached && <p className="text-center text-xs text-gray-900 mt-3">{t('limitInfo')}</p>}
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
          {result.limitReached && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-xs text-yellow-800">
              ⚠️ {result.limitMessage}
            </div>
          )}
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
              <p className="text-xs font-semibold text-gray-900 uppercase mb-1">{t('extractedURL')}</p>
              <p className="text-xs text-gray-900 break-all font-mono bg-white p-2 rounded border border-gray-200">{result.text}</p>
              <p className="text-xs text-red-600 mt-2 font-medium">{t('disclaimerQR')}</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-gray-900 uppercase mb-1">{limitReached ? t('basicAnalysis') : t('aiAnalysis')}</p>
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
    <div className="min-h-screen bg-white">
      <Header title={t('learnTitle')} />
      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-900 mb-6">{t('learnSub')}</p>
        <div className="space-y-4">
          {SCAM_LESSONS.map((lesson, i) => (
            <details key={i} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <summary className="p-4 cursor-pointer font-semibold text-gray-900 flex justify-between items-center">
                <span>{lesson.title}</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full ml-2 shrink-0">{lesson.tag}</span>
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
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-gray-900 mb-1">🚨 Report Scams in Malaysia</p>
          <p className="text-xs text-gray-900">CCID Scam Response Centre: <strong>013-211 9999</strong></p>
          <p className="text-xs text-gray-900">BNM LINK: <strong>1-300-88-5465</strong></p>
          <p className="text-xs text-gray-900">MCMC Aduan: <strong>aduan.mcmc.gov.my</strong></p>
        </div>
      </div>
    </div>
  );

  if (page === 'settings') return (
    <div className="min-h-screen bg-white">
      {showDisclaimer && <DisclaimerModal />}
      <Header title={t('settings')} />
      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-xs font-semibold text-gray-900 uppercase mb-3">{t('language')}</p>
        <div className="space-y-2 mb-8">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => selectLang(l.code)}
              className={`w-full p-3.5 rounded-xl border-2 font-medium text-left transition text-gray-900 ${lang === l.code ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300 bg-white'}`}>
              {l.label} {lang === l.code && '✓'}
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
        <p className="text-xs text-gray-900 text-center mt-2">{t('premiumSoon')}</p>
        <button onClick={() => { 
          localStorage.removeItem(DISCLAIMER_KEY); 
          setShowDisclaimer(true); 
        }}
          className="w-full mt-6 py-3 border-2 border-gray-400 rounded-xl text-sm text-gray-900 font-medium bg-gray-50 hover:bg-gray-100">
          📄 {t('termsLink')}
        </button>
        <a href="/privacy" target="_blank" rel="noopener noreferrer"
          className="w-full mt-3 py-3 border-2 border-gray-400 rounded-xl text-sm text-gray-900 font-medium bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
          🔒 Privacy Policy
        </a>
      </div>
    </div>
  );

  return null;
}