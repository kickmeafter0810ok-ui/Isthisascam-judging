import type { Verdict, Result } from './types';

export const FREE_LIMIT = 20;

export const VERDICT_STYLE: Record<Verdict, { icon: string; color: string; bg: string; border: string; bar: string }> = {
  scam:       { icon: '🚨', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    bar: 'bg-red-500' },
  suspicious: { icon: '⚠️', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', bar: 'bg-yellow-500' },
  safe:       { icon: '✅', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  bar: 'bg-green-500' },
  no_text:    { icon: '📷', color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200',   bar: 'bg-gray-400' },
};

export const SCAM_LESSONS = [
  { title: '🏦 Bank Impersonation SMS', tag: 'Common in Malaysia', content: 'Real banks NEVER send links asking you to verify accounts. Legitimate bank SMS contains your card last 4 digits and specific merchant names. If you receive a link, call your bank directly using the number on the back of your card.', example: 'SCAM: "Your Maybank account suspended. Click bit.ly/verify"\nSAFE: "HLB: Card 0088 debited MYR220 at PETRONAS. Call if not you."' },
  { title: '💼 Job Scams', tag: 'Rising trend', content: 'Scammers offer high-paying part-time jobs requiring no skills — typically liking YouTube videos or Shopee products. They ask you to top up a wallet first before earning. You will never get paid back.', example: 'Red flags: Work from home, RM500/day, no experience needed, must top up first.' },
  { title: '❤️ Love Scams', tag: 'Most losses in Malaysia', content: 'Scammers build romantic relationships online over weeks or months, then claim an emergency requiring money. Malaysians lost over RM1.2 billion to this in 2023.', example: 'Red flags: Never meets in person, always has emergencies, asks for money transfers.' },
  { title: '🎰 Prize & Lucky Draw Scams', tag: 'Very common', content: 'You win a prize from Shopee, TnG, or Petronas, but must pay a fee to claim it. Real companies never ask winners to pay fees.', example: 'SCAM: "Tahniah! You won RM5,000. Pay RM50 admin fee to claim."' },
  { title: '📱 Parcel Delivery Scams', tag: 'Post-pandemic surge', content: 'Fake notifications from Pos Malaysia, J&T, or DHL claiming your parcel is held. They direct you to a fake website to pay a small release fee and steal your card details.', example: 'Red flags: Unexpected parcel, small payment required, link not from official domain.' },
  { title: '🏛️ Government Impersonation', tag: 'Very serious', content: 'Scammers impersonate LHDN, PDRM, or MCMC claiming you have unpaid taxes or are under investigation. Government agencies NEVER demand payment via phone or WhatsApp.', example: 'Red flags: Urgent arrest threat, demand for immediate bank transfer, secrecy required.' },
];

// ─── Storage keys ────────────────────────────────────────────────────────────
export const HISTORY_KEY     = 'itsascam_history';
export const LANG_KEY        = 'itsascam_lang';
export const CONSENT_KEY     = 'itsascam_consent';
export const DISCLAIMER_KEY  = 'itsascam_disclaimer';
export const DEVICE_KEY      = 'itsascam_device';
export const ONBOARDING_KEY  = 'itsascam_onboarding';
export const DARK_MODE_KEY   = 'itsascam_dark';
export const usageKey = () => `itsascam_usage_${new Date().toISOString().slice(0, 7)}`;

// ─── Storage helpers ─────────────────────────────────────────────────────────
export const loadHistory    = (): Result[] => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } };
export const persistHistory = (h: Result[]) => localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
export const loadUsage      = (): number => parseInt(localStorage.getItem(usageKey()) || '0');
export const bumpUsage      = () => localStorage.setItem(usageKey(), String(loadUsage() + 1));
export const getDeviceId    = (): string => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) { id = `d_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem(DEVICE_KEY, id); }
  return id;
};
