import {
  imgTopAdd,
  imgTopMore,
  imgSidebarCollapse,
} from "../assets/figmaIcons";

export interface PlaygroundHeaderProps {
  leftNavCollapsed: boolean;
  onToggleLeftNav: () => void;
  rightInspectorOpen: boolean;
  onToggleRightInspector: () => void;
  onClearSession: () => void;
  messagesCount: number;
}

export function PlaygroundHeader({
  leftNavCollapsed,
  onToggleLeftNav,
  rightInspectorOpen,
  onToggleRightInspector,
  onClearSession,
}: PlaygroundHeaderProps) {
  return (
    <header className="figma-topbar">
      <div className="figma-topbar-left">
        {leftNavCollapsed && (
          <button
            className="figma-icon-btn figma-topbar-expand"
            onClick={onToggleLeftNav}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <img src={imgSidebarCollapse} alt="" className="figma-asset-icon" />
          </button>
        )}
        <div className="figma-topbar-titles">
          <span className="figma-topbar-title">Playground</span>
          <span className="figma-topbar-sub">Speech generation</span>
        </div>
      </div>

      <div className="figma-topbar-actions">
        <button
          className="figma-icon-btn"
          onClick={onClearSession}
          title="New session"
        >
          <img src={imgTopAdd} alt="Add" className="figma-topbar-icon" />
        </button>

        <button
          className={`figma-icon-btn ${rightInspectorOpen ? "active" : ""}`}
          onClick={onToggleRightInspector}
          title="Run settings"
        >
          <img src={imgTopMore} alt="More" className="figma-topbar-icon" />
        </button>
      </div>
    </header>
  );
}
