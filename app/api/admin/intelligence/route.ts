import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const RSS_SOURCES = [
  // Direct feeds — confirmed working
  { url: 'https://malaysianow.com/feed', name: 'MalaysiaNow', lang: 'en' },
  { url: 'https://vulcanpost.com/feed/', name: 'Vulcan Post', lang: 'en' },
  { url: 'https://bernama.com/en/rssfeed.php', name: 'Bernama', lang: 'en' },
  { url: 'https://www.freemalaysiatoday.com/feed/', name: 'Free Malaysia Today', lang: 'en' },
  { url: 'https://www.utusan.com.my/feed', name: 'Utusan Malaysia', lang: 'ms' },

  // Google News — recovers blocked sources
  { url: 'https://news.google.com/rss/search?q=scam+fraud+Malaysia&hl=en-MY&gl=MY&ceid=MY:en', name: 'Google News EN Scam', lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=penipuan+sindiket+mangsa+Malaysia&hl=ms&gl=MY&ceid=MY:ms', name: 'Google News MS Penipuan', lang: 'ms' },
  { url: 'https://news.google.com/rss/search?q=scam+macau+cinta+pelaburan+Malaysia&hl=ms&gl=MY&ceid=MY:ms', name: 'Google News MS Scam Types', lang: 'ms' },
  { url: 'https://news.google.com/rss/search?q=诈骗+马来西亚&hl=zh-CN&gl=MY&ceid=MY:zh-Hans', name: 'Google News ZH Scam', lang: 'zh' },
  { url: 'https://news.google.com/rss/search?q=PDRM+CCID+scam+arrest+Malaysia&hl=en-MY&gl=MY&ceid=MY:en', name: 'Google News PDRM', lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=BNM+Bank+Negara+scam+fraud+Malaysia&hl=en-MY&gl=MY&ceid=MY:en', name: 'Google News BNM', lang: 'en' },
  { url: 'https://news.google.com/rss/search?q=NSRC+997+scam+Malaysia&hl=en-MY&gl=MY&ceid=MY:en', name: 'Google News NSRC', lang: 'en' },
];

const SCAM_KEYWORDS = [
  // English
  'scam', 'fraud', 'phishing', 'swindl', 'cheat', 'fake', 'impersonat',
  'syndicat', 'victim', 'losses', 'duped', 'deceiv', 'mule', 'money mule',
  'macau scam', 'love scam', 'job scam', 'investment scam', 'parcel scam',
  'WhatsApp scam', 'telegram scam', 'online fraud', 'cybercrime',
  'CCID', 'NSRC', 'Commercial Crime',

  // Malay
  'penipuan', 'penipu', 'palsu', 'menipu', 'sindiket', 'mangsa', 'kerugian',
  'phishing', 'peras ugut', 'tipuan', 'scam', 'fraud', 'wang haram',
  'akaun mule', 'akaun palsu', 'pelaburan haram', 'cinta scam',
  'kerja sambilan', 'pekerjaan palsu', 'hadiah palsu', 'bank palsu',

  // Chinese
  '诈骗', '欺诈', '骗局', '钓鱼', '假冒', '受骗', '损失',
  '网络诈骗', '电话诈骗', '投资诈骗', '爱情诈骗', '工作诈骗',
  '澳门诈骗', '银行诈骗', '假包裹', '假奖品',
];

async function fetchRSS(url: string, limit = 30): Promise<{ title: string; description: string; link: string }[]> {
  try {
    const res = await fetch(url, {
      headers: { 
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  'Accept-Language': 'en-US,en;q=0.9,ms;q=0.8',
},
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const text = await res.text();

    const items: { title: string; description: string; link: string }[] = [];
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/gi);

    for (const match of itemMatches) {
      const item = match[1];
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i)?.[1] ||
                    item.match(/<title>(.*?)<\/title>/i)?.[1] || '';
      const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i)?.[1] ||
                          item.match(/<description>(.*?)<\/description>/i)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/i)?.[1] || '';

      if (title) items.push({
        title: title.replace(/<[^>]*>/g, '').trim(),
        description: description.replace(/<[^>]*>/g, '').trim().slice(0, 500),
        link: link.trim(),
      });
    }
    return items.slice(0, limit);
  } catch {
    return [];
  }
}

function isScamRelated(title: string, description: string): boolean {
  const text = (title + ' ' + description).toLowerCase();
  return SCAM_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

function generateHash(title: string, source: string): string {
  return crypto.createHash('md5').update(`${title}-${source}`).digest('hex');
}

async function extractAndTranslate(
  title: string,
  description: string,
  sourceLang: string,
  sourceName: string
): Promise<{
  summary_en: string;
  summary_ms: string;
  summary_zh: string;
  summary_ta: string;
  tactic_tags: string[];
  target_demographic: string;
  platform: string;
  is_scam_pattern: boolean;
  share_text_en: string;
  share_text_ms: string;
  share_text_zh: string;
  share_text_ta: string;
} | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a scam intelligence analyst for Malaysia.
Extract scam patterns from news articles to warn Malaysians.

Rules:
- Process articles about scams, fraud, cybercrime affecting Malaysians
- Individual victim stories are VALID if they describe how the scam works
- Extract the scam METHOD and TACTICS even from individual case articles
- Reject only: unrelated news, political articles, sports, entertainment
- Generate 2-sentence summaries focusing on HOW the scam works

Return JSON only:
{
  "is_scam_pattern": true/false,
  "summary_en": "2-sentence description of how this scam works in English",
  "summary_ms": "2-sentence description in Bahasa Malaysia",
  "summary_zh": "2句话描述此诈骗手法（中文）",
  "summary_ta": "2-வரி மோசடி முறை விளக்கம் (தமிழ்)",
  "tactic_tags": ["urgency", "impersonation", etc],
  "target_demographic": "e.g. bank customers, job seekers, elderly",
  "platform": "e.g. WhatsApp, SMS, Telegram, Phone call",
  "share_text_en": "⚠️ SCAM ALERT: [warning text]. Protect yourself — check suspicious messages with IsThisAScam on Google Play.",
  "share_text_ms": "⚠️ AMARAN SCAM: [teks amaran]. Lindungi diri anda — semak mesej mencurigakan dengan IsThisAScam di Google Play.",
  "share_text_zh": "⚠️ 诈骗警告：[警告内容]。保护自己——在Google Play下载IsThisAScam检查可疑消息。",
  "share_text_ta": "⚠️ மோசடி எச்சரிக்கை: [எச்சரிக்கை உரை]. உங்களை பாதுகாத்துக்கொள்ளுங்கள் — Google Play-ல் IsThisAScam பதிவிறக்கவும்."
}

Valid tactic_tags: urgency, impersonation, phishing_link, credential_harvesting,
prize_scam, loan_scam, job_scam, romance_scam, investment_scam, fake_qr,
data_breach, malware, government_impersonation, bank_impersonation`
        },
        {
          role: 'user',
          content: `Article from ${sourceName} (${sourceLang}):\nTitle: ${title}\nContent: ${description}`
        }
      ],
      max_tokens: 800,
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  const data = await res.json();
  if (!res.ok) return null;

  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (req.cookies.get('admin_auth')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
  fetched: 0,
  scamRelated: 0,
  duplicates: 0,
  newItems: 0,
  errors: 0,
  sourceHealth: [] as { name: string; fetched: number; status: 'ok' | 'empty' | 'error' }[],
};

for (const source of RSS_SOURCES) {
  try {
    const items = await fetchRSS(source.url, 30);
    results.fetched += items.length;
    results.sourceHealth.push({
      name: source.name,
      fetched: items.length,
      status: items.length > 0 ? 'ok' : 'empty'
    });
    console.log(`${source.name}: fetched ${items.length} articles`);
      
    let processedCount = 0;
    const MAX_PROCESS_PER_RUN = 10;

      for (const item of items) {
  if (!isScamRelated(item.title, item.description)) continue;
  results.scamRelated++;
  console.log(`Scam-related: [${source.name}] ${item.title}`);

  // Stop processing if we've hit the limit
  if (processedCount >= MAX_PROCESS_PER_RUN) continue;
  processedCount++;

        const hash = generateHash(item.title, source.name);

        // Check duplicate
        const { data: existing } = await supabase
          .from('scam_intel')
          .select('id, occurrence_count')
          .eq('content_hash', hash)
          .single();

        if (existing) {
          // Update occurrence count and last_seen
          await supabase
            .from('scam_intel')
            .update({
              occurrence_count: existing.occurrence_count + 1,
              last_seen: new Date().toISOString().slice(0, 10),
              status: existing.occurrence_count >= 2 ? 'emerging' : 'new',
            })
            .eq('id', existing.id);
          results.duplicates++;
          continue;
        }

        // Extract pattern and translate
        const extracted = await extractAndTranslate(
          item.title,
          item.description,
          source.lang,
          source.name
        );

        if (!extracted) { console.log('Extraction failed for:', item.title); continue; }
        if (!extracted.is_scam_pattern) { 
  console.log('Not a pattern:', item.title);
  continue; 
}
console.log('New pattern found:', item.title);

        // Store new intel item
        const { error } = await supabase.from('scam_intel').insert({
          headline: item.title,
          summary_en: extracted.summary_en,
          summary_ms: extracted.summary_ms,
          summary_zh: extracted.summary_zh,
          summary_ta: extracted.summary_ta,
          source: source.name,
          source_url: item.link,
          language: source.lang,
          tactic_tags: extracted.tactic_tags,
          target_demographic: extracted.target_demographic,
          platform: extracted.platform,
          content_hash: hash,
          status: 'new',
          admin_action: 'pending',
          share_text_en: extracted.share_text_en,
          share_text_ms: extracted.share_text_ms,
          share_text_zh: extracted.share_text_zh,
          share_text_ta: extracted.share_text_ta,
        });

        if (error) {
          results.errors++;
        } else {
          results.newItems++;
        }
      }
    } catch {
    results.errors++;
    results.sourceHealth.push({
      name: source.name,
      fetched: 0,
      status: 'error'
    });
  }
  }

  return NextResponse.json({ success: true, results });
}