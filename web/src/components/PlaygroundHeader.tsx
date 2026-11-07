import { useState } from "react";
import {
  BookOpen,
  Keyboard,
  MoreVertical,
  PanelLeftOpen,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

export interface PlaygroundHeaderProps {
  leftNavCollapsed?: boolean;
  onToggleLeftNav?: () => void;
  rightInspectorOpen: boolean;
  onToggleRightInspector: () => void;
  onClearSession: () => void;
  messagesCount: number;
  onOpenShortcuts?: () => void;
  onOpenMenu?: () => void;
}

export function PlaygroundHeader({
  leftNavCollapsed = false,
  onToggleLeftNav,
  rightInspectorOpen,
  onToggleRightInspector,
  onClearSession,
  messagesCount,
  onOpenShortcuts,
  onOpenMenu,
}: PlaygroundHeaderProps) {
  const [viewTitle, setViewTitle] = useState("Egyptian Arabic Speech Studio");

  return (
    <header className="figma-topbar">
      <div className="figma-topbar-left">
        {leftNavCollapsed && onToggleLeftNav && (
          <button
            type="button"
            className="figma-sidebar-reopen"
            onClick={onToggleLeftNav}
            title="Open navigation sidebar"
            aria-label="Open navigation sidebar"
          >
            <PanelLeftOpen size={17} />
          </button>
        )}
        <div className="figma-topbar-titles">
          <input
            type="text"
            className="figma-view-title"
            value={viewTitle}
            onChange={(e) => setViewTitle(e.target.value)}
            title="Click to rename view title"
          />
          <span className="figma-view-status">
            24 kHz · RTF 0.08x · {messagesCount > 0 ? `${messagesCount} clips` : "Ready"}
          </span>
        </div>
      </div>

      <div className="figma-topbar-actions">
        <button
          type="button"
          className="figma-topbar-action-btn"
          onClick={onClearSession}
          title="New session / Clear script"
          aria-label="New session"
        >
          <RotateCcw size={16} />
        </button>

        {onOpenShortcuts && (
          <button
            type="button"
            className="figma-topbar-action-btn"
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts (Press ?)"
            aria-label="Keyboard shortcuts"
          >
            <Keyboard size={16} />
          </button>
        )}

        <button
          type="button"
          className="figma-topbar-action-btn"
          onClick={() => window.open("https://github.com/sha-2026/VoiceTuT-TTS", "_blank")}
          title="Documentation & Model Card"
          aria-label="Documentation"
        >
          <BookOpen size={16} />
        </button>

        <button
          type="button"
          className={`figma-topbar-action-btn ${rightInspectorOpen ? "active" : ""}`}
          onClick={onToggleRightInspector}
          title={
            rightInspectorOpen
              ? "Hide Configuration Drawer"
              : "Open Configuration Drawer (Run Settings)"
          }
          aria-label="Toggle inspector"
        >
          <SlidersHorizontal size={16} />
        </button>

        <button
          type="button"
          className="figma-topbar-action-btn"
          onClick={onOpenMenu}
          title="More actions & options"
          aria-label="More options"
        >
          <MoreVertical size={16} />
        </button>
      </div>
    </header>
  );
}
