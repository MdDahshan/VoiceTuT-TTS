import { useEffect, useRef, useState } from "react";
import {
  assetUrl,
  type Info,
  type Language,
  type Speaker,
  type VoiceMode,
} from "../api";
import { formatTime, toReferenceWav } from "../audio";
import { stopPreview, usePreview } from "../hooks";
import { DEFAULT_PARAMS, type Params } from "./Settings";
import type { RefClip } from "./Voices";
import { GenderIcon, Eq } from "./ui";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Mic,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Upload,
  UserRound,
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
  language,
  onChangeLanguage,
  voiceMode,
  onVoiceMode,
  speaker,
  onSpeaker,
  speakers,
  clip,
  onClip,
  refText,
  onRefText,
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
    Array(24).fill(0.08),
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
      ? clip?.name || "Cloned Voice"
      : currentSpeaker?.speaker_name
        ? `${currentSpeaker.speaker_name} (${currentSpeaker.arabic_name})`
        : "Mohammed (محمد)";
  const voiceSub =
    voiceMode === "clone"
      ? clip
        ? `Custom voice sample · ${formatTime(clip.duration)}`
        : "Click to record or upload reference voice"
      : `${currentSpeaker?.gender === "female" ? "Female" : "Male"} · Egyptian Arabic · ${currentSpeaker?.tags?.join(" · ") || "Natural"}`;

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

  const handleSavePreset = () => {
    localStorage.setItem(
      "voicetut-preset",
      JSON.stringify({
        params,
        language,
        speakerBoost,
        outputFormat,
      }),
    );
    setPresetSaved(true);
    setTimeout(() => setPresetSaved(false), 2000);
    onToast("ok", "Preset saved successfully");
  };

  // Process reference audio
  const handleAcceptAudioBlob = async (blob: Blob, name: string) => {
    try {
      const { wav, duration, peaks } = await toReferenceWav(blob, 20);
      if (duration < 2) {
        onToast("error", "Audio sample too short — at least 2 seconds required");
        return;
      }
      if (clip) URL.revokeObjectURL(clip.url);
      onClip({ wav, url: URL.createObjectURL(wav), duration, peaks, name });
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

  return (
    <aside className="figma-inspector">
      {/* Top Header */}
      <div className="figma-inspector-head">
        <div className="figma-inspector-header-info">
          <span className="figma-inspector-title">Run Settings</span>
          <span
            className="figma-inspector-help-hint"
            title="إعدادات التوليد: تحكم في الصوت المختار، سرعة النطق، دقة التوليد، ومطابقة الصوت المرجعي."
          >
            Hover for Arabic help
          </span>
        </div>
        <div className="figma-inspector-actions">
          <button
            type="button"
            className="figma-icon-btn sm"
            onClick={() => {
              onChangeParams(DEFAULT_PARAMS);
              onToast("info", "Reset settings to defaults");
            }}
            title="إعادة تعيين كافة المعايير إلى القيم الافتراضية الموصى بها"
            aria-label="Reset to defaults"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            className="figma-icon-btn sm"
            onClick={onClose}
            title="إغلاق لوحة الإعدادات الجانبية"
            aria-label="Close inspector"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="figma-inspector-scroll">
        {/* Model Info Card */}
        <div
          className="figma-model-card"
          title="معلومات الموديل: نموذج VoiceTut-TTS المدرب خصيصاً على اللهجة المصرية والعربية بجودة استوديو عالية."
        >
          <div className="figma-model-header-row">
            <div className="figma-model-badge">
              <Sparkles size={11} />
              <span>ACTIVE MODEL</span>
            </div>
            <span className="figma-model-chip">
              {info?.device ? info.device.toUpperCase() : "CUDA"} ·{" "}
              {info?.sampling_rate ? `${info.sampling_rate / 1000} kHz` : "24 kHz"}
            </span>
          </div>
          <div className="figma-model-title">{info?.name || "VoiceTut-TTS"}</div>
          <div className="figma-model-desc">
            End-to-end neural speech synthesis trained on colloquial Egyptian Arabic and modern standard Arabic.
          </div>
        </div>

        {/* VOICE SELECTOR & INLINE CLONING — NO POPUPS! */}
        <div className="figma-section-block">
          <div className="figma-section-header">
            <span className="figma-section-title">Voice & Identity</span>
            <span
              className="figma-section-tip"
              title="اختر صوتاً من قائمة الأصوات الجاهزة أو استخدم ميزة استنساخ صوت مخصص عبر رفع عينة أو التسجيل المباشر."
            >
              (?)
            </span>
          </div>

          {/* Active Voice Box (Click to Expand / Collapse) */}
          <div
            className={`figma-voice-select-box ${isExpanded ? "active" : ""}`}
            onClick={toggleExpanded}
            role="button"
            tabIndex={0}
            title="انقر لفتح قائمة الأصوات الجاهزة أو البدء في استنساخ صوت جديد داخل السايد بار"
          >
            <div className="figma-voice-avatar-wrap">
              <span className="figma-voice-avatar-letter">
                {voiceMode === "clone" ? "C" : currentSpeaker?.speaker_name?.charAt(0) || "M"}
              </span>
            </div>
            <div className="figma-voice-meta">
              <span className="figma-voice-name">{voiceName}</span>
              <span className="figma-voice-sub">{voiceSub}</span>
            </div>
            {isExpanded ? (
              <ChevronUp size={16} className="figma-chevron-icon" />
            ) : (
              <ChevronDown size={16} className="figma-chevron-icon" />
            )}
          </div>

          {/* Inline Voice Management Panel */}
          {isExpanded && (
            <div className="figma-inline-voice-picker">
              {/* Mode Switcher Tabs */}
              <div className="figma-picker-modes">
                <button
                  type="button"
                  className={`figma-picker-mode-btn ${voiceMode === "speaker" ? "active" : ""}`}
                  onClick={() => onVoiceMode("speaker")}
                  title="استعراض واختيار أحد الأصوات الـ 19 الرسمية المدمجة في النظام"
                >
                  <UserRound size={13} />
                  <span>System Voices ({speakers.length})</span>
                </button>
                <button
                  type="button"
                  className={`figma-picker-mode-btn ${voiceMode === "clone" ? "active" : ""}`}
                  onClick={() => onVoiceMode("clone")}
                  title="استنساخ صوت جديد من ملف مسجل أو عبر التسجيل الفوري من الميكروفون"
                >
                  <Wand2 size={13} />
                  <span>Clone Voice</span>
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
                      placeholder="Search by name, gender or tone..."
                      value={speakerSearch}
                      onChange={(e) => setSpeakerSearch(e.target.value)}
                      className="figma-speaker-search-input"
                      title="ابحث باسم الصوت (عربي أو إنجليزي) أو طابعه الصوتي"
                    />
                    {speakerSearch && (
                      <button
                        type="button"
                        className="figma-search-clear"
                        onClick={() => setSpeakerSearch("")}
                        title="مسح البحث"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Gender Filters */}
                  <div className="figma-gender-tabs">
                    <button
                      type="button"
                      className={`figma-gender-pill ${genderFilter === "all" ? "active" : ""}`}
                      onClick={() => setGenderFilter("all")}
                      title="عرض جميع الأصوات المتوفرة"
                    >
                      All ({speakers.length})
                    </button>
                    <button
                      type="button"
                      className={`figma-gender-pill ${genderFilter === "male" ? "active" : ""}`}
                      onClick={() => setGenderFilter("male")}
                      title="تصفية الأصوات الرجالية فقط"
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      className={`figma-gender-pill ${genderFilter === "female" ? "active" : ""}`}
                      onClick={() => setGenderFilter("female")}
                      title="تصفية الأصوات النسائية فقط"
                    >
                      Female
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
                            onToast("ok", `Selected voice: ${s.speaker_name} (${s.arabic_name})`);
                          }}
                          role="button"
                          tabIndex={0}
                          title={`انقر لاختيار صوت ${s.arabic_name} (${s.speaker_name})`}
                        >
                          <span
                            className={`figma-speaker-avatar ${s.gender === "female" ? "female" : "male"}`}
                          >
                            <GenderIcon gender={s.gender} />
                          </span>
                          <div className="figma-speaker-info">
                            <span className="figma-speaker-title">
                              <b>{s.speaker_name}</b>
                              <small>({s.arabic_name})</small>
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
                              title="الاستماع إلى عينة صوتية مسجلة مسبقاً لهذا المتحدث"
                              aria-label={`Preview ${s.speaker_name}`}
                            >
                              {isPlayingSample ? (
                                <Eq />
                              ) : (
                                <Play size={11} fill="currentColor" />
                              )}
                            </button>
                            {isSelected && <Check size={14} className="figma-selected-icon" />}
                          </div>
                        </div>
                      );
                    })}
                    {filteredSpeakers.length === 0 && (
                      <div className="figma-no-speakers">No matching voices found</div>
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
                    title="اسحب وأفلت ملف صوتي مرجعي هنا أو انقر للاختيار من جهازك (WAV أو MP3)"
                  >
                    <Upload size={18} className="figma-upload-icon" />
                    <span className="figma-drop-title">Drop audio file here or browse</span>
                    <small className="figma-drop-sub">5–15 seconds clear speech (WAV or MP3)</small>
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

                  <div className="figma-clone-or">OR</div>

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
                      title={recording ? "إيقاف التسجيل واعتماد المقطع" : "بدء التسجيل الفوري من الميكروفون"}
                      aria-label="Toggle recording"
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
                        <b>Record voice directly</b>
                        <small>Speak naturally for up to {MAX_REC} seconds</small>
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
                        title={clipPlaying ? "إيقاف تشغيل العينة المرجعية" : "تشغيل العينة المرجعية"}
                      >
                        <Play size={11} fill="currentColor" />
                      </button>
                      <div className="figma-loaded-clip-meta">
                        <span className="figma-loaded-clip-name">{clip.name}</span>
                        <span className="figma-loaded-clip-dur">{formatTime(clip.duration)}</span>
                      </div>
                      <button
                        type="button"
                        className="figma-clip-remove-btn"
                        onClick={() => {
                          if (clip) URL.revokeObjectURL(clip.url);
                          onClip(null);
                        }}
                        title="حذف هذا المقطع المرجعي"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {/* Reference Text */}
                  <div className="figma-field-group">
                    <label className="figma-field-label">
                      Reference Transcript (optional)
                    </label>
                    <textarea
                      className="figma-ref-textarea"
                      placeholder="Enter the exact words spoken in the reference clip for maximum fidelity..."
                      value={refText}
                      onChange={(e) => onRefText(e.target.value)}
                      dir="auto"
                      rows={2}
                      title="النص الذي تم نطقه في الملف المرجعي: كتابته بدقة ترفع من جودة مطابقة الصوت واستقراره."
                    />
                  </div>

                  <div
                    className="figma-consent-note"
                    title="تنبيه الأمان والخصوصية: يجب استخدام أصوات تملك حق استخدامها بموافقة صريحة من صاحب الصوت."
                  >
                    <ShieldCheck size={14} />
                    <span>Only clone voices with proper consent and authorization.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DELIVERY / GENERATION SETTINGS */}
        <div className="figma-section-block">
          <div className="figma-section-header">
            <span className="figma-section-title">Delivery & Synthesis</span>
            <span
              className="figma-section-tip"
              title="معايير التحكم في سرعة النطق ودقة توليد الصوت ومطابقة المرجع."
            >
              (?)
            </span>
          </div>

          {/* Language / Dialect */}
          <div className="figma-field-group">
            <div className="figma-field-label-row">
              <span className="figma-field-label">Language / Dialect</span>
              <span
                className="figma-hint-icon"
                title="اللغة المستهدفة: العامية المصرية (arz) هي التخصص الأساسي للموديل، مع دعم الإنجليزية (en)."
              >
                (?)
              </span>
            </div>
            <div className="figma-dropdown-wrap">
              <select
                className="figma-select-native"
                value={language}
                onChange={(e) => onChangeLanguage(e.target.value as Language)}
                title="اختر لغة أو لهجة التوليد"
              >
                <option value="arz">Egyptian Arabic (العامية المصرية)</option>
                <option value="en">English (US)</option>
              </select>
              <div className="figma-dropdown-display">
                <span>{language === "arz" ? "Egyptian Arabic (العامية المصرية)" : "English (US)"}</span>
                <ChevronDown size={14} className="figma-dropdown-chevron" />
              </div>
            </div>
          </div>

          {/* Stability (Steps) Slider */}
          <div
            className="figma-slider-group"
            title="عدد خطوات التوليد (Diffusion Steps): قيم أعلى (32–64) تعطي صوتاً أنقى وأدق لكن تستغرق وقتاً أطول. القيمة الافتراضية 32."
          >
            <div className="figma-slider-label-row">
              <span className="figma-slider-name">Stability (Diffusion Steps)</span>
              <span className="figma-slider-val">{params.numStep} steps</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              step={2}
              value={params.numStep}
              onChange={(e) =>
                onChangeParams({ ...params, numStep: Number(e.target.value) })
              }
              className="figma-range-slider"
            />
            <div className="figma-slider-scale">
              <span>Fast (8)</span>
              <span>Balanced (32)</span>
              <span>Studio Quality (64)</span>
            </div>
          </div>

          {/* Guidance Scale (CFG) Slider */}
          <div
            className="figma-slider-group"
            title="مقياس التوجيه (Guidance Scale / CFG): يتحكم في مدى التزام الصوت بخصائص المتحدث المرجعي ونبرته. القيمة المثالية بين 1.5 و 2.5."
          >
            <div className="figma-slider-label-row">
              <span className="figma-slider-name">Guidance Scale (Voice Adherence)</span>
              <span className="figma-slider-val">{params.guidance.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5.0}
              step={0.1}
              value={params.guidance}
              onChange={(e) =>
                onChangeParams({ ...params, guidance: Number(e.target.value) })
              }
              className="figma-range-slider"
            />
            <div className="figma-slider-scale">
              <span>Loose (0.5)</span>
              <span>Standard (2.0)</span>
              <span>Strict (5.0)</span>
            </div>
          </div>

          {/* Speaking Rate (Speed) Slider */}
          <div
            className="figma-slider-group"
            title="سرعة نطق الكلام: 1.0× هي السرعة الطبيعية للمتحدث، يمكن تسريع الكلام حتى 2.0× أو إبطاؤه حتى 0.5×."
          >
            <div className="figma-slider-label-row">
              <span className="figma-slider-name">Speaking Rate (Speed)</span>
              <span className="figma-slider-val">{(params.speed ?? 1.0).toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={params.speed ?? 1.0}
              onChange={(e) =>
                onChangeParams({ ...params, speed: Number(e.target.value) })
              }
              className="figma-range-slider"
            />
            <div className="figma-slider-scale">
              <span>0.5× (Slow)</span>
              <span>1.0× (Normal)</span>
              <span>2.0× (Fast)</span>
            </div>
          </div>
        </div>

        {/* PROCESSING & TOOLS */}
        <div className="figma-section-block">
          <div className="figma-section-header">
            <span className="figma-section-title">Tools & Processing</span>
            <span
              className="figma-section-tip"
              title="أدوات معالجة النصوص وتحسين النطق التلقائي."
            >
              (?)
            </span>
          </div>

          {/* Text Normalization Switch */}
          <div
            className="figma-switch-row"
            title="التشكيل والمعالجة التلقائية للنص العربي: يقوم بضبط التشكيل، تصحيح الأرقام، وتجهيز النص المصري للنطق السليم."
          >
            <div className="figma-switch-text-group">
              <span className="figma-switch-label">Arabic Text Normalization</span>
              <small className="figma-switch-sub">Auto-diacritics & number conversion</small>
            </div>
            <button
              type="button"
              className={`figma-switch-track ${params.normalize ? "on" : "off"}`}
              onClick={() => onChangeParams({ ...params, normalize: !params.normalize })}
              role="switch"
              aria-checked={params.normalize}
              title="تفعيل/تعطيل التشكيل والمعالجة التلقائية"
            >
              <div className="figma-switch-knob" />
            </button>
          </div>

          {/* Speaker Boost Switch */}
          <div
            className="figma-switch-row"
            title="تحسين وضوح مخارج الحروف والنبرة الصوتية لمنع التشويش والهمس الزائد."
          >
            <div className="figma-switch-text-group">
              <span className="figma-switch-label">Speaker Clarity Boost</span>
              <small className="figma-switch-sub">Enhances acoustic clarity and presence</small>
            </div>
            <button
              type="button"
              className={`figma-switch-track ${speakerBoost ? "on" : "off"}`}
              onClick={() => setSpeakerBoost(!speakerBoost)}
              role="switch"
              aria-checked={speakerBoost}
              title="تفعيل/تعطيل تحسين النبرة والوضوح"
            >
              <div className="figma-switch-knob" />
            </button>
          </div>
        </div>

        {/* OUTPUT SETTINGS */}
        <div className="figma-section-block">
          <div className="figma-section-header">
            <span className="figma-section-title">Export Settings</span>
            <span
              className="figma-section-tip"
              title="صيغة الملف واسم الملف المولد عند التحميل."
            >
              (?)
            </span>
          </div>

          {/* Output Format */}
          <div className="figma-field-group">
            <div className="figma-field-label">Audio Container / Format</div>
            <div className="figma-dropdown-wrap">
              <select
                className="figma-select-native"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                title="اختر صيغة الملف الصوتي المولد"
              >
                <option value="WAV · 24 kHz">WAV (Lossless · 24 kHz · Studio)</option>
                <option value="MP3 · 320 kbps">MP3 (Compressed · 320 kbps)</option>
                <option value="FLAC · 24-bit">FLAC (Lossless · Studio Archive)</option>
              </select>
              <div className="figma-dropdown-display">
                <span>{outputFormat}</span>
                <ChevronDown size={14} className="figma-dropdown-chevron" />
              </div>
            </div>
          </div>

          {/* File Name */}
          <div className="figma-field-group">
            <div className="figma-field-label">Default Filename</div>
            <div className="figma-input-wrap">
              <input
                type="text"
                className="figma-text-input"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                title="اسم الملف الصوتي عند التنزيل"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="figma-inspector-footer">
        <div className="figma-footer-actions">
          <button
            type="button"
            className="figma-btn-save-preset"
            onClick={handleSavePreset}
            title="حفظ الإعدادات الحالية كإعداد مسبق لجلساتك القادمة"
          >
            {presetSaved ? "Saved ✓" : "Save Preset"}
          </button>
          <button
            type="button"
            className="figma-btn-generate-main"
            onClick={onGenerate}
            disabled={busy}
            title="توليد الصوت الآن وفق هذه الإعدادات (اختصار: Ctrl + Enter)"
          >
            {busy ? "Synthesizing…" : "Generate Speech"}
          </button>
        </div>
        <div className="figma-footer-status">
          {busy ? "Synthesizing audio on server…" : "Ready to synthesize"}
        </div>
      </div>
    </aside>
  );
}
