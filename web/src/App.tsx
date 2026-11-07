import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, History, Info as InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getInfo,
  synthesize,
  type Info,
  type Language,
  type Metrics,
  type SynthRequest,
  type VoiceMode,
} from "./api";
import { audioContext, engine, formatTime } from "./audio";
import { LeftNav, type LeftNavTab } from "./components/LeftNav";
import type { HistoryItem, RunState } from "./components/Output";
import { PlaygroundHeader } from "./components/PlaygroundHeader";
import { RightInspector } from "./components/RightInspector";
import { DEFAULT_PARAMS, type Params } from "./components/Settings";
import { VoiceStudioPlayground } from "./components/VoiceStudioPlayground";
import type { RefClip } from "./components/Voices";
import { stopPreview, useEngine, useFrame, useToasts } from "./hooks";

const DEFAULT_SCRIPT =
  "النهارده الجو حلو أوي في إسكندرية، يلا نطلع نتمشى شوية على الكورنيش ونشرب قهوة سوا.";

const DEFAULT_SPEAKERS = [
  { speaker_id: "Mohammed", speaker_name: "Mohammed", arabic_name: "محمد", gender: "male", tags: ["طبيعي", "سرد"], reference_text: "", audio_url: "voices/Mohammed" },
  { speaker_id: "Ahmed", speaker_name: "Ahmed", arabic_name: "أحمد", gender: "male", tags: ["شبابي", "حماسي"], reference_text: "", audio_url: "voices/Ahmed" },
  { speaker_id: "Mariam", speaker_name: "Mariam", arabic_name: "مريم", gender: "female", tags: ["هادئ", "واضح"], reference_text: "", audio_url: "voices/Mariam" },
  { speaker_id: "Sarah", speaker_name: "Sarah", arabic_name: "سارة", gender: "female", tags: ["تعبيري", "قصصي"], reference_text: "", audio_url: "voices/Sarah" },
  { speaker_id: "Ali", speaker_name: "Ali", arabic_name: "علي", gender: "male", tags: ["إعلاني", "قوي"], reference_text: "", audio_url: "voices/Ali" },
  { speaker_id: "Hassan", speaker_name: "Hassan", arabic_name: "حسن", gender: "male", tags: ["وقور", "عميق"], reference_text: "", audio_url: "voices/Hassan" },
  { speaker_id: "Karim", speaker_name: "Karim", arabic_name: "كريم", gender: "male", tags: ["حوار", "ودود"], reference_text: "", audio_url: "voices/Karim" },
  { speaker_id: "Mahmoud", speaker_name: "Mahmoud", arabic_name: "محمود", gender: "male", tags: ["رسمي", "واضح"], reference_text: "", audio_url: "voices/Mahmoud" },
  { speaker_id: "Mostafa", speaker_name: "Mostafa", arabic_name: "مصطفى", gender: "male", tags: ["تفاعلي"], reference_text: "", audio_url: "voices/Mostafa" },
  { speaker_id: "Ramy", speaker_name: "Ramy", arabic_name: "رامي", gender: "male", tags: ["عفوي", "عامي"], reference_text: "", audio_url: "voices/Ramy" },
  { speaker_id: "Shaker", speaker_name: "Shaker", arabic_name: "شاكر", gender: "male", tags: ["إذاعي"], reference_text: "", audio_url: "voices/Shaker" },
  { speaker_id: "Tareq", speaker_name: "Tareq", arabic_name: "طارق", gender: "male", tags: ["شاب"], reference_text: "", audio_url: "voices/Tareq" },
  { speaker_id: "Yehia", speaker_name: "Yehia", arabic_name: "يحيى", gender: "male", tags: ["هادئ"], reference_text: "", audio_url: "voices/Yehia" },
  { speaker_id: "Youssef", speaker_name: "Youssef", arabic_name: "يوسف", gender: "male", tags: ["حماسي"], reference_text: "", audio_url: "voices/Youssef" },
  { speaker_id: "Hadeer", speaker_name: "Hadeer", arabic_name: "هدير", gender: "female", tags: ["عفوي", "بودكاست"], reference_text: "", audio_url: "voices/Hadeer" },
  { speaker_id: "Hanan", speaker_name: "Hanan", arabic_name: "حنان", gender: "female", tags: ["سردي", "دافئ"], reference_text: "", audio_url: "voices/Hanan" },
  { speaker_id: "Rana", speaker_name: "Rana", arabic_name: "رنا", gender: "female", tags: ["مرح", "إعلاني"], reference_text: "", audio_url: "voices/Rana" },
  { speaker_id: "Yasmin", speaker_name: "Yasmin", arabic_name: "ياسمين", gender: "female", tags: ["ناعم", "احترافي"], reference_text: "", audio_url: "voices/Yasmin" },
  { speaker_id: "Yara", speaker_name: "Yara", arabic_name: "يارا", gender: "female", tags: ["شابة", "حيوية"], reference_text: "", audio_url: "voices/Yara" },
];

function loadParams(): Params {
  try {
    const p = JSON.parse(localStorage.getItem("voicetut-params") || "null");
    if (p && typeof p.numStep === "number") return { ...DEFAULT_PARAMS, ...p };
  } catch {
    /* ignore */
  }
  return DEFAULT_PARAMS;
}

export default function App() {
  const { toasts, push } = useToasts();
  const st = useEngine();

  const [info, setInfo] = useState<Info | null>(null);
  const [, setOffline] = useState(false);

  // Panels State matching Figma 3-panel layout
  const [leftNavCollapsed, setLeftNavCollapsed] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth < 1100;
    return false;
  });
  const [rightInspectorOpen, setRightInspectorOpen] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 1024;
    return true;
  });
  const [rightInspectorVoiceExpanded, setRightInspectorVoiceExpanded] = useState(false);

  const [activeLeftTab, setActiveLeftTab] = useState<LeftNavTab>("playground");

  const [text, setText] = useState(DEFAULT_SCRIPT);
  const [language, setLanguage] = useState<Language>("arz");
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("speaker");
  const [speaker, setSpeaker] = useState<string | null>("Mohammed");
  const [clip, setClip] = useState<RefClip | null>(null);
  const [refText, setRefText] = useState("");
  const [params, setParams] = useState<Params>(loadParams);

  const [run, setRun] = useState<RunState>("idle");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [currentTime, setCurrentTime] = useState(0);

  // Continuous frame update for smooth waveform scrubbing & timing
  useFrame(() => {
    if (st.playing || st.mode === "ready" || st.mode === "streaming") {
      setCurrentTime(engine.currentTime());
    }
  }, st.playing || st.mode === "ready" || st.mode === "streaming");

  // Server info fetch
  useEffect(() => {
    let dead = false;
    let timer = 0;
    const load = () =>
      getInfo()
        .then((i) => {
          if (dead) return;
          setInfo(i);
          setOffline(false);
          setSpeaker(
            (s) =>
              s ??
              i.speakers.find((x) => x.speaker_name === "Mohammed")?.speaker_id ??
              i.speakers[0]?.speaker_id ??
              "Mohammed",
          );
        })
        .catch(() => {
          if (dead) return;
          setOffline(true);
          timer = window.setTimeout(load, 4000);
        });
    load();
    return () => {
      dead = true;
      clearTimeout(timer);
    };
  }, []);

  // Save params
  useEffect(() => {
    try {
      localStorage.setItem("voicetut-params", JSON.stringify(params));
    } catch {
      /* ignore */
    }
  }, [params]);

  // Space bar play/pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        e.code !== "Space" ||
        t.closest("textarea, input, button, [role=slider], [role=option], a")
      )
        return;
      const mode = engine.getState().mode;
      if (mode !== "ready" && mode !== "streaming") return;
      e.preventDefault();
      engine.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const busy = run === "busy";
  const maxChars = info?.max_chars ?? 3000;

  const availableSpeakers =
    info?.speakers && info.speakers.length > 0 ? info.speakers : DEFAULT_SPEAKERS;
  const currentSpeakerObj = availableSpeakers.find((s) => s.speaker_id === speaker);
  const activeVoiceName =
    voiceMode === "clone"
      ? clip?.name || "Cloned Voice"
      : currentSpeakerObj?.speaker_name
        ? `${currentSpeakerObj.speaker_name} (${currentSpeakerObj.arabic_name})`
        : "Mohammed (محمد)";
  const activeVoiceDetails =
    voiceMode === "clone"
      ? clip
        ? `Custom voice sample · ${formatTime(clip.duration)}`
        : "Click to record or upload reference voice"
      : `${currentSpeakerObj?.gender === "female" ? "Female" : "Male"} · Egyptian Arabic · ${currentSpeakerObj?.tags?.join(" · ") || "Natural"}`;

  const addHistory = (
    audio: ArrayBuffer,
    m: Metrics,
    duration: number,
    voice: string,
    t: string,
  ) => {
    const id = Date.now();
    setHistory((h) => [{ id, text: t, voice, duration, audio, metrics: m }, ...h].slice(0, 50));
    setCurrentId(id);
  };

  const handleGenerate = async () => {
    if (busy) return;
    const t = text.trim();
    if (!t) return push("info", "Please enter text to generate speech / اكتب النص المراد توليده");
    if (t.length > maxChars) return push("error", `Script exceeds maximum character limit (${maxChars} chars)`);
    if (!info) return push("error", "Server is initializing, please wait a moment");
    if (voiceMode === "speaker" && !speaker) return push("info", "Please select a voice from the sidebar");
    if (voiceMode === "clone" && !clip) {
      setRightInspectorOpen(true);
      setRightInspectorVoiceExpanded(true);
      return push("info", "Please upload or record a reference voice sample in the sidebar for cloning");
    }

    stopPreview();
    audioContext();

    const voice = activeVoiceName;
    const req: SynthRequest = {
      text: t,
      language,
      voiceMode,
      speaker,
      refAudio: clip?.wav ?? null,
      refText,
      numStep: params.numStep,
      guidance: params.guidance,
      speed: params.speed,
      normalize: params.normalize,
    };

    setRun("busy");
    engine.setLoading();

    try {
      const { audio, metrics: m } = await synthesize(req);
      await engine.load(audio);
      addHistory(audio, m, m.audio, voice, t);
      setRun("ready");
      push("ok", `Speech generated in ${m.total.toFixed(2)}s`);
    } catch (e) {
      engine.reset();
      setRun("error");
      push("error", (e as Error).message);
    }
  };

  const handleSelectHistory = async (h: HistoryItem) => {
    setCurrentId(h.id);
    setText(h.text);
    await engine.load(h.audio);
    engine.play();
  };

  const handleNewSession = () => {
    setText("");
    engine.reset();
    setCurrentTime(0);
    push("info", "Clean session started");
  };

  const handleToggleLanguage = () => {
    const nextLang = language === "arz" ? "en" : "arz";
    setLanguage(nextLang);
    push("info", `Language set to ${nextLang === "arz" ? "Egyptian Arabic (العامية المصرية)" : "English (US)"}`);
  };

  const handleExportAll = () => {
    if (!history.length) return push("info", "No audio recordings to export");
    history.forEach((h, idx) => {
      const blob = new Blob([h.audio], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voicetut_clip_${idx + 1}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    });
    push("ok", `Exported ${history.length} audio clips as WAV`);
  };

  const handleOpenVoiceMode = (mode: VoiceMode = "speaker") => {
    setVoiceMode(mode);
    setRightInspectorOpen(true);
    setRightInspectorVoiceExpanded(true);
  };

  const handleTogglePlay = () => {
    if (st.mode === "ready" || st.mode === "streaming") {
      engine.toggle();
    } else if (text.trim() && !busy) {
      void handleGenerate();
    } else {
      push("info", "Enter text and click Generate Speech to synthesize audio");
    }
  };

  return (
    <div className="figma-studio-layout">
      {/* 1. Left Sidebar Navigation */}
      <LeftNav
        activeTab={activeLeftTab}
        onSelectTab={setActiveLeftTab}
        onOpenVoiceMode={handleOpenVoiceMode}
        historyCount={history.length}
        speakersCount={availableSpeakers.length}
        collapsed={leftNavCollapsed}
        onToggleCollapse={() => setLeftNavCollapsed((c) => !c)}
        onNewSession={handleNewSession}
        history={history}
        currentId={currentId}
        onSelectHistory={handleSelectHistory}
        isPlaying={st.playing}
        onTogglePlay={handleTogglePlay}
        currentTime={currentTime}
        duration={st.duration || 0}
        onExportAll={handleExportAll}
      />

      {/* 2. Center Workspace */}
      <div className="figma-center-stage">
        <PlaygroundHeader
          leftNavCollapsed={leftNavCollapsed}
          onToggleLeftNav={() => setLeftNavCollapsed((c) => !c)}
          rightInspectorOpen={rightInspectorOpen}
          onToggleRightInspector={() => setRightInspectorOpen((o) => !o)}
          onClearSession={handleNewSession}
          messagesCount={history.length}
        />

        {activeLeftTab === "history" ? (
          <div className="studio-history-view">
            <div className="studio-history-head">
              <div className="history-head-title">
                <History size={18} />
                <h2>Recording History ({history.length})</h2>
              </div>
              <p
                title="سجل المقاطع والتسجيلات الصوتية المولدة في هذه الجلسة مع إمكانية إعادة تشغيلها وتحميلها"
              >
                Generated speech clips and session audio recordings
              </p>
            </div>
            {history.length === 0 ? (
              <div
                className="empty-history-box"
                title="لا توجد تسجيلات بعد — اكتب نصاً واضغط على توليد الصوت لإنشاء أول مقطع"
              >
                <History size={32} />
                <p>No audio clips generated yet</p>
                <small>Generated speech clips will automatically appear here</small>
              </div>
            ) : (
              <div className="history-cards-grid">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className={`history-card-item ${h.id === currentId ? "active" : ""}`}
                    onClick={() => handleSelectHistory(h)}
                    role="button"
                    tabIndex={0}
                    title={`انقر لتحميل وتشغيل هذا المقطع: "${h.text}"`}
                  >
                    <div className="card-top">
                      <span className="voice-badge">{h.voice}</span>
                      <span className="dur num">{formatTime(h.duration)}</span>
                    </div>
                    <p className="card-text" dir="auto">
                      {h.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <VoiceStudioPlayground
            text={text}
            onTextChange={setText}
            voiceName={activeVoiceName}
            voiceDetails={activeVoiceDetails}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            modelName="VoiceTut-TTS v1"
            onOpenVoicePicker={handleOpenVoiceMode}
            busy={busy}
            onGenerate={handleGenerate}
            isPlaying={st.playing}
            onTogglePlay={handleTogglePlay}
            currentTime={currentTime}
            duration={st.duration || 0}
            onSeek={(frac) => engine.seek(frac)}
            maxChars={maxChars}
          />
        )}
      </div>

      {/* 3. Right Inspector Surface — Inline Voice Management, NO POPUPS! */}
      <RightInspector
        open={rightInspectorOpen}
        onClose={() => setRightInspectorOpen(false)}
        info={info}
        params={params}
        onChangeParams={setParams}
        language={language}
        onChangeLanguage={setLanguage}
        voiceMode={voiceMode}
        onVoiceMode={setVoiceMode}
        speaker={speaker}
        onSpeaker={setSpeaker}
        speakers={availableSpeakers}
        clip={clip}
        onClip={setClip}
        refText={refText}
        onRefText={setRefText}
        onGenerate={handleGenerate}
        busy={busy}
        onToast={push}
        voiceExpanded={rightInspectorVoiceExpanded}
        onToggleVoiceExpanded={() => setRightInspectorVoiceExpanded((e) => !e)}
      />

      {/* Toast Notifications */}
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              className={`toast ${t.kind}`}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
            >
              {t.kind === "error" ? (
                <AlertCircle size={17} />
              ) : t.kind === "ok" ? (
                <CheckCircle2 size={17} />
              ) : (
                <InfoIcon size={17} />
              )}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
