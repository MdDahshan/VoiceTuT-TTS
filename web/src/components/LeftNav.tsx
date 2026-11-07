import type { HistoryItem } from "./Output";
import { formatTime } from "../audio";
import {
  imgNavNewVoice,
  imgNavDocs,
  imgNavVoiceLibrary,
  imgNavHistory,
  imgSessionLatestPlay,
  imgSessionLatestLiveDot,
  imgSessionLatestPlayIcon,
  imgSessionClipPlayIcon,
  imgNavDashboard,
  imgNavMyVoices,
  imgSidebarCollapse,
  imgNavPlayground,
} from "../assets/figmaIcons";
import { Pause } from "lucide-react";
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
}: LeftNavProps) {
  const currentClip = history.find((h) => h.id === currentId) || history[0];
  const activeClipTitle = currentClip
    ? currentClip.text.slice(0, 22) + (currentClip.text.length > 22 ? "…" : "")
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
      {/* Brand Header */}
      <div className="figma-sidebar-header">
        <div
          className="figma-brand-group"
          onClick={() => onSelectTab("playground")}
          role="button"
          tabIndex={0}
          title="Voice Studio"
        >
          <div className="figma-brand-tile">
            <span className="figma-brand-mark">V</span>
          </div>
          {!collapsed && <span className="figma-brand-title">VOICE STUDIO</span>}
        </div>
        <button
          type="button"
          className="figma-icon-btn figma-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
          aria-label="Toggle sidebar"
        >
          <img src={imgSidebarCollapse} alt="" className="figma-asset-icon" />
        </button>
      </div>

      {/* Nav List */}
      <div className="figma-nav-scroll">
        {/* EXPLORE section */}
        <div className="figma-nav-section">
          {!collapsed && <div className="figma-nav-label">EXPLORE</div>}
          <button
            type="button"
            className={`figma-nav-item ${activeTab === "playground" ? "active" : ""}`}
            onClick={() => onSelectTab("playground")}
            title="Playground"
          >
            <div className="figma-nav-icon-wrap">
              <img src={imgNavPlayground} alt="" className="figma-asset-icon" />
            </div>
            {!collapsed && <span className="figma-nav-text">Playground</span>}
          </button>
          <button
            type="button"
            className={`figma-nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => onSelectTab("history")}
            title="History"
          >
            <div className="figma-nav-icon-wrap">
              <img src={imgNavHistory} alt="" className="figma-asset-icon" />
            </div>
            {!collapsed && (
              <>
                <span className="figma-nav-text">History</span>
                {historyCount > 0 && (
                  <span className="figma-nav-badge">{historyCount}</span>
                )}
              </>
            )}
          </button>
        </div>

        {/* BUILD section */}
        <div className="figma-nav-section">
          {!collapsed && <div className="figma-nav-label">BUILD</div>}
          <button
            type="button"
            className="figma-nav-item"
            onClick={() => {
              onSelectTab("playground");
              onOpenVoiceMode("clone");
            }}
            title="استنساخ صوت جديد في السايد بار"
          >
            <div className="figma-nav-icon-wrap">
              <img src={imgNavNewVoice} alt="" className="figma-asset-icon" />
            </div>
            {!collapsed && <span className="figma-nav-text">New voice (استنساخ)</span>}
          </button>

          <button
            type="button"
            className="figma-nav-item"
            onClick={() => {
              onSelectTab("playground");
              onOpenVoiceMode("speaker");
            }}
            title="أصوات النظام المتاحة"
          >
            <div className="figma-nav-icon-wrap">
              <img src={imgNavMyVoices} alt="" className="figma-asset-icon" />
            </div>
            {!collapsed && (
              <>
                <span className="figma-nav-text">My voices</span>
                <span className="figma-nav-badge-subtle">{speakersCount}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="figma-nav-item"
            onClick={() => {
              onSelectTab("playground");
              onOpenVoiceMode("speaker");
            }}
            title="مكتبة الأصوات"
          >
            <div className="figma-nav-icon-wrap">
              <img src={imgNavVoiceLibrary} alt="" className="figma-asset-icon" />
            </div>
            {!collapsed && <span className="figma-nav-text">Voice library</span>}
          </button>
        </div>

        {/* MANAGE section */}
        <div className="figma-nav-section">
          {!collapsed && <div className="figma-nav-label">MANAGE</div>}
          <button
            type="button"
            className="figma-nav-item"
            onClick={() => onSelectTab("playground")}
            title="Dashboard"
          >
            <div className="figma-nav-icon-wrap">
              <img src={imgNavDashboard} alt="" className="figma-asset-icon" />
            </div>
            {!collapsed && <span className="figma-nav-text">Dashboard</span>}
          </button>
          <a
            className="figma-nav-item"
            href="https://github.com/MohammedAly22/VoiceTuT-TTS"
            target="_blank"
            rel="noopener noreferrer"
            title="Documentation"
          >
            <div className="figma-nav-icon-wrap">
              <img src={imgNavDocs} alt="" className="figma-asset-icon" />
            </div>
            {!collapsed && <span className="figma-nav-text">Documentation</span>}
          </a>
        </div>

        {/* CONVERSATION AUDIO section — REAL AUDIO CLIPS ONLY! */}
        {!collapsed && (
          <div className="figma-conversation-audio-section">
            <div className="figma-conversation-audio-header">
              <span className="figma-conv-title">CONVERSATION AUDIO</span>
              <span className="figma-conv-badge">{history.length}</span>
            </div>

            {history.length === 0 ? (
              <div className="figma-empty-session">
                <span className="figma-empty-session-text">لا توجد تسجيلات بعد</span>
                <small className="figma-empty-session-sub">
                  قم بتوليد أول مقطع صوتي في الاستوديو ليظهر هنا
                </small>
              </div>
            ) : (
              <>
                {/* Currently Active Clip Card */}
                {currentClip && (
                  <div className="figma-active-clip-card">
                    <div className="figma-clip-top-row">
                      <button
                        type="button"
                        className="figma-session-play-btn"
                        onClick={onTogglePlay}
                        title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                      >
                        {isPlaying ? (
                          <Pause size={12} color="#181818" />
                        ) : (
                          <>
                            <img
                              src={imgSessionLatestPlay}
                              alt=""
                              className="figma-session-play-circle"
                            />
                            <img
                              src={imgSessionLatestPlayIcon}
                              alt=""
                              className="figma-session-play-triangle"
                            />
                          </>
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
                      <img
                        src={imgSessionLatestLiveDot}
                        alt=""
                        className="figma-session-live-dot"
                      />
                    </div>

                    {/* 32-bar Mini Waveform */}
                    <div className="figma-session-bars">
                      {SESSION_BARS.map((barHeight, idx) => {
                        const isPlayed = idx <= activeBarIndex;
                        return (
                          <div
                            key={idx}
                            className="figma-session-bar"
                            style={{
                              height: `${barHeight}px`,
                              backgroundColor: isPlayed ? "#a7b8aa" : "#444444",
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Time display */}
                    <div className="figma-session-time-row">
                      <span className="figma-session-cur-time">{formatTime(currentTime)}</span>
                      <span className="figma-session-total-time">{activeClipDuration}</span>
                    </div>
                  </div>
                )}

                {/* Recent Clips List */}
                <div className="figma-recent-clips-list">
                  {history.slice(0, 4).map((item, i) => (
                    <div
                      key={item.id}
                      className={`figma-recent-clip-row ${item.id === currentId ? "active" : ""}`}
                      onClick={() => onSelectHistory?.(item)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="figma-clip-tile">
                        <img src={imgSessionClipPlayIcon} alt="" className="figma-clip-play-ico" />
                      </div>
                      <div className="figma-recent-clip-meta">
                        <span className="figma-recent-clip-title">
                          {item.text.slice(0, 20)}…
                        </span>
                        <span className="figma-recent-clip-time">
                          {formatTime(item.duration)} · {i === 0 ? "الآن" : `${item.voice}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conversation Audio Footer */}
                <div className="figma-sidebar-conv-footer">
                  <div className="figma-conv-summary">
                    <span className="figma-conv-clips-count">{history.length} مقاطع</span>
                    <span className="figma-conv-total-time">
                      {formatTotalTime(totalDurationSeconds)} إجمالي
                    </span>
                  </div>
                  <button
                    type="button"
                    className="figma-export-all-btn"
                    onClick={onExportAll}
                    title="تصدير جميع مقاطع الصوت المولدة كملفات WAV"
                  >
                    تصدير الكل
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
