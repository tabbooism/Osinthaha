import { useState, useEffect } from "react";
import { PRESET_SUBJECTS } from "./presets";
import { DossierReport, SubjectPreset } from "./types";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Brain,
  BookOpen,
  AlertTriangle,
  Play,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Info,
  Copy,
  Check,
  User,
  Sparkles,
  Award,
  Download
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function getSubjectStats(nameStr: string) {
  // Simple deterministic hash based on name characters to compute realistic modeling parameters
  let hash = 0;
  const targetName = nameStr || "Subject";
  for (let i = 0; i < targetName.length; i++) {
    hash = targetName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seedVal = Math.abs(hash);
  
  const intVal = 120 + (seedVal % 28); // 120 - 148
  const emoVal = 40 + (seedVal % 55);  // 40 - 95
  const trustVal = 4 + (seedVal % 22);  // 4% - 26%
  const egoVal = 60 + (seedVal % 38);   // 60% - 98%
  
  const narcissisticIndex = 55 + (seedVal % 38); // 55% - 93%
  const empathyQuotient = 8 + (seedVal % 32);    // 8% - 40%
  const paranoiaBaseline = 45 + ((seedVal >> 2) % 48); // 45% - 93%
  
  return {
    intVal,
    emoVal,
    trustVal,
    egoVal,
    narcissisticIndex,
    empathyQuotient,
    paranoiaBaseline
  };
}

export default function App() {
  // Preset management
  const [selectedPresetId, setSelectedPresetId] = useState<string>("vance");
  const [customSubject, setCustomSubject] = useState<Omit<SubjectPreset, "id">>({
    name: "",
    role: "",
    baseTraits: "",
    baseFacts: "",
    options: ""
  });

  // Current edited profile input
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [baseTraits, setBaseTraits] = useState("");
  const [baseFacts, setBaseFacts] = useState("");
  const [options, setOptions] = useState("");

  const [activeTab, setActiveTab] = useState<"dossier" | "greene" | "vulnerability" | "simulation">("dossier");
  
  // Loading & reporting state
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [report, setReport] = useState<DossierReport | null>(null);

  // Tabletop simulation game state
  const [selectedSimOptionIndex, setSelectedSimOptionIndex] = useState<number | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Initialize form with preset values on mount & selection
  useEffect(() => {
    if (selectedPresetId === "custom") {
      setName(customSubject.name);
      setRole(customSubject.role);
      setBaseTraits(customSubject.baseTraits);
      setBaseFacts(customSubject.baseFacts);
      setOptions(customSubject.options);
    } else {
      const preset = PRESET_SUBJECTS.find(p => p.id === selectedPresetId);
      if (preset) {
        setName(preset.name);
        setRole(preset.role);
        setBaseTraits(preset.baseTraits);
        setBaseFacts(preset.baseFacts);
        setOptions(preset.options);
      }
    }
    // Clean states
    setSelectedSimOptionIndex(null);
  }, [selectedPresetId]);

  // Loading steps animation
  const LOADING_STEPS = [
    "Spinning up clinical mental threat analyzer...",
    "Clustering cognitive core pathways and traits...",
    "Constructing Robert Greene Laws matrix for specific subject...",
    "Modeling 'Red Ops' social engineering susceptibility benchmarks...",
    "Structuring cognitive bias playbooks...",
    "Generating tabletop defensive training playout scenario...",
    "Formulating clinical-grade dossier packet..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2000);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Trigger JSON report generation
  const handleGenerate = async () => {
    if (!name.trim()) {
      setErrorString("Subject Name is required before compiling diagnostic.");
      return;
    }

    setLoading(true);
    setErrorString(null);
    setReport(null);
    setSelectedSimOptionIndex(null);

    // If custom preset, save current input values to custom preset cache
    if (selectedPresetId === "custom") {
      setCustomSubject({ name, role, baseTraits, baseFacts, options });
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, baseTraits, baseFacts, options })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || "Internal server error connecting to analysis module.");
      }

      const data: DossierReport = await response.json();
      setReport(data);
      setActiveTab("dossier");
    } catch (err: any) {
      console.error(err);
      setErrorString(err?.message || "An unexpected disconnection occurred during behavioral threat modeling.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("active-report-viewport");
    if (!element) return;

    setDownloadingPdf(true);
    try {
      // Temporarily override max-height and scrolling to capture the full overflowing text content
      const bodyEl = document.getElementById("tab-viewport-body");
      let originalMaxHeight = "";
      let originalOverflow = "";
      if (bodyEl) {
        originalMaxHeight = bodyEl.style.maxHeight;
        originalOverflow = bodyEl.style.overflowY;
        bodyEl.style.maxHeight = "none";
        bodyEl.style.overflowY = "visible";
      }

      // Allow small delay for rendering lifecycle adjustment if any
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        backgroundColor: "#111113",
        scale: 2, // Retain high-DPI quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Restore original container scroll parameters
      if (bodyEl) {
        bodyEl.style.maxHeight = originalMaxHeight;
        bodyEl.style.overflowY = originalOverflow;
      }

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Scale appropriately: 72 ppi baseline conversion
      const pdfWidth = imgWidth / 2;
      const pdfHeight = imgHeight / 2;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [pdfWidth, pdfHeight]
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PsycheOps_Dossier_${name.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF download sequence failed:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const stats = getSubjectStats(name);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans selection:bg-rose-500/30 selection:text-white" id="root-console">
      {/* Header Bar */}
      <header className="border-b border-[#2D2D30] bg-[#0A0A0B]/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 py-3.5 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4" id="app-header">
        <div className="flex items-center gap-3 md:gap-4" id="header-logo">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-none text-rose-500 shrink-0" id="main-icon-container">
            <Shield className="w-5 h-5 animate-pulse" id="header-shield" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-serif text-white tracking-widest uppercase flex flex-wrap items-center gap-2" id="title-text">
              PSYCHEOPS <span className="text-[9px] md:text-[10px] font-mono tracking-[0.2em] px-2.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-sm font-semibold">IDENTITY AUDIT</span>
            </h1>
            <p className="text-[9px] md:text-[10px] font-mono tracking-widest text-[#71717A] uppercase mt-0.5" id="subtitle-text">Clinical Profiling & Advanced Threat-Modeling Matrix</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-zinc-500" id="system-metadata-container">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" id="ping-indicator"></span>
          <span id="system-time" className="tracking-widest uppercase text-[10px] text-rose-500 font-bold">MODE: THREAT DOSSIER ACTIVE</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8 grid lg:grid-cols-12 gap-6 md:gap-8" id="main-workspace">
        
        {/* Left Console: Control Inputs & Preset Loader */}
        <section className="lg:col-span-5 space-y-8" id="control-panel-section">
          {/* Section Heading */}
          <div className="bg-[#121214] border border-[#2D2D30] rounded-none p-6 space-y-6 shadow-xl relative overflow-hidden" id="identity-import-panel">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />
            <div className="flex items-center justify-between border-b border-[#2D2D30] pb-4" id="import-title-bar">
              <div className="flex items-center gap-2.5" id="import-group">
                <User className="w-4 h-4 text-rose-400" />
                <h2 className="font-serif text-lg font-medium tracking-tight text-white">Import Subject Identity</h2>
              </div>
              <Sparkles className="w-4 h-4 text-rose-500/40 animate-pulse" />
            </div>

            {/* Presets Selection */}
            <div className="space-y-2.5" id="presets-container">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.15em] block">Choose Subject Baseline Profile</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" id="presets-grid">
                {PRESET_SUBJECTS.map((preset) => (
                  <button
                    key={preset.id}
                    id={`btn-preset-${preset.id}`}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`px-3 py-2.5 text-xs font-mono tracking-wider uppercase rounded-none border text-center transition-all ${
                      selectedPresetId === preset.id
                        ? "bg-white border-white text-black font-semibold shadow-lg"
                        : "bg-transparent border-[#2D2D30] text-zinc-400 hover:text-white hover:border-[#4E4E52]"
                    }`}
                  >
                    {preset.name.split(" ")[0]}
                  </button>
                ))}
                <button
                  id="btn-preset-custom"
                  onClick={() => setSelectedPresetId("custom")}
                  className={`px-3 py-2.5 text-xs font-mono tracking-wider uppercase rounded-none border text-center transition-all ${
                    selectedPresetId === "custom"
                      ? "bg-rose-500 border-rose-500 text-white font-semibold shadow-lg"
                      : "bg-transparent border-[#2D2D30] text-zinc-400 hover:text-white hover:border-[#4E4E52]"
                  }`}
                >
                  [ Custom ]
                </button>
              </div>
            </div>

            {/* Editing fields */}
            <div className="space-y-4 pt-4 border-t border-[#2D2D30]" id="form-fields">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="identity-names">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Codename / Full Name</label>
                  <input
                    type="text"
                    id="input-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jack Vance"
                    className="w-full bg-[#0A0A0B] border border-[#2D2D30] hover:border-[#4E4E52] focus:border-rose-500 rounded-none px-3 py-3 text-xs font-mono text-white placeholder-zinc-700 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Corporate Position</label>
                  <input
                    type="text"
                    id="input-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Systems Director"
                    className="w-full bg-[#0A0A0B] border border-[#2D2D30] hover:border-[#4E4E52] focus:border-rose-500 rounded-none px-3 py-3 text-xs font-mono text-white placeholder-zinc-700 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5" id="traits-group">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Base Psychological Traits</label>
                <textarea
                  id="input-traits"
                  rows={2}
                  value={baseTraits}
                  onChange={(e) => setBaseTraits(e.target.value)}
                  placeholder="e.g. Secretive, academic, hyper-rational, validation seeker..."
                  className="w-full bg-[#0A0A0B] border border-[#2D2D30] hover:border-[#4E4E52] focus:border-rose-500 rounded-none px-3 py-2 text-xs font-sans text-zinc-200 placeholder-zinc-700 focus:outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5" id="facts-group">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Base Facts & Logistical Data</label>
                  <span className="text-[9px] font-mono text-[#71717A] tracking-wider uppercase">Logistics & Vulnerabilities</span>
                </div>
                <textarea
                  id="input-facts"
                  rows={4}
                  value={baseFacts}
                  onChange={(e) => setBaseFacts(e.target.value)}
                  placeholder="Identify historical facts, schedules, exfiltration risks, or specific access structures they control..."
                  className="w-full bg-[#0A0A0B] border border-[#2D2D30] hover:border-[#4E4E52] focus:border-rose-500 rounded-none px-3 py-2 text-xs font-sans text-zinc-200 placeholder-zinc-700 focus:outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5" id="options-group">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Focus Options / Specific Directives</label>
                <input
                  type="text"
                  id="input-options"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  placeholder="e.g. Prioritize pre-prints or spear-phishing simulation scenarios..."
                  className="w-full bg-[#0A0A0B] border border-[#2D2D30] hover:border-[#4E4E52] focus:border-rose-500 rounded-none px-3 py-2.5 text-xs font-sans text-zinc-200 placeholder-zinc-700 focus:outline-none transition-all"
                />
              </div>

              {/* Action Button */}
              <button
                id="btn-trigger-analyzer"
                disabled={loading}
                onClick={handleGenerate}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3.5 px-4 rounded-none flex items-center justify-center gap-2 border border-rose-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none text-xs font-mono tracking-widest uppercase group cursor-pointer shadow-lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>COMPILING DIAGNOSIS...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span>EXECUTE DEFENSIVE INTEL REPORT</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Educational Callout */}
          <div className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-3 font-sans text-xs text-zinc-400 relative overflow-hidden" id="intel-creed">
            <div className="absolute left-0 top-0 h-full w-[3px] bg-rose-500" />
            <p className="font-semibold text-white flex items-center gap-2 font-mono uppercase text-[10px] tracking-widest">
              <Info className="w-4 h-4 text-rose-400 shrink-0" /> MISSION DECREE
            </p>
            <p className="leading-relaxed text-zinc-400">
              This sandbox isolates core psychological vulnerabilities of high-value internal personnel profiles. Modern cyber adversaries exploit abstract cognitive patterns and behavioral traits (trust, pride, fear, reciprocity) rather than pure code errors, making human-centric threat modeling vital to network fortifications.
            </p>
          </div>
        </section>

        {/* Right Console: Report Viewport, Tabs, Loading, and Simulations */}
        <section className="lg:col-span-7 flex flex-col" id="viewport-section">
          
          {/* Viewport Box */}
          <div className="bg-[#111113] border border-[#2D2D30] rounded-none flex-1 flex flex-col min-h-[550px] overflow-hidden shadow-2xl relative" id="report-viewport">
            
            {/* INITIAL BLANK STATE / HERO */}
            {!loading && !report && !errorString && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center my-auto space-y-6" id="welcome-pane">
                <div className="w-16 h-16 bg-[#0A0A0B] border border-[#2D2D30] rounded-none flex items-center justify-center text-rose-500 shadow-xl relative" id="welcome-globe">
                  <div className="absolute inset-0.5 border border-dashed border-[#2D2D30] animate-pulse" />
                  <Shield className="w-6 h-6" />
                </div>
                <div className="max-w-md space-y-3">
                  <h3 className="text-xl font-serif text-white tracking-wide">Identity Compiler Offline</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Import a preset codename from the left tray or write a custom subject baseline. Once populated, initiate the compiler to formulate a high-fidelity psychological dossier, Robert Greene mapping, behavioral threat scores, and interactive simulation.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4" id="demo-indicator">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0A0A0B] border border-[#2D2D30] text-zinc-400 text-xs font-mono rounded-none" id="check-clinical">
                    <span className="w-1 h-1 bg-rose-500 rounded-full" />
                    <span>Clinical Profile</span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0A0A0B] border border-[#2D2D30] text-zinc-400 text-xs font-mono rounded-none" id="check-greene">
                    <span className="w-1 h-1 bg-amber-400 rounded-full" />
                    <span>Laws of Power Map</span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0A0A0B] border border-[#2D2D30] text-zinc-400 text-xs font-mono rounded-none" id="check-fuzz">
                    <span className="w-1 h-1 bg-indigo-500 rounded-full" />
                    <span>Human Vectors</span>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVE LOADING STATE */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto" id="loading-pane">
                <div className="relative mb-6" id="loader-spinning-rings">
                  <div className="w-16 h-16 rounded-none border-2 border-[#2D2D30] border-t-rose-500 animate-spin"></div>
                  <div className="absolute inset-2 rounded-none border border-dashed border-rose-500/30 animate-pulse"></div>
                </div>
                <div className="max-w-md space-y-4" id="loading-text-container">
                  <h3 className="text-xs font-mono text-rose-500 uppercase tracking-[0.25em] animate-pulse">Running Diagnostic Sequence</h3>
                  <p className="text-base font-serif text-white italic h-6 transition-all px-4">
                    {LOADING_STEPS[loadingStepIndex]}
                  </p>
                  <div className="bg-[#0A0A0B] border border-[#2D2D30] rounded-none p-4 font-mono text-[10px] leading-relaxed text-zinc-500 max-w-sm mx-auto text-left space-y-1 block shadow-inner" id="loading-terminal">
                    <div className="flex gap-2">
                      <span className="text-rose-500">[SYS]</span>
                      <span>GET /api/gemini/generate</span>
                    </div>
                    <div className="flex gap-2 text-zinc-600 animate-pulse">
                      <span>[SYS]</span>
                      <span>Configuring schema definitions...</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-indigo-400">[JWT]</span>
                      <span>Authenticating console context...</span>
                    </div>
                    <div className="flex gap-2 text-rose-500/75 ... animate-bounce">
                      <span>[ANALYZER]</span>
                      <span>Refining behavior weights: True</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ERROR VIEW */}
            {errorString && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center my-auto space-y-5" id="error-pane">
                <div className="w-12 h-12 bg-rose-950/20 border border-rose-500/20 text-rose-500 rounded-none flex items-center justify-center" id="error-alert-wrapper">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-sm font-semibold font-mono text-rose-500 tracking-wider uppercase">Compilation Failure Encountered</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {errorString}
                  </p>
                </div>
                <button
                  id="btn-retry-analysis"
                  onClick={handleGenerate}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-none text-xs font-mono tracking-widest border border-rose-500/20 transition-all uppercase cursor-pointer"
                >
                  RETRY COMPILATION SEQUENCE
                </button>
              </div>
            )}

            {/* RENDERED ACTIVE DOSSIER REPORT */}
            {report && !loading && (
              <div className="flex-1 flex flex-col" id="active-report-viewport">
                
                {/* Subject Summary Card Header */}
                <div className="bg-[#121214] p-6 border-b border-[#2D2D30] flex flex-col gap-5" id="report-header">
                  
                  {/* Top line detail */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-rose-400 tracking-[0.2em] font-semibold">INTEL CODE: #{name.toUpperCase().replace(/\s/g, "_")}</span>
                        <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono rounded-none text-indigo-400">CLASS 3 DOSSIER</span>
                      </div>
                      <h2 className="text-3xl font-serif font-bold text-white tracking-tight leading-none mt-1">{name}</h2>
                      <p className="text-xs font-mono text-zinc-400 tracking-wider uppercase">{role || "Unlisted Corporate Assignment"}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto" id="report-top-actions" data-html2canvas-ignore="true">
                      <button
                        id="btn-copy-report"
                        onClick={handleCopyReport}
                        className="px-3.5 py-2 bg-[#0A0A0B] hover:bg-zinc-900 border border-[#2D2D30] text-zinc-400 hover:text-white rounded-none text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {hasCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                            <span className="text-[#4ADE80] font-bold">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>EXPORT JSON</span>
                          </>
                        )}
                      </button>

                      <button
                        id="btn-download-pdf"
                        onClick={handleDownloadPDF}
                        disabled={downloadingPdf}
                        className="px-3.5 py-2 bg-rose-950/25 hover:bg-rose-900/40 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-none text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {downloadingPdf ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                            <span>COMPILING PDF...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>DOWNLOAD PDF</span>
                          </>
                        )}
                      </button>

                      <button
                        id="btn-refresh-sequence"
                        onClick={handleGenerate}
                        className="p-2 bg-[#0A0A0B] hover:bg-zinc-900 border border-[#2D2D30] text-zinc-400 hover:text-white rounded-none transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* THORNE CLINICAL INTEL-CORE MATRIX (Visual Sub-Grid parameters) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 border border-[#2D2D30] bg-[#0A0A0B] p-2.5 md:p-3 text-center" id="thorne-stats-grid">
                    <div className="border-r border-b md:border-b-0 border-[#2D2D30] py-2 md:py-1.5">
                      <span className="text-[8px] font-mono text-[#71717A] tracking-[0.2em] block">INT INDEX</span>
                      <span className="text-base md:text-lg font-mono font-bold tracking-tight text-white">{stats.intVal || "135"}</span>
                    </div>
                    <div className="border-b md:border-b-0 md:border-r border-[#2D2D30] py-2 md:py-1.5">
                      <span className="text-[8px] font-mono text-[#71717A] tracking-[0.2em] block">EMO QUOTIENT</span>
                      <span className="text-base md:text-lg font-mono font-bold tracking-tight text-white">{stats.emoVal || "075"}</span>
                    </div>
                    <div className="border-r border-[#2D2D30] py-2 md:py-1.5">
                      <span className="text-[8px] font-mono text-[#71717A] tracking-[0.2em] block">TRUST VEC</span>
                      <span className="text-base md:text-lg font-mono font-bold tracking-tight text-rose-500">{stats.trustVal || "14"}%</span>
                    </div>
                    <div className="py-2 md:py-1.5">
                      <span className="text-[8px] font-mono text-[#71717A] tracking-[0.2em] block">EGO DEFL</span>
                      <span className="text-base md:text-lg font-mono font-bold tracking-tight text-amber-500">{stats.egoVal || "84"}%</span>
                    </div>
                  </div>

                </div>

                {/* Dossier Terminal Navigation Tabs */}
                <div className="bg-[#0A0A0B] border-b border-[#2D2D30] px-4 flex overflow-x-auto gap-1" id="report-nav-tabs">
                  <button
                    id="tab-btn-clinical"
                    onClick={() => setActiveTab("dossier")}
                    className={`px-4 py-3.5 text-xs font-mono font-medium border-b-2 tracking-wider transition-all uppercase whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      activeTab === "dossier"
                        ? "border-rose-500 text-rose-400 bg-rose-500/5 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Psych Profile</span>
                  </button>
                  <button
                    id="tab-btn-greene"
                    onClick={() => setActiveTab("greene")}
                    className={`px-4 py-3.5 text-xs font-mono font-medium border-b-2 tracking-wider transition-all uppercase whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      activeTab === "greene"
                        ? "border-amber-500 text-amber-400 bg-[#FBBF24]/5 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Greene Power Matrix</span>
                  </button>
                  <button
                    id="tab-btn-vulnerability"
                    onClick={() => setActiveTab("vulnerability")}
                    className={`px-4 py-3.5 text-xs font-mono font-medium border-b-2 tracking-wider transition-all uppercase whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      activeTab === "vulnerability"
                        ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Red Ops Susceptibility</span>
                  </button>
                  <button
                    id="tab-btn-simulation"
                    onClick={() => setActiveTab("simulation")}
                    className={`px-4 py-3.5 text-xs font-mono font-medium border-b-2 tracking-wider transition-all uppercase whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      activeTab === "simulation"
                        ? "border-[#4ADE80] text-[#4ADE80] bg-[#4ADE80]/5 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 animate-pulse" />
                    <span>Defense Simulator</span>
                  </button>
                </div>

                {/* Sub-Pane Dynamic Viewport */}
                <div className="p-4 md:p-6 overflow-y-auto max-h-[600px] space-y-6" id="tab-viewport-body">
                  <AnimatePresence mode="wait">
                    
                    {/* TAB 1: CLINICAL PSYCH DOSSIER */}
                    {activeTab === "dossier" && (
                      <motion.div
                        key="tab-dossier"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6 text-sm"
                        id="clinical-profile-pane"
                      >
                        {/* Executive Summary Summary Box */}
                        <div className="bg-[#121214] border-l-4 border-rose-500 p-5 rounded-none space-y-1 block relative overflow-hidden" id="clinical-summary-box">
                          <div className="absolute right-3 bottom-0 text-[64px] font-serif italic text-rose-500/5 select-none pointer-events-none">"</div>
                          <span className="text-[9px] font-mono uppercase text-rose-400 tracking-[0.2em] font-bold">Psychological Dossier Assessment</span>
                          <p className="italic text-zinc-200 font-serif text-[13px] leading-relaxed">
                            "{report.clinicalDossier.summary}"
                          </p>
                        </div>

                        {/* Cognitive Profile Paragraph */}
                        <div className="space-y-3" id="cognitive-profile-block">
                          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-none bg-rose-500"></span> Clinical Cognitive Portrait
                          </h3>
                          <p className="text-zinc-200 leading-relaxed bg-[#121214] p-5 rounded-none border border-[#2D2D30] text-sm font-sans">
                            {report.clinicalDossier.cognitiveProfile}
                          </p>
                        </div>

                        {/* Motivators & Stressors grid */}
                        <div className="grid md:grid-cols-2 gap-5 animate-fade-in" id="drivers-friction-grid">
                          {/* Motivators */}
                          <div className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-4 shadow-xl" id="motivators-card">
                            <h4 className="text-xs font-mono text-rose-400 uppercase tracking-[0.15em] flex items-center gap-2 border-b border-[#2D2D30] pb-3">
                              <span className="w-1.5 h-1.5 rounded-none bg-rose-500 inline-block"></span> Core Motivators
                            </h4>
                            <ul className="space-y-2.5 text-xs text-zinc-300 font-sans" id="motivators-list">
                              {report.clinicalDossier.coreMotivators.map((m, idx) => (
                                <li key={idx} className="flex gap-2 items-start" id={`motiv-item-${idx}`}>
                                  <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                  <span className="leading-relaxed">{m}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Stressors */}
                          <div className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-4 shadow-xl" id="stressors-card">
                            <h4 className="text-xs font-mono text-amber-400 uppercase tracking-[0.15em] flex items-center gap-2 border-b border-[#2D2D30] pb-3">
                              <span className="w-1.5 h-1.5 rounded-none bg-amber-500 inline-block"></span> Threat Stressors
                            </h4>
                            <ul className="space-y-2.5 text-xs text-zinc-300 font-sans" id="stressors-list">
                              {report.clinicalDossier.stressors.map((s, idx) => (
                                <li key={idx} className="flex gap-2 items-start" id={`stress-item-${idx}`}>
                                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                  <span className="leading-relaxed">{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Ego-Defense Mechanisms */}
                        <div className="space-y-3" id="defenses-block">
                          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-none bg-rose-500"></span> Primary Ego_Defenses
                          </h3>
                          <div className="flex flex-wrap gap-2" id="defenses-tags">
                            {report.clinicalDossier.psychDefenseMechanisms.map((def, idx) => (
                              <span
                                key={idx}
                                id={`def-tag-${idx}`}
                                className="px-3.5 py-2 bg-[#121214] border border-[#2D2D30] text-zinc-200 rounded-none text-xs font-mono font-medium hover:border-[#4E4E52] transition-colors"
                              >
                                {def}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Working Style */}
                        <div className="p-5 bg-[#121214] border border-[#2D2D30] rounded-none space-y-3" id="interpersonal-style-block">
                          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-[0.15em] flex items-center gap-1.5 border-b border-[#2D2D30] pb-3">
                            Collaboration & Leadership Dialectic
                          </h3>
                          <p className="text-zinc-300 leading-relaxed text-xs font-sans">
                            {report.clinicalDossier.interpersonalStyle}
                          </p>
                        </div>

                      </motion.div>
                    )}

                    {/* TAB 2: ROBERT GREENE / MACHIAVELLIAN POWER ANALYSIS */}
                    {activeTab === "greene" && (
                      <motion.div
                        key="tab-greene"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6 text-sm"
                        id="greene-matrix-pane"
                      >
                        {/* Summary Warning */}
                        <div className="bg-[#121214] border border-[#2D2D30] p-5 rounded-none flex items-start gap-4 relative overflow-hidden" id="greene-warning-box">
                          <div className="absolute right-0 bottom-0 top-0 w-1 bg-amber-500" />
                          <div className="p-3 bg-amber-500/10 border border-amber-500/35 text-amber-500 shrink-0">
                            <Award className="w-5 h-5 animate-pulse" id="machiavelli-icon" />
                          </div>
                          <div>
                            <h4 className="text-sm font-serif font-semibold text-white tracking-wide">Robert Greene Strategic Power Blueprint</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed mt-1 font-sans">
                              Analysis of vulnerable positional pivot elements. Adversaries modeling targeted operations leverage these historical guidelines on power dynamics to maneuver around defensive structures.
                            </p>
                          </div>
                        </div>

                        {/* Dominant Laws mapping (High-contrast stark-white cards for Artistic Flair contrast) */}
                        <div className="space-y-4" id="laws-mapping-container">
                          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-none bg-amber-500"></span> Primary Laws of Influence
                          </h3>
                          
                          <div className="grid gap-5" id="laws-grid">
                            {report.greeneAnalysis.dominantRobertGreeneLaws.map((law, idx) => (
                              <div
                                key={idx}
                                id={`law-card-${law.lawNumber}`}
                                className="bg-white text-[#0A0A0B] p-6 rounded-none flex flex-col gap-3 relative overflow-hidden group border border-[#2D2D30] light-contrast-shadow transition-all duration-300"
                              >
                                {/* Giant elegant serif backdrop watermark */}
                                <div className="absolute -right-2 -bottom-6 text-[100px] font-serif italic text-zinc-100 opacity-60 font-black select-none pointer-events-none transition-transform group-hover:scale-105">
                                  {law.lawNumber}
                                </div>
                                <div className="flex items-center gap-3 border-b border-zinc-200 pb-3 mb-1 z-10" id={`law-card-header-${idx}`}>
                                  <span className="w-6 h-6 flex items-center justify-center bg-black text-white font-mono text-[10px] font-bold">
                                    L{law.lawNumber}
                                  </span>
                                  <h4 className="font-serif font-bold text-black text-base tracking-tight">
                                    {law.lawTitle}
                                  </h4>
                                </div>
                                <p className="text-zinc-700 text-xs leading-relaxed z-10 font-sans" id={`law-card-body-${idx}`}>
                                  {law.relevance}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Power Vulnerabilities & Leverage tactics */}
                        <div className="grid md:grid-cols-2 gap-5" id="power-vulnerability-leverage-grid">
                          {/* Strategic Vulnerabilities */}
                          <div className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-4" id="power-vulnerabilities-card">
                            <h4 className="text-xs font-mono text-amber-400 uppercase tracking-[0.15em] flex items-center gap-2 border-b border-[#2D2D30] pb-3">
                              Critical Power Flaws
                            </h4>
                            <ul className="space-y-2.5 text-xs text-zinc-300 font-sans" id="power-vulnerabilities-list">
                              {report.greeneAnalysis.powerVulnerabilities.map((pv, idx) => (
                                <li key={idx} className="flex gap-2 items-start" id={`flaw-item-${idx}`}>
                                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                  <span className="leading-relaxed">{pv}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Tactics */}
                          <div className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-4" id="leverage-tactics-card">
                            <h4 className="text-xs font-mono text-amber-400 uppercase tracking-[0.15em] flex items-center gap-2 border-b border-[#2D2D30] pb-3">
                              Tactical Leverage Methods
                            </h4>
                            <ul className="space-y-2.5 text-xs text-zinc-300 font-sans" id="leverage-tactics-list">
                              {report.greeneAnalysis.leverageTactics.map((lt, idx) => (
                                <li key={idx} className="flex gap-2 items-start" id={`leverage-item-${idx}`}>
                                  <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                  <span className="leading-relaxed">{lt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Realpolitik Assessment Container (New Machiavellian perspective module!) */}
                        {report.greeneAnalysis.realpolitikAssessment && (
                          <div className="space-y-4 pt-4 border-t border-[#2D2D30]" id="realpolitik-assessment-block">
                            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-none bg-amber-500 animate-pulse"></span> Machiavellian Realpolitik Assessment
                            </h3>

                            <div className="grid md:grid-cols-2 gap-5" id="realpolitik-cards-grid">
                              {/* Strategic Maneuvering */}
                              <div className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-2" id="realpolitik-maneuver-card">
                                <div className="flex justify-between items-center border-b border-[#2D2D30] pb-2">
                                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">I. Strategic Maneuvering Capacity</span>
                                  <span className="text-[9px] font-mono text-zinc-500 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20">MANEUVER</span>
                                </div>
                                <p className="text-zinc-300 text-xs leading-relaxed font-sans pt-1">
                                  {report.greeneAnalysis.realpolitikAssessment.strategicManeuvering}
                                </p>
                              </div>

                              {/* Understanding & Use of Power */}
                              <div className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-2" id="realpolitik-power-card">
                                <div className="flex justify-between items-center border-b border-[#2D2D30] pb-2">
                                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">II. Systemic Power Interpretation</span>
                                  <span className="text-[9px] font-mono text-zinc-500 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20">HIERARCHY</span>
                                </div>
                                <p className="text-zinc-300 text-xs leading-relaxed font-sans pt-1">
                                  {report.greeneAnalysis.realpolitikAssessment.understandingAndUseOfPower}
                                </p>
                              </div>

                              {/* Susceptibility to Influence */}
                              <div className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-2" id="realpolitik-influence-card">
                                <div className="flex justify-between items-center border-b border-[#2D2D30] pb-2">
                                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">III. Susceptibility to Outer Influence</span>
                                  <span className="text-[9px] font-mono text-zinc-500 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20">EXPOSED</span>
                                </div>
                                <p className="text-zinc-300 text-xs leading-relaxed font-sans pt-1">
                                  {report.greeneAnalysis.realpolitikAssessment.influenceSusceptibility}
                                </p>
                              </div>

                              {/* Defensive Realpolitik Advice */}
                              <div className="bg-[#121214] border-l-2 border-amber-500 bg-amber-500/5 p-5 space-y-2" id="realpolitik-advice-card">
                                <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold text-amber-400">IV. Realpolitik Defensive Guidelines</span>
                                  <span className="text-[9px] font-mono text-amber-400 font-bold px-2 py-0.5 bg-amber-500/15">MITIGATION</span>
                                </div>
                                <p className="text-amber-100 text-xs leading-relaxed font-serif italic pt-1">
                                  "{report.greeneAnalysis.realpolitikAssessment.powerTacticAdvice}"
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      </motion.div>
                    )}

                    {/* TAB 3: RED OPS SUSCEPTIBILITY & COGNITIVE SECURITY VECTORS */}
                    {activeTab === "vulnerability" && (
                      <motion.div
                        key="tab-vulnerability"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6 text-sm"
                        id="vulnerability-pane"
                      >
                        {/* SUSCEPTIBILITY METERS */}
                        <div className="space-y-4" id="vectors-meters-block">
                          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-none bg-[#FBBF24] animate-pulse"></span> Human Attack Surface Mapping (Susceptibility Meters)
                          </h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4" id="meters-bento-grid">
                            {report.redOpsAssessment.susceptibilityMeters.map((meter, idx) => {
                              // Dynamic severity styling
                              const isHigh = meter.score >= 70;
                              const isMedium = meter.score >= 40 && meter.score < 70;
                              const barColorClass = isHigh 
                                ? "bg-rose-500" 
                                : isMedium 
                                  ? "bg-[#FBBF24]" 
                                  : "bg-[#4ADE80]";
                              const textColorClass = isHigh
                                ? "text-rose-500"
                                : isMedium
                                  ? "text-[#FBBF24]"
                                  : "text-[#4ADE80]";

                              return (
                                <div
                                  key={idx}
                                  id={`meter-bento-${idx}`}
                                  className="bg-[#121214] border border-[#2D2D30] rounded-none p-4 md:p-5 flex flex-col justify-between hover:border-[#4E4E52] transition-colors"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-1.5" id={`meter-header-${idx}`}>
                                      <span className="font-mono text-[11px] font-semibold text-zinc-200 truncate tracking-wide">{meter.vectorName}</span>
                                      <span className={`font-mono text-xs font-bold ${textColorClass}`}>{meter.score}%</span>
                                    </div>
                                    <div className="w-full bg-[#0A0A0B] rounded-none h-1 mb-2.5" id={`meter-track-${idx}`}>
                                      <div
                                        className={`h-1 rounded-none ${barColorClass}`}
                                        style={{ width: `${meter.score}%` }}
                                        id={`meter-fill-${idx}`}
                                      />
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans pt-1 border-t border-[#0A0A0B]/50 mt-1" id={`meter-body-${idx}`}>
                                    {meter.explanation}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* PHYSICAL/COGNITIVE EXPOSURE SCENARIOS */}
                        <div className="space-y-4" id="exposure-scenarios-block">
                          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-none bg-indigo-400"></span> Targeted Cognitive Vector Modeling
                          </h3>

                          <div className="space-y-4" id="scr-card-container">
                            {report.redOpsAssessment.socialEngineeringVectors.map((vec, idx) => (
                              <div
                                key={idx}
                                id={`vector-card-${idx}`}
                                className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-4 font-sans text-xs"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D2D30] pb-3" id={`scr-card-header-${idx}`}>
                                  <div>
                                    <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest block font-bold">VECTOR MODEL // {idx + 1}</span>
                                    <h4 className="text-base font-serif font-bold text-white mt-0.5">{vec.scenarioName}</h4>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5" id={`scr-triggers-${idx}`}>
                                    {vec.psychologicalTriggers.map((trig, tIdx) => (
                                      <span
                                        key={tIdx}
                                        id={`trigger-tag-${idx}-${tIdx}`}
                                        className="px-2.5 py-1 bg-[#0A0A0B] border border-[#2D2D30] rounded-none font-mono text-[9px] text-zinc-400 uppercase tracking-wider"
                                      >
                                        {trig}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-5" id={`scr-grid-body-${idx}`}>
                                  <div className="space-y-1.5" id={`scr-reaction-part-${idx}`}>
                                    <span className="font-mono text-[9px] text-[#71717A] tracking-wider uppercase block">Predicted Subject Reaction Behavior</span>
                                    <p className="text-zinc-300 leading-relaxed bg-[#0A0A0B] p-3.5 rounded-none border border-[#2D2D30] font-sans">
                                      {vec.simulationReaction}
                                    </p>
                                  </div>
                                  <div className="space-y-1.5" id={`scr-mitigation-part-${idx}`}>
                                    <span className="font-mono text-[9px] text-[#71717A] tracking-wider uppercase block">Defensive Mitigation & Security Controls Blueprint</span>
                                    <p className="text-[#4ADE80] bg-[#4ADE80]/5 leading-relaxed bg-[#0A0A0B] border border-[#2D2D30] p-3.5 rounded-none font-sans">
                                      {vec.defensiveMitigation}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* New Dedicated Social Engineering Tactics Module */}
                        {report.redOpsAssessment.socialEngineeringVulnerabilities && (
                          <div className="space-y-4 pt-4 border-t border-[#2D2D30]" id="se-vulnerabilities-block">
                            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-none bg-indigo-500"></span> Tactical Social Engineering Vector Mapping
                            </h3>

                            <div className="grid gap-5" id="se-vulnerabilities-list-grid">
                              {report.redOpsAssessment.socialEngineeringVulnerabilities.map((sev, idx) => {
                                const tLower = sev.tacticType.toLowerCase();
                                const isPhishing = tLower.includes("phish");
                                const isPretexting = tLower.includes("pretext");
                                const isBaiting = tLower.includes("bait");

                                const badgeColorClass = isPhishing
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : isPretexting
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : isBaiting
                                      ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                                      : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";

                                return (
                                  <div
                                    key={idx}
                                    id={`se-vuln-${idx}`}
                                    className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-4"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D2D30] pb-3" id={`se-header-${idx}`}>
                                      <div>
                                        <span className={`px-2.5 py-0.5 rounded-none text-[9px] font-mono uppercase border font-bold tracking-widest ${badgeColorClass}`}>
                                          {sev.tacticType}
                                        </span>
                                        <h4 className="text-sm font-serif font-bold text-white mt-1.5">
                                          {sev.identifiedVulnerability}
                                        </h4>
                                      </div>
                                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-[9px]">TACTIC VECTOR</span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-5" id={`se-body-${idx}`}>
                                      {/* Specific Attack Vector detail */}
                                      <div className="space-y-1.5" id={`se-vector-${idx}`}>
                                        <span className="font-mono text-[9px] text-[#71717A] tracking-wider uppercase block">Simulated Adverse Attack Vector Playout</span>
                                        <p className="text-zinc-300 leading-relaxed bg-[#0A0A0B] p-4 rounded-none border border-[#2D2D30] font-sans text-xs">
                                          {sev.specificAttackVector}
                                        </p>
                                      </div>

                                      {/* Countermeasures checklist */}
                                      <div className="space-y-1.5" id={`se-countermeasures-${idx}`}>
                                        <span className="font-mono text-[9px] text-[#71717A] tracking-wider uppercase block">Countermeasures & Defensive Controls Blueprint</span>
                                        <div className="bg-[#0A0A0B] border border-[#2D2D30] p-4 space-y-3 font-sans text-xs">
                                          {sev.countermeasuresAndDefenses.map((cd, cdIdx) => (
                                            <div key={cdIdx} className="flex gap-2.5 items-start text-zinc-300" id={`se-cd-${idx}-${cdIdx}`}>
                                              <span className="w-4 h-4 rounded-none bg-[#4ADE80]/15 border border-[#4ADE80]/30 text-[#4ADE80] flex items-center justify-center shrink-0 mt-0.5" id={`cd-check-${cdIdx}`}>
                                                <Check className="w-2.5 h-2.5 text-[#4ADE80]" />
                                              </span>
                                              <span className="leading-relaxed">{cd}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </motion.div>
                    )}

                    {/* TAB 4: DEFENSE TRAINING TABLETOP SIMULATOR */}
                    {activeTab === "simulation" && (
                      <motion.div
                        key="tab-simulation"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6 text-sm"
                        id="tabletop-simulation-pane"
                      >
                        {/* Scenario Prompt Frame */}
                        <div className="bg-[#121214] border border-[#2D2D30] rounded-none overflow-hidden shadow-lg p-5 space-y-4" id="sim-scenario-box">
                          <div>
                            <span className="text-[9px] font-mono text-[#4ADE80] uppercase tracking-[0.2em] block font-bold">Interactive Awareness Simulation Session</span>
                            <h3 className="text-lg font-serif font-bold text-white mt-1">{report.interactiveSimulation.scenarioTitle}</h3>
                          </div>

                          <div className="bg-[#0A0A0B] p-4 rounded-none text-xs leading-relaxed text-zinc-300 border border-[#2D2D30] font-sans" id="sim-setting">
                            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Interactive Setting</span>
                            {report.interactiveSimulation.settingDescription}
                          </div>

                          <div className="relative bg-[#0a0a0b] border border-[#2D2D30] p-5 rounded-none text-center" id="npc-dialectic">
                            <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-none font-mono text-[9px] text-rose-400 tracking-widest uppercase">Target Vector Outreach</span>
                            <p className="italic text-zinc-200 font-serif text-[14px] leading-relaxed pt-2">
                              "{report.interactiveSimulation.npcDialogue}"
                            </p>
                          </div>
                        </div>

                        {/* Choice Deck */}
                        <div className="space-y-3" id="sim-options-deck">
                          <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Select Defensive Response or Action Strategy</h4>
                          
                          <div className="grid gap-3" id="sim-options-grid">
                            {report.interactiveSimulation.options.map((option, idx) => {
                              const isSelected = selectedSimOptionIndex === idx;

                              return (
                                <button
                                  key={idx}
                                  id={`sim-option-btn-${idx}`}
                                  onClick={() => setSelectedSimOptionIndex(idx)}
                                  className={`w-full text-left p-4 rounded-none border font-sans text-xs transition-all relative flex justify-between items-center gap-4 cursor-pointer ${
                                    isSelected
                                      ? "bg-white border-white text-black shadow-lg"
                                      : "bg-[#121214] border-[#2D2D30] text-zinc-300 hover:text-white hover:border-[#4E4E52]"
                                  }`}
                                >
                                  <div className="flex gap-3 items-center">
                                    <span className={`w-5 h-5 shrink-0 rounded-none flex items-center justify-center font-mono text-[10px] font-bold ${
                                      isSelected ? "bg-black text-white" : "bg-[#0A0A0B] text-zinc-500"
                                    }`}>
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="font-medium leading-relaxed">{option.label}</span>
                                  </div>
                                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-black translate-x-0.5" : "text-zinc-600"}`} />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Option Results / Playback Playout */}
                        <AnimatePresence>
                          {selectedSimOptionIndex !== null && (
                            <motion.div
                              key="simulation-result"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-[#121214] border border-[#2D2D30] rounded-none p-5 space-y-4 overflow-hidden"
                              id="simulation-resolved-console"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D2D30] pb-3" id="sim-result-header">
                                <div className="flex items-center gap-2.5">
                                  {report.interactiveSimulation.options[selectedSimOptionIndex].success ? (
                                    <>
                                      <CheckCircle2 className="w-5 h-5 text-[#4ADE80] shrink-0" id="sim-success-icon" />
                                      <div>
                                        <span className="text-[10px] font-mono text-[#4ADE80] block uppercase font-bold tracking-widest">DEFENSIVE SUCCESS REINFORCED</span>
                                        <span className="text-zinc-400 text-[11px] font-medium font-sans">Cognitive Threat Avoided</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" id="sim-fail-icon" />
                                      <div>
                                        <span className="text-[10px] font-mono text-rose-500 block uppercase font-bold tracking-widest">COGNITIVE COMPROMISE EXPOSED</span>
                                        <span className="text-zinc-400 text-[11px] font-medium font-sans">Subject Trapped by Manipulation Vector</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <span className={`px-2.5 py-1 text-[9px] font-mono rounded-none font-bold uppercase ${
                                  report.interactiveSimulation.options[selectedSimOptionIndex].success
                                    ? "bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/20"
                                    : "bg-rose-500/15 text-rose-500 border border-rose-500/20"
                                }`}>
                                  {report.interactiveSimulation.options[selectedSimOptionIndex].success ? "SECURE RATIO" : "VULNERABLE"}
                                </span>
                              </div>

                              <div className="space-y-1.5" id="sim-results-explanation">
                                <span className="font-mono text-[9px] text-zinc-500 uppercase block tracking-wider">Dynamic Result Trajectory</span>
                                <p className="text-zinc-200 leading-relaxed text-xs font-sans">
                                  {report.interactiveSimulation.options[selectedSimOptionIndex].resultDescription}
                                </p>
                              </div>

                              <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-none space-y-1 block relative" id="sim-takeaway">
                                <span className="font-mono text-[9px] text-[#4ADE80] uppercase tracking-[0.2em] block font-bold">CONSECUTIVE LEARNING METRIC</span>
                                <p className="text-[11px] leading-relaxed text-zinc-400 font-sans">
                                  Use this test sequence outcome for team modeling. Personalities resembling {name} benefit less from static policy documents and more from targeted tabletop exercises, secure escalation paths, and role-play scenario tests verifying their resistance to dynamic pride and urgency maneuvers.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

              </div>
            )}

          </div>
        </section>

      </main>

      {/* Footer information */}
      <footer className="border-t border-[#2D2D30] bg-[#0A0A0B] mt-16 py-8 text-center text-xs text-[#71717A] font-mono" id="app-footer">
        <p className="tracking-widest uppercase">© 2026 PSYCHEOPS BEHAVIORAL DEFENSE AND HUMAN AUDITING LABS. FOR COMPLIANCE AND THREAT MITIGATION TRAINING SIMULATION USE ONLY.</p>
      </footer>
    </div>
  );
}
