import type { HistoryItem } from "./Output";
import { formatTime } from "../audio";
import {
  Activity,
  BookOpen,
  ChevronRight,
  Compass,
  Download,
  History,
  Keyboard,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  Settings,
  Users,
  Wand2,
} from "lucide-react";
import type { VoiceMode } from "../api";

export type LeftNavTab = "playground" | "history";

export interface LeftNavProps {
  activeTab: LeftNavTab;
  onSelectTab: (tab: LeftNavTab) => void;
  onOpenVoiceMode: (mode: VoiceMode) => void;
  historyCount: number;
  speakersCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNewSession: () => void;
  history?: HistoryItem[];
  currentId?: number | null;
  onSelectHistory?: (item: HistoryItem) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  currentTime?: number;
  duration?: number;
  onExportAll?: () => void;
  onOpenShortcuts?: () => void;
}

const SESSION_BARS = [
  6, 11, 15, 9, 20, 13, 8, 22, 17, 11, 8, 14, 21, 11, 6, 18, 24, 15, 9, 20, 13, 8,
  18, 25, 12, 7, 15, 21, 10, 6, 13, 19,
];

export function LeftNav({
  activeTab,
  onSelectTab,
  onOpenVoiceMode,
  historyCount,
  speakersCount,
  collapsed,
  onToggleCollapse,
  history = [],
  currentId = null,
  onSelectHistory,
  isPlaying = false,
  onTogglePlay,
  currentTime = 0,
  duration = 0,
  onExportAll,
  onOpenShortcuts,
}: LeftNavProps) {
  const currentClip = history.find((h) => h.id === currentId) || history[0];
  const activeClipTitle = currentClip
    ? currentClip.text.slice(0, 24) + (currentClip.text.length > 24 ? "…" : "")
    : "";
  const activeClipDuration = currentClip ? formatTime(currentClip.duration) : "0:00";

  const totalDurationSeconds = history.reduce((acc, h) => acc + (h.duration || 0), 0);

  const formatTotalTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const clipDuration = currentClip?.duration || duration || 0;
  const progressFrac = clipDuration > 0 ? Math.min(1, currentTime / clipDuration) : 0;
  const activeBarIndex = Math.floor(progressFrac * SESSION_BARS.length);

  return (
    <aside className={`figma-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Top Brand Header (44px) */}
      <div className="figma-sidebar-header">
        {collapsed ? (
          <button
            type="button"
            className="figma-collapse-btn"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={17} />
          </button>
        ) : (
          <>
            <div
              className="figma-brand-group"
              onClick={() => onSelectTab("playground")}
              role="button"
              tabIndex={0}
              title="Voice Studio: Egyptian Colloquial Arabic Speech Studio"
            >
              <div className="figma-brand-tile">
                <span className="figma-brand-mark">V</span>
              </div>
              <span className="figma-brand-title">VOICE STUDIO</span>
            </div>
            <button
              type="button"
              className="figma-collapse-btn"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={17} />
            </button>
          </>
        )}
      </div>

      {/* Navigation Groups Scrollable Container */}
      <div className="figma-nav-scroll">
        {/* EXPLORE section */}
        <div className="figma-nav-section">
          <div className="figma-nav-label">EXPLORE</div>
          <button
            type="button"
            className={`figma-nav-item ${activeTab === "playground" ? "active" : ""}`}
            onClick={() => onSelectTab("playground")}
            title="Interactive Studio Playground"
          >
            <div className="figma-nav-icon-wrap">
              <Compass size={16} />
            </div>
            <span className="figma-nav-text">Playground</span>
            <ChevronRight className="figma-nav-item-chevron" size={16} />
          </button>

          <button
            type="button"
            className="figma-nav-item"
            onClick={() => onOpenVoiceMode("speaker")}
            title="Browse Built-in Voices (19 Speakers)"
          >
            <div className="figma-nav-icon-wrap">
              <Users size={16} />
            </div>
            <span className="figma-nav-text">Voice Library</span>
            <span className="figma-nav-badge">{speakersCount}</span>
            <ChevronRight className="figma-nav-item-chevron" size={16} />
          </button>

          <button
            type="button"
            className="figma-nav-item"
            onClick={() => onOpenVoiceMode("clone")}
            title="Zero-Shot Voice Cloning"
          >
            <div className="figma-nav-icon-wrap">
              <Wand2 size={16} />
            </div>
            <span className="figma-nav-text">Voice Clone</span>
            <ChevronRight className="figma-nav-item-chevron" size={16} />
          </button>

          <button
            type="button"
            className={`figma-nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => onSelectTab("history")}
            title="Session Audio Clips & History"
          >
            <div className="figma-nav-icon-wrap">
              <History size={16} />
            </div>
            <span className="figma-nav-text">Recordings</span>
            {historyCount > 0 && <span className="figma-nav-badge">{historyCount}</span>}
            <ChevronRight className="figma-nav-item-chevron" size={16} />
          </button>
        </div>

        {/* SESSION AUDIO section (only when expanded and clips exist) */}
        {!collapsed && history.length > 0 && (
          <div className="figma-nav-section" style={{ marginTop: "10px" }}>
            <div className="figma-nav-label">ACTIVE SESSION</div>
            <div className="figma-session-audio-card">
              {currentClip && (
                <>
                  <div className="figma-clip-top-row">
                    <button
                      type="button"
                      className="figma-session-play-btn"
                      onClick={onTogglePlay}
                      title={isPlaying ? "Pause audio (Space)" : "Play audio (Space)"}
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <Pause size={12} fill="currentColor" />
                      ) : (
                        <Play size={12} fill="currentColor" />
                      )}
                    </button>
                    <div className="figma-active-clip-info">
                      <div className="figma-active-clip-title" title={currentClip.text}>
                        {activeClipTitle}
                      </div>
                      <div className="figma-active-clip-sub">
                        {activeClipDuration} · {currentClip.voice}
                      </div>
                    </div>
                    <span className="figma-session-live-dot-solid" />
                  </div>

                  <div className="figma-session-bars">
                    {SESSION_BARS.map((barHeight, idx) => {
                      const isPlayed = idx <= activeBarIndex;
                      return (
                        <div
                          key={idx}
                          className={`figma-session-bar ${isPlayed ? "played" : ""}`}
                          style={{ height: `${barHeight}px` }}
                        />
                      );
                    })}
                  </div>

                  <div className="figma-session-time-row">
                    <span>{formatTime(currentTime)}</span>
                    <span>{activeClipDuration}</span>
                  </div>
                </>
              )}

              {/* Scrollable list of recent clips */}
              <div className="figma-recent-clips-list">
                {history.map((item, i) => (
                  <div
                    key={item.id}
                    className={`figma-recent-clip-row ${item.id === currentId ? "active" : ""}`}
                    onClick={() => onSelectHistory?.(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="figma-clip-tile">
                      <Play size={10} fill="currentColor" />
                    </div>
                    <div className="figma-recent-clip-meta">
                      <span className="figma-recent-clip-title">{item.text.slice(0, 22)}…</span>
                      <span className="figma-recent-clip-time">
                        {formatTime(item.duration)} · {i === 0 ? "Latest" : item.voice}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="figma-sidebar-conv-footer">
                <span className="figma-conv-summary">
                  {history.length} clips · {formatTotalTime(totalDurationSeconds)}
                </span>
                <button
                  type="button"
                  className="figma-export-all-btn"
                  onClick={onExportAll}
                  title="Export all generated clips as WAV"
                >
                  <Download size={11} />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Flex Spacer pushes Bottom Utility Stack to the bottom */}
        <div className="figma-nav-spacer" />

        {/* Bottom Utility Stack (Section 4.1) */}
        {collapsed ? (
          <div className="figma-collapsed-bottom-icons">
            {onOpenShortcuts && (
              <button
                type="button"
                className="figma-sidebar-utility-btn"
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts"
                aria-label="Shortcuts"
              >
                <Keyboard size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="figma-sidebar-bottom-stack">
            {/* 1. Callout / Promo Card */}
            <div
              className="figma-sidebar-promo-card"
              onClick={() => onSelectTab("playground")}
              title="VoiceTuT Neural Engine v1 · 24 kHz HiFi"
            >
              VoiceTuT Neural Engine v1 · 24 kHz
            </div>

            {/* 2. 4-Icon Utility Row */}
            <div className="figma-sidebar-utility-row">
              <button
                type="button"
                className="figma-sidebar-utility-btn"
                onClick={() => onOpenVoiceMode("speaker")}
                title="Audio Parameters & Settings"
                aria-label="Settings"
              >
                <Settings size={16} />
              </button>
              <button
                type="button"
                className="figma-sidebar-utility-btn"
                onClick={() => onSelectTab("playground")}
                title="Equalizer & Neural Synthesis"
                aria-label="Equalizer"
              >
                <Activity size={16} />
              </button>
              <button
                type="button"
                className="figma-sidebar-utility-btn"
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts"
                aria-label="Shortcuts"
              >
                <Keyboard size={16} />
              </button>
              <button
                type="button"
                className="figma-sidebar-utility-btn"
                onClick={() => window.open("https://github.com/sha-2026/VoiceTuT-TTS", "_blank")}
                title="Documentation & Model Card"
                aria-label="Docs"
              >
                <BookOpen size={16} />
              </button>
            </div>

          </div>
        )}
      </div>
    </aside>
  );
}
