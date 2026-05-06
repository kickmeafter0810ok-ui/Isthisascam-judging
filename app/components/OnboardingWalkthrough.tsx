'use client';

import { useState, useRef } from 'react';
import { ONBOARDING_KEY } from '@/lib/constants';

interface Props {
  t: (k: string) => string;
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: '🔍',
    titleKey: 'ob_s1_title',
    subKey: 'ob_s1_sub',
    bullets: ['onboardingCan1', 'onboardingCan2', 'onboardingCan3'],
    bg: 'from-red-50 to-orange-50',
    iconBg: 'bg-red-100',
  },
  {
    icon: '🌏',
    titleKey: 'ob_s2_title',
    subKey: 'ob_s2_sub',
    custom: 'languages',
    bg: 'from-blue-50 to-indigo-50',
    iconBg: 'bg-blue-100',
  },
  {
    icon: '📚',
    titleKey: 'ob_s3_title',
    subKey: 'ob_s3_sub',
    bullets: ['onboardingHow1', 'onboardingHow2', 'onboardingHow3'],
    bg: 'from-green-50 to-emerald-50',
    iconBg: 'bg-green-100',
  },
  {
    icon: '⭐',
    titleKey: 'ob_s4_title',
    subKey: 'ob_s4_sub',
    custom: 'free',
    bg: 'from-yellow-50 to-amber-50',
    iconBg: 'bg-yellow-100',
  },
];

const LANG_PILLS = [
  { flag: '🇬🇧', label: 'English' },
  { flag: '🇲🇾', label: 'Bahasa Melayu' },
  { flag: '🇨🇳', label: '中文简体' },
  { flag: '🇮🇳', label: 'தமிழ்' },
];

export function OnboardingWalkthrough({ t, onComplete }: Props) {
  const [slide, setSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const finish = (persist: boolean) => {
    if (persist) localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1);
    else finish(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 50 && slide < SLIDES.length - 1) setSlide(s => s + 1);
    if (dx < -50 && slide > 0) setSlide(s => s - 1);
    touchStartX.current = null;
  };

  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-60">
      <div
        className={`w-full max-w-md bg-gradient-to-br ${current.bg} rounded-t-3xl overflow-hidden`}
        style={{ maxHeight: '88vh' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top bar: skip */}
        <div className="flex justify-between items-center px-5 pt-5 pb-2">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === slide ? 'w-6 h-2 bg-gray-700' : 'w-2 h-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => finish(false)}
            className="text-sm text-gray-500 font-medium px-2 py-1"
          >
            {t('ob_skip')}
          </button>
        </div>

        {/* Slide content */}
        <div className="px-6 pb-2 slide-in" key={slide}>
          {/* Icon */}
          <div className={`w-20 h-20 ${current.iconBg} rounded-2xl flex items-center justify-center text-4xl mx-auto mt-4 mb-5`}>
            {current.icon}
          </div>

          {/* Title & subtitle */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">{t(current.titleKey)}</h2>
          <p className="text-sm text-gray-600 text-center mb-5">{t(current.subKey)}</p>

          {/* Bullets */}
          {current.bullets && (
            <div className="bg-white bg-opacity-70 rounded-2xl p-4 space-y-2.5">
              {current.bullets.map(key => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                  <p className="text-sm text-gray-800">{t(key)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Language pills */}
          {current.custom === 'languages' && (
            <div className="bg-white bg-opacity-70 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-2">
                {LANG_PILLS.map(lp => (
                  <div key={lp.label} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-sm">
                    <span className="text-xl">{lp.flag}</span>
                    <span className="text-sm font-medium text-gray-800">{lp.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Free tier */}
          {current.custom === 'free' && (
            <div className="bg-white bg-opacity-70 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🆓</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">20 scans / month</p>
                  <p className="text-xs text-gray-600">No account needed to get started</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">Private by design</p>
                  <p className="text-xs text-gray-600">Messages are never stored on our servers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💎</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">Premium coming soon</p>
                  <p className="text-xs text-gray-600">Unlimited scans + priority analysis</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="px-6 pt-4 pb-6 space-y-2">
          <button
            onClick={next}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl text-base transition"
          >
            {isLast ? t('ob_getStarted') : t('ob_next')}
          </button>
          {isLast && (
            <button
              onClick={() => finish(true)}
              className="w-full text-xs text-gray-500 py-2"
            >
              {t('ob_dontShow')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
