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
import { audioContext, engine } from "./audio";
import { LeftNav, type LeftNavTab } from "./components/LeftNav";
import type { HistoryItem, RunState } from "./components/Output";
import { PlaygroundHeader } from "./components/PlaygroundHeader";
import { HistoryView } from "./components/HistoryView";
import { ToastStack } from "./components/ToastStack";
import { ModalPanels } from "./components/ModalPanels";
import { RightInspector } from "./components/RightInspector";
import type { Params } from "./components/Settings";
import { DEFAULT_SCRIPT, DEFAULT_SPEAKERS, loadParams } from "./defaults";
import { VoiceStudioPlayground } from "./components/VoiceStudioPlayground";
import type { RefClip } from "./components/Voices";
import { stopPreview, useEngine, useFrame, useToasts } from "./hooks";


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

  const handleDownloadLatest = () => {
    const latest = history.find((h) => h.id === currentId) || history[0];
    if (!latest) {
      push("info", "No audio generated yet to download");
      return;
    }
    const blob = new Blob([latest.audio], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voicetut_${latest.voice.split(" ")[0].toLowerCase()}_${latest.id}.wav`;
    a.click();
    URL.revokeObjectURL(url);
    push("ok", `Downloaded "${latest.text.slice(0, 20)}…" (WAV)`);
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
      />
      {/* 2. Center Workspace (Section 4.2) */}
      <div className="figma-center-stage">
        <PlaygroundHeader
          leftNavCollapsed={leftNavCollapsed}
          onToggleLeftNav={() => setLeftNavCollapsed((collapsed) => !collapsed)}
          rightInspectorOpen={rightInspectorOpen}
          onToggleRightInspector={() => setRightInspectorOpen((o) => !o)}
          onClearSession={handleNewSession}
          messagesCount={history.length}
          onOpenShortcuts={() => setShortcutsModalOpen(true)}
          onOpenMenu={() => setOptionsMenuOpen(true)}
        />

        {activeLeftTab === "history" ? (
          <HistoryView history={history} onSelect={handleSelectHistory} />
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
            maxChars={maxChars}
            speed={params.speed}
            numStep={params.numStep}
            onDownload={handleDownloadLatest}
            hasAudio={history.length > 0 || st.duration > 0}
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

      <ModalPanels
        shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}
        optionsMenuOpen={optionsMenuOpen} setOptionsMenuOpen={setOptionsMenuOpen}
        handleExportAll={handleExportAll} handleNewSession={handleNewSession}
      />
      <ToastStack toasts={toasts} />
    </div>
  );
}
