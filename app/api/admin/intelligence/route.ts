import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const RSS_SOURCES = [
  // English
  { url: 'https://www.freemalaysiatoday.com/feed/', name: 'Free Malaysia Today', lang: 'en' },
  { url: 'https://vulcanpost.com/feed/', name: 'Vulcan Post', lang: 'en' },
  { url: 'https://says.com/my/rss', name: 'Says.com', lang: 'en' },
  { url: 'https://www.thestar.com.my/rss/news/nation', name: 'The Star', lang: 'en' },
  // Malay
  { url: 'https://www.bharian.com.my/rss', name: 'Berita Harian', lang: 'ms' },
  { url: 'https://www.hmetro.com.my/rss', name: 'Harian Metro', lang: 'ms' },
  // Chinese
  { url: 'https://www.sinchew.com.my/feed/', name: 'Sin Chew Daily', lang: 'zh' },
  { url: 'https://www.chinapress.com.my/feed/', name: 'China Press', lang: 'zh' },
  // Government
  { url: 'https://www.rmp.gov.my/rss', name: 'PDRM', lang: 'en' },
  { url: 'https://www.bnm.gov.my/rss', name: 'Bank Negara Malaysia', lang: 'en' },
  { url: 'https://www.mcmc.gov.my/rss', name: 'MCMC', lang: 'en' },
];

const SCAM_KEYWORDS = [
  // English
  'scam', 'fraud', 'phishing', 'swindl', 'cheat', 'fake', 'impersonat',
  'syndicat', 'victim', 'losses', 'duped', 'deceiv',
  // Malay
  'scam', 'penipuan', 'palsu', 'menipu', 'sindiket', 'mangsa', 'kerugian',
  'phishing', 'peras ugut', 'ugutan', 'tipuan',
  // Chinese
  '诈骗', '骗局', '欺诈', '钓鱼', '冒充', '假冒', '受害', '损失',
];

async function fetchRSS(url: string): Promise<{ title: string; description: string; link: string }[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'IsThisAScam-Bot/1.0 (scam-education-tool)' },
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
    return items.slice(0, 10);
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
Your job is to extract SCAM TYPE PATTERNS from news articles — not individual cases.

Rules:
- Only process if the article describes a reusable scam pattern or tactic
- Ignore individual victim stories with no new pattern
- Focus on HOW the scam works, not WHO was victimised
- Generate 2-sentence summaries in all 4 languages
- Generate shareable warning text (no URLs, ends with "Search IsThisAScam on Google/Play Store")

Return JSON only:
{
  "is_scam_pattern": true/false,
  "summary_en": "2-sentence scam pattern description in English",
  "summary_ms": "2-sentence scam pattern description in Bahasa Malaysia",
  "summary_zh": "2句话诈骗模式描述（简体中文）",
  "summary_ta": "2-வரி மோசடி முறை விளக்கம் தமிழில்",
  "tactic_tags": ["urgency", "impersonation", etc],
  "target_demographic": "e.g. bank customers, job seekers, elderly",
  "platform": "e.g. WhatsApp, SMS, Telegram, Phone call",
  "share_text_en": "shareable WhatsApp warning in English, no URLs, ends with IsThisAScam mention",
  "share_text_ms": "shareable WhatsApp warning in Bahasa Malaysia, no URLs, ends with IsThisAScam mention",
  "share_text_zh": "shareable WhatsApp warning in Chinese, no URLs, ends with IsThisAScam mention",
  "share_text_ta": "shareable WhatsApp warning in Tamil, no URLs, ends with IsThisAScam mention"
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
  };

  for (const source of RSS_SOURCES) {
    try {
      const items = await fetchRSS(source.url);
      results.fetched += items.length;

      for (const item of items) {
        if (!isScamRelated(item.title, item.description)) continue;
        results.scamRelated++;

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

        if (!extracted || !extracted.is_scam_pattern) continue;

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
    }
  }

  return NextResponse.json({ success: true, results });
}