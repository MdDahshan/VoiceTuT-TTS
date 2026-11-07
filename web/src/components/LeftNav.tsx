import type { HistoryItem } from "./Output";
import { formatTime } from "../audio";
import {
  BookOpen,
  Compass,
  Download,
  FileText,
  History,
  LayoutDashboard,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  Users,
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
      {/* Brand Header */}
      <div className="figma-sidebar-header">
        <div
          className="figma-brand-group"
          onClick={() => onSelectTab("playground")}
          role="button"
          tabIndex={0}
          title="Voice Studio: استوديو توليد الصوت بالعامية المصرية"
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
          title={collapsed ? "توسيع الشريط الجانبي (عرض الخيارات كاملة)" : "طي الشريط الجانبي لتوفير مساحة للعمل"}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
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
            title="الاستوديو التفاعلي: اكتب النص واختر المتحدث لتوليد الصوت فوراً"
          >
            <div className="figma-nav-icon-wrap">
              <Compass size={16} />
            </div>
            {!collapsed && <span className="figma-nav-text">Playground</span>}
          </button>
          <button
            type="button"
            className={`figma-nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => onSelectTab("history")}
            title="سجل الجلسة: استعراض جميع التسجيلات والمقاطع التي قمت بتوليدها"
          >
            <div className="figma-nav-icon-wrap">
              <History size={16} />
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
          {!collapsed && <div className="figma-nav-label">BUILD & VOICES</div>}
          <button
            type="button"
            className="figma-nav-item"
            onClick={() => {
              onSelectTab("playground");
              onOpenVoiceMode("clone");
            }}
            title="استنساخ صوت جديد: رفع ملف صوتي مرجعي أو التسجيل المباشر من الميكروفون في السايد بار الأيمن"
          >
            <div className="figma-nav-icon-wrap">
              <Mic size={16} />
            </div>
            {!collapsed && <span className="figma-nav-text">New Voice (Clone)</span>}
          </button>

          <button
            type="button"
            className="figma-nav-item"
            onClick={() => {
              onSelectTab("playground");
              onOpenVoiceMode("speaker");
            }}
            title="أصوات النظام: تصفح واختيار أحد الأصوات الـ 19 الرسمية المتاحة في النظام"
          >
            <div className="figma-nav-icon-wrap">
              <Users size={16} />
            </div>
            {!collapsed && (
              <>
                <span className="figma-nav-text">My Voices</span>
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
            title="مكتبة الأصوات: استعراض شامل للأصوات وتصنيفاتها (رجالي / حريمي / نبرات)"
          >
            <div className="figma-nav-icon-wrap">
              <BookOpen size={16} />
            </div>
            {!collapsed && <span className="figma-nav-text">Voice Library</span>}
          </button>
        </div>

        {/* MANAGE section */}
        <div className="figma-nav-section">
          {!collapsed && <div className="figma-nav-label">MANAGE</div>}
          <button
            type="button"
            className="figma-nav-item"
            onClick={() => onSelectTab("playground")}
            title="لوحة التحكم الرئيسية"
          >
            <div className="figma-nav-icon-wrap">
              <LayoutDashboard size={16} />
            </div>
            {!collapsed && <span className="figma-nav-text">Dashboard</span>}
          </button>
          <a
            className="figma-nav-item"
            href="https://github.com/MohammedAly22/VoiceTuT-TTS"
            target="_blank"
            rel="noopener noreferrer"
            title="التوثيق والمستندات التقنية على GitHub"
          >
            <div className="figma-nav-icon-wrap">
              <FileText size={16} />
            </div>
            {!collapsed && <span className="figma-nav-text">Documentation</span>}
          </a>
        </div>

        {/* CONVERSATION AUDIO section — FULLY SCROLLABLE FOR ALL CLIPS */}
        {!collapsed && (
          <div className="figma-conversation-audio-section">
            <div className="figma-conversation-audio-header">
              <span
                className="figma-conv-title"
                title="تسجيلات الجلسة الصوتية: قائمة بجميع المقاطع التي تم توليدها مؤخراً"
              >
                SESSION AUDIO
              </span>
              <span className="figma-conv-badge">{history.length}</span>
            </div>

            {history.length === 0 ? (
              <div
                className="figma-empty-session"
                title="لا توجد مقاطع صوتية بعد — اكتب نصاً واضغط على توليد لتشغيل أول مقطع"
              >
                <span className="figma-empty-session-text">No recordings yet</span>
                <small className="figma-empty-session-sub">
                  Generated audio clips will automatically appear here
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
                        title={isPlaying ? "إيقاف مؤقت (Space)" : "تشغيل هذا المقطع الصوتي (Space)"}
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
                      <span
                        className="figma-session-live-dot-solid"
                        title="المقطع المحدد حالياً للتشغيل"
                      />
                    </div>

                    {/* 32-bar Mini Waveform */}
                    <div className="figma-session-bars">
                      {SESSION_BARS.map((barHeight, idx) => {
                        const isPlayed = idx <= activeBarIndex;
                        return (
                          <div
                            key={idx}
                            className={`figma-session-bar ${isPlayed ? "played" : "unplayed"}`}
                            style={{ height: `${barHeight}px` }}
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

                {/* All Generated Clips — SCROLLABLE CONTAINER! */}
                <div
                  className="figma-recent-clips-list scrollable"
                  title="اسحب للتمرير وعرض جميع المقاطع الصوتية المولدة في هذه الجلسة"
                >
                  {history.map((item, i) => (
                    <div
                      key={item.id}
                      className={`figma-recent-clip-row ${item.id === currentId ? "active" : ""}`}
                      onClick={() => onSelectHistory?.(item)}
                      role="button"
                      tabIndex={0}
                      title={`انقر لتحميل وتشغيل هذا المقطع: "${item.text}"`}
                    >
                      <div className="figma-clip-tile">
                        <Play size={10} fill="currentColor" />
                      </div>
                      <div className="figma-recent-clip-meta">
                        <span className="figma-recent-clip-title">
                          {item.text.slice(0, 24)}…
                        </span>
                        <span className="figma-recent-clip-time">
                          {formatTime(item.duration)} · {i === 0 ? "Latest" : item.voice}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Session Audio Footer */}
                <div className="figma-sidebar-conv-footer">
                  <div className="figma-conv-summary">
                    <span className="figma-conv-clips-count">{history.length} clips</span>
                    <span className="figma-conv-total-time">
                      {formatTotalTime(totalDurationSeconds)} total
                    </span>
                  </div>
                  <button
                    type="button"
                    className="figma-export-all-btn"
                    onClick={onExportAll}
                    title="تصدير وتحميل جميع المقاطع الصوتية المولدة في هذه الجلسة كملفات WAV منفصلة"
                  >
                    <Download size={12} />
                    <span>Export All</span>
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
