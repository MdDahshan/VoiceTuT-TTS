import { useEffect, useRef, useState } from "react";
import {
  assetUrl,
  type Info,
  type Speaker,
  type VoiceMode,
} from "../api";
import { formatTime, toReferenceWav } from "../audio";
import { stopPreview, usePreview } from "../hooks";
import { DEFAULT_PARAMS, type Params } from "./Settings";
import type { RefClip } from "./Voices";
import {
  imgSettingsClose,
  imgVoiceAvatar,
  imgChevronDown,
  imgStabilityThumb,
  imgSpeakerBoostKnob,
  imgNoiseReductionKnob,
} from "../assets/figmaIcons";
import {
  GenderIcon,
  Eq,
} from "./ui";
import {
  Check,
  Mic,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Square,
  Trash2,
  Upload,
  UserRound,
  Wand2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface RightInspectorProps {
  open: boolean;
  onClose: () => void;
  info: Info | null;
  params: Params;
  onChangeParams: (p: Params) => void;
  voiceMode: VoiceMode;
  onVoiceMode: (m: VoiceMode) => void;
  speaker: string | null;
  onSpeaker: (id: string) => void;
  speakers: Speaker[];
  clip: RefClip | null;
  onClip: (c: RefClip | null) => void;
  refText: string;
  onRefText: (t: string) => void;
  speakingStyle: string;
  onChangeSpeakingStyle: (s: string) => void;
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
  speakingStyle,
  onChangeSpeakingStyle,
  onGenerate,
  busy = false,
  onToast,
  voiceExpanded,
  onToggleVoiceExpanded,
}: RightInspectorProps) {
  const [outputFormat, setOutputFormat] = useState("WAV · 24 kHz");
  const [fileName, setFileName] = useState("voicetut_output.wav");
  const [speakerBoost, setSpeakerBoost] = useState(true);
  const [presetSaved, setPresetSaved] = useState(false);
  const [internalVoiceExpanded, setInternalVoiceExpanded] = useState(false);

  // Search & Filter for Built-in Speakers
  const [speakerSearch, setSpeakerSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [previewId, togglePreview] = usePreview();

  // Voice Cloning State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingLevels, setRecordingLevels] = useState<number[]>(() =>
    Array(28).fill(0.06),
  );
  const [clipPlaying, setClipPlaying] = useState(false);
  const recorderRef = useRef<{ stop: () => void } | null>(null);
  const clipAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => recorderRef.current?.stop(), []);

  const isExpanded = voiceExpanded !== undefined ? voiceExpanded : internalVoiceExpanded;
  const toggleExpanded = () => {
    if (onToggleVoiceExpanded) {
      onToggleVoiceExpanded();
    } else {
      setInternalVoiceExpanded((v) => !v);
    }
  };

  if (!open) return null;

  const currentSpeaker = speakers.find((s) => s.speaker_id === speaker);
  const voiceName =
    voiceMode === "clone"
      ? clip?.name || "صوت مستنسخ"
      : currentSpeaker?.arabic_name
        ? `${currentSpeaker.arabic_name} (${currentSpeaker.speaker_name})`
        : "محمد (Mohammed)";
  const voiceSub =
    voiceMode === "clone"
      ? clip
        ? `صوت مرجعي · ${formatTime(clip.duration)}`
        : "اضغط لتسجيل أو رفع صوت مرجعي"
      : `${currentSpeaker?.gender === "female" ? "مصرية · أنثى" : "مصري · ذكر"} · ${currentSpeaker?.tags?.join(" · ") || "طبيعي"}`;

  // Filtered built-in speakers list
  const filteredSpeakers = speakers.filter((s) => {
    const q = speakerSearch.trim().toLowerCase();
    const matchesGender = genderFilter === "all" || s.gender === genderFilter;
    const matchesQuery =
      !q ||
      s.speaker_name.toLowerCase().includes(q) ||
      s.arabic_name.includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q));
    return matchesGender && matchesQuery;
  });

  // Slider conversions
  const stepsFrac = Math.min(100, Math.max(0, ((params.numStep - 8) / (64 - 8)) * 100));
  const guidanceFrac = Math.min(100, Math.max(0, ((params.guidance - 0.5) / (5.0 - 0.5)) * 100));
  const speedFrac = Math.min(100, Math.max(0, ((params.speed - 0.5) / (2.0 - 0.5)) * 100));

  const handleSavePreset = () => {
    localStorage.setItem(
      "voicetut-preset",
      JSON.stringify({
        params,
        speakingStyle,
        speakerBoost,
        outputFormat,
      }),
    );
    setPresetSaved(true);
    setTimeout(() => setPresetSaved(false), 2000);
    onToast("ok", "تم حفظ الإعدادات بنجاح");
  };

  // Process reference audio
  const handleAcceptAudioBlob = async (blob: Blob, name: string) => {
    try {
      const { wav, duration, peaks } = await toReferenceWav(blob, 20);
      if (duration < 2) {
        onToast("error", "المقطع قصير جداً — مطلوب ثانيتين على الأقل");
        return;
      }
      if (clip) URL.revokeObjectURL(clip.url);
      onClip({ wav, url: URL.createObjectURL(wav), duration, peaks, name });
      onToast("ok", `تم تجهيز المقطع المرجعي (${duration.toFixed(1)} ثانية)`);
    } catch {
      onToast("error", "تعذر قراءة الملف — يرجى استخدام صيغة WAV أو MP3");
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
      onToast("error", "يرجى السماح بالوصول إلى الميكروفون للتسجيل");
      return;
    }
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    const buffer = new Uint8Array(analyser.fftSize);

    const startTime = performance.now();
    let animationFrame = 0;
    let lastTick = 0;

    const tick = (t: number) => {
      const secs = (t - startTime) / 1000;
      if (t - lastTick > 60) {
        lastTick = t;
        analyser.getByteTimeDomainData(buffer);
        let peak = 0;
        for (const v of buffer) peak = Math.max(peak, Math.abs(v - 128) / 128);
        setRecordingLevels((levels) => [
          ...levels.slice(1),
          Math.min(1, 0.08 + peak * 1.5),
        ]);
        setRecordingSeconds(secs);
      }
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
      void audioCtx.close();
      setRecording(false);
      recorderRef.current = null;
      if (chunks.length) {
        void handleAcceptAudioBlob(
          new Blob(chunks, { type: mediaRecorder.mimeType }),
          "تسجيل الميكروفون",
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

  return (
    <aside className="figma-inspector">
      {/* Top Header */}
      <div className="figma-inspector-head">
        <span className="figma-inspector-title">Run settings / إعدادات التوليد</span>
        <div className="figma-inspector-actions">
          <button
            className="figma-icon-btn sm"
            onClick={() => onChangeParams(DEFAULT_PARAMS)}
            title="إعادة تعيين للإعدادات الافتراضية"
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="figma-icon-btn sm"
            onClick={onClose}
            title="إغلاق الإعدادات"
          >
            <img src={imgSettingsClose} alt="Close" className="figma-close-icon" />
          </button>
        </div>
      </div>

      <div className="figma-inspector-scroll">
        {/* Real Model Information Card */}
        <div className="figma-model-card">
          <div className="figma-model-eyebrow">VOICE MODEL</div>
          <div className="figma-model-title">{info?.name || "VoiceTut-TTS"}</div>
          <div className="figma-model-tag">
            {info?.model_version || "v1"} · {info?.device ? info.device.toUpperCase() : "CUDA"} ·{" "}
            {info?.sampling_rate ? `${info.sampling_rate / 1000} kHz` : "24 kHz"}
          </div>
          <div className="figma-model-desc">
            نموذج تحويل النص إلى كلام بالعامية المصرية بأعلى جودة ودقة تعبيرية.
          </div>
        </div>

        {/* VOICE SELECTOR & INLINE CLONING — NO POPUPS! */}
        <div className="figma-inspector-section">
          <div className="figma-section-title">الصوت والحديث / Voice</div>

          {/* Active Voice Box (Click to Expand / Collapse) */}
          <div
            className={`figma-voice-select-box ${isExpanded ? "active" : ""}`}
            onClick={toggleExpanded}
            role="button"
            tabIndex={0}
            title="اضغط لاختيار صوت أو استنساخ صوت جديد"
          >
            <div className="figma-voice-avatar-wrap">
              <img src={imgVoiceAvatar} alt="" className="figma-voice-avatar-bg" />
              <span className="figma-voice-avatar-letter">
                {voiceMode === "clone" ? "C" : currentSpeaker?.speaker_name?.charAt(0) || "M"}
              </span>
            </div>
            <div className="figma-voice-meta">
              <span className="figma-voice-name">{voiceName}</span>
              <span className="figma-voice-sub">{voiceSub}</span>
            </div>
            <img
              src={imgChevronDown}
              alt=""
              className={`figma-chevron-icon ${isExpanded ? "figma-chevron-rotated" : ""}`}
            />
          </div>

          {/* Inline Voice Management Panel */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="figma-inline-voice-picker"
              >
                {/* Mode Switcher Tabs */}
                <div className="figma-picker-modes">
                  <button
                    type="button"
                    className={`figma-picker-mode-btn ${voiceMode === "speaker" ? "active" : ""}`}
                    onClick={() => onVoiceMode("speaker")}
                  >
                    <UserRound size={14} />
                    <span>أصوات النظام ({speakers.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`figma-picker-mode-btn ${voiceMode === "clone" ? "active" : ""}`}
                    onClick={() => onVoiceMode("clone")}
                  >
                    <Wand2 size={14} />
                    <span>استنساخ صوت</span>
                  </button>
                </div>

                {/* 1. Built-in Speakers Tab */}
                {voiceMode === "speaker" ? (
                  <div className="figma-speakers-browser">
                    {/* Search Bar */}
                    <div className="figma-speaker-search-bar">
                      <Search size={14} className="figma-search-icon" />
                      <input
                        type="text"
                        placeholder="دوّر باسم الصوت أو طابعه…"
                        value={speakerSearch}
                        onChange={(e) => setSpeakerSearch(e.target.value)}
                        className="figma-speaker-search-input"
                        dir="auto"
                      />
                    </div>

                    {/* Gender Filters */}
                    <div className="figma-gender-tabs">
                      <button
                        type="button"
                        className={`figma-gender-pill ${genderFilter === "all" ? "active" : ""}`}
                        onClick={() => setGenderFilter("all")}
                      >
                        الكل ({speakers.length})
                      </button>
                      <button
                        type="button"
                        className={`figma-gender-pill ${genderFilter === "male" ? "active" : ""}`}
                        onClick={() => setGenderFilter("male")}
                      >
                        رجالي
                      </button>
                      <button
                        type="button"
                        className={`figma-gender-pill ${genderFilter === "female" ? "active" : ""}`}
                        onClick={() => setGenderFilter("female")}
                      >
                        حريمي
                      </button>
                    </div>

                    {/* Speakers Scrollable List */}
                    <div className="figma-speakers-list">
                      {filteredSpeakers.map((s) => {
                        const isSelected = s.speaker_id === speaker;
                        const isPlayingSample = previewId === s.speaker_id;
                        return (
                          <div
                            key={s.speaker_id}
                            className={`figma-speaker-item ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              onSpeaker(s.speaker_id);
                              onToast("ok", `تم اختيار ${s.arabic_name}`);
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <span
                              className={`figma-speaker-avatar ${s.gender === "female" ? "female" : "male"}`}
                            >
                              <GenderIcon gender={s.gender} />
                            </span>
                            <div className="figma-speaker-info">
                              <span className="figma-speaker-title">
                                <b>{s.arabic_name}</b>
                                <small>({s.speaker_name})</small>
                              </span>
                              <span className="figma-speaker-tags">
                                {s.tags.slice(0, 3).join(" · ") || s.gender}
                              </span>
                            </div>
                            <div className="figma-speaker-actions">
                              <button
                                type="button"
                                className="figma-sample-play-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePreview(s.speaker_id, assetUrl(s.audio_url));
                                }}
                                title="استمع لعينة من هذا الصوت"
                              >
                                {isPlayingSample ? (
                                  <Eq />
                                ) : (
                                  <Play size={12} fill="currentColor" />
                                )}
                              </button>
                              {isSelected && <Check size={14} className="figma-selected-icon" />}
                            </div>
                          </div>
                        );
                      })}
                      {filteredSpeakers.length === 0 && (
                        <div className="figma-no-speakers">لا توجد نتائج مطابقة</div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 2. Voice Cloning Tab */
                  <div className="figma-clone-browser">
                    {/* Dropzone for audio upload */}
                    <div
                      className={`figma-dropzone ${isDragOver ? "dragover" : ""}`}
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
                      <Upload size={18} className="figma-upload-icon" />
                      <span className="figma-drop-title">اسحب ملف صوتي هنا أو اضغط للاختيار</span>
                      <small className="figma-drop-sub">٥–١٥ ثانية بصوت واضح (WAV أو MP3)</small>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleAcceptAudioBlob(file, file.name);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    <div className="figma-clone-or">أو</div>

                    {/* Microphone Recording Row */}
                    <div className="figma-mic-rec-row">
                      <button
                        type="button"
                        className={`figma-mic-btn ${recording ? "recording" : ""}`}
                        onClick={() => {
                          if (recording) {
                            recorderRef.current?.stop();
                          } else {
                            void handleStartRecording();
                          }
                        }}
                        title={recording ? "إيقاف التسجيل" : "تسجيل من الميكروفون"}
                      >
                        {recording ? (
                          <Square size={14} fill="currentColor" />
                        ) : (
                          <Mic size={16} />
                        )}
                      </button>

                      {recording ? (
                        <div className="figma-rec-visualizer">
                          <div className="figma-rec-bars">
                            {recordingLevels.map((lvl, idx) => (
                              <div
                                key={idx}
                                className="figma-rec-bar"
                                style={{ height: `${lvl * 100}%` }}
                              />
                            ))}
                          </div>
                          <span className="figma-rec-time">{formatTime(recordingSeconds)}</span>
                        </div>
                      ) : (
                        <div className="figma-mic-label">
                          <b>تسجيل بصوتك الآن</b>
                          <small>حتى {MAX_REC} ثانية وتحدث بشكل طبيعي</small>
                        </div>
                      )}
                    </div>

                    {/* Loaded Reference Clip Preview */}
                    {clip && (
                      <div className="figma-loaded-clip">
                        <button
                          type="button"
                          className="figma-clip-play-btn"
                          onClick={handleTogglePlayClip}
                          title={clipPlaying ? "إيقاف" : "استماع"}
                        >
                          <Play size={12} fill="currentColor" />
                        </button>
                        <div className="figma-loaded-clip-meta">
                          <span className="figma-loaded-clip-name">{clip.name}</span>
                          <span className="figma-loaded-clip-dur">
                            {formatTime(clip.duration)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="figma-clip-remove-btn"
                          onClick={() => {
                            if (clip) URL.revokeObjectURL(clip.url);
                            onClip(null);
                          }}
                          title="حذف المقطع المرجعي"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    {/* Reference Text */}
                    <div className="figma-field-group">
                      <label className="figma-field-label">
                        النص المنطوق في الملف المرجعي (اختياري)
                      </label>
                      <textarea
                        className="figma-ref-textarea"
                        placeholder="لو كتبته هتكون النتيجة أدق وأقرب للصوت الأصلي..."
                        value={refText}
                        onChange={(e) => onRefText(e.target.value)}
                        dir="auto"
                        rows={2}
                      />
                    </div>

                    <div className="figma-consent-note">
                      <ShieldCheck size={14} />
                      <span>استخدم صوتك أو صوتاً بموافقة صاحبه فقط.</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Delivery Section */}
        <div className="figma-inspector-section">
          <div className="figma-section-title">Delivery / الأداء والسرعة</div>

          {/* Speaking Style */}
          <div className="figma-field-group">
            <div className="figma-field-label">Speaking style / النبرة</div>
            <div className="figma-dropdown-wrap">
              <select
                className="figma-select-native"
                value={speakingStyle}
                onChange={(e) => onChangeSpeakingStyle(e.target.value)}
              >
                <option value="Conversational">Conversational (حوار طبيعي)</option>
                <option value="Narrative">Narrative (سرد قصصي)</option>
                <option value="Expressive">Expressive (تعبيري وحماسي)</option>
                <option value="Formal">Formal (رسمي ومتقن)</option>
              </select>
              <div className="figma-dropdown-display">
                <span>{speakingStyle}</span>
                <img src={imgChevronDown} alt="" className="figma-chevron-icon" />
              </div>
            </div>
          </div>

          {/* Stability (Steps) Slider */}
          <div className="figma-slider-group">
            <div className="figma-slider-label-row">
              <span className="figma-slider-name">Stability (Steps / الخطوات)</span>
              <span className="figma-slider-val">{params.numStep} steps</span>
            </div>
            <div className="figma-slider-track-wrap">
              <input
                type="range"
                min={8}
                max={64}
                step={2}
                value={params.numStep}
                onChange={(e) =>
                  onChangeParams({ ...params, numStep: Number(e.target.value) })
                }
                className="figma-range-input"
              />
              <div className="figma-slider-fill" style={{ width: `${stepsFrac}%` }} />
              <div
                className="figma-slider-thumb-custom"
                style={{ left: `calc(${stepsFrac}% - 6px)` }}
              >
                <img src={imgStabilityThumb} alt="" width={12} height={12} />
              </div>
            </div>
          </div>

          {/* Guidance Scale (CFG) */}
          <div className="figma-slider-group">
            <div className="figma-slider-label-row">
              <span className="figma-slider-name">Guidance Scale (تطابق الصوت)</span>
              <span className="figma-slider-val">{params.guidance.toFixed(1)}</span>
            </div>
            <div className="figma-slider-track-wrap">
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.1}
                value={params.guidance}
                onChange={(e) =>
                  onChangeParams({ ...params, guidance: Number(e.target.value) })
                }
                className="figma-range-input"
              />
              <div className="figma-slider-fill" style={{ width: `${guidanceFrac}%` }} />
              <div
                className="figma-slider-thumb-custom"
                style={{ left: `calc(${guidanceFrac}% - 6px)` }}
              >
                <img src={imgStabilityThumb} alt="" width={12} height={12} />
              </div>
            </div>
          </div>

          {/* Speaking Rate (Speed) Slider */}
          <div className="figma-slider-group">
            <div className="figma-slider-label-row">
              <span className="figma-slider-name">Speaking rate / السرعة</span>
              <span className="figma-slider-val">{(params.speed ?? 1.0).toFixed(2)}×</span>
            </div>
            <div className="figma-slider-track-wrap">
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={params.speed ?? 1.0}
                onChange={(e) =>
                  onChangeParams({ ...params, speed: Number(e.target.value) })
                }
                className="figma-range-input"
              />
              <div className="figma-slider-fill" style={{ width: `${speedFrac}%` }} />
              <div
                className="figma-slider-thumb-custom"
                style={{ left: `calc(${speedFrac}% - 6px)` }}
              >
                <img src={imgStabilityThumb} alt="" width={12} height={12} />
              </div>
            </div>
          </div>
        </div>

        <div className="figma-inspector-divider" />

        {/* Tools Section */}
        <div className="figma-inspector-section">
          <div className="figma-section-title">Tools / الأدوات والمعالجة</div>

          {/* Text Normalization Switch */}
          <div className="figma-switch-row">
            <span className="figma-switch-label">Arabic Normalization (تشكيل وضبط النص)</span>
            <button
              type="button"
              className={`figma-switch-track ${params.normalize ? "on" : "off"}`}
              onClick={() => onChangeParams({ ...params, normalize: !params.normalize })}
              role="switch"
              aria-checked={params.normalize}
            >
              <div className="figma-switch-knob">
                <img src={imgSpeakerBoostKnob} alt="" width={16} height={16} />
              </div>
            </button>
          </div>

          {/* Speaker Boost Switch */}
          <div className="figma-switch-row">
            <span className="figma-switch-label">Speaker Boost (تحسين وضوح النطق)</span>
            <button
              type="button"
              className={`figma-switch-track ${speakerBoost ? "on" : "off"}`}
              onClick={() => setSpeakerBoost(!speakerBoost)}
              role="switch"
              aria-checked={speakerBoost}
            >
              <div className="figma-switch-knob">
                <img src={imgNoiseReductionKnob} alt="" width={16} height={16} />
              </div>
            </button>
          </div>
        </div>

        <div className="figma-inspector-divider" />

        {/* Advanced Settings */}
        <div className="figma-inspector-section">
          <div className="figma-section-title">Advanced settings / الإخراج</div>

          {/* Output Format */}
          <div className="figma-field-group">
            <div className="figma-field-label">Output format / الصيغة</div>
            <div className="figma-dropdown-wrap">
              <select
                className="figma-select-native"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
              >
                <option value="WAV · 24 kHz">WAV (Lossless · 24 kHz)</option>
                <option value="MP3 · 320 kbps">MP3 (High Quality · 320 kbps)</option>
                <option value="FLAC · 24-bit">FLAC (Studio · 24-bit)</option>
              </select>
              <div className="figma-dropdown-display">
                <span>{outputFormat}</span>
                <img src={imgChevronDown} alt="" className="figma-chevron-icon" />
              </div>
            </div>
          </div>

          {/* File Name */}
          <div className="figma-field-group">
            <div className="figma-field-label">File name / اسم الملف</div>
            <div className="figma-input-wrap">
              <input
                type="text"
                className="figma-text-input"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
            <span className="figma-field-hint">سيتم حفظه في مجلد التنزيلات</span>
          </div>
        </div>
      </div>

      <div className="figma-inspector-divider" />

      {/* Footer Actions */}
      <div className="figma-inspector-footer">
        <div className="figma-footer-actions">
          <button
            type="button"
            className="figma-btn-save-preset"
            onClick={handleSavePreset}
          >
            {presetSaved ? "تم الحفظ ✓" : "Save preset"}
          </button>
          <button
            type="button"
            className="figma-btn-generate-main"
            onClick={onGenerate}
            disabled={busy}
          >
            {busy ? "جاري التوليد…" : "Generate speech"}
          </button>
        </div>
        <div className="figma-footer-status">
          {busy ? "Synthesizing audio… يتم توليد الصوت الآن" : "Ready to generate · جاهز للتوليد"}
        </div>
      </div>
    </aside>
  );
}
