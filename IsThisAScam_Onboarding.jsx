import { useState } from "react";

const slides = [
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" fill="#FAECE7" />
        <path d="M32 18v18M32 42v2" stroke="#D85A30" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    title: "Scams are evolving. Fast.",
    body:
      "Fraudsters use sophisticated messages, fake websites, and impersonation tactics. IsItAScam helps you spot them before it's too late.",
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" fill="#E1F5EE" />
        <path d="M22 32l7 7 13-14" stroke="#1D9E75" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Paste. Scan. Stay safe.",
    body:
      "Submit any suspicious message, link, or screenshot. Our AI analyzes it instantly and gives you a clear risk verdict — in seconds.",
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" fill="#E6F1FB" />
        <rect x="18" y="22" width="20" height="16" rx="3" stroke="#378ADD" strokeWidth="2.5" />
        <path d="M23 30h10M23 35h6" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" />
        <rect x="40" y="28" width="8" height="12" rx="2" fill="#E6F1FB" stroke="#378ADD" strokeWidth="2" />
        <path d="M40 34h8" stroke="#378ADD" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M44 25l-1 3h-3l2.5 2-1 3 2.5-2 2.5 2-1-3 2.5-2h-3z" fill="#378ADD" />
      </svg>
    ),
    title: "20 free scans — and you make them smarter",
    body:
      "Submit any suspicious text, link, or screenshot for AI analysis. After each verdict, tell us if we got it right — your feedback trains the system to catch scams more accurately over time.",
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" fill="#FAEEDA" />
        <path d="M32 20a12 12 0 1 1 0 24 12 12 0 0 1 0-24z" stroke="#BA7517" strokeWidth="2.5" />
        <path d="M32 28v5l3 3" stroke="#BA7517" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    title: "AI verdicts are guidance, not legal advice",
    body:
      "IsItAScam provides risk assessments based on pattern analysis. Results may not be 100% accurate. Always use your own judgement — when in doubt, do not engage or transfer money.",
    isDisclaimer: true,
  },
];

export default function IsItAScamOnboarding({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [agreed, setAgreed] = useState(false);

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (agreed && onComplete) onComplete();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #fff9f6 0%, #f0f9ff 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "48px 24px 40px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        boxSizing: "border-box",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8, alignSelf: "center" }}>
        {slides.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? "#D85A30" : "#E0D8D4",
              transition: "width 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Slide content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 24,
          padding: "32px 0",
        }}
      >
        <div style={{ animation: "fadeIn 0.4s ease" }}>{slide.icon}</div>

        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#1a1a1a",
              margin: "0 0 12px",
              lineHeight: 1.3,
            }}
          >
            {slide.title}
          </h1>
          <p
            style={{
              fontSize: 16,
              color: slide.isDisclaimer ? "#6b4c1e" : "#555",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {slide.body}
          </p>
        </div>

        {/* Disclaimer checkbox — last slide only */}
        {isLast && (
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              background: "#FAEEDA",
              border: "1px solid #EFC97A",
              borderRadius: 12,
              padding: "14px 16px",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 3, accentColor: "#D85A30", width: 18, height: 18, flexShrink: 0 }}
            />
            <span style={{ fontSize: 14, color: "#6b4c1e", lineHeight: 1.5 }}>
              I understand that IsItAScam's verdicts are AI-generated risk assessments, not legal advice. I will make my own final decisions and not hold IsItAScam liable for any outcomes.
            </span>
          </label>
        )}
      </div>

      {/* Navigation */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={handleNext}
          disabled={isLast && !agreed}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            border: "none",
            background: isLast && !agreed ? "#ccc" : "#D85A30",
            color: "#fff",
            fontSize: 17,
            fontWeight: 600,
            cursor: isLast && !agreed ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {isLast ? "Start scanning →" : "Continue"}
        </button>

        {!isLast && (
          <button
            onClick={() => {
              setCurrent(slides.length - 1);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#999",
              fontSize: 14,
              cursor: "pointer",
              padding: "8px",
            }}
          >
            Skip
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
