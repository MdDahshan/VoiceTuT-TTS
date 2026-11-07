import { History } from "lucide-react";
import { formatTime } from "../audio";
import type { HistoryItem } from "./Output";

export function HistoryView({ history, onSelect }: { history: HistoryItem[]; onSelect: (item: HistoryItem) => void }) {
  return (
    <div className="figma-canvas-scroll">
      <div className="figma-canvas-inner">
        <div className="figma-showcase-header">
          <h1 className="figma-showcase-title">Session Recordings &amp; History</h1>
          <p className="figma-showcase-sub">Review, replay, and manage audio clips generated during this studio session.</p>
        </div>
        {history.length === 0 ? (
          <div className="figma-preview-stage-container" style={{ textAlign: "center", padding: "40px" }}>
            <History size={32} color="#A0A0A0" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500 }}>No audio clips generated yet</p>
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Synthesize any text in the playground to begin creating recordings.</span>
          </div>
        ) : (
          <div className="figma-showcase-grid">
            {history.map((item) => (
              <div key={item.id} className="figma-tile-card" onClick={() => onSelect(item)} role="button" tabIndex={0}>
                <div className="figma-tile-media">
                  <svg className="figma-tile-media-svg" viewBox="0 0 200 112" fill="none">
                    <path d="M 10 56 Q 30 20, 50 56 T 90 56 T 130 30 T 170 56 T 190 56" stroke="#E5E7EB" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <div className="figma-tile-footer">
                  <span className="figma-tile-title">{item.text}</span>
                  <span className="figma-tile-badge">{formatTime(item.duration)} · {item.voice}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
