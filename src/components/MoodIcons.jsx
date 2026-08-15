import React from "react";

const moodIconStyle = {
  display: "inline-block",
  verticalAlign: "middle",
  width: "1.25em",
  height: "1.25em",
  transition: "transform 0.2s ease",
};

// 1. Very Sad (Rất tệ) - Red theme (#ef4444)
export function MoodVerySad(props) {
  return (
    <svg style={moodIconStyle} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" fill="#ef444415" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
      <path d="M16 17s-1.5-2.5-4-2.5-4 2.5-4 2.5" />
      <path d="M9 11v3M15 11v3" stroke="#3b82f6" strokeWidth="1.5" />
    </svg>
  );
}

// 2. Sad (Buồn) - Orange theme (#f97316)
export function MoodSad(props) {
  return (
    <svg style={moodIconStyle} viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" fill="#f9731615" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
      <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
    </svg>
  );
}

// 3. Uneasy (Khó chịu) - Yellow theme (#eab308)
export function MoodUnhappy(props) {
  return (
    <svg style={moodIconStyle} viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" fill="#eab30815" />
      <path d="M8 8.5c1 .5 2 0 2 0M16 8.5c-1 .5-2 0-2 0" />
      <line x1="9" y1="10" x2="9.01" y2="10" strokeWidth="3" />
      <line x1="15" y1="10" x2="15.01" y2="10" strokeWidth="3" />
      <path d="M8 15h3a1 1 0 0 1 1 1v0a1 1 0 0 0 1 1h3" />
    </svg>
  );
}

// 4. Neutral (Bình thường) - Gray theme (#6b7280)
export function MoodNeutral(props) {
  return (
    <svg style={moodIconStyle} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" fill="#6b728015" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
      <line x1="8" y1="15" x2="16" y2="15" />
    </svg>
  );
}

// 5. OK (Ổn) - Green theme (#22c55e)
export function MoodOk(props) {
  return (
    <svg style={moodIconStyle} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" fill="#22c55e15" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
      <path d="M9.5 14.5s1 1 2.5 1 2.5-1 2.5-1" />
    </svg>
  );
}

// 6. Happy (Vui) - Blue theme (#3b82f6)
export function MoodHappy(props) {
  return (
    <svg style={moodIconStyle} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" fill="#3b82f615" />
      <path d="M8 10c.5-.8 1.5-.8 2 0M14 10c.5-.8 1.5-.8 2 0" />
      <path d="M8 14s1.5 3 4 3 4-3 4-3" />
    </svg>
  );
}

// 7. Very Happy (Rất vui) - Purple theme (#8b5cf6)
export function MoodVeryHappy(props) {
  return (
    <svg style={moodIconStyle} viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" fill="#8b5cf615" />
      <path d="M8 10c.5-.8 1.5-.8 2 0M14 10c.5-.8 1.5-.8 2 0" />
      <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4H8z" fill="#8b5cf633" />
    </svg>
  );
}

// 8. Excellent (Tuyệt vời) - Pink theme (#ec4899)
export function MoodExcellent(props) {
  return (
    <svg style={moodIconStyle} viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" fill="#ec489915" />
      {/* Star Eyes */}
      <path d="M9 7l.6 1.2 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2z" fill="#ec4899" />
      <path d="M15 7l.6 1.2 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2z" fill="#ec4899" />
      <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4H8z" fill="#ec489933" />
    </svg>
  );
}
