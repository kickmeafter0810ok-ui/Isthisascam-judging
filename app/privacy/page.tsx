export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <a href="/" className="text-blue-600 text-sm mb-6 block">← Back to App</a>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-xs text-gray-500 mb-8">Last updated: April 2026 | English version prevails</p>

        {[
          {
            title: '1. Who We Are',
            content: 'IsThisAScam is an AI-powered scam detection tool developed by an individual developer based in Malaysia. The app is currently operated as a personal project under development. Contact: via the feedback form at isthisascam-alpha.vercel.app'
          },
          {
            title: '2. What Data We Collect',
            content: `We collect the following data when you use IsThisAScam:

a) Message content & images
- Temporarily transmitted to OpenAI (USA) for AI analysis
- NOT stored by us after analysis is complete
- Subject to OpenAI's privacy policy: openai.com/privacy

b) Anonymous usage statistics (stored in Supabase, Singapore)
- Verdict result (scam/suspicious/safe)
- Language selected
- Country/region (from IP address)
- Whether input was text or image
- No personally identifiable information

c) User feedback & corrections
- If you tap ✅ or ❌ on a result, your correction is stored
- Includes the message text and your suggested verdict
- Reviewed by the IsThisAScam team
- May be used to improve detection accuracy

d) Device identifier
- A randomly generated anonymous ID stored on your device
- Used for usage limiting only
- Not linked to any personal information

e) App preferences (stored locally on your device only)
- Language preference
- Scan history
- Usage count
- Consent status`
          },
          {
            title: '3. How We Use Your Data',
            content: `• To provide scam detection analysis
- To improve detection accuracy via feedback
- To monitor app usage and performance
- To enforce fair usage limits (10 free AI scans/month)

We do NOT:
- Sell your data to third parties
- Use your data for advertising
- Store your message content after analysis
- Link usage data to your identity`
          },
          {
            title: '4. Third Party Services',
            content: `OpenAI (USA)
- Purpose: AI analysis of messages and images
- Data sent: Message content / image content
- Privacy policy: openai.com/privacy
- Data processing agreement: In place with OpenAI

Supabase (Singapore)
- Purpose: Anonymous analytics storage
- Data sent: Verdict, language, country, device ID
- Privacy policy: supabase.com/privacy

Vercel (USA)
- Purpose: App hosting and delivery
- Data sent: Standard web request logs (IP, browser)
- Privacy policy: vercel.com/legal/privacy-policy

Tally.so
- Purpose: User feedback collection (optional)
- Only if you voluntarily submit the feedback form
- Privacy policy: tally.so/privacy`
          },
          {
            title: '5. Your Rights Under Malaysian PDPA',
            content: `Under the Personal Data Protection Act 2010 (PDPA), you have the right to:

- Access your personal data — most data is stored locally on your device
- Correct inaccurate data — use the feedback mechanism in the app
- Delete your data — use "Clear All History" in Settings
- Withdraw consent — uninstall the app and clear browser data
- Opt out of data collection — use the app in your browser's private/incognito mode

For data deletion requests or privacy concerns, please use the feedback form in the app.`
          },
          {
            title: '6. Data Retention',
            content: `• Message content: Not retained (processed and discarded)
- Anonymous scan statistics: 12 months
- User feedback: 24 months or until deleted by admin
- Device identifier: Until you clear browser data
- App preferences: Until you clear browser data or use "Clear History"`
          },
          {
            title: '7. Security',
            content: `We implement the following security measures:
- All data transmitted via HTTPS encryption
- API keys stored as server-side environment variables (never exposed to browser)
- Row-level security on database
- Rate limiting to prevent abuse
- Input sanitization to prevent injection attacks

However, no system is 100% secure. We cannot guarantee absolute security of data transmitted over the internet.`
          },
          {
            title: '8. Children',
            content: 'IsThisAScam is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has submitted data, please contact us via the feedback form.'
          },
          {
            title: '9. Changes to This Policy',
            content: 'We may update this Privacy Policy from time to time. Changes will be reflected by the "Last updated" date above. Continued use of the app after changes constitutes acceptance of the updated policy.'
          },
          {
            title: '10. Disclaimer of Liability',
            content: `IsThisAScam is provided "as is" without warranty of any kind.

- Results are AI-generated and not guaranteed to be accurate
- This app does not constitute legal, financial, or security advice
- The developer is not liable for any losses, damages, or decisions made based on app results
- Always verify suspicious messages with official sources (your bank, PDRM at 999, MCMC at 1-800-888-030)
- Report scams to: CCID at 013-211 9999 or ccid.rmp.gov.my`
          },
          {
            title: '11. Contact',
            content: 'For privacy-related inquiries, please use the feedback form accessible from the app\'s home screen. We aim to respond within 14 business days.'
          },
        ].map((section, i) => (
          <div key={i} className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            IsThisAScam © 2026 | isthisascam-alpha.vercel.app
            <br />This Privacy Policy is provided in English. Translations are for convenience only.
          </p>
        </div>
      </div>
    </div>
  );
}