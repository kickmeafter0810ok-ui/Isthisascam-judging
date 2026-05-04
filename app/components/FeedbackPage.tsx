'use client';

import { useState } from 'react';
import type { Lang } from '@/lib/types';

export function FeedbackPage({ lang, onBack }: { lang: Lang; onBack: () => void }) {
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
        body: JSON.stringify({ rating, whatYouLike, needsImprovement, featureSuggestions, wouldRecommend, anythingElse, name, contact, language: lang }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch {
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
        <button onClick={onBack} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl">← Back to App</button>
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
                className={`flex-1 py-3 rounded-xl text-xl transition ${rating >= n ? 'bg-yellow-400' : 'bg-gray-100'}`}>⭐</button>
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
              className={`flex-1 py-3 rounded-xl font-semibold transition ${wouldRecommend === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-900'}`}>✅ Yes</button>
            <button onClick={() => setWouldRecommend(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${wouldRecommend === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-900'}`}>❌ No</button>
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
