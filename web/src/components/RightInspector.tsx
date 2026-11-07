import { useEffect, useRef, useState } from "react";
import {
  assetUrl,
  type Info,
  type Language,
  type Speaker,
  type VoiceMode,
} from "../api";
import { toReferenceWav } from "../audio";
import { stopPreview, usePreview } from "../hooks";
import { DEFAULT_PARAMS, type Params } from "./Settings";
import type { RefClip } from "./Voices";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Mic,
  Play,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Square,
  Users,
  Wand2,
  X,
} from "lucide-react";

export interface RightInspectorProps {
  open: boolean;
  onClose: () => void;
  info: Info | null;
  params: Params;
  onChangeParams: (p: Params) => void;
  language: Language;
  onChangeLanguage: (l: Language) => void;
  voiceMode: VoiceMode;
  onVoiceMode: (m: VoiceMode) => void;
  speaker: string | null;
  onSpeaker: (id: string) => void;
  speakers: Speaker[];
  clip: RefClip | null;
  onClip: (c: RefClip | null) => void;
  refText: string;
  onRefText: (t: string) => void;
  onGenerate?: () => void;
  busy?: boolean;
  onToast: (kind: "error" | "info" | "ok", text: string) => void;
  voiceExpanded?: boolean;
  onToggleVoiceExpanded?: () => void;
}

const MAX_REC = 15;

export function RightInspector({
  open,
  onClose,
  info,
  params,
  onChangeParams,
  voiceMode,
  onVoiceMode,
  speaker,
  onSpeaker,
  speakers,
  clip,
  onClip,
  refText,
  onRefText,
  onToast,
}: RightInspectorProps) {
  // Folder Tab state (Section 5.8)
  const [activeTab, setActiveTab] = useState<"speakers" | "clone" | "params">("speakers");

  // Output format & filename (Section 5.1)
  const [outputFormat, setOutputFormat] = useState("WAV · 24 kHz · 16-bit");
  const [fileName, setFileName] = useState("voicetut_output.wav");

  // Toggles (Section 5.3)
  const [speakerBoost, setSpeakerBoost] = useState(true);
  const [autoDiacritics, setAutoDiacritics] = useState(true);

  // Accordion Sections (Section 4.3)
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(true);
  const [exportSettingsOpen, setExportSettingsOpen] = useState(false);

  // Search & Filter for Built-in Speakers
  const [speakerSearch, setSpeakerSearch] = useState("");
  const [previewId, togglePreview] = usePreview();

  // Voice Cloning State & Audio Drop
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recorderRef = useRef<{ stop: () => void } | null>(null);
  const [clipPlaying, setClipPlaying] = useState(false);
  const clipAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => recorderRef.current?.stop(), []);

  const currentSpeaker = speakers.find((s) => s.speaker_id === speaker);
  const voiceName =
    voiceMode === "clone"
      ? clip?.name || "Cloned Voice Sample"
      : currentSpeaker?.speaker_name
        ? `${currentSpeaker.speaker_name} (${currentSpeaker.arabic_name})`
        : "Mohammed (محمد)";

  const voiceTechnicalSubtitle =
    voiceMode === "clone" ? "CLONE_REF_WAV · 24kHz" : "SPEAKER_EMBEDDING_V1 · ARZ";

  const voiceDescription =
    voiceMode === "clone"
      ? clip
        ? `Custom voice sample (${clip.duration.toFixed(1)}s) loaded for neural zero-shot cloning.`
        : "Upload or record reference speech to clone timbre, tone, and accent."
      : `${currentSpeaker?.gender === "female" ? "Female" : "Male"} speaker · Authentic colloquial Egyptian Arabic.`;

  const filteredSpeakers = speakers.filter((s) => {
    const q = speakerSearch.trim().toLowerCase();
    return (
      !q ||
      s.speaker_name.toLowerCase().includes(q) ||
      s.arabic_name.includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleSavePreset = () => {
    localStorage.setItem(
      "voicetut-preset",
      JSON.stringify({
        params,
        speakerBoost,
        outputFormat,
        fileName,
      }),
    );
    onToast("ok", "Preset saved successfully");
  };

  const handleResetDefaults = () => {
    onChangeParams(DEFAULT_PARAMS);
    setSpeakerBoost(true);
    setAutoDiacritics(true);
    onToast("info", "Reset settings to defaults");
  };

  // Process reference audio blob
  const handleAcceptAudioBlob = async (blob: Blob, name: string) => {
    try {
      const { wav, duration, peaks } = await toReferenceWav(blob, 20);
      if (duration < 2) {
        onToast("error", "Audio sample too short — at least 2 seconds required");
        return;
      }
      if (clip) URL.revokeObjectURL(clip.url);
      onClip({ wav, url: URL.createObjectURL(wav), duration, peaks, name });
      onVoiceMode("clone");
      onToast("ok", `Reference voice ready (${duration.toFixed(1)}s)`);
    } catch {
      onToast("error", "Could not process audio — please use a WAV or MP3 file");
    }
  };

  // Start microphone recording
  const handleStartRecording = async () => {
    stopPreview();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      onToast("error", "Microphone access is required for recording");
      return;
    }
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const startTime = performance.now();
    let animationFrame = 0;

    const tick = (t: number) => {
      const secs = (t - startTime) / 1000;
      setRecordingSeconds(secs);
      if (secs >= MAX_REC) {
        stop();
      } else {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    const stop = () => {
      cancelAnimationFrame(animationFrame);
      if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
    };

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      recorderRef.current = null;
      if (chunks.length) {
        void handleAcceptAudioBlob(
          new Blob(chunks, { type: mediaRecorder.mimeType }),
          "Microphone Recording",
        );
      }
    };

    recorderRef.current = { stop };
    mediaRecorder.start();
    setRecordingSeconds(0);
    setRecording(true);
    animationFrame = requestAnimationFrame(tick);
  };

  const handleTogglePlayClip = () => {
    if (!clip) return;
    if (!clipAudioRef.current) {
      clipAudioRef.current = new Audio();
      clipAudioRef.current.onended = () => setClipPlaying(false);
      clipAudioRef.current.onpause = () => setClipPlaying(false);
    }
    const player = clipAudioRef.current;
    if (clipPlaying) {
      player.pause();
      return;
    }
    stopPreview();
    player.src = clip.url;
    void player.play().then(() => setClipPlaying(true));
  };

  const applyPresetProfile = (type: "conversational" | "narrative" | "expressive") => {
    if (type === "conversational") {
      onChangeParams({ ...params, speed: 1.05, numStep: 16, guidance: 2.0 });
      onToast("info", "Loaded Conversational profile (1.05x speed, 16 steps)");
    } else if (type === "narrative") {
      onChangeParams({ ...params, speed: 0.95, numStep: 24, guidance: 2.5 });
      onToast("info", "Loaded Narrative profile (0.95x speed, 24 steps)");
    } else {
      onChangeParams({ ...params, speed: 1.0, numStep: 32, guidance: 3.0 });
      onToast("info", "Loaded High-Fidelity Studio profile (32 steps)");
    }
  };

  return (
    <aside className={`figma-inspector ${open ? "open" : "closed"}`} aria-hidden={!open}>
      {/* Sticky Drawer Header (height: 56px, Section 4.3) */}
      <div className="figma-inspector-head">
        <span className="figma-inspector-title">
          Run Settings {info?.device ? `(${info.device.toUpperCase()})` : ""}
        </span>
        <div className="figma-inspector-actions">
          <button
            type="button"
            className="figma-compact-action-btn"
            onClick={handleSavePreset}
            title="Save current parameters to preset"
          >
            Save Preset
          </button>
          <button
            type="button"
            className="figma-icon-btn sm"
            onClick={handleResetDefaults}
            title="Reset parameters to defaults"
            aria-label="Reset parameters"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            className="figma-icon-btn sm"
            onClick={onClose}
            title="Close inspector drawer"
            aria-label="Close inspector"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable Settings Body */}
      <div className="figma-inspector-scroll">
        {/* Interactive Summary Selector Card (Section 4.3) */}
        <div className="figma-field-group">
          <div
            className="figma-summary-selector-card"
            onClick={() => setActiveTab(voiceMode === "clone" ? "clone" : "speakers")}
            role="button"
            tabIndex={0}
            title="Active Voice Profile — Click to manage voice selection"
          >
            <span className="figma-summary-title">{voiceName}</span>
            <span className="figma-summary-subtitle">{voiceTechnicalSubtitle}</span>
            <p className="figma-summary-desc">{voiceDescription}</p>
          </div>
        </div>

        {/* 5.8 Segmented Folder Tabs */}
        <div className="figma-folder-tabs" role="tablist">
          <button
            type="button"
            className={`figma-folder-tab ${activeTab === "speakers" ? "active" : ""}`}
            onClick={() => setActiveTab("speakers")}
            role="tab"
            aria-selected={activeTab === "speakers"}
          >
            <Users size={12} className="figma-folder-tab-icon" />
            <span>Speakers ({speakers.length})</span>
          </button>
          <button
            type="button"
            className={`figma-folder-tab ${activeTab === "clone" ? "active" : ""}`}
            onClick={() => setActiveTab("clone")}
            role="tab"
            aria-selected={activeTab === "clone"}
          >
            <Wand2 size={12} className="figma-folder-tab-icon" />
            <span>Voice Clone</span>
          </button>
          <button
            type="button"
            className={`figma-folder-tab ${activeTab === "params" ? "active" : ""}`}
            onClick={() => setActiveTab("params")}
            role="tab"
            aria-selected={activeTab === "params"}
          >
            <Sliders size={12} className="figma-folder-tab-icon" />
            <span>Parameters</span>
          </button>
        </div>

        {/* TAB 1: SPEAKERS */}
        {activeTab === "speakers" && (
          <div className="figma-field-group">
            <div className="figma-speaker-search-box">
              <Search size={14} color="#A0A0A0" />
              <input
                type="text"
                className="figma-speaker-search-input"
                placeholder="Search Egyptian speakers..."
                value={speakerSearch}
                onChange={(e) => setSpeakerSearch(e.target.value)}
              />
              {speakerSearch && (
                <button
                  type="button"
                  className="figma-filter-chip-close"
                  onClick={() => setSpeakerSearch("")}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="figma-speakers-list-grid">
              {filteredSpeakers.map((s) => {
                const isSelected = voiceMode === "speaker" && speaker === s.speaker_id;
                const isAuditioning = previewId === s.speaker_id;
                return (
                  <button
                    key={s.speaker_id}
                    type="button"
                    className={`figma-speaker-row-btn ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      onSpeaker(s.speaker_id);
                      onVoiceMode("speaker");
                    }}
                  >
                    <div className="figma-speaker-row-left">
                      <div className="figma-speaker-row-avatar">{s.speaker_name.charAt(0)}</div>
                      <div className="figma-speaker-row-names">
                        <span className="figma-speaker-row-en">{s.speaker_name}</span>
                        <span className="figma-speaker-row-ar">
                          {s.arabic_name} · {s.gender === "female" ? "Female" : "Male"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        className="figma-icon-btn sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePreview(s.speaker_id, assetUrl(s.audio_url));
                        }}
                        title="Audition voice sample"
                      >
                        {isAuditioning ? <Square size={12} /> : <Play size={12} />}
                      </button>
                      {isSelected && <Check size={14} color="#E5E7EB" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: VOICE CLONING (Section 5.7 Drag-and-Drop Upload Zone) */}
        {activeTab === "clone" && (
          <div className="figma-field-group">
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*,.wav,.mp3"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleAcceptAudioBlob(file, file.name);
              }}
            />

            {/* 5.7 Drag-and-Drop Upload Zone */}
            <div
              className={`figma-upload-zone ${isDragOver ? "dragover" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) void handleAcceptAudioBlob(file, file.name);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="figma-upload-prompt">Drop reference audio here</div>
              <div className="figma-upload-divider">or record a 5-15s clear speech sample</div>
              <button
                type="button"
                className="figma-upload-trigger-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse Audio File
              </button>
            </div>

            {/* Reference Transcription Input */}
            <div className="figma-setting-row-stacked" style={{ marginTop: "8px" }}>
              <label className="figma-setting-label">Reference Transcript (Optional)</label>
              <input
                type="text"
                className="figma-input"
                placeholder="What was spoken in the reference audio clip..."
                value={refText}
                onChange={(e) => onRefText(e.target.value)}
                dir="auto"
              />
            </div>

            {/* Microphone Recording Button */}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className={`figma-btn-secondary ${recording ? "active" : ""}`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onClick={recording ? () => recorderRef.current?.stop() : handleStartRecording}
              >
                {recording ? (
                  <>
                    <Square size={13} color="#f28b82" />
                    <span>Stop ({recordingSeconds.toFixed(1)}s)</span>
                  </>
                ) : (
                  <>
                    <Mic size={13} />
                    <span>Record Mic Sample</span>
                  </>
                )}
              </button>

              {clip && (
                <button
                  type="button"
                  className="figma-btn-secondary"
                  onClick={handleTogglePlayClip}
                  title="Audition uploaded reference sample"
                >
                  {clipPlaying ? <Square size={13} /> : <Play size={13} />}
                </button>
              )}
            </div>

            {/* 5.8 Tip / Callout Box */}
            <div className="tip-box">
              <strong>Tip:</strong> For best Egyptian colloquial fidelity, provide 5 to 12 seconds
              of clean, background-noise-free vocal speech.
            </div>
          </div>
        )}

        {/* TAB 3: PARAMETERS & SLIDERS (Section 5.4 Custom Range Sliders) */}
        {activeTab === "params" && (
          <div className="figma-field-group">
            {/* Speech Pace / Speed Slider */}
            <div className="figma-setting-row-stacked">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="figma-setting-label">Speech Pace (Speed)</span>
                <span className="figma-slider-badge">{(params.speed || 1.0).toFixed(2)}x</span>
              </div>
              <div className="figma-slider-container">
                <input
                  type="range"
                  className="figma-slider"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={params.speed || 1.0}
                  onChange={(e) =>
                    onChangeParams({ ...params, speed: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>

            {/* Diffusion Steps (numStep) Slider */}
            <div className="figma-setting-row-stacked">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="figma-setting-label">Diffusion Steps</span>
                <span className="figma-slider-badge">{params.numStep} steps</span>
              </div>
              <div className="figma-slider-container">
                <input
                  type="range"
                  className="figma-slider"
                  min="8"
                  max="64"
                  step="2"
                  value={params.numStep}
                  onChange={(e) =>
                    onChangeParams({ ...params, numStep: parseInt(e.target.value, 10) })
                  }
                />
              </div>
            </div>

            {/* Guidance Scale (guidance) Slider */}
            <div className="figma-setting-row-stacked">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="figma-setting-label">Guidance Scale</span>
                <span className="figma-slider-badge">{(params.guidance || 2.0).toFixed(1)}</span>
              </div>
              <div className="figma-slider-container">
                <input
                  type="range"
                  className="figma-slider"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={params.guidance || 2.0}
                  onChange={(e) =>
                    onChangeParams({ ...params, guidance: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>

            {/* 5.2 Compact Action Grid Pattern (3 columns) */}
            <div style={{ marginTop: "8px" }}>
              <span className="figma-setting-label" style={{ marginBottom: "6px", display: "block" }}>
                Quick Profiles
              </span>
              <div className="figma-action-grid-3">
                <button
                  type="button"
                  className="figma-action-grid-btn"
                  onClick={() => applyPresetProfile("conversational")}
                >
                  <MessageSquare size={13} />
                  <span>Dialogue</span>
                </button>
                <button
                  type="button"
                  className="figma-action-grid-btn"
                  onClick={() => applyPresetProfile("narrative")}
                >
                  <BookOpen size={13} />
                  <span>Storybook</span>
                </button>
                <button
                  type="button"
                  className="figma-action-grid-btn"
                  onClick={() => applyPresetProfile("expressive")}
                >
                  <Sparkles size={13} />
                  <span>Studio HiFi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Accordion: Audio Processing & Toggles (Section 4.3 & 5.3) */}
        <div className="figma-field-group">
          <div
            className="figma-accordion-header"
            onClick={() => setAudioSettingsOpen(!audioSettingsOpen)}
          >
            <div className="figma-accordion-left">
              <span className="figma-accordion-title">Audio Processing & Effects</span>
            </div>
            {audioSettingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {audioSettingsOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
              {/* Toggle 1: Speaker Boost */}
              <div className="figma-setting-row-horizontal">
                <span className="figma-setting-label">Neural Speaker Boost</span>
                {/* 5.3 Custom Pill Toggle Switch */}
                <label className="figma-toggle-switch">
                  <input
                    type="checkbox"
                    checked={speakerBoost}
                    onChange={(e) => setSpeakerBoost(e.target.checked)}
                  />
                  <span className="figma-toggle-track">
                    <span className="figma-toggle-thumb" />
                  </span>
                </label>
              </div>

              {/* Toggle 2: Text Normalization */}
              <div className="figma-setting-row-horizontal">
                <span className="figma-setting-label">Text Normalization (Numbers/Dates)</span>
                <label className="figma-toggle-switch">
                  <input
                    type="checkbox"
                    checked={params.normalize}
                    onChange={(e) => onChangeParams({ ...params, normalize: e.target.checked })}
                  />
                  <span className="figma-toggle-track">
                    <span className="figma-toggle-thumb" />
                  </span>
                </label>
              </div>

              {/* Toggle 3: Auto Diacritics (تشكيل) */}
              <div className="figma-setting-row-horizontal">
                <span className="figma-setting-label">Auto Diacritics (تشكيل تلقائي)</span>
                <label className="figma-toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoDiacritics}
                    onChange={(e) => setAutoDiacritics(e.target.checked)}
                  />
                  <span className="figma-toggle-track">
                    <span className="figma-toggle-thumb" />
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Accordion: Export & Output Options (Section 5.1 Inputs & Selects) */}
        <div className="figma-field-group">
          <div
            className="figma-accordion-header"
            onClick={() => setExportSettingsOpen(!exportSettingsOpen)}
          >
            <div className="figma-accordion-left">
              <span className="figma-accordion-title">Export & Audio Target</span>
            </div>
            {exportSettingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {exportSettingsOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
              {/* 5.1 Outlined Dropdown */}
              <div className="figma-setting-row-stacked">
                <label className="figma-setting-label">Target Format</label>
                <select
                  className="figma-select"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                >
                  <option value="WAV · 24 kHz · 16-bit">WAV · 24 kHz · 16-bit PCM</option>
                  <option value="WAV · 48 kHz · High-Res">WAV · 48 kHz · High-Res</option>
                  <option value="MP3 · 320 kbps">MP3 · 320 kbps</option>
                  <option value="FLAC · Lossless">FLAC · Lossless</option>
                </select>
              </div>

              {/* 5.1 Standard Input */}
              <div className="figma-setting-row-stacked">
                <label className="figma-setting-label">Default Filename</label>
                <input
                  type="text"
                  className="figma-input"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="voicetut_output.wav"
                />
              </div>
            </div>
          )}
        </div>

        {/* Keyboard shortcut hint with .kbd badges (Section 5.8) */}
        <div style={{ marginTop: "auto", paddingTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
          Press <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> to synthesize instantly.
        </div>
      </div>
    </aside>
  );
}
