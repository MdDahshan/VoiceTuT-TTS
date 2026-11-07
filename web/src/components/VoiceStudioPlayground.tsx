import React, { useRef } from "react";
import { formatTime } from "../audio";
import {
  imgSpeakerOneAvatar,
  imgSpeakerTwoAvatar,
  imgWorkflow1Narration,
  imgWorkflow2Audiobook,
  imgWorkflow3Conversational,
} from "../assets/figmaIcons";
import {
  Globe,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Sparkles,
  X,
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
  language,
  onToggleLanguage,
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
        {/* Top & Middle Content: Stage Grid */}
        <div className="figma-stage-grid">
          {/* Left Column: Hero Title & Workflows */}
          <div className="figma-hero-column">
            <div
              className="figma-eyebrow"
              title="استوديو التوليد الصوتي: بيئة العمل لتوليد الصوت وتحويل النصوص"
            >
              VOICE PLAYGROUND
            </div>
            <h1 className="figma-hero-title">
              Generate Realistic Speech
              <br />
              in Egyptian Arabic
            </h1>
            <p className="figma-hero-desc">
              Convert any script into expressive, natural-sounding audio with
              fine-grained control over voice identity, pace, and cloning.
            </p>

            <div className="figma-workflows-section">
              <div
                className="figma-workflows-label"
                title="نماذج نصوص جاهزة: انقر على أي نموذج لتطبيقه مباشرة في مربع الكتابة"
              >
                START WITH A WORKFLOW
              </div>
              <div className="figma-workflows-list">
                {/* Workflow 1 */}
                <div
                  className="figma-workflow-card"
                  onClick={() => onTextChange(SAMPLE_SCRIPTS.narration)}
                  role="button"
                  tabIndex={0}
                  title="سرد إعلاني وإعلامي: تسجيلات واضحة واحترافية للفيديوهات والبودكاست — انقر لتطبيق النص"
                >
                  <div className="figma-workflow-tile">
                    <img src={imgWorkflow1Narration} alt="" className="figma-workflow-icon" />
                  </div>
                  <div className="figma-workflow-meta">
                    <span className="figma-workflow-title">Commercial & Voiceover</span>
                    <span className="figma-workflow-detail">
                      Crisp, polished delivery for promos and video narration
                    </span>
                  </div>
                </div>

                {/* Workflow 2 */}
                <div
                  className="figma-workflow-card"
                  onClick={() => onTextChange(SAMPLE_SCRIPTS.audiobook)}
                  role="button"
                  tabIndex={0}
                  title="قصص وكتب صوتية: قراءة سردية مع تناغم وتأثير عاطفي هادئ — انقر لتطبيق النص"
                >
                  <div className="figma-workflow-tile">
                    <img src={imgWorkflow2Audiobook} alt="" className="figma-workflow-icon" />
                  </div>
                  <div className="figma-workflow-meta">
                    <span className="figma-workflow-title">Audiobook & Story</span>
                    <span className="figma-workflow-detail">
                      Long-form narrative reading with consistent pacing
                    </span>
                  </div>
                </div>

                {/* Workflow 3 */}
                <div
                  className="figma-workflow-card"
                  onClick={() => onTextChange(SAMPLE_SCRIPTS.conversational)}
                  role="button"
                  tabIndex={0}
                  title="محادثة وحوار يومي: كلام عفوي عامي مثل المكالمات وخدمة العملاء — انقر لتطبيق النص"
                >
                  <div className="figma-workflow-tile">
                    <img src={imgWorkflow3Conversational} alt="" className="figma-workflow-icon" />
                  </div>
                  <div className="figma-workflow-meta">
                    <span className="figma-workflow-title">Conversational Dialogue</span>
                    <span className="figma-workflow-detail">
                      Natural colloquial speech for support and interactive agents
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
                <span
                  className="figma-preview-eyebrow"
                  title="معاينة الصوت: يعرض الصوت المختار وحالة المشغل الصوتي"
                >
                  VOICE PREVIEW
                </span>
                <div
                  className="figma-preview-ready-pill"
                  title={
                    busy
                      ? "جاري توليد الصوت الآن..."
                      : isPlaying
                        ? "يتم تشغيل الصوت حالياً"
                        : "جاهز للتوليد والتشغيل"
                  }
                >
                  <span className={`figma-ready-dot-solid ${busy ? "busy" : isPlaying ? "playing" : "ready"}`} />
                  <span className="figma-ready-text">
                    {busy ? "GENERATING…" : isPlaying ? "PLAYING" : "READY"}
                  </span>
                </div>
              </div>

              <div className="figma-preview-speaker-info">
                <div
                  className="figma-preview-speaker-name"
                  onClick={() => onOpenVoicePicker("speaker")}
                  title="انقر لتغيير المتحدث أو اختيار صوت آخر من السايد بار الأيمن"
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
                title="الموجة الصوتية: انقر في أي مكان للتنقل السريع داخل المقطع الصوتي"
              >
                <div className="figma-preview-waveform">
                  {WAVEFORM_BARS.map((h, i) => {
                    const isPlayed = displayDuration > 0 && i <= activeWaveformIndex;
                    return (
                      <div
                        key={i}
                        className={`figma-waveform-bar ${isPlayed ? "played" : "unplayed"}`}
                        style={{ height: `${h}px` }}
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
                  title={isPlaying ? "إيقاف مؤقت (Space)" : "تشغيل الصوت المولد (Space)"}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause size={14} className="figma-play-icon" />
                  ) : (
                    <Play size={14} className="figma-play-icon" fill="currentColor" />
                  )}
                </button>

                <span
                  className="figma-preview-time-display"
                  title="الوقت الحالي / إجمالي مدة المقطع الصوتي"
                >
                  {formatTime(currentTime)} / {formatTime(displayDuration)}
                </span>

                <div
                  className="figma-preview-progress-track"
                  onClick={handleWaveformClick}
                  title="شريط التقدم: انقر للتنقل"
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
                  title="عرض تفاصيل الصوت في السايد بار الأيمن"
                  aria-label="More voice options"
                >
                  <MoreHorizontal size={16} />
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
                title="سرد تعبيري: انقر لتحميل نص السرد في صندوق الكتابة"
              >
                <div className="figma-sample-graphic">
                  <div className="figma-narration-bars">
                    {NARRATION_BARS.map((h, idx) => (
                      <div
                        key={idx}
                        className={`figma-narration-bar ${NARRATION_ACCENT_INDICES.has(idx) ? "accent" : "dim"}`}
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="figma-sample-title">Expressive Narration</div>
                <div className="figma-sample-sub">Warm, natural tone · Sample</div>
              </div>

              {/* Sample 2: Conversational */}
              <div
                className="figma-sample-card"
                onClick={() => onTextChange(SAMPLE_SCRIPTS.conversational)}
                role="button"
                tabIndex={0}
                title="حوار عامي: انقر لتحميل نص الحوار في صندوق الكتابة"
              >
                <div className="figma-sample-graphic figma-conversational-graphic">
                  <div className="figma-conv-avatar-one">
                    <img src={imgSpeakerOneAvatar} alt="" width={26} height={26} />
                  </div>
                  <div className="figma-conv-lines">
                    <div className="figma-conv-line figma-line-a" />
                    <div className="figma-conv-line figma-line-b" />
                    <div className="figma-conv-line figma-line-a" />
                  </div>
                  <div className="figma-conv-avatar-two">
                    <img src={imgSpeakerTwoAvatar} alt="" width={22} height={22} />
                  </div>
                </div>
                <div className="figma-sample-title">Conversational Audio</div>
                <div className="figma-sample-sub">Multi-turn dialogue flow</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Script Composer: Anchored nicely at the bottom with breathing room */}
        <div className="figma-composer-dock">
          <div className="figma-script-composer">
            <div className="figma-composer-header">
              <span
                className="figma-script-label"
                title="صندوق كتابة النص: اكتب هنا النص العربي أو العامي المراد تحويله لصوت"
              >
                SCRIPT INPUT
              </span>
              <div className="figma-composer-meta">
                <span
                  className="figma-char-count"
                  title="عدد الحروف المكتوبة من الحد الأقصى المسموح به"
                >
                  {text.length} / {maxChars} chars
                </span>
                {text.trim() && (
                  <button
                    type="button"
                    className="figma-clear-btn"
                    onClick={() => onTextChange("")}
                    title="مسح النص المكتوب بالكامل للبدء من جديد"
                  >
                    <X size={13} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              className="figma-script-textarea"
              placeholder="Type or paste your text here to generate high-quality Egyptian Arabic speech (or pick a workflow above)..."
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              dir="auto"
              rows={3}
              title="مربع النص: اكتب النص بالعامية المصرية أو الفصحى (اضغط Ctrl + Enter للتوليد الفوري)"
            />

            <div className="figma-composer-divider" />

            <div className="figma-script-toolbar">
              <div className="figma-script-pills">
                <span
                  className="figma-pill figma-pill-engine"
                  title="الموديل المستخدم: VoiceTut-TTS v1 المدرب على العامية المصرية"
                >
                  <Sparkles size={12} className="pill-ico" />
                  <span>{modelName}</span>
                </span>

                <button
                  type="button"
                  className="figma-pill figma-pill-voice"
                  onClick={() => onOpenVoicePicker("speaker")}
                  title="انقر لتغيير الصوت المختار من السايد بار الأيمن"
                >
                  <span>{voiceName}</span>
                </button>

                <button
                  type="button"
                  className="figma-pill figma-pill-lang"
                  onClick={onToggleLanguage}
                  title="انقر للتبديل بين العامية المصرية والإنجليزية"
                >
                  <Globe size={12} />
                  <span>{language === "arz" ? "Egyptian Arabic" : "English"}</span>
                </button>
              </div>

              <div className="figma-script-actions">
                <button
                  type="button"
                  className="figma-attach-btn"
                  onClick={() => onOpenVoicePicker("clone")}
                  title="استنساخ صوت مخصص: انقر لفتح لوحة الاستنساخ ورفع عينة صوتية أو التسجيل بالميكروفون"
                  aria-label="Clone voice"
                >
                  <Plus size={16} />
                </button>

                <button
                  type="button"
                  className="figma-generate-btn"
                  disabled={busy || !text.trim()}
                  onClick={onGenerate}
                  title="توليد الصوت الآن (اختصار: Ctrl + Enter)"
                >
                  {busy ? (
                    <>
                      <Loader2 size={14} className="spin-icon" />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <span>Generate</span>
                      <kbd className="figma-kbd-hint">Ctrl ↵</kbd>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
