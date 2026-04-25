export default function DeleteData() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 px-4 py-12">
      <div className="max-w-2xl mx-auto">

        <div className="mb-10">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6 inline-block">
            ← Back to IsThisAScam
          </a>
          <h1 className="text-3xl font-bold text-white mb-2">Data Deletion Request</h1>
          <p className="text-gray-400 text-sm">
            IsThisAScam — operated by JAGA Technologies<br />
            Last updated: April 2026
          </p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm">

          <section>
            <h2 className="text-white font-semibold text-base mb-3">How to Request Data Deletion</h2>
            <p className="mb-3">To request deletion of your data collected by IsThisAScam, use either of the following methods:</p>
            <div className="bg-gray-900 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-white font-medium mb-1">Option 1 — In-app feedback form</p>
                <p>Open IsThisAScam → tap the Feedback button on the home screen → describe your deletion request. We will respond within 14 business days.</p>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Option 2 — Email</p>
                <p>Send a deletion request to <span className="text-blue-400">[isthisascam.my@gmail.com]</span> with the subject line "Data Deletion Request". Include your anonymous device ID if known (found in app settings).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">What Data We Delete</h2>
            <p className="mb-3">Upon a verified deletion request, we will delete the following data associated with your device:</p>
            <ul className="space-y-2 pl-4">
              <li className="flex gap-2"><span className="text-gray-500 mt-0.5">•</span><span><strong className="text-gray-200">Scan submissions</strong> — any text or image content submitted for analysis</span></li>
              <li className="flex gap-2"><span className="text-gray-500 mt-0.5">•</span><span><strong className="text-gray-200">Feedback records</strong> — thumbs up/down ratings and written feedback</span></li>
              <li className="flex gap-2"><span className="text-gray-500 mt-0.5">•</span><span><strong className="text-gray-200">Device identifier</strong> — your anonymous device ID</span></li>
              <li className="flex gap-2"><span className="text-gray-500 mt-0.5">•</span><span><strong className="text-gray-200">Usage statistics</strong> — scan count and verdict history linked to your device</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">What Data Is Retained</h2>
            <p className="mb-3">The following may be retained after deletion for legal and safety purposes:</p>
            <ul className="space-y-2 pl-4">
              <li className="flex gap-2"><span className="text-gray-500 mt-0.5">•</span><span><strong className="text-gray-200">Anonymised scam patterns</strong> — scam content that has been fully anonymised and added to our detection database. This data cannot be linked back to you and is retained to protect other users.</span></li>
              <li className="flex gap-2"><span className="text-gray-500 mt-0.5">•</span><span><strong className="text-gray-200">Aggregated statistics</strong> — non-identifiable usage totals retained for up to 12 months.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">Local Data</h2>
            <p>Data stored locally on your device (scan history, language preference, usage count) can be deleted immediately by going to <strong className="text-gray-200">Settings → Clear All History</strong> in the app, or by uninstalling the app.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">Response Time</h2>
            <p>We will process all deletion requests within <strong className="text-gray-200">14 business days</strong> and confirm completion via the contact method you provided.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">Contact</h2>
            <p>JAGA Technologies<br />
            <span className="text-blue-400">[isthisascam.my@gmail.com]</span></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
          © 2026 JAGA Technologies. All rights reserved.
        </div>

      </div>
    </main>
  );
}