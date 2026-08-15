import React, { useState, useRef, useMemo, memo } from "react";
import { useAppContext } from "../context/AppContext.jsx";
import { getLocalizedNote } from "../utils/constants.js";

/**
 * Journal item rendering component (Memoized to prevent unnecessary updates).
 */
const JournalItem = memo(({ item, style, moodLabels, moodColors, moodEmojis }) => {
  const { t } = useAppContext();
  const score = item.score || 1;
  const moodIdx = Math.min(score - 1, 7);
  
  let emoji = moodEmojis[moodIdx] || "💡";
  let label = moodLabels[moodIdx] || "";
  let color = moodColors[moodIdx] || "#a78bfa";

  if (item.note === "开心") {
    emoji = moodEmojis[3]; // Neutral emoji
    label = t.mood5 || "Vui";
    color = moodColors[5]; // Happy color (#3b82f6)
  } else if (item.note === "非常开心") {
    emoji = moodEmojis[1]; // Sad emoji
    label = t.mood6 || "Rất vui";
    color = moodColors[6]; // Very Happy color (#8b5cf6)
  }


  return (
    <div
      style={{
        ...style,
        padding: "4px 8px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 16px",
          background: "rgba(255, 255, 255, 0.025)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: 12,
          height: "100%",
          boxSizing: "border-box",
          backdropFilter: "blur(15px)",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
          transition: "transform 0.2s ease, border-color 0.2s ease",
        }}
        className="recent-journal-card"
      >
        <div style={{ width: 34, height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.isValidElement(emoji) ? React.cloneElement(emoji, { style: { width: "100%", height: "100%" } }) : <span style={{ fontSize: 24 }}>{emoji}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: 12,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {getLocalizedNote(item.note, item.score, t)}
          </div>
          <div style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 10, marginTop: 2 }}>{item.date}</div>
        </div>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 99,
            background: `${color}18`,
            border: `1px solid ${color}33`,
            color: color,
            fontSize: 10,
            fontWeight: 600,
            whiteSpace: "nowrap",
            flexShrink: 0,
            textShadow: `0 0 8px ${color}33`,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
});

JournalItem.displayName = "JournalItem";

/**
 * High-performance virtualized list container for rendering long journal arrays.
 */
export const VirtualJournalList = memo(
  ({ items, moodLabels, moodColors, moodEmojis, height = 260, itemHeight = 64 }) => {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);

    const handleScroll = (e) => {
      setScrollTop(e.currentTarget.scrollTop);
    };

    const totalHeight = items.length * itemHeight;

    // Buffer visible range by 2 extra items on both top and bottom to avoid flickering
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
    const endIndex = Math.min(items.length, Math.ceil((scrollTop + height) / itemHeight) + 2);

    const visibleItems = useMemo(() => {
      return items.slice(startIndex, endIndex).map((item, idx) => ({
        item,
        index: startIndex + idx,
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: itemHeight,
          transform: `translateY(${(startIndex + idx) * itemHeight}px)`,
        },
      }));
    }, [items, startIndex, endIndex, itemHeight]);

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          position: "relative",
          height,
          overflowY: "auto",
          scrollbarWidth: "thin",
          paddingRight: 4,
        }}
      >
        <div style={{ height: totalHeight, width: "100%", position: "relative" }}>
          {visibleItems.map(({ item, index, style }) => (
            <JournalItem
              key={item.id || index}
              item={item}
              style={style}
              moodLabels={moodLabels}
              moodColors={moodColors}
              moodEmojis={moodEmojis}
            />
          ))}
        </div>
      </div>
    );
  }
);

VirtualJournalList.displayName = "VirtualJournalList";

