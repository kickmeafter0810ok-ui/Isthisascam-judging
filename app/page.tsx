'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type Page = 'language' | 'home' | 'scan' | 'results' | 'history' | 'settings' | 'learn' | 'feedback';
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
  isQRCode?: boolean;
  timestamp: number;
  limitReached?: boolean;
  limitMessage?: string;
}

const FREE_LIMIT = 20;
const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ms', label: '🇲🇾 Bahasa Melayu' },
  { code: 'zh-s', label: '🇨🇳 中文简体' },
  { code: 'ta', label: '🇮🇳 தமிழ்' },
];

const TACTIC_LABELS: Record<string, Record<string, string>> = {
  urgency:                { en: 'Urgency', ms: 'Kecemasan', 'zh-s': '紧迫', ta: 'அவசரம்' },
  impersonation:          { en: 'Impersonation', ms: 'Penyamaran', 'zh-s': '冒充', ta: 'போலியான அடையாளம்' },
  phishing_link:          { en: 'Phishing Link', ms: 'Pautan Phishing', 'zh-s': '钓鱼链接', ta: 'ஃபிஷிங் இணைப்பு' },
  credential_harvesting:  { en: 'Credential Theft', ms: 'Kecurian Akaun', 'zh-s': '账号盗取', ta: 'கணக்கு திருட்டு' },
  prize_scam:             { en: 'Prize Scam', ms: 'Scam Hadiah', 'zh-s': '奖品诈骗', ta: 'பரிசு மோசடி' },
  loan_scam:              { en: 'Loan Scam', ms: 'Scam Pinjaman', 'zh-s': '贷款诈骗', ta: 'கடன் மோசடி' },
  job_scam:               { en: 'Job Scam', ms: 'Scam Kerja', 'zh-s': '工作诈骗', ta: 'வேலை மோசடி' },
  romance_scam:           { en: 'Love Scam', ms: 'Love Scam', 'zh-s': '爱情诈骗', ta: 'காதல் மோசடி' },
  investment_scam:        { en: 'Investment Scam', ms: 'Scam Pelaburan', 'zh-s': '投资诈骗', ta: 'முதலீட்டு மோசடி' },
  fake_qr:                { en: 'Fake QR', ms: 'QR Palsu', 'zh-s': '假二维码', ta: 'போலி QR' },
  government_impersonation: { en: 'Gov Impersonation', ms: 'Samaran Kerajaan', 'zh-s': '冒充政府', ta: 'அரசு போலியர்' },
  bank_impersonation:     { en: 'Bank Impersonation', ms: 'Samaran Bank', 'zh-s': '冒充银行', ta: 'வங்கி போலியர்' },
  malware:                { en: 'Malware', ms: 'Perisian Hasad', 'zh-s': '恶意软件', ta: 'தீம்பொருள்' },
  data_breach:            { en: 'Data Breach', ms: 'Kebocoran Data', 'zh-s': '数据泄露', ta: 'தரவு கசிவு' },
};

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
    limitReached: '⚠️ You have used all 20 free scans this month. Please try again next month.',
    limitInfo: 'You have used all 20 free AI scans this month. Try again next month.',
    deleteAll: '🗑️ Clear All History', aiAnalysis: 'AI Analysis',
    basicAnalysis: 'AI Analysis',
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
    feedbackBtn: 'Give Feedback',
    privacyPolicy: 'Privacy Policy',
    onboardingTitle: 'Welcome to IsThisAScam',
    onboardingCan: '✅ What we can do',
    onboardingCan1: 'Analyse suspicious text messages, emails & WhatsApp messages',
    onboardingCan2: 'Scan QR codes and reveal the hidden link before you use them',
    onboardingCan3: 'Snap a photo or upload a screenshot of suspicious content',
    onboardingCan4: 'Supports Bahasa Malaysia, English, Chinese & Tamil',
    onboardingCannot: '⚠️ What we cannot do',
    onboardingCannot1: 'Guarantee 100% accuracy — always use your judgment',
    onboardingCannot2: 'Analyse live phone calls',
    onboardingCannot3: 'Block scammers or recover lost money',
    onboardingCannot4: 'Replace reporting to NSRC (997) or BNM (1-300-88-5465)',
    onboardingHow: '📱 How to use',
    onboardingHow1: 'Copy a suspicious message — or snap/upload a screenshot',
    onboardingHow2: 'Paste the text or image into the scan box',
    onboardingHow3: 'Scan a QR code to see where it really leads before clicking',
    onboardingHow4: 'Get your AI verdict in seconds',
    onboardingHow5: 'Give feedback on results — it helps improve accuracy for everyone',
    onboardingHow6: 'When in doubt — don\'t click, don\'t transfer',
    onboardingBtn: 'Got it, let\'s go →',
    emerging: 'EMERGING',
    active: 'ACTIVE', 
    resolved: 'RESOLVED',
    shareWarning: '↗ Share Warning',
    readArticle: '📰 Read Article',
    tacticsDetected: 'Tactics:',
    lesson1Title: '🏦 Bank Impersonation SMS', lesson1Tag: 'Common in Malaysia',
    lesson2Title: '💼 Job Scams', lesson2Tag: 'Rising trend',
    lesson3Title: '❤️ Love Scams', lesson3Tag: 'Most losses in Malaysia',
    lesson4Title: '🎰 Prize & Lucky Draw Scams', lesson4Tag: 'Very common',
    lesson5Title: '📦 Parcel Delivery Scams', lesson5Tag: 'Post-pandemic surge',
    lesson6Title: '🏛️ Government Impersonation', lesson6Tag: 'Very serious',
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
    limitReached: '⚠️ Anda telah menggunakan kesemua 20 imbasan percuma bulan ini. Sila cuba lagi bulan hadapan.',
    limitInfo: 'Anda telah menggunakan kesemua 20 imbasan AI percuma bulan ini. Cuba lagi bulan hadapan.',
    deleteAll: '🗑️ Padam Semua Sejarah', aiAnalysis: 'Analisis AI',
    basicAnalysis: 'Analisis AI',
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
    feedbackBtn: 'Beri Maklum Balas',
    privacyPolicy: 'Dasar Privasi',
    onboardingTitle: 'Selamat Datang ke IsThisAScam',
    onboardingCan: '✅ Apa yang boleh kami lakukan',
    onboardingCan1: 'Analisis mesej teks, emel & WhatsApp yang mencurigakan',
    onboardingCan2: 'Imbas kod QR dan dedahkan pautan tersembunyi sebelum anda gunakannya',
    onboardingCan3: 'Ambil foto atau muat naik tangkapan skrin kandungan mencurigakan',
    onboardingCan4: 'Menyokong Bahasa Malaysia, Inggeris, Cina & Tamil',
    onboardingCannot: '⚠️ Apa yang tidak boleh kami lakukan',
    onboardingCannot1: 'Menjamin 100% ketepatan — sentiasa gunakan pertimbangan anda',
    onboardingCannot2: 'Menganalisis panggilan telefon secara langsung',
    onboardingCannot3: 'Menyekat penipu atau memulihkan wang yang hilang',
    onboardingCannot4: 'Menggantikan laporan kepada NSRC (997) atau BNM (1-300-88-5465)',
    onboardingHow: '📱 Cara menggunakan',
    onboardingHow1: 'Salin mesej mencurigakan — atau ambil/muat naik tangkapan skrin',
    onboardingHow2: 'Tampal teks atau imej ke dalam kotak imbasan',
    onboardingHow3: 'Imbas kod QR untuk lihat destinasi sebenar sebelum klik',
    onboardingHow4: 'Dapatkan keputusan AI dalam beberapa saat',
    onboardingHow5: 'Beri maklum balas — ia membantu meningkatkan ketepatan untuk semua',
    onboardingHow6: 'Apabila ragu-ragu — jangan klik, jangan pindah',
    onboardingBtn: 'Faham, jom mula →',
    emerging: 'TERKINI',
    active: 'AKTIF',
    resolved: 'SELESAI',
    shareWarning: '↗ Kongsi Amaran',
    readArticle: '📰 Baca Artikel',
    tacticsDetected: 'Taktik:',
    lesson1Title: '🏦 SMS Penyamaran Bank', lesson1Tag: 'Biasa di Malaysia',
    lesson2Title: '💼 Scam Kerja', lesson2Tag: 'Trend meningkat',
    lesson3Title: '❤️ Love Scam', lesson3Tag: 'Kerugian terbesar di Malaysia',
    lesson4Title: '🎰 Scam Hadiah & Cabutan Bertuah', lesson4Tag: 'Sangat biasa',
    lesson5Title: '📦 Scam Penghantaran Barang', lesson5Tag: 'Meningkat selepas pandemik',
    lesson6Title: '🏛️ Penyamaran Kerajaan', lesson6Tag: 'Sangat serius',
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
    limitReached: '⚠️ 您已使用本月全部20次免费扫描。请下个月再试。',
    limitInfo: '您已使用本月全部20次免费AI扫描。请下个月再试。',
    deleteAll: '🗑️ 清除所有历史', aiAnalysis: 'AI分析',
    basicAnalysis: 'AI分析',
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
    feedbackBtn: '提供反馈',
    privacyPolicy: '隐私政策',
    onboardingTitle: '欢迎使用 IsThisAScam',
    onboardingCan: '✅ 我们能做什么',
    onboardingCan1: '分析可疑的短信、电邮和WhatsApp消息',
    onboardingCan2: '扫描二维码并在使用前揭露隐藏链接',
    onboardingCan3: '拍照或上传可疑内容的截图',
    onboardingCan4: '支持马来语、英语、中文和淡米尔语',
    onboardingCannot: '⚠️ 我们不能做什么',
    onboardingCannot1: '保证100%准确 — 请自行判断',
    onboardingCannot2: '分析实时电话通话',
    onboardingCannot3: '拦截骗子或追回损失款项',
    onboardingCannot4: '替代向NSRC (997) 或BNM (1-300-88-5465) 举报',
    onboardingHow: '📱 如何使用',
    onboardingHow1: '复制可疑消息 — 或拍照/上传截图',
    onboardingHow2: '将文字或图片粘贴到扫描框',
    onboardingHow3: '扫描二维码查看真实链接目的地',
    onboardingHow4: '几秒内获得AI分析结果',
    onboardingHow5: '提供反馈 — 帮助提升所有用户的准确度',
    onboardingHow6: '有疑虑时 — 不要点击，不要转账',
    onboardingBtn: '明白了，开始吧 →',
    emerging: '新兴',
    active: '活跃',
    resolved: '已解决',
    shareWarning: '↗ 分享警告',
    readArticle: '📰 阅读文章',
    tacticsDetected: '手法：',
    lesson1Title: '🏦 银行冒充短信', lesson1Tag: '马来西亚常见',
    lesson2Title: '💼 工作诈骗', lesson2Tag: '上升趋势',
    lesson3Title: '❤️ 爱情诈骗', lesson3Tag: '马来西亚损失最大',
    lesson4Title: '🎰 奖品与幸运抽奖诈骗', lesson4Tag: '非常普遍',
    lesson5Title: '📦 包裹快递诈骗', lesson5Tag: '疫情后激增',
    lesson6Title: '🏛️ 冒充政府机构', lesson6Tag: '非常严重',
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
    limitReached: '⚠️ இந்த மாதம் 20 இலவச ஸ்கேன்கள் அனைத்தையும் பயன்படுத்திவிட்டீர்கள். அடுத்த மாதம் மீண்டும் முயற்சிக்கவும்.',
    limitInfo: 'இந்த மாதம் 20 இலவச AI ஸ்கேன்கள் அனைத்தையும் பயன்படுத்திவிட்டீர்கள். அடுத்த மாதம் மீண்டும் முயற்சிக்கவும்.',
    deleteAll: '🗑️ அனைத்து வரலாற்றையும் அழிக்கவும்', aiAnalysis: 'AI பகுப்பாய்வு',
    basicAnalysis: 'AI பகுப்பாய்வு',
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
    feedbackBtn: 'கருத்து தெரிவிக்கவும்',
    privacyPolicy: 'தனியுரிமைக் கொள்கை',
    onboardingTitle: 'IsThisAScam-க்கு வரவேற்கிறோம்',
    onboardingCan: '✅ நாம் என்ன செய்யலாம்',
    onboardingCan1: 'சந்தேகமான SMS, மின்னஞ்சல் மற்றும் WhatsApp செய்திகளை பகுப்பாய்வு செய்யலாம்',
    onboardingCan2: 'QR குறியீடுகளை ஸ்கேன் செய்து பயன்படுத்துவதற்கு முன் மறைக்கப்பட்ட இணைப்பை வெளிப்படுத்தலாம்',
    onboardingCan3: 'சந்தேகமான உள்ளடக்கத்தின் புகைப்படம் எடுக்கலாம் அல்லது ஸ்கிரீன்ஷாட் பதிவேற்றலாம்',
    onboardingCan4: 'மலாய், ஆங்கிலம், சீனம் மற்றும் தமிழை ஆதரிக்கிறது',
    onboardingCannot: '⚠️ நாம் என்ன செய்ய முடியாது',
    onboardingCannot1: '100% துல்லியத்தை உறுதி செய்ய முடியாது — உங்கள் சொந்த தீர்ப்பை பயன்படுத்துங்கள்',
    onboardingCannot2: 'நேரடி தொலைபேசி அழைப்புகளை பகுப்பாய்வு செய்ய முடியாது',
    onboardingCannot3: 'மோசடியாளர்களை தடுக்க அல்லது இழந்த பணத்தை மீட்டெடுக்க முடியாது',
    onboardingCannot4: 'NSRC (997) அல்லது BNM (1-300-88-5465) க்கு புகாரளிப்பதை மாற்ற முடியாது',
    onboardingHow: '📱 எப்படி பயன்படுத்துவது',
    onboardingHow1: 'சந்தேகமான செய்தியை நகலெடுக்கவும் — அல்லது புகைப்படம்/ஸ்கிரீன்ஷாட் பதிவேற்றவும்',
    onboardingHow2: 'உரை அல்லது படத்தை ஸ்கேன் பெட்டியில் ஒட்டவும்',
    onboardingHow3: 'QR குறியீட்டை ஸ்கேன் செய்து கிளிக் செய்வதற்கு முன் உண்மையான இணைப்பை பாருங்கள்',
    onboardingHow4: 'சில நொடிகளில் AI முடிவைப் பெறுங்கள்',
    onboardingHow5: 'கருத்து தெரிவியுங்கள் — அனைவருக்கும் துல்லியத்தை மேம்படுத்த உதவுகிறது',
    onboardingHow6: 'சந்தேகம் இருந்தால் — கிளிக் வேண்டாம், பணம் அனுப்ப வேண்டாம்',
    onboardingBtn: 'புரிந்தது, தொடங்குவோம் →',
    emerging: 'புதியது',
    active: 'செயலில்',
    resolved: 'தீர்க்கப்பட்டது',
    shareWarning: '↗ எச்சரிக்கை பகிர்',
    readArticle: '📰 கட்டுரை படிக்க',
    tacticsDetected: 'தந்திரங்கள்:',
    lesson1Title: '🏦 வங்கி போலி SMS', lesson1Tag: 'மலேசியாவில் பொதுவானது',
    lesson2Title: '💼 வேலை மோசடி', lesson2Tag: 'அதிகரிக்கும் போக்கு',
    lesson3Title: '❤️ காதல் மோசடி', lesson3Tag: 'மலேசியாவில் அதிக இழப்பு',
    lesson4Title: '🎰 பரிசு & லாட்டரி மோசடி', lesson4Tag: 'மிகவும் பொதுவானது',
    lesson5Title: '📦 பார்சல் டெலிவரி மோசடி', lesson5Tag: 'தொற்றுநோய்க்கு பின் அதிகரிப்பு',
    lesson6Title: '🏛️ அரசு போலியர்', lesson6Tag: 'மிகவும் தீவிரமானது',
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
const ONBOARDING_KEY = 'itsascam_onboarding';

const loadHistory = (): Result[] => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } };
const persistHistory = (h: Result[]) => localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
const loadUsage = (): number => parseInt(localStorage.getItem(usageKey()) || '0');
const bumpUsage = () => localStorage.setItem(usageKey(), String(loadUsage() + 1));
const getDeviceId = (): string => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) { id = `d_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem(DEVICE_KEY, id); }
  return id;
};



function FeedbackPage({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const [rating, setRating] = useState(0);
  const [whatYouLike, setWhatYouLike] = useState('');
  const [needsImprovement, setNeedsImprovement] = useState('');
  const [featureSuggestions, setFeatureSuggestions] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [anythingElse, setAnythingElse] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  

  const submit = async () => {
    if (rating === 0) { setError('Please select a rating.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/app-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          whatYouLike,
          needsImprovement,
          featureSuggestions,
          wouldRecommend,
          anythingElse,
          name,
          contact,
          language: lang,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch (e: any) {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🙏</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
        <p className="text-gray-900 mb-6">Your feedback helps us protect more Malaysians from scams.</p>
        <button onClick={onBack} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl">
          ← Back to App
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-blue-600 font-medium">← Back</button>
          <span className="font-semibold text-gray-900">Give Feedback</span>
          <div />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <p className="font-semibold text-gray-900 mb-1">Overall Rating <span className="text-red-500">*</span></p>
          <p className="text-xs text-gray-900 mb-3">How would you rate IsThisAScam?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                className={`flex-1 py-3 rounded-xl text-xl transition ${rating >= n ? 'bg-yellow-400' : 'bg-gray-100'}`}>
                ⭐
              </button>
            ))}
          </div>
          {rating > 0 && <p className="text-xs text-gray-900 mt-1 text-center">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</p>}
        </div>

        <div>
          <p className="font-semibold text-gray-900 mb-1">What do you like most?</p>
          <textarea value={whatYouLike} onChange={e => setWhatYouLike(e.target.value)}
            placeholder="e.g. Easy to use, fast results..."
            className="w-full h-24 p-3 border-2 border-gray-300 rounded-xl text-sm text-gray-900 focus:border-red-400 focus:outline-none resize-none" />
        </div>

        <div>
          <p className="font-semibold text-gray-900 mb-1">What needs improvement?</p>
          <textarea value={needsImprovement} onChange={e => setNeedsImprovement(e.target.value)}
            placeholder="e.g. Better accuracy for Malay messages..."
            className="w-full h-24 p-3 border-2 border-gray-300 rounded-xl text-sm text-gray-900 focus:border-red-400 focus:outline-none resize-none" />
        </div>

        <div>
          <p className="font-semibold text-gray-900 mb-1">Feature suggestions?</p>
          <textarea value={featureSuggestions} onChange={e => setFeatureSuggestions(e.target.value)}
            placeholder="e.g. Share result with family, voice input..."
            className="w-full h-24 p-3 border-2 border-gray-300 rounded-xl text-sm text-gray-900 focus:border-red-400 focus:outline-none resize-none" />
        </div>

        <div>
          <p className="font-semibold text-gray-900 mb-3">Would you recommend this app?</p>
          <div className="flex gap-3">
            <button onClick={() => setWouldRecommend(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${wouldRecommend === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
              ✅ Yes
            </button>
            <button onClick={() => setWouldRecommend(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${wouldRecommend === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
              ❌ No
            </button>
          </div>
        </div>

        <div>
          <p className="font-semibold text-gray-900 mb-1">Anything else?</p>
          <textarea value={anythingElse} onChange={e => setAnythingElse(e.target.value)}
            placeholder="Any other thoughts..."
            className="w-full h-24 p-3 border-2 border-gray-300 rounded-xl text-sm text-gray-900 focus:border-red-400 focus:outline-none resize-none" />
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="font-semibold text-gray-900 mb-3">Optional contact (for follow-up)</p>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full p-3 border-2 border-gray-300 rounded-xl text-sm text-gray-900 mb-3 focus:border-red-400 focus:outline-none" />
          <input value={contact} onChange={e => setContact(e.target.value)}
            placeholder="Email or phone (optional)"
            className="w-full p-3 border-2 border-gray-300 rounded-xl text-sm text-gray-900 focus:border-red-400 focus:outline-none" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button onClick={submit} disabled={submitting}
          className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-lg transition">
          {submitting ? '⏳ Submitting...' : '💼 Submit Feedback'}
        </button>

        <p className="text-xs text-gray-900 text-center pb-6">
          Your feedback is reviewed by the IsThisAScam team to improve detection accuracy and protect more Malaysians.
        </p>
      </div>
    </div>
  );
}

function LearnPage({ lang, t, onBack }: { lang: Lang; t: (k: string) => string; onBack: () => void }) {
  const [intelItems, setIntelItems] = useState<any[]>([]);
  const [intelLoading, setIntelLoading] = useState(true);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    fetch('/api/intel')
      .then(r => r.json())
      .then(data => { setIntelItems(data); setIntelLoading(false); })
      .catch(() => setIntelLoading(false));
  }, []);

  const getSummary = (item: any) => {
    if (lang === 'ms') return item.summary_ms;
    if (lang === 'zh-s') return item.summary_zh;
    if (lang === 'ta') return item.summary_ta;
    return item.summary_en;
  };

  const getHeadline = (item: any) => {
    if (lang === 'ms' && item.headline_ms) return item.headline_ms;
    if (lang === 'zh-s' && item.headline_zh) return item.headline_zh;
    if (lang === 'ta' && item.headline_ta) return item.headline_ta;
    return item.headline;
  };

  const getShareText = (item: any) => {
    if (lang === 'ms') return item.share_text_ms;
    if (lang === 'zh-s') return item.share_text_zh;
    if (lang === 'ta') return item.share_text_ta;
    return item.share_text_en;
  };

  const handleShare = (item: any) => {
    const text = getShareText(item) || getSummary(item);
    if (navigator.share) {
      navigator.share({ title: item.headline, text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'emerging') return '🚨';
    if (status === 'active') return '⚠️';
    return '✅';
  };

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

          {intelLoading && (
            <div className="text-center py-6 text-gray-400 text-sm">Loading alerts...</div>
          )}

          {!intelLoading && intelItems.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">No alerts yet</div>
          )}

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
                  {item.occurrence_count > 2 && (
                    <span className="text-xs text-gray-400 shrink-0">{item.occurrence_count}x reported</span>
                  )}
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
                  <span>{t(`lesson${i+1}Title`)}</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full ml-2 shrink-0">{t(`lesson${i+1}Tag`)}</span>
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
          <p className="text-sm font-bold text-gray-900 mb-1">🚨 Report Scams in Malaysia</p>
          <p className="text-xs text-gray-900">🚨 NSRC (Scam Emergency): <strong>997</strong> (24/7)</p>
          <p className="text-xs text-gray-900">🏦 BNM LINK: <strong>1-300-88-5465</strong></p>
          <p className="text-xs text-gray-900">🏦 Your Bank Hotline: <strong>Call immediately if money lost</strong></p>
          <p className="text-xs text-gray-900">👮 Police (CCID): <strong>03-2610 1559</strong></p>
          <p className="text-xs text-gray-900">📡 MCMC Hotline: <strong>1-800-188-030</strong></p>
          <p className="text-xs text-gray-900">🌐 MCMC Online: <strong>aduan.mcmc.gov.my</strong></p>
          <p className="text-xs text-gray-900">🔍 Semak Mule: <strong>ccid.rmp.gov.my</strong></p>
        </div>
      </div>
    </div>
  );
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
  const [showOnboarding, setShowOnboarding] = useState(false);
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
    if (!localStorage.getItem(ONBOARDING_KEY)) setShowOnboarding(true);
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
        
        <a href="/terms" target="_blank" rel="noopener noreferrer"
  className="w-full mt-6 py-3 border-2 border-gray-400 rounded-xl text-sm text-gray-900 font-medium bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
  📄 {t('termsLink')}
</a>
        <a href="/privacy" target="_blank" rel="noopener noreferrer"
          className="w-full mt-3 py-3 border-2 border-gray-400 rounded-xl text-sm text-gray-900 font-medium bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
          🔒 {t('privacyPolicy')}
        </a>
      </div>
    </div>
  );

  if (page === 'feedback') return (
    <FeedbackPage lang={lang} onBack={() => setPage('home')} />
  );

  return null;
}