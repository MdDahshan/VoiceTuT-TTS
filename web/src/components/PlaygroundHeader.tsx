import {
  PanelLeftOpen,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

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
            type="button"
            className="figma-icon-btn figma-topbar-expand"
            onClick={onToggleLeftNav}
            title="توسيع الشريط الجانبي الأيسر"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
        <div className="figma-topbar-titles">
          <span
            className="figma-topbar-title"
            title="بيئة العمل التفاعلية لتوليد واختبار الأصوات"
          >
            Voice Studio Playground
          </span>
          <span
            className="figma-topbar-sub"
            title="تحويل النصوص إلى كلام واقعي بالعامية المصرية"
          >
            Egyptian Arabic Neural Speech Synthesis
          </span>
        </div>
      </div>

      <div className="figma-topbar-actions">
        <button
          type="button"
          className="figma-icon-btn"
          onClick={onClearSession}
          title="جلسة جديدة: مسح النص الحالي وإعادة ضبط المشغل الصوتي"
          aria-label="New session"
        >
          <Plus size={16} />
        </button>

        <button
          type="button"
          className={`figma-icon-btn ${rightInspectorOpen ? "active" : ""}`}
          onClick={onToggleRightInspector}
          title={
            rightInspectorOpen
              ? "إخفاء لوحة الإعدادات الجانبية"
              : "فتح لوحة الإعدادات الجانبية (Run Settings)"
          }
          aria-label="Toggle inspector"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>
    </header>
  );
}
