export type Page = 'language' | 'home' | 'scan' | 'results' | 'history' | 'settings' | 'learn' | 'feedback';
export type Verdict = 'scam' | 'suspicious' | 'safe' | 'no_text';
export type Lang = 'en' | 'ms' | 'zh-s' | 'ta';

export interface Result {
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
