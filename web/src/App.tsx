import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  History,
  Info as InfoIcon,
} from "lucide-react";
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

  // Panels State matching 3-pane desktop layout
  const [leftNavCollapsed, setLeftNavCollapsed] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth < 1100;
    return false;
  });
  const [rightInspectorOpen, setRightInspectorOpen] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 1024;
    return true;
  });
  const [rightInspectorVoiceExpanded, setRightInspectorVoiceExpanded] = useState(false);

  // Modals state (Section 5.5)
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);

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
    getInfo()
      .then((data) => {
        if (dead) return;
        setInfo(data);
        setOffline(false);
        if (data.speakers?.length) {
          const first = data.speakers[0].speaker_id;
          setSpeaker((curr) => curr || first);
        }
      })
      .catch(() => {
        if (dead) return;
        setOffline(true);
      });
    return () => {
      dead = true;
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "Escape") {
        setShortcutsModalOpen(false);
        setProfileModalOpen(false);
        setOptionsMenuOpen(false);
      } else if (e.key === "?" && !["INPUT", "TEXTAREA"].includes(target?.tagName)) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
      } else if (e.code === "Space" && !["INPUT", "TEXTAREA"].includes(target?.tagName)) {
        const mode = engine.getState().mode;
        if (mode === "ready" || mode === "streaming") {
          e.preventDefault();
          engine.toggle();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const availableSpeakers = info?.speakers?.length ? info.speakers : DEFAULT_SPEAKERS;
  const currentSpeaker = availableSpeakers.find((s) => s.speaker_id === speaker);

  const activeVoiceName =
    voiceMode === "clone"
      ? clip?.name || "Cloned Voice Sample"
      : currentSpeaker?.speaker_name
        ? `${currentSpeaker.speaker_name} (${currentSpeaker.arabic_name})`
        : "Mohammed (محمد)";

  const activeVoiceDetails =
    voiceMode === "clone"
      ? clip
        ? `Custom voice sample (${clip.duration.toFixed(1)}s)`
        : "Reference audio needed"
      : `${currentSpeaker?.gender === "female" ? "Female" : "Male"} · Egyptian Arabic · ${currentSpeaker?.tags?.join(" · ") || "Natural"}`;

  const maxChars = info?.max_chars || 3000;
  const busy = run === "busy";

  // Add History item
  const addHistory = (
    audio: ArrayBuffer,
    m: Metrics,
    dur: number,
    voice: string,
    t: string,
  ) => {
    const id = Date.now();
    const item: HistoryItem = { id, text: t, voice, duration: dur, audio, metrics: m };
    setHistory((h) => [item, ...h].slice(0, 50));
    setCurrentId(id);
  };

  // Synthesize Speech handler
  const handleGenerate = async () => {
    if (busy) return;
    const trimmed = text.trim();
    if (!trimmed) {
      push("error", "Please enter some text to synthesize");
      return;
    }
    if (trimmed.length > maxChars) {
      push("error", `Text exceeds limit of ${maxChars} characters`);
      return;
    }

    if (voiceMode === "clone" && !clip) {
      push("error", "Please upload or record reference audio first");
      setRightInspectorOpen(true);
      setRightInspectorVoiceExpanded(true);
      return;
    }

    stopPreview();
    audioContext();

    const itemVoiceName = activeVoiceName;
    const req: SynthRequest = {
      text: trimmed,
      language,
      voiceMode,
      speaker: voiceMode === "speaker" ? speaker : null,
      refAudio: voiceMode === "clone" && clip ? clip.wav : null,
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
      addHistory(audio, m, m.audio, itemVoiceName, trimmed);
      setRun("ready");
      push("ok", `Speech generated in ${m.total.toFixed(2)}s`);
    } catch (err) {
      engine.reset();
      setRun("error");
      const msg = err instanceof Error ? err.message : String(err);
      push("error", msg || "Synthesis failed");
    }
  };

  const handleTogglePlay = () => {
    engine.toggle();
  };

  const handleSelectHistory = async (item: HistoryItem) => {
    setCurrentId(item.id);
    setText(item.text);
    await engine.load(item.audio);
    engine.play();
    push("info", `Playing: "${item.text.slice(0, 24)}…"`);
  };

  const handleExportAll = () => {
    if (history.length === 0) {
      push("info", "No audio clips to export");
      return;
    }
    history.forEach((h, idx) => {
      const blob = new Blob([h.audio], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voicetut_clip_${idx + 1}_${h.voice.split(" ")[0]}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    });
    push("ok", `Exported ${history.length} audio clips as WAV files`);
  };

  const handleNewSession = () => {
    engine.reset();
    setText("");
    setCurrentTime(0);
    push("info", "New session started — cleared text script");
  };

  const handleOpenVoiceMode = (mode: VoiceMode = "speaker") => {
    setVoiceMode(mode);
    setRightInspectorOpen(true);
    setRightInspectorVoiceExpanded(true);
  };

  const handleToggleLanguage = () => {
    setLanguage((l) => (l === "arz" ? "en" : "arz"));
    push("info", `Language set to ${language === "arz" ? "English" : "Egyptian Arabic (عامية)"}`);
  };

  return (
    <div className="figma-studio-layout">
      {/* 1. Left Sidebar Navigation (Section 4.1) */}
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
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* 2. Center Workspace (Section 4.2) */}
      <div className="figma-center-stage">
        <PlaygroundHeader
          leftNavCollapsed={leftNavCollapsed}
          onToggleLeftNav={() => setLeftNavCollapsed((c) => !c)}
          rightInspectorOpen={rightInspectorOpen}
          onToggleRightInspector={() => setRightInspectorOpen((o) => !o)}
          onClearSession={handleNewSession}
          messagesCount={history.length}
          onOpenShortcuts={() => setShortcutsModalOpen(true)}
          onOpenMenu={() => setOptionsMenuOpen(true)}
        />

        {activeLeftTab === "history" ? (
          <div className="figma-canvas-scroll">
            <div className="figma-canvas-inner">
              <div className="figma-showcase-header">
                <h1 className="figma-showcase-title">Session Recordings & History</h1>
                <p className="figma-showcase-sub">
                  Review, replay, and manage audio clips generated during this studio session.
                </p>
              </div>

              {history.length === 0 ? (
                <div className="figma-preview-stage-container" style={{ textAlign: "center", padding: "40px" }}>
                  <History size={32} color="#A0A0A0" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500 }}>
                    No audio clips generated yet
                  </p>
                  <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                    Synthesize any text in the playground to begin creating recordings.
                  </span>
                </div>
              ) : (
                <div className="figma-showcase-grid">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="figma-tile-card"
                      onClick={() => handleSelectHistory(h)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="figma-tile-media">
                        <svg className="figma-tile-media-svg" viewBox="0 0 200 112" fill="none">
                          <path
                            d="M 10 56 Q 30 20, 50 56 T 90 56 T 130 30 T 170 56 T 190 56"
                            stroke="#E5E7EB"
                            strokeWidth="2"
                            fill="none"
                          />
                        </svg>
                      </div>
                      <div className="figma-tile-footer">
                        <span className="figma-tile-title">{h.text}</span>
                        <span className="figma-tile-badge">
                          {formatTime(h.duration)} · {h.voice}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <VoiceStudioPlayground
            text={text}
            onTextChange={setText}
            voiceName={activeVoiceName}
            voiceDetails={activeVoiceDetails}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            modelName="VoiceTuT-TTS v1"
            onOpenVoicePicker={handleOpenVoiceMode}
            busy={busy}
            onGenerate={handleGenerate}
            isPlaying={st.playing}
            onTogglePlay={handleTogglePlay}
            currentTime={currentTime}
            duration={st.duration || 0}
            onSeek={(frac) => engine.seek(frac)}
            maxChars={maxChars}
            speed={params.speed}
            numStep={params.numStep}
          />
        )}
      </div>

      {/* 3. Right Inspector Surface (Section 4.3) */}
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

      {/* 5.5 Floating Panels & Modal Dialogs: Account & Workspace Switcher */}
      {profileModalOpen && (
        <div className="figma-modal-backdrop" onClick={() => setProfileModalOpen(false)}>
          <div className="figma-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="figma-modal-header">
              <h2 className="figma-modal-title">Account & Workspace</h2>
              <button
                type="button"
                className="figma-modal-close-btn"
                onClick={() => setProfileModalOpen(false)}
              >
                Close
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="figma-account-avatar" style={{ width: "40px", height: "40px", fontSize: "14px" }}>
                  VP
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Studio Audio Producer
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>producer@voicetut.ai</div>
                </div>
              </div>

              <div className="figma-field-group">
                <div className="figma-setting-row-horizontal">
                  <span className="figma-setting-label">Workspace Plan</span>
                  <span className="figma-tier-badge">PRO TIER</span>
                </div>
                <div className="figma-setting-row-horizontal">
                  <span className="figma-setting-label">Inference Compute</span>
                  <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>NVIDIA CUDA GPU</span>
                </div>
                <div className="figma-setting-row-horizontal">
                  <span className="figma-setting-label">Egyptian Arabic Corpus</span>
                  <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>24 kHz High Fidelity</span>
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
