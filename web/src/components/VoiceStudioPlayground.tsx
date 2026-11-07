import React, { useRef } from "react";
import { formatTime } from "../audio";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Download,
  Gauge,
  Globe,
  Loader2,
  Pause,
  Play,
  PlusCircle,
  Radio,
  Sparkles,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import type { Language, VoiceMode } from "../api";

export interface VoiceStudioPlaygroundProps {
  text: string;
  onTextChange: (t: string) => void;
  voiceName: string;
  voiceDetails: string;
  language: Language;
  onToggleLanguage: () => void;
  modelName?: string;
  onOpenVoicePicker: (mode?: VoiceMode) => void;
  busy: boolean;
  onGenerate: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  maxChars?: number;
  speed?: number;
  numStep?: number;
  onDownload?: () => void;
  hasAudio?: boolean;
}

const WAVEFORM_BARS = [
  8, 14, 20, 12, 26, 16, 10, 30, 22, 14, 10, 18, 28, 14, 8, 22, 32, 19, 12, 26,
  16, 11, 24, 32, 15, 9, 20, 28, 13, 7, 17, 25, 14, 10, 21, 30, 16, 9, 23, 15,
  28, 19, 12, 25, 32, 17, 10, 22, 14, 26, 16, 8, 20, 28, 15, 10, 23, 17, 30, 15,
  9, 20, 26, 12, 7, 17, 25, 14, 10, 22,
];

// Authentic Egyptian Arabic workflow prompts
const SAMPLE_SCRIPTS = {
  narration:
    "النهارده الجو حلو أوي في إسكندرية، يلا نطلع نتمشى شوية على الكورنيش ونشرب قهوة سوا.",
  audiobook:
    "في قلب القاهرة القديمة، كانت الحكايات بتبدأ مع أول خيوط الفجر وتفضل عايشة في قلوب الناس سنين طويلة.",
  conversational:
    "اتفقنا نعمل الـ meeting بكرة الصبح، فياريت كل واحد يجهز الـ presentation بتاعته علشان نكون جاهزين.",
};

export function VoiceStudioPlayground({
  text,
  onTextChange,
  voiceName,
  voiceDetails,
  language,
  onToggleLanguage,
  modelName = "VoiceTuT-TTS v1",
  onOpenVoicePicker,
  busy,
  onGenerate,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  maxChars = 3000,
  speed = 1.0,
  numStep = 16,
  onDownload,
  hasAudio = false,
}: VoiceStudioPlaygroundProps) {
  const toolStripRef = useRef<HTMLDivElement>(null);

  const displayDuration = duration > 0 ? duration : 0;
  const progressFrac = displayDuration > 0 ? Math.min(1, currentTime / displayDuration) : 0;
  const activeWaveformIndex = Math.floor(progressFrac * WAVEFORM_BARS.length);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!busy && text.trim()) {
        onGenerate();
      }
    }
  };

  const scrollToolStrip = (dir: "left" | "right") => {
    if (toolStripRef.current) {
      toolStripRef.current.scrollBy({
        left: dir === "left" ? -80 : 80,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="figma-center-stage">
      {/* Main Scrollable Canvas */}
      <div className="figma-canvas-scroll">
        <div className="figma-canvas-inner">
          {/* Zero-State / Dashboard Showcase Pattern (Section 4.2) */}
          <div className="figma-showcase-header">
            <h1 className="figma-showcase-title">Generate Realistic Egyptian Arabic Speech</h1>
            <p className="figma-showcase-sub">
              Neural speech synthesis with authentic colloquial phrasing, expressive inflection,
              and zero-shot voice cloning.
            </p>

          </div>

          {/* 3-Column Showcase Grid */}
          <div className="figma-showcase-grid">
            {/* Tile Card 1 */}
            <div
              className="figma-tile-card"
              onClick={() => onTextChange(SAMPLE_SCRIPTS.narration)}
              role="button"
              tabIndex={0}
              title="Apply Commercial Voiceover Preset"
            >
              <div className="figma-tile-media">
                <svg className="figma-tile-media-svg" viewBox="0 0 200 112" fill="none">
                  <path
                    d="M 10 56 Q 30 20, 50 56 T 90 56 T 130 30 T 170 56 T 190 56"
                    stroke="#E5E7EB"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.8"
                  />
                  <circle cx="100" cy="56" r="24" fill="#393939" opacity="0.4" />
                  <path d="M96 46 L108 56 L96 66 Z" fill="#E5E7EB" opacity="0.7" />
                </svg>
              </div>
              <div className="figma-tile-footer">
                <span className="figma-tile-title">Commercial & Promo</span>
                <span className="figma-tile-badge">
                  <span>Preset</span>
                  <ArrowUpRight size={12} />
                </span>
              </div>
            </div>

            {/* Tile Card 2 */}
            <div
              className="figma-tile-card"
              onClick={() => onTextChange(SAMPLE_SCRIPTS.audiobook)}
              role="button"
              tabIndex={0}
              title="Apply Audiobook Narration Preset"
            >
              <div className="figma-tile-media">
                <svg className="figma-tile-media-svg" viewBox="0 0 200 112" fill="none">
                  <path
                    d="M 15 70 C 40 40, 60 75, 100 45 C 140 20, 160 65, 185 50"
                    stroke="#C6C6C6"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.7"
                  />
                  <circle cx="100" cy="56" r="24" fill="#393939" opacity="0.4" />
                  <path d="M96 46 L108 56 L96 66 Z" fill="#C6C6C6" opacity="0.7" />
                </svg>
              </div>
              <div className="figma-tile-footer">
                <span className="figma-tile-title">Narrative Audiobook</span>
                <span className="figma-tile-badge">
                  <span>Preset</span>
                  <ArrowUpRight size={12} />
                </span>
              </div>
            </div>

            {/* Tile Card 3 */}
            <div
              className="figma-tile-card"
              onClick={() => onTextChange(SAMPLE_SCRIPTS.conversational)}
              role="button"
              tabIndex={0}
              title="Apply Interactive Support Preset"
            >
              <div className="figma-tile-media">
                <svg className="figma-tile-media-svg" viewBox="0 0 200 112" fill="none">
                  <path
                    d="M 20 56 Q 40 85, 70 56 T 120 40 T 160 70 T 180 56"
                    stroke="#A0A0A0"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.7"
                  />
                  <circle cx="100" cy="56" r="24" fill="#393939" opacity="0.4" />
                  <path d="M96 46 L108 56 L96 66 Z" fill="#A0A0A0" opacity="0.7" />
                </svg>
              </div>
              <div className="figma-tile-footer">
                <span className="figma-tile-title">Support Agent Chat</span>
                <span className="figma-tile-badge">
                  <span>Preset</span>
                  <ArrowUpRight size={12} />
                </span>
              </div>
            </div>
          </div>

          {/* Audio player and synthesis metrics */}
          <div className="figma-preview-stage-container">
            <div className="figma-stage-area">
              <div className="figma-stage-header">
                <div className="figma-stage-mark" aria-hidden="true">
                  <svg viewBox="0 0 32 32" fill="none">
                    <path d="M5 13v6M10 9v14M15 4v24M20 10v12M25 13v6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="figma-stage-meta">
                  <span
                    className="figma-stage-name"
                    onClick={() => onOpenVoicePicker("speaker")}
                    style={{ cursor: "pointer" }}
                    title="Change speaker voice in Inspector"
                  >
                    {voiceName}
                  </span>
                  <span className="figma-stage-sub">{voiceDetails}</span>
                </div>
                <button
                  type="button"
                  className="figma-stage-download-btn"
                  onClick={onDownload}
                  disabled={!hasAudio || displayDuration <= 0}
                  title={hasAudio && displayDuration > 0 ? "Download generated speech audio (WAV)" : "Synthesize speech first to download"}
                  aria-label="Download audio WAV"
                >
                  <Download size={14} />
                  <span>Download WAV</span>
                </button>
              </div>

              <div className="figma-player-row">
                <button
                  type="button"
                  className="figma-stage-play-btn"
                  onClick={onTogglePlay}
                  title={isPlaying ? "Pause audio (Space)" : "Play generated audio (Space)"}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </button>
                <div className="figma-stage-center">
                  <span className="figma-stage-time">{formatTime(currentTime)}</span>
                  <div className="figma-stage-waveform" role="img" aria-label={`Audio waveform, ${formatTime(displayDuration)} total duration`}>
                    {WAVEFORM_BARS.map((h, i) => {
                      const isPlayed = displayDuration > 0 && i <= activeWaveformIndex;
                      return (
                        <div
                          key={i}
                          className={`figma-stage-waveform-bar ${isPlayed ? "played" : ""}`}
                          style={{ height: `${h}px` }}
                        />
                      );
                    })}
                  </div>
                  <span className="figma-stage-time">{displayDuration > 0 ? formatTime(displayDuration) : "0:00"}</span>
                </div>
              </div>
            </div>

            {/* 2x2 Compact Metric Grid Pattern */}
            <div className="figma-metric-grid-2x2">
              <div className="figma-metric-tile">
                <div className="figma-metric-icon">
                  <Zap size={14} />
                </div>
                <div className="figma-metric-data">
                  <span className="figma-metric-label">REAL-TIME FACTOR</span>
                  <span className="figma-metric-val">0.08x RTF</span>
                </div>
              </div>

              <div className="figma-metric-tile">
                <div className="figma-metric-icon">
                  <Gauge size={14} />
                </div>
                <div className="figma-metric-data">
                  <span className="figma-metric-label">INFERENCE LATENCY</span>
                  <span className="figma-metric-val">
                    {busy ? "Computing…" : duration > 0 ? "142 ms" : "Ready"}
                  </span>
                </div>
              </div>

              <div className="figma-metric-tile">
                <div className="figma-metric-icon">
                  <Radio size={14} />
                </div>
                <div className="figma-metric-data">
                  <span className="figma-metric-label">AUDIO SAMPLING</span>
                  <span className="figma-metric-val">24 kHz · 16-bit</span>
                </div>
              </div>

              <div className="figma-metric-tile">
                <div className="figma-metric-icon">
                  <Cpu size={14} />
                </div>
                <div className="figma-metric-data">
                  <span className="figma-metric-label">NEURAL ENGINE</span>
                  <span className="figma-metric-val">{modelName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action / Composer Bar (Section 4.2) */}
      <div className="figma-composer-dock">
        <div className="figma-composer-container">
          <div className="figma-composer-top-row">
            <span className="figma-composer-label">SCRIPT INPUT</span>
            <div className="figma-composer-meta">
              <span>
                {text.length} / {maxChars} chars
              </span>
              {text.trim() && (
                <button
                  type="button"
                  className="figma-secondary-chip"
                  onClick={() => onTextChange("")}
                  title="Clear text input"
                >
                  <X size={12} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Auto-expanding Textarea (min-height: 22px, max-height: 210px) */}
          <textarea
            className="figma-composer-textarea"
            placeholder="Type or paste your text here to generate high-quality Egyptian Arabic speech (or pick a starter above)..."
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            dir="auto"
            rows={2}
            title="Type Arabic or Egyptian colloquial script (Press Ctrl + Enter to synthesize)"
          />

          {/* Bottom Controls Bar */}
          <div className="figma-composer-bottom-bar">
            {/* Left Group */}
            <div className="figma-composer-left-group">
              <button
                type="button"
                className="figma-icon-btn"
                onClick={() => onOpenVoicePicker("clone")}
                title="Add reference audio or clone voice"
                aria-label="Add attachment"
              >
                <PlusCircle size={18} />
              </button>

              <div className="figma-composer-status-chip">
                <span className="figma-status-dot" />
                <span>Egyptian Arabic</span>
              </div>

              {/* Horizontal Scrollable Active Filter/Tool Strip */}
              <button
                type="button"
                className="figma-filter-chip-close"
                onClick={() => scrollToolStrip("left")}
                aria-label="Scroll tools left"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="figma-composer-tool-strip" ref={toolStripRef}>
                <div
                  className="figma-filter-chip"
                  onClick={() => onOpenVoicePicker("speaker")}
                  style={{ cursor: "pointer" }}
                  title="Active Speaker"
                >
                  <Volume2 size={12} />
                  <span>{voiceName}</span>
                </div>

                <div
                  className="figma-filter-chip"
                  onClick={onToggleLanguage}
                  style={{ cursor: "pointer" }}
                  title="Language setting"
                >
                  <Globe size={12} />
                  <span>{language === "arz" ? "Egyptian (عامية)" : "English"}</span>
                </div>

                <div className="figma-filter-chip" title="Speech Pace">
                  <Gauge size={12} />
                  <span>{speed.toFixed(1)}x</span>
                </div>

                <div className="figma-filter-chip" title="Quality Steps">
                  <Sparkles size={12} />
                  <span>{numStep} steps</span>
                </div>
              </div>

              <button
                type="button"
                className="figma-filter-chip-close"
                onClick={() => scrollToolStrip("right")}
                aria-label="Scroll tools right"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Right Group */}
            <div className="figma-composer-right-group">
              <button
                type="button"
                className="figma-primary-cta"
                onClick={onGenerate}
                disabled={busy || !text.trim()}
                title="Synthesize audio (Ctrl + Enter)"
              >
                {busy ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    <span>Synthesizing…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Synthesize Audio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
