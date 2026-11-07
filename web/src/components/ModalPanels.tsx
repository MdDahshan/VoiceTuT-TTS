import type { Dispatch, SetStateAction } from "react";

type ModalPanelsProps = {
  shortcutsModalOpen: boolean; setShortcutsModalOpen: Dispatch<SetStateAction<boolean>>;
  optionsMenuOpen: boolean; setOptionsMenuOpen: Dispatch<SetStateAction<boolean>>;
  handleExportAll: () => void; handleNewSession: () => void;
};

export function ModalPanels({ shortcutsModalOpen, setShortcutsModalOpen, optionsMenuOpen, setOptionsMenuOpen, handleExportAll, handleNewSession }: ModalPanelsProps) {
  return <>
      {/* 5.5 Floating Panels & Modal Dialogs: Keyboard Shortcuts */}
      {shortcutsModalOpen && (
        <div className="figma-modal-backdrop" onClick={() => setShortcutsModalOpen(false)}>
          <div className="figma-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="figma-modal-header">
              <h2 className="figma-modal-title">Keyboard Shortcuts</h2>
              <button
                type="button"
                className="figma-modal-close-btn"
                onClick={() => setShortcutsModalOpen(false)}
              >
                Close
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <div className="figma-setting-row-horizontal">
                <span className="figma-setting-label">Synthesize Speech</span>
                <div>
                  <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span>
                </div>
              </div>
              <div className="figma-setting-row-horizontal">
                <span className="figma-setting-label">Play / Pause Audio</span>
                <div>
                  <span className="kbd">Space</span>
                </div>
              </div>
              <div className="figma-setting-row-horizontal">
                <span className="figma-setting-label">Toggle Shortcuts Guide</span>
                <div>
                  <span className="kbd">?</span>
                </div>
              </div>
              <div className="figma-setting-row-horizontal">
                <span className="figma-setting-label">Close Modal / Panels</span>
                <div>
                  <span className="kbd">Esc</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5.5 Options & Overflow Popover Modal */}
      {optionsMenuOpen && (
        <div className="figma-modal-backdrop" onClick={() => setOptionsMenuOpen(false)}>
          <div className="figma-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="figma-modal-header">
              <h2 className="figma-modal-title">Studio Actions</h2>
              <button
                type="button"
                className="figma-modal-close-btn"
                onClick={() => setOptionsMenuOpen(false)}
              >
                Close
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              <button
                type="button"
                className="figma-btn-secondary"
                style={{ textAlign: "left", padding: "10px" }}
                onClick={() => {
                  handleExportAll();
                  setOptionsMenuOpen(false);
                }}
              >
                Export All Session Audio (WAV)
              </button>
              <button
                type="button"
                className="figma-btn-secondary"
                style={{ textAlign: "left", padding: "10px" }}
                onClick={() => {
                  handleNewSession();
                  setOptionsMenuOpen(false);
                }}
              >
                Reset / Start New Session
              </button>
              <button
                type="button"
                className="figma-btn-secondary"
                style={{ textAlign: "left", padding: "10px" }}
                onClick={() => {
                  setShortcutsModalOpen(true);
                  setOptionsMenuOpen(false);
                }}
              >
                View Keyboard Shortcuts
              </button>
            </div>
          </div>
        </div>
      )}

  </>;
}
