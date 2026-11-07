import React, { useRef } from "react";
import { formatTime } from "../audio";
import {
  imgPreviewReadyDot,
  imgPreviewPlayIcon,
  imgPreviewMore,
  imgSpeakerOneAvatar,
  imgSpeakerTwoAvatar,
  imgComposerAttachButton,
  imgComposerAttachPlus,
  imgWorkflow1Narration,
  imgWorkflow2Audiobook,
  imgWorkflow3Conversational,
} from "../assets/figmaIcons";
import { Loader2, Pause, Sparkles, X } from "lucide-react";
import type { VoiceMode } from "../api";

export interface VoiceStudioPlaygroundProps {
  text: string;
  onTextChange: (t: string) => void;
  voiceName: string;
  voiceDetails: string;
  speakingStyle: string;
  onCycleSpeakingStyle: () => void;
  modelName?: string;
  onOpenVoicePicker: (mode?: VoiceMode) => void;
  busy: boolean;
  onGenerate: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (frac: number) => void;
  maxChars?: number;
}

const WAVEFORM_BARS = [
  9, 16, 22, 13, 28, 18, 11, 32, 24, 16, 11, 20, 30, 15, 9, 25, 34, 21, 13, 29,
  18, 12, 26, 35, 17, 10, 22, 30, 14, 8, 19, 27, 15, 11, 23, 32, 18, 10, 25, 16,
  30, 21, 13, 27, 35, 19, 11, 24, 15, 29, 18, 9, 22, 31, 16, 11, 25, 19, 33, 17,
  10, 22, 28, 13, 8, 19, 27, 15, 11, 24,
];

const NARRATION_BARS = [
  10, 18, 25, 15, 30, 19, 12, 27, 21, 14, 29, 18, 11, 24, 31, 17, 13, 26, 18, 10,
];
const NARRATION_ACCENT_INDICES = new Set([0, 4, 8, 12, 16]);

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
  speakingStyle,
  onCycleSpeakingStyle,
  modelName = "VoiceTut-TTS v1",
  onOpenVoicePicker,
  busy,
  onGenerate,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  maxChars = 3000,
}: VoiceStudioPlaygroundProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayDuration = duration > 0 ? duration : 0;
  const progressFrac = displayDuration > 0 ? Math.min(1, currentTime / displayDuration) : 0;
  const activeWaveformIndex = Math.floor(progressFrac * WAVEFORM_BARS.length);

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || displayDuration <= 0) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(frac);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!busy && text.trim()) {
        onGenerate();
      }
    }
  };

  return (
    <div className="figma-playground-container">
      <div className="figma-playground-scroll">
        {/* Main 2-Column Hero & Cards Grid */}
        <div className="figma-stage-grid">
          {/* Left Column: Hero Title & Workflows */}
          <div className="figma-hero-column">
            <div className="figma-eyebrow">VOICE PLAYGROUND / استوديو التوليد</div>
            <h1 className="figma-hero-title">
              توليد صوت واقعي
              <br />
              بالعامية المصرية
            </h1>
            <p className="figma-hero-desc">
              حوّل أي نص عربي أو عامي إلى تسجيل صوتي فائق الجودة والواقعية مع تحكم
              دقيق في النبرة والسرعة واستنساخ الأصوات.
            </p>

            <div className="figma-workflows-section">
              <div className="figma-workflows-label">START WITH A WORKFLOW / نماذج جاهزة</div>
              <div className="figma-workflows-list">
                {/* Workflow 1 */}
                <div
                  className="figma-workflow-card"
                  onClick={() => onTextChange(SAMPLE_SCRIPTS.narration)}
                  role="button"
                  tabIndex={0}
                  title="انقر لتطبيق هذا النص في صندوق الكتابة"
                >
                  <div className="figma-workflow-tile">
                    <img src={imgWorkflow1Narration} alt="" className="figma-workflow-icon" />
                  </div>
                  <div className="figma-workflow-meta">
                    <span className="figma-workflow-title">سرد إعلاني وإعلامي</span>
                    <span className="figma-workflow-detail">
                      تسجيلات واضحة واحترافية للفيديوهات والبرودكاست
                    </span>
                  </div>
                </div>

                {/* Workflow 2 */}
                <div
                  className="figma-workflow-card"
                  onClick={() => onTextChange(SAMPLE_SCRIPTS.audiobook)}
                  role="button"
                  tabIndex={0}
                  title="انقر لتطبيق هذا النص في صندوق الكتابة"
                >
                  <div className="figma-workflow-tile">
                    <img src={imgWorkflow2Audiobook} alt="" className="figma-workflow-icon" />
                  </div>
                  <div className="figma-workflow-meta">
                    <span className="figma-workflow-title">قصص وكتب صوتية</span>
                    <span className="figma-workflow-detail">
                      قراءة سردية مع تناغم وتأثير عاطفي هادئ
                    </span>
                  </div>
                </div>

                {/* Workflow 3 */}
                <div
                  className="figma-workflow-card"
                  onClick={() => onTextChange(SAMPLE_SCRIPTS.conversational)}
                  role="button"
                  tabIndex={0}
                  title="انقر لتطبيق هذا النص في صندوق الكتابة"
                >
                  <div className="figma-workflow-tile">
                    <img src={imgWorkflow3Conversational} alt="" className="figma-workflow-icon" />
                  </div>
                  <div className="figma-workflow-meta">
                    <span className="figma-workflow-title">محادثة وحوار يومي</span>
                    <span className="figma-workflow-detail">
                      كلام عفوي عامي مثل المكالمات وخدمة العملاء
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Voice Preview Card + Feature Cards */}
          <div className="figma-cards-column">
            {/* Main Voice Preview Card */}
            <div className="figma-voice-preview-card">
              <div className="figma-preview-card-header">
                <span className="figma-preview-eyebrow">VOICE PREVIEW / الصوت المختار</span>
                <div className="figma-preview-ready-pill">
                  <img src={imgPreviewReadyDot} alt="" className="figma-ready-dot" />
                  <span className="figma-ready-text">
                    {busy ? "GENERATING…" : isPlaying ? "PLAYING" : "READY"}
                  </span>
                </div>
              </div>

              <div className="figma-preview-speaker-info">
                <div
                  className="figma-preview-speaker-name"
                  onClick={() => onOpenVoicePicker("speaker")}
                  title="تغيير الصوت من السايد بار"
                >
                  {voiceName}
                </div>
                <div className="figma-preview-speaker-sub">{voiceDetails}</div>
              </div>

              {/* 70-bar Waveform */}
              <div
                className="figma-preview-waveform-wrap"
                ref={waveformRef}
                onClick={handleWaveformClick}
                role="slider"
                aria-valuenow={Math.round(progressFrac * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
              >
                <div className="figma-preview-waveform">
                  {WAVEFORM_BARS.map((h, i) => {
                    const isPlayed = displayDuration > 0 && i <= activeWaveformIndex;
                    return (
                      <div
                        key={i}
                        className="figma-waveform-bar"
                        style={{
                          height: `${h}px`,
                          backgroundColor: isPlayed ? "#a7b8aa" : "#454545",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="figma-waveform-baseline" />
              </div>

              {/* Player Scrubber Controls */}
              <div className="figma-preview-controls-row">
                <button
                  type="button"
                  className="figma-preview-play-btn"
                  onClick={onTogglePlay}
                  title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                >
                  {isPlaying ? (
                    <Pause size={14} color="#181818" />
                  ) : (
                    <img src={imgPreviewPlayIcon} alt="Play" className="figma-play-triangle" />
                  )}
                </button>

                <span className="figma-preview-time-display">
                  {formatTime(currentTime)} / {formatTime(displayDuration)}
                </span>

                <div
                  className="figma-preview-progress-track"
                  onClick={handleWaveformClick}
                >
                  <div
                    className="figma-preview-progress-fill"
                    style={{ width: `${progressFrac * 100}%` }}
                  />
                </div>

                <button
                  type="button"
                  className="figma-preview-more-btn"
                  onClick={() => onOpenVoicePicker("speaker")}
                  title="عرض تفاصيل الصوت في السايد بار"
                >
                  <img src={imgPreviewMore} alt="•••" className="figma-preview-more-icon" />
                </button>
              </div>
            </div>

            {/* Bottom 2 Sample Cards */}
            <div className="figma-samples-row">
              {/* Sample 1: Expressive Narration */}
              <div
                className="figma-sample-card"
                onClick={() => onTextChange(SAMPLE_SCRIPTS.narration)}
                role="button"
                tabIndex={0}
                title="اضغط لتحميل نص السرد التعبيري"
              >
                <div className="figma-sample-graphic">
                  <div className="figma-narration-bars">
                    {NARRATION_BARS.map((h, idx) => (
                      <div
                        key={idx}
                        className="figma-narration-bar"
                        style={{
                          height: `${h}px`,
                          backgroundColor: NARRATION_ACCENT_INDICES.has(idx)
                            ? "#a7b8aa"
                            : "#666666",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="figma-sample-title">سرد قصصي وتعبيري</div>
                <div className="figma-sample-sub">نبرة دافئة ومعبرة · 0:12</div>
              </div>

              {/* Sample 2: Conversational */}
              <div
                className="figma-sample-card"
                onClick={() => onTextChange(SAMPLE_SCRIPTS.conversational)}
                role="button"
                tabIndex={0}
                title="اضغط لتحميل نص الحوار"
              >
                <div className="figma-sample-graphic figma-conversational-graphic">
                  <div className="figma-conv-avatar-one">
                    <img src={imgSpeakerOneAvatar} alt="" width={29} height={29} />
                  </div>
                  <div className="figma-conv-lines">
                    <div className="figma-conv-line figma-line-a" />
                    <div className="figma-conv-line figma-line-b" />
                    <div className="figma-conv-line figma-line-a" />
                  </div>
                  <div className="figma-conv-avatar-two">
                    <img src={imgSpeakerTwoAvatar} alt="" width={23} height={23} />
                  </div>
                </div>
                <div className="figma-sample-title">حوار عامي تفاعلي</div>
                <div className="figma-sample-sub">محادثات طبيعية وسريعة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Script Composer (The Text Box) */}
        <div className="figma-script-composer">
          <div className="figma-composer-header">
            <span className="figma-script-label">SCRIPT / نص الكلام</span>
            <div className="figma-composer-meta">
              <span className="figma-char-count">
                {text.length} / {maxChars} حرف
              </span>
              {text.trim() && (
                <button
                  type="button"
                  className="figma-clear-btn"
                  onClick={() => onTextChange("")}
                  title="مسح النص"
                >
                  <X size={12} />
                  <span>مسح</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="figma-script-textarea"
            placeholder="اكتب أو الصق النص هنا لتوليد الصوت بالعامية المصرية (أو اختر نموذجاً من النماذج في الأعلى)..."
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            dir="auto"
            rows={3}
          />

          <div className="figma-composer-divider" />

          <div className="figma-script-toolbar">
            <div className="figma-script-pills">
              <span className="figma-pill figma-pill-engine" title="نموذج التوليد المستخدم">
                <Sparkles size={11} className="pill-ico" />
                <span>{modelName}</span>
              </span>

              <button
                type="button"
                className="figma-pill figma-pill-voice"
                onClick={() => onOpenVoicePicker("speaker")}
                title="تغيير الصوت من السايد بار"
              >
                <span>{voiceName}</span>
                <span className="figma-pill-sub">· مصري</span>
              </button>

              <button
                type="button"
                className="figma-pill figma-pill-style"
                onClick={onCycleSpeakingStyle}
                title="تغيير أسلوب النبرة"
              >
                <span>الأسلوب: {speakingStyle}</span>
              </button>
            </div>

            <div className="figma-script-actions">
              <button
                type="button"
                className="figma-attach-btn"
                onClick={() => onOpenVoicePicker("clone")}
                title="استنساخ صوت أو رفع ملف مرجعي في السايد بار"
              >
                <img src={imgComposerAttachButton} alt="" className="figma-attach-bg" />
                <img src={imgComposerAttachPlus} alt="" className="figma-attach-plus" />
              </button>

              <button
                type="button"
                className="figma-generate-btn"
                disabled={busy || !text.trim()}
                onClick={onGenerate}
                title="توليد الصوت الآن (Ctrl + Enter)"
              >
                {busy ? (
                  <>
                    <Loader2 size={13} className="spin-icon" />
                    <span>توليد…</span>
                  </>
                ) : (
                  <>
                    <span>توليد الصوت</span>
                    <kbd className="figma-kbd-hint">Ctrl ↵</kbd>
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
