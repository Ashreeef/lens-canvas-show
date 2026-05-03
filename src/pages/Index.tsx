import { useEffect, useRef, useState, useCallback } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "../styles/presentation.css";

const SLIDES = [
  "Title",
  "Why it matters",
  "Constraints",
  "System architecture",
  "Shared contract",
  "Face mesh",
  "EAR + calibration",
  "MAR + PERCLOS",
  "Gaze fusion",
  "Seatbelt",
  "Phone",
  "Smoking",
  "DL fatigue",
  "Fatigue score",
  "Alert engine",
  "Config discipline",
  "Runtime & demo",
  "Performance",
  "Technical decisions",
  "Scope & roadmap",
  "Closing",
];

const TOTAL = SLIDES.length;

const DEMO_VIDEOS = {
  fatigue: { title: "Fatigue module demo", src: "/fatigue_video.mp4" },
  seatbelt: { title: "Seatbelt module demo", src: "/seatbelt_video.mp4" },
  phone: { title: "Phone module demo", src: "/phone_vid.mp4" },
  smoking: { title: "Smoking module demo", src: "/smoking_video.mp4" },
} as const;

type DemoKey = keyof typeof DEMO_VIDEOS;

function Latex({ children, display = false }: { children: string; display?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      katex.render(children, ref.current, { displayMode: display, throwOnError: false });
    }
  }, [children, display]);
  return <span ref={ref} />;
}

export default function Index() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activeDemoKey, setActiveDemoKey] = useState<DemoKey>("fatigue");
  const [demoVideoState, setDemoVideoState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [demoVideoReason, setDemoVideoReason] = useState("");
  const demoVideoRef = useRef<HTMLVideoElement>(null);

  const openDemo = useCallback((demoKey: DemoKey) => {
    setActiveDemoKey(demoKey);
    setDemoModalOpen(true);
  }, []);

  const closeDemo = useCallback(() => setDemoModalOpen(false), []);

  const activeDemo = DEMO_VIDEOS[activeDemoKey];

  const scrollTo = useCallback((i: number) => {
    const el = containerRef.current;
    if (!el) return;
    const target = el.children[i] as HTMLElement;
    if (target) target.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const st = el.scrollTop;
      const sh = el.scrollHeight - el.clientHeight;
      setProgress(sh > 0 ? (st / sh) * 100 : 0);
      const idx = Math.round(st / el.clientHeight);
      setCurrent(Math.min(idx, TOTAL - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (demoModalOpen) {
        if (e.key === "Escape") { e.preventDefault(); closeDemo(); }
        return;
      }
      if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        scrollTo(Math.min(current + 1, TOTAL - 1));
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollTo(Math.max(current - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, scrollTo, demoModalOpen, closeDemo]);

  useEffect(() => {
    const els = document.querySelectorAll(".slide-inner");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
        else e.target.classList.remove("visible");
      }),
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!demoModalOpen) {
      setDemoVideoState("idle");
      setDemoVideoReason("");
      return;
    }
    const video = demoVideoRef.current;
    if (!video) return;
    setDemoVideoState("loading");
    setDemoVideoReason("");
    video.currentTime = 0;
    video.play().catch(() => {
      setDemoVideoState("error");
      setDemoVideoReason("The browser blocked playback or cannot decode this video format.");
    });
    const onTimeUpdate = () => { if (video.currentTime >= 50) video.pause(); };
    const onLoadedData = () => { setDemoVideoState("ready"); setDemoVideoReason(""); };
    const onError = () => {
      setDemoVideoState("error");
      setDemoVideoReason("This demo video cannot be played inline in this browser (codec unsupported or file missing).");
    };
    const loadingTimeout = window.setTimeout(() => {
      if (video.readyState < 2) {
        setDemoVideoState("error");
        setDemoVideoReason("Video could not load for inline playback. Try opening it directly or re-exporting to H.264 (avc1).");
      }
    }, 2500);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("error", onError);
    return () => {
      window.clearTimeout(loadingTimeout);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", onError);
      video.pause();
      video.currentTime = 0;
    };
  }, [demoModalOpen, activeDemoKey]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="slide-counter">{pad(current + 1)} / {pad(TOTAL)}</div>
      <div className="side-dots">
        {SLIDES.map((t, i) => (
          <button key={i} className={`side-dot ${i === current ? "active" : ""}`} data-title={t} onClick={() => scrollTo(i)} />
        ))}
      </div>

      <div className="pres-container" ref={containerRef}>

        {/* ===== 1 — Title ===== */}
        <section className="slide">
          <div className="slide-bg-accent" style={{ top: -100, right: -100 }} />
          <div className="slide-bg-accent" style={{ bottom: -150, left: -150 }} />
          <div className="slide-inner" style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 36, marginBottom: 20 }}>
              <img src="/ensia_logo.png" alt="ENSIA" style={{ height: 64, objectFit: "contain" }} />
              <div style={{ width: 1, height: 50, background: "#ddd" }} />
              <img src="/qareeb_logo.ico" alt="Qareeb" style={{ height: 64, objectFit: "contain" }} />
            </div>
            <p className="section-label" style={{ justifyContent: "center" }}>ENSIA × QAREEB · FINAL DEFENSE · 2025–2026</p>
            <h1 style={{ marginBottom: 8, letterSpacing: "-0.03em" }}>
              <span style={{ color: "hsl(var(--primary))" }}>Q-Vision</span>
            </h1>
            <h2 style={{ color: "hsl(var(--text-primary))", fontWeight: 400, fontSize: "clamp(20px, 2.6vw, 30px)", marginTop: 0 }}>
              Real-time Driver Fatigue and Safety Monitoring
            </h2>
            <p style={{ color: "#666", fontSize: 14, marginTop: 8, fontWeight: 500 }}>
              Edge-AI in-cabin monitoring on Raspberry Pi 4 — fully offline
            </p>
            <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
              Fatigue · Gaze · Seatbelt · Phone · Smoking — a single 15 FPS pipeline
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, padding: "8px 14px", background: "#fff7ed", border: "1px solid #ffd6a8", borderRadius: 100, fontSize: 12, color: "#7c3a05" }}>
              <span style={{ fontSize: 14 }}>🛡</span>
              In observance of the <strong style={{ margin: "0 4px" }}>World Day for Safety and Health at Work</strong> — 28 April 2026
            </div>
            <div className="dark-strip">
              <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap", marginBottom: 10 }}>
                  {[
                    "Berbaoui Ashref",
                    "Benelhadj Djelloul Imen",
                    "Gasmi Yassine",
                    "Khentache Hamza",
                  ].map((n) => (
                    <span key={n} style={{ fontSize: 15, fontWeight: 500, letterSpacing: "0.03em" }}>{n}</span>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                  Supervised by <span style={{ color: "#bbb", fontWeight: 500 }}>Mounir Ouadi</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 2 — Why it matters ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">PROBLEM</p>
            <h2>Driver fatigue is a top-3 cause of fatal road crashes</h2>
            <div className="two-col" style={{ display: "flex", gap: 36, alignItems: "stretch", marginTop: 18 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: "clamp(56px, 7vw, 96px)", fontWeight: 200, color: "hsl(var(--primary))", lineHeight: 1, letterSpacing: "-0.03em" }}>~20%</div>
                <p style={{ marginTop: 8, fontSize: 15, color: "#666" }}>of fatal crashes worldwide involve driver fatigue or distraction (WHO, 2023).</p>
                <div style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 200, color: "hsl(var(--primary))", lineHeight: 1, marginTop: 36, letterSpacing: "-0.03em" }}>0 / 24h</div>
                <p style={{ marginTop: 8, fontSize: 15, color: "#666" }}>internet connectivity at typical Qareeb sites — the system must run fully offline.</p>
              </div>
              <div style={{ flex: 1.1 }}>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
                  Existing in-cabin monitoring fails the field requirement on at least one of these axes:
                </p>
                {[
                  ["Cloud-dependent", "Privacy concerns; useless without connectivity at remote sites."],
                  ["GPU-dependent", "Cost and power don't fit fleet vehicles. No automotive-grade GPU at this price point."],
                  ["Single-modality", "Only EAR or only YOLO — high false-positive rate; drivers stop trusting the alerts."],
                  ["AGPL-licensed", "Commercial blocker for Qareeb; YOLOv5 family is excluded."],
                ].map(([t, d]) => (
                  <div key={t} style={{ display: "flex", gap: 12, padding: "10px 14px", marginBottom: 8, background: "hsl(var(--surface))", borderRadius: 8, borderLeft: "3px solid hsl(var(--primary))" }}>
                    <strong style={{ fontSize: 13, minWidth: 150 }}>{t}</strong>
                    <span style={{ color: "#666", fontSize: 13 }}>{d}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, padding: "12px 16px", background: "#fff5f5", borderRadius: 10, border: "1px solid #ffd6d6", fontSize: 13, color: "#8b1e1e" }}>
                  <strong>Qareeb's brief:</strong> detect fatigue <em>and</em> safety compliance (seatbelt, phone, smoking) on cheap edge hardware that ships with each commercial vehicle.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3 — Constraints ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">DESIGN CONSTRAINTS</p>
            <h2>Why edge ADAS is harder than cloud ADAS</h2>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 16 }}>
              <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { tag: "Hardware", title: "Raspberry Pi 4, CPU only", body: "4-core ARM, no GPU, no NPU. ≥ 15 FPS end-to-end is the contract — anything less stops being real-time." },
                  { tag: "Sensor", title: "Single fixed RGB camera", body: "640×480 @ 15 fps, mounted in-cabin. Visible-light only (IR camera ordered, not yet arrived)." },
                  { tag: "Network", title: "Fully offline", body: "No cloud inference, no telemetry uplink. Models loaded from local .task / .pt / .onnx files." },
                  { tag: "Memory", title: "Threading, never multiprocessing", body: "RPi RAM is constrained. The GIL is a non-issue — every blocking call is I/O-bound inference, which releases it." },
                  { tag: "License", title: "Apache 2.0 only", body: "YOLOv8 / YOLOv10 ship under Apache 2.0. YOLOv5 (AGPL-3.0) is excluded from the production build path." },
                ].map((c) => (
                  <div key={c.title} className="pres-card" style={{ padding: "12px 16px" }}>
                    <span className="tag tag-blue" style={{ marginBottom: 6 }}>{c.tag}</span>
                    <h3 style={{ fontSize: 15, margin: "6px 0 4px" }}>{c.title}</h3>
                    <p style={{ margin: 0, fontSize: 12, color: "#666" }}>{c.body}</p>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(var(--primary))", margin: "0 0 8px", fontWeight: 600 }}>Edge unit</p>
                <h3 style={{ margin: "0 0 10px" }}>Raspberry Pi 4</h3>
                <RpiBoardVisual />
                <p style={{ fontSize: 12, color: "#777", marginTop: 12 }}>
                  Same hardware deployed across the fleet. Same model files. Same thresholds (overridable per driver via 10-second calibration).
                </p>
                <div style={{ marginTop: "auto", fontSize: 11, color: "#999", borderTop: "1px dashed #ddd", paddingTop: 10 }}>
                  Budget: <strong>≤ 67 ms / frame</strong> end-to-end to clear 15 FPS.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 4 — System architecture ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">SYSTEM ARCHITECTURE</p>
            <h2>One pipeline, six modules, one frame at a time</h2>
            <ArchitectureDiagram />
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
              <img src="/system_pic.png" alt="System overview diagram" style={{ maxWidth: 360, width: "100%", height: "auto", borderRadius: 10, boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }} />
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 14, fontSize: 11, color: "#777", flexWrap: "wrap", justifyContent: "center" }}>
              <span>● Solid arrow = synchronous, main thread</span>
              <span>┄ Dashed arrow = async daemon, lock-guarded</span>
              <span>◯ All modules read &amp; mutate a shared <code>result_dict</code></span>
            </div>
          </div>
        </section>

        {/* ===== 5 — Shared contract ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">DESIGN DISCIPLINE</p>
            <h2>The <code>result_dict</code> contract</h2>
            <div className="two-col" style={{ display: "flex", gap: 32, marginTop: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1.05 }}>
                <p style={{ fontSize: 14, color: "#555" }}>
                  Every per-frame computation reads, mutates, and returns the same dictionary. There is no message bus,
                  no observer pattern, no event queue. The dict <em>is</em> the frame.
                </p>
                <CodeBlock>{`# Module 1 produces:
result_dict["face"] = {
    "landmarks": np.ndarray(478, 3),
    "transform_matrix": np.ndarray(4, 4),
    "head_pose": {"yaw": 4.2, "pitch": -1.7, "roll": 0.3},
    "valid": True,
}

# Module 2 reads "face", writes:
result_dict["fatigue"] = {
    "ear": 0.31, "ear_baseline": 0.34,
    "mar": 0.18, "perclos": 0.07,
    "alerts": ["Drowsiness (EAR)"],
}

# Module 6 reads everything, writes:
result_dict["fatigue_score"] = 0.62   # 0..1
result_dict["fatigue_band"]  = "moderate"
result_dict["alerts"]        = [...]  # ranked, deduped`}</CodeBlock>
              </div>
              <div style={{ flex: 0.95, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Why one dict", "Inference is sequential per frame anyway. A shared mutable object replaces 20 dataclasses and 200 lines of plumbing."],
                  ["Why thresholds in YAML", "Re-tuning for a new driver pool is a one-file change, not a rebuild. No magic numbers in code — ever."],
                  ["Why landmark indices in one module", "478 landmarks have non-obvious meanings. Centralizing the lookup table prevents the same EAR bug from being re-introduced in three files."],
                  ["Why threading not multiprocessing", "Inference releases the GIL; multiprocessing would 4× the model RAM footprint, which RPi 4 cannot afford."],
                ].map(([t, d]) => (
                  <div key={t} style={{ borderLeft: "2px solid hsl(var(--primary))", paddingLeft: 14 }}>
                    <strong style={{ fontSize: 13 }}>{t}</strong>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666" }}>{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== 6 — Module 1 Face Mesh ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 1 · FACE MESH</p>
            <h2>478 landmarks, free 4×4 head-pose matrix, EMA-stabilized</h2>
            <div className="two-col" style={{ display: "flex", gap: 36, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Library — MediaPipe Tasks API</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Not the legacy <code>mp.solutions.face_mesh</code>. The Tasks API loads from a local <code>.task</code> file
                    (offline by construction) and exposes the <strong>facial transformation matrix</strong> — a free 4×4 head-pose proxy.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Head pose — solvePnP from 6 landmarks</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Nose, chin, both eye outer corners, both mouth corners. Falls back to MediaPipe's transformation
                    matrix when <code>|yaw| &gt; 90°</code> or solvePnP fails to converge.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>LandmarkStabilizer — EMA, α = 0.4</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Resets after 1 second of no detected face — prevents stale landmarks bleeding across re-acquisitions.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px" }}>
                  <strong style={{ fontSize: 13 }}>Validity gate</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    <code>|yaw| ≤ 60°</code> and <code>|pitch| ≤ 40°</code> — outside this, every downstream module sees <code>valid=False</code> and skips.
                    Camera-mount offsets are subtracted <em>before</em> the check (configurable per vehicle).
                  </p>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{ width: "100%", background: "#fff", borderRadius: 12, border: "1px solid hsl(var(--border))", padding: 12 }}>
                  <img src="/face_mesh_overview.png" alt="MediaPipe face mesh — 478 landmarks" style={{ width: "100%", maxHeight: 280, objectFit: "contain", borderRadius: 8 }} />
                  <p style={{ fontSize: 11, color: "#888", textAlign: "center", marginTop: 8 }}>478 landmarks per frame · 5 iris points / eye · 3-D normalized coordinates</p>
                </div>
                <div style={{ width: "100%", background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#555" }}>
                  <strong>Why this stack:</strong> offline-capable, free transformation matrix, actively maintained, Apache 2.0.
                  No PyTorch dependency on the inference path — only ONNX Runtime + MediaPipe.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 7 — EAR + calibration ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 2 · FATIGUE — EAR</p>
            <h2>Eye Aspect Ratio, calibrated per driver</h2>
            <div className="two-col" style={{ display: "flex", gap: 36, alignItems: "flex-start", marginTop: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid hsl(var(--border))", padding: 10, marginBottom: 10 }}>
                  <img src="/ear.png" alt="EAR — open eye vs closed eye, six landmarks" style={{ width: "100%", maxHeight: 170, objectFit: "contain", display: "block" }} />
                </div>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{EAR} = \frac{\|P_2 - P_6\| + \|P_3 - P_5\|}{2 \cdot \|P_1 - P_4\|}`}</Latex>
                </div>
                <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>
                  Right eye <code>[33, 160, 158, 133, 153, 144]</code> · Left eye <code>[362, 385, 387, 263, 373, 380]</code>.
                  Scale-invariant ratio · 10-frame rolling mean · per-eye, then averaged.
                </p>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10, background: "#f0fdf4", borderColor: "#86efac" }}>
                  <strong style={{ fontSize: 13, color: "#15803d" }}>EARCalibrator — 10 s warmup</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#365314" }}>
                    Collects open-eye samples, rejects outliers outside [0.10, 0.65], computes baseline.
                    <br />
                    <code>alert_threshold = baseline × 0.75</code>
                    <br />
                    <code>perclos_threshold = baseline × 0.27</code>
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "#365314", fontStyle: "italic" }}>
                    Why: anatomy varies by ~30% across drivers. Universal thresholds either miss tired drivers with naturally narrow eyes or false-fire on wide-eyed drivers.
                  </p>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16 }}>Two EAR-driven alerts</h3>
                <div className="threshold-row" style={{ borderColor: "#e65100" }}>
                  <span className="tag tag-orange">Drowsiness (EAR)</span>
                  <span style={{ fontSize: 12 }}>EAR &lt; alert_threshold for <strong>12 frames</strong> ≈ 800 ms</span>
                </div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}>
                  <span className="tag tag-red">Fatigue (EAR Trend)</span>
                  <span style={{ fontSize: 12 }}>30-frame buffer · first-half mean − second-half mean &gt; <strong>0.06</strong></span>
                </div>
                <div style={{ background: "#e8f4fd", border: "1px solid #bbdefb", borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#1565c0" }}>
                  <strong>Why 12 frames @ 15 FPS = 800 ms?</strong> Longer than any normal blink (≤ 400 ms). Below this, blinks would false-fire.
                </div>
                <div style={{ background: "#fff7ed", border: "1px solid #ffd6a8", borderRadius: 10, padding: "10px 14px", marginTop: 10, fontSize: 12, color: "#7c3a05" }}>
                  <strong>One-shot trend alert.</strong> "Fatigue (EAR Trend)" fires once, then re-arms only after recovery — prevents the trend signal from spamming the driver.
                </div>
                <div style={{ background: "hsl(var(--surface))", borderRadius: 10, padding: "10px 14px", marginTop: 10, fontSize: 12, color: "#555", borderLeft: "3px solid hsl(var(--primary))" }}>
                  <strong>In Module 6:</strong> when the global fatigue band drives, these sub-alerts are suppressed — the system speaks with one voice.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 8 — MAR + PERCLOS ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 2 · FATIGUE — MAR &amp; PERCLOS</p>
            <h2>Yawning + percentage-of-eye-closure</h2>
            <div className="two-col" style={{ display: "flex", gap: 32, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <h3>MAR — Mouth Aspect Ratio</h3>
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid hsl(var(--border))", padding: 10, marginBottom: 10 }}>
                  <img src="/mar.jpg" alt="MAR — closed mouth vs open mouth landmarks" style={{ width: "100%", maxHeight: 150, objectFit: "contain", display: "block" }} />
                </div>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{MAR} = \frac{\|\text{top} - \text{bottom}\|}{\|\text{left} - \text{right}\|}`}</Latex>
                </div>
                <p style={{ fontSize: 12, color: "#666" }}>
                  Indices <strong>13</strong> (upper-lip center), <strong>14</strong> (lower-lip center), <strong>78</strong> (left corner), <strong>308</strong> (right corner).
                </p>
                <div style={{ background: "#e8f4fd", border: "1px solid #bbdefb", borderRadius: 10, padding: "10px 14px", marginTop: 8, fontSize: 12, color: "#1565c0" }}>
                  <strong>Why centers (13/14) vs 82/87/312/317?</strong> 13/14 are the extreme vertical points and move ~2× as much during a yawn — cleaner signal, less noise.
                </div>
                <div className="threshold-row" style={{ borderColor: "#e65100", marginTop: 10 }}>
                  <span className="tag tag-orange">Yawn alert</span>
                  <span style={{ fontSize: 12 }}>MAR &gt; <strong>0.55</strong> sustained for <strong>2.5 s</strong> (was 2.0 — tightened against speech)</span>
                </div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}>
                  <span className="tag tag-red">Yawn frequency</span>
                  <span style={{ fontSize: 12 }}><strong>3+</strong> confirmed yawns in rolling <strong>5-minute</strong> window</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3>PERCLOS — Percentage of Eye Closure</h3>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{PERCLOS} = \frac{N_{\text{closed}}}{N_{\text{window}}} \quad \text{window} = 60\,\text{s} \times \text{fps}`}</Latex>
                </div>
                <PerclosBar />
                <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                  900 frames @ 15 FPS · returns <code>None</code> until buffer fills (the overlay shows "buffering…" for the first 60 s).
                </p>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))", marginTop: 8 }}>
                  <span className="tag tag-red">Alert</span>
                  <span style={{ fontSize: 12 }}>PERCLOS &gt; <strong>15%</strong> sustained closure</span>
                </div>
                <div style={{ background: "#fff7ed", border: "1px solid #ffd6a8", borderRadius: 10, padding: "10px 14px", marginTop: 10, fontSize: 12, color: "#7c3a05" }}>
                  <strong>Why 60 seconds?</strong> Industry convention since FHWA validated PERCLOS as the gold-standard drowsiness metric in the 1990s. A single blink doesn't move the needle; sustained microsleep does.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 9 — Gaze fusion ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 3 · GAZE</p>
            <h2>Two-tier fusion: head pose primary, iris fallback</h2>
            <div className="two-col" style={{ display: "flex", gap: 32, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1.1 }}>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>1. Head-pose primary (always available)</strong>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, marginTop: 6, padding: "8px 10px", background: "hsl(var(--surface))", borderRadius: 6 }}>
                    |yaw| &gt; 20°  → "left" / "right"<br />
                    pitch  &gt; 15°  → "down"<br />
                    pitch  &lt; -10° → "up"<br />
                    otherwise     → fall through to iris
                  </div>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>2. Iris deviation (head near-forward only)</strong>
                  <div className="formula-block" style={{ margin: "6px 0 0", padding: "10px 14px" }}>
                    <Latex display>{String.raw`\Delta h = h - h_{\text{neutral}},\ \Delta v = v - v_{\text{neutral}}`}</Latex>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#666" }}>
                    Thresholds: <code>|Δh| &gt; 0.14</code> · <code>Δv &lt; -0.10</code> (up) · <code>Δv &gt; 0.12</code> (down).
                    <br />Neutral = <em>median</em> of calibration samples (robust to outliers).
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#fff7ed", borderColor: "#ffd6a8" }}>
                  <strong style={{ fontSize: 13, color: "#b45309" }}>Calibration gating — the non-trivial part</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#7c3a05" }}>
                    Calibration samples are only collected when <code>|yaw| &lt; 10°</code> AND <code>|pitch| &lt; 8°</code>.
                    Iris ratios distort in 3-D projection at large head angles; if we accepted those, "forward" itself would be biased.
                  </p>
                </div>
              </div>
              <div style={{ flex: 0.9 }}>
                <h3 style={{ fontSize: 16 }}>Stability &amp; alerting</h3>
                <div className="threshold-row" style={{ borderColor: "#e65100" }}>
                  <span className="tag tag-orange">confirm_frames</span>
                  <span style={{ fontSize: 12 }}><strong>8 frames</strong> ≈ 533 ms before <code>stable_direction</code> changes</span>
                </div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}>
                  <span className="tag tag-red">Distraction (Gaze)</span>
                  <span style={{ fontSize: 12 }}>Stable non-forward for <strong>4.0 s</strong> (was 2.5 — passes mirror checks)</span>
                </div>
                <div style={{ marginTop: 12, background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "10px 14px" }}>
                  <strong style={{ fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", color: "#666" }}>Overlay debug indicator</strong>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12 }}>
                    <span><code>[H]</code> head-driven</span>
                    <span><code>[I]</code> iris-driven</span>
                    <span><code>[?]</code> pre-calibration</span>
                  </div>
                </div>
                <div style={{ marginTop: 14, background: "#fff5f5", border: "1px solid #ffd6d6", borderRadius: 10, padding: "10px 14px" }}>
                  <strong style={{ fontSize: 12, color: "#8b1e1e" }}>Bug history (debugging maturity)</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: 11, color: "#8b1e1e", lineHeight: 1.6 }}>
                    <li>Phantom L/R at large yaw → fixed by head-primary</li>
                    <li>Calibration mid-glance → fixed by gating</li>
                    <li>"Up" missing entirely → added <code>Δv &lt; -threshold</code> branch</li>
                    <li>Pre-cal up/down swapped → fixed</li>
                    <li>Mirror-check false fires → confirm 8, alert 4.0 s</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 10 — Seatbelt ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 5 · COMPLIANCE — SEATBELT</p>
            <h2>Three pipelines, runtime-selectable</h2>
            <p style={{ fontSize: 13, color: "#666", marginTop: 4, marginBottom: 14 }}>
              All three run in the <code>ComplianceWorker</code> daemon thread. Async results merged into <code>result_dict</code> each frame; main face-mesh loop never blocks on YOLO.
            </p>
            <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              {[
                {
                  n: "1",
                  flag: "--seatbelt-pipeline 1",
                  title: "YOLOv5s → YOLOv8n",
                  desc: "ROI extraction then patch classification.",
                  caveat: "YOLOv5 is AGPL-3.0 — used for now via torch.hub weights. Will be retrained on YOLOv8 before Qareeb deployment.",
                  rec: false,
                },
                {
                  n: "2",
                  flag: "--seatbelt-pipeline 2 (default)",
                  title: "Pose ROI → YOLOv8n + MobileNetV3 → RANSAC + EMA",
                  desc: "MediaPipe Pose crops the torso, YOLOv8n detects, MobileNetV3 classifies the patch, RANSAC fits a diagonal-strap line as a geometric prior. Fusion: CNN 0.10 / YOLO 0.90.",
                  caveat: "Most robust. Default for the demo and the Qareeb MVP.",
                  rec: true,
                },
                {
                  n: "3",
                  flag: "--seatbelt-pipeline 3",
                  title: "YOLOv8n full-frame + EMA / Majority Vote",
                  desc: "Simplest, fastest, less robust to occlusion. Useful baseline for ablation.",
                  caveat: "",
                  rec: false,
                },
              ].map((p) => (
                <div key={p.n} className="pres-card" style={{ flex: 1, position: "relative", borderColor: p.rec ? "hsl(var(--primary))" : undefined, padding: "14px 16px" }}>
                  {p.rec && <span className="tag tag-red" style={{ position: "absolute", top: 12, right: 12 }}>Default</span>}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 200, color: "hsl(var(--primary))" }}>{p.n}</span>
                    <code style={{ fontSize: 11, color: "#888" }}>{p.flag}</code>
                  </div>
                  <h3 style={{ fontSize: 14, margin: "0 0 6px" }}>{p.title}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#666" }}>{p.desc}</p>
                  {p.caveat && <p style={{ margin: "8px 0 0", fontSize: 11, color: "#999", fontStyle: "italic" }}>{p.caveat}</p>}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <div className="pres-card" style={{ flex: 1, padding: "12px 14px" }}>
                <strong style={{ fontSize: 13 }}>Asymmetric hysteresis</strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                  <strong>24 frames</strong> to confirm ON · <strong>27 frames (~1.8 s)</strong> to confirm OFF.
                  <br />Quick to trust the strap, slow to commit to "off" — flicker is real, strap loss isn't.
                </p>
              </div>
              <div className="pres-card" style={{ flex: 1, padding: "12px 14px" }}>
                <strong style={{ fontSize: 13 }}>Tried and dropped — BiLSTM smoother</strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                  Trained <code>seatbelt_bilstm.pt</code> as a learned alternative to the EMA. Did not improve precision/recall on our held-out clips and added latency. EMA + RANSAC kept.
                </p>
              </div>
              <button
                onClick={() => openDemo("seatbelt")}
                style={{ alignSelf: "stretch", border: "1px solid hsl(var(--border))", background: "#fff", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                ▶ Play seatbelt demo
              </button>
            </div>
          </div>
        </section>

        {/* ===== 11 — Phone ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 5 · COMPLIANCE — PHONE</p>
            <h2>Phone — fine-tuned YOLOv8n with label-robust class matching</h2>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1.05 }}>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Model — YOLOv8n fine-tuned on Roboflow phone dataset</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Apache 2.0 licensed weights and dataset (CC BY 4.0). Trained at 640×640, AdamW, 50 epochs,
                    mosaic + horizontal flip + HSV-V augmentation, patience 20.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Label-robust class matching</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Different datasets label phones inconsistently. We match the predicted class name (lower-cased)
                    against the alias set <code>{"{phone, cell phone, cellphone, mobile}"}</code>. This survives
                    swapping the model for any commercial phone-detector without code changes.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>HIDDEN_CLASSES — false-positive suppressor</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    <code>{"{wheel, steering wheel}"}</code> are <em>actively suppressed</em>. The steering wheel is
                    the single biggest false-positive source from a driver-camera angle (round, dark, often hand-occluded).
                    We drop those boxes before they reach the alert engine.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px" }}>
                  <strong style={{ fontSize: 13 }}>Confidence 0.25 — deliberately lower than seatbelt</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Phones are often partially occluded by the hand or held against the cheek. A higher threshold
                    misses real calls. We compensate downstream with the 8-frame confirm + 20-frame clear hysteresis.
                  </p>
                </div>
              </div>
              <div style={{ flex: 0.95, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#fff5f5", borderColor: "#ffd6d6" }}>
                  <strong style={{ fontSize: 13, color: "#8b1e1e" }}>Why no hybrid (hand-near-ear) for phone?</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8b1e1e" }}>
                    From a driver-facing camera, the ear is frequently occluded by the windshield pillar or the
                    headrest. Hand-to-ear distance becomes a noise channel. YOLO alone outperformed every fused
                    variant we tested.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px" }}>
                  <strong style={{ fontSize: 13 }}>Pipeline placement</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Runs inside <code>ComplianceWorker</code> alongside seatbelt and smoking — async, lock-guarded,
                    merged into <code>result_dict</code> each frame. ~29 ms mean latency · ~41 ms p95 (laptop CPU).
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#f0fdf4", borderColor: "#86efac" }}>
                  <strong style={{ fontSize: 13, color: "#15803d" }}>Why not COCO out-of-the-box?</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#365314" }}>
                    COCO class 67 (cell phone) is trained on lifestyle photos, not in-cabin angles. Recall on driver
                    footage was poor. The Roboflow-fine-tuned model lifts mAP@50 substantially on our test clips.
                  </p>
                </div>
                <button
                  onClick={() => openDemo("phone")}
                  style={{ alignSelf: "stretch", border: "1px solid hsl(var(--border))", background: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  ▶ Play phone demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 12 — Smoking ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 5 · COMPLIANCE — SMOKING</p>
            <h2>Smoking — third-party model + landmark gate</h2>
            <div style={{ background: "#fff7ed", border: "1px solid #ffd6a8", borderRadius: 10, padding: "12px 16px", marginTop: 8, fontSize: 13, color: "#7c3a05" }}>
              <strong>Honest disclosure.</strong> We did not train our own smoking model. In-cabin smoking datasets
              are extremely scarce — annotated, driver-perspective footage at the scale needed for fine-tuning is
              not publicly available, and we lacked the resources to collect and label it. We integrated an
              open-source model instead.
            </div>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1.05 }}>
                <div className="pres-card" style={{ padding: "14px 16px", marginBottom: 10 }}>
                  <span className="tag tag-blue">Upstream model</span>
                  <h3 style={{ fontSize: 14, margin: "8px 0 4px" }}>alihassanml / Smoking-detection-yolo11</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Open-source YOLO11 weights from{" "}
                    <a href="https://github.com/alihassanml/Smoking-detection-yolo11" target="_blank" rel="noreferrer" style={{ color: "hsl(var(--primary))" }}>
                      github.com/alihassanml/Smoking-detection-yolo11
                    </a>.
                    Class label <code>"Smooking"</code> (sic — kept verbatim for compatibility with the upstream weights).
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "14px 16px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>What we added on top</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "#555", lineHeight: 1.7 }}>
                    <li><strong>Branch A — landmark gate:</strong> MediaPipe Hand + Pose, hand-to-mouth distance + elbow-angle bonus + velocity penalty</li>
                    <li><strong>Branch B — detection:</strong> the upstream YOLO11 ONNX</li>
                    <li><strong>Score fusion:</strong> <code>s = 0.10 × landmark + 0.90 × detection</code> — detection-led, landmark-disambiguated</li>
                    <li><strong>Temporal:</strong> 8-frame sliding window · confirm at 5+ · clear below 0.30</li>
                  </ul>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", background: "hsl(var(--surface))" }}>
                  <strong style={{ fontSize: 13 }}>Dual-mode integration</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    When wired into the full pipeline, the smoking module reuses Module 1's face landmarks rather
                    than running its own face detector — saves one full inference per frame.
                  </p>
                </div>
              </div>
              <div style={{ flex: 0.95, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#fff5f5", borderColor: "#ffd6d6" }}>
                  <strong style={{ fontSize: 13, color: "#8b1e1e" }}>Honest limitations</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: 12, color: "#8b1e1e", lineHeight: 1.6 }}>
                    <li>Upstream training data is not driver-specific — generalization to in-cabin angles is unverified</li>
                    <li>Cigarette is a tiny object; recall drops at low resolution</li>
                    <li>Smoke plume class is unreliable in vehicle interiors</li>
                  </ul>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#f0fdf4", borderColor: "#86efac" }}>
                  <strong style={{ fontSize: 13, color: "#15803d" }}>Why this is still a defensible MVP choice</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#365314" }}>
                    The fusion + temporal hysteresis layer is <em>ours</em>, and it works for any binary
                    smoking detector. Swapping the upstream model later (once a real driver dataset exists)
                    is a one-line change in <code>configs/model_paths.yaml</code>.
                  </p>
                </div>
                <button
                  onClick={() => openDemo("smoking")}
                  style={{ alignSelf: "stretch", border: "1px solid hsl(var(--border))", background: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  ▶ Play smoking demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 13 — Module 4 · DL fatigue ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 4 · DEEP-LEARNING FATIGUE (HAMZA)</p>
            <h2>CNN-GRU fatigue — implemented, slightly beats landmarks, hard on RPi 4</h2>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Architecture</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Per-eye CNN encoder (small backbone, ~ MobileNetV2 stem) → 128-dim embedding → GRU temporal head
                    over a sliding window of 16 frames → binary "alert / drowsy" head. Trained on a curated mix
                    of public driver-drowsiness corpora plus our own augmented in-cabin clips.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>What we measured</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    On our held-out clips, CNN-GRU is <strong>close to or slightly better</strong> than the
                    EAR + PERCLOS baseline on F1 — the gain is largest on subjects whose neutral EAR sits at
                    the edges of the population (very wide or very narrow eyes), where geometric thresholds
                    struggle even with calibration.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px" }}>
                  <strong style={{ fontSize: 13 }}>Why it's not in the MVP path</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    The gain is small. Module 2 (EAR/MAR/PERCLOS) is already feeding the FatigueScorer, and the
                    score-level design absorbs the strengths of both signals. Adding CNN-GRU on the main thread
                    is a measurable cost for a marginal accuracy bump.
                  </p>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16 }}>The Raspberry Pi 4 problem</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["Latency", "Per-frame inference of CNN-GRU on RPi 4 CPU is ≈ 90–130 ms — by itself, that already misses the 67 ms / frame budget for 15 FPS."],
                    ["Memory", "Sliding 16-frame buffer × per-eye crops + GRU hidden state pushes RAM tight when MediaPipe + YOLO are also resident."],
                    ["Quantization", "INT8 quantization halves latency on x86 but gives much smaller speedups on the RPi 4 NEON path; FP16 isn't supported on this CPU."],
                    ["Threading", "Cannot move it to the ComplianceWorker — fatigue is a synchronous Module 6 input. Async fatigue would race the score."],
                  ].map(([t, d]) => (
                    <div key={t} style={{ borderLeft: "2px solid hsl(var(--primary))", paddingLeft: 12 }}>
                      <strong style={{ fontSize: 12 }}>{t}</strong>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#666", lineHeight: 1.5 }}>{d}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, background: "#fff7ed", border: "1px solid #ffd6a8", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#7c3a05" }}>
                  <strong>Resolution path (post-MVP).</strong> Distill the CNN-GRU head into a smaller backbone,
                  share the eye crops with Module 2 (no double work), and run inference once every <em>k</em> frames
                  with a temporal interpolation. On paper this fits the budget — the engineering work, not the
                  modelling, is what's outstanding.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 12 — Fatigue Scorer ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 6 · FATIGUE SCORER</p>
            <h2>One number (0..1) replaces three competing alerts</h2>
            <div className="two-col" style={{ display: "flex", gap: 28, marginTop: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1.05 }}>
                <p style={{ fontSize: 13, color: "#666", marginTop: 0 }}>
                  Per-frame contributions, each clamped to <code>[0, 1]</code>:
                </p>
                <div className="formula-block">
                  <Latex display>{String.raw`c_{\text{ear}} = \mathrm{clamp}\!\left(\frac{0.85B - \text{EAR}}{0.35\,B}\right)`}</Latex>
                </div>
                <div className="formula-block">
                  <Latex display>{String.raw`c_{\text{perclos}} = \mathrm{clamp}\!\left(\frac{\text{PERCLOS}}{0.30}\right)`}</Latex>
                </div>
                <p style={{ fontSize: 12, color: "#666", margin: "6px 0" }}>
                  <code>c_yawn</code> = +0.40 pulse per confirmed yawn, decays linearly over 8 s.
                  <br /><code>c_gaze</code> = 0.6 if a Distraction (Gaze) alert is currently active.
                </p>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{raw} = 0.35\,c_{\text{ear}} + 0.45\,c_{\text{perclos}} + 0.15\,c_{\text{yawn}} + 0.05\,c_{\text{gaze}}`}</Latex>
                </div>
                <p style={{ fontSize: 12, color: "#666" }}>
                  EMA over <code>raw</code>: <strong>fast attack</strong> (α=0.15), <strong>slow decay</strong> (−0.05/sec absolute floor) — climbs quickly when evidence accumulates, doesn't crash to zero on a single good frame.
                </p>
              </div>
              <div style={{ flex: 0.95 }}>
                <h3 style={{ fontSize: 16 }}>Bands with hysteresis</h3>
                <p style={{ fontSize: 12, color: "#666" }}>To step <em>down</em> a band, the score must drop <strong>0.10</strong> below the threshold — prevents oscillation.</p>
                <FatigueScoreBar />
                <div style={{ marginTop: 14, background: "#fff5f5", border: "1px solid #ffd6d6", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#8b1e1e" }}>
                  <strong>Crucially:</strong> when the band drives, EAR / MAR / PERCLOS sub-alerts are <em>suppressed</em>.
                  The system speaks with one voice on fatigue.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 13 — Alert Engine ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 6 · ALERT ENGINE &amp; AUDIO</p>
            <h2>Three-stage post-processing, four severity tiers</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
              <div className="pres-card" style={{ padding: "14px 16px" }}>
                <span className="tag tag-blue">Stage 1</span>
                <h3 style={{ fontSize: 14, margin: "8px 0 4px" }}>Compliance hysteresis</h3>
                <p style={{ fontSize: 12, color: "#666", margin: "0 0 6px" }}>Asymmetric counters per class:</p>
                <ul style={{ paddingLeft: 16, fontSize: 12, color: "#666", lineHeight: 1.7, margin: 0 }}>
                  <li>seatbelt: <strong>24</strong> ON / <strong>27</strong> OFF</li>
                  <li>smoking: <strong>8</strong> ON / <strong>20</strong> OFF</li>
                  <li>phone: <strong>8</strong> ON / <strong>20</strong> OFF</li>
                </ul>
              </div>
              <div className="pres-card" style={{ padding: "14px 16px" }}>
                <span className="tag tag-orange">Stage 2</span>
                <h3 style={{ fontSize: 14, margin: "8px 0 4px" }}>Fatigue band</h3>
                <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
                  Single 0..1 score → calm / mild / moderate / severe.
                  <br />Sub-alerts suppressed when band drives.
                </p>
              </div>
              <div className="pres-card" style={{ padding: "14px 16px" }}>
                <span className="tag tag-red">Stage 3</span>
                <h3 style={{ fontSize: 14, margin: "8px 0 4px" }}>Audio dispatch</h3>
                <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
                  Daemon thread + queue · WinMM MCI / aplay / afplay.
                  <br />Pure stdlib — no new pip deps.
                </p>
              </div>
            </div>
            <div style={{ marginTop: 16, overflow: "hidden", borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "hsl(var(--surface))" }}>
                    <th style={{ textAlign: "left", padding: "10px 14px" }}>Tier</th>
                    <th style={{ textAlign: "left", padding: "10px 14px" }}>Cooldown</th>
                    <th style={{ textAlign: "left", padding: "10px 14px" }}>Sound</th>
                    <th style={{ textAlign: "left", padding: "10px 14px" }}>Triggers</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["info", "15 s", "Single soft 880 Hz tone", "Gaze alert · low-severity compliance"],
                    ["warn", "25 s", "Double 660 Hz tone", "Yawn frequency · moderate fatigue band · phone/smoking confirmed"],
                    ["critical", "30 s", "1200 → 500 Hz sweep", "Seatbelt OFF confirmed · two compliance alerts at once"],
                    ["severe", "45 s", "Custom MP3 (Hey_you_WAKE_UP!.mp3)", "Severe fatigue band · cross-module fatigue escalation"],
                  ].map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid hsl(var(--border))" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <span className={`tag ${row[0] === "info" ? "tag-blue" : row[0] === "warn" ? "tag-orange" : row[0] === "critical" ? "tag-red" : "tag-purple"}`}>{row[0]}</span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#666" }}>{row[1]}</td>
                      <td style={{ padding: "10px 14px", color: "#666" }}>{row[2]}</td>
                      <td style={{ padding: "10px 14px", color: "#666" }}>{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, background: "#fff5f5", border: "1px solid #ffd6d6", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#8b1e1e" }}>
              <strong>Cross-module escalation.</strong> When two or more fatigue indicators fire simultaneously, the engine promotes them to a single <em>CRITICAL FATIGUE</em> severe-tier alert — one loud event, not three competing chimes.
            </div>
          </div>
        </section>

        {/* ===== 14 — Config discipline ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">CONFIGURATION DISCIPLINE</p>
            <h2>Every threshold is a YAML key</h2>
            <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
              Re-tuning for a new driver pool, a new vehicle, or a new region is a one-file change. Re-tuning for a new licensee is a fork of <code>configs/</code>, not the code.
            </p>
            <div className="two-col" style={{ display: "flex", gap: 18, marginTop: 14 }}>
              <div style={{ flex: 1 }}>
                <CodeBlock>{`# configs/thresholds.yaml
ear:
  alert_ratio: 0.75       # baseline * 0.75
  closed_frames: 12       # @ 15 fps ≈ 800 ms
  trend_drop: 0.06
mar:
  threshold: 0.55
  duration_s: 2.5
  freq_window_s: 300
  freq_min_yawns: 3
perclos:
  window_s: 60
  alert: 0.15
gaze:
  yaw_deg: 20
  pitch_down_deg: 15
  pitch_up_deg: -10
  iris_h: 0.14
  iris_v_up: 0.10
  iris_v_down: 0.12
  confirm_frames: 8
  alert_s: 4.0`}</CodeBlock>
              </div>
              <div style={{ flex: 1 }}>
                <CodeBlock>{`# configs/seatbelt.yaml
pipeline: 2
fusion:
  cnn_weight: 0.10
  yolo_weight: 0.90
hysteresis:
  on_frames: 24
  off_frames: 27

# configs/smoking.yaml
fusion_alpha: 0.10
window: 8
confirm: 5
clear_below: 0.30

# configs/phone.yaml
conf_threshold: 0.25
hidden_classes: [wheel, steering wheel]
class_aliases: [phone, cell phone, cellphone, mobile]

# configs/model_paths.yaml
mediapipe_face: weights/face_landmarker.task
seatbelt_yolo:  weights/seatbelt_yolov8n.pt
phone_yolo:     weights/phone_yolov8n.pt
smoking_onnx:   weights/smoking_yolov8.onnx`}</CodeBlock>
              </div>
            </div>
            <div style={{ marginTop: 12, background: "hsl(var(--surface))", borderLeft: "3px solid hsl(var(--primary))", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#555" }}>
              Landmark indices live in <code>src/face_mesh/landmark_utils.py</code> — never inlined in detector code.
            </div>
          </div>
        </section>

        {/* ===== 15 — Runtime / demo ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">RUNTIME · DEMO MODES</p>
            <h2>Single entry point, every module togglable</h2>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <CodeBlock>{`python scripts/run_demo.py
    # webcam, all modules on (default)

python scripts/run_demo.py --source video.mp4
    # video file, real-time-paced playback

python scripts/run_demo.py --no-smoking
python scripts/run_demo.py --no-phone
python scripts/run_demo.py --no-compliance
    # toggle individual modules

python scripts/run_demo.py --seatbelt-pipeline 3
    # ablation: simpler pipeline

python scripts/run_demo.py --output annotated.mp4
    # save overlay-rendered video`}</CodeBlock>
                <div style={{ marginTop: 10, background: "hsl(var(--surface))", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#555", borderLeft: "3px solid hsl(var(--primary))" }}>
                  <strong>Frame-skipping for video files.</strong> The runtime tracks wall-clock vs source FPS — if inference is slower than the source, frames are dropped to keep playback real-time. Critical for evaluation on benchmark videos.
                </div>
                <div style={{ marginTop: 10, background: "hsl(var(--surface))", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#555", borderLeft: "3px solid #2e7d32" }}>
                  <strong>Graceful shutdown.</strong> <code>try / KeyboardInterrupt / finally</code> wraps the main loop — Ctrl+C exits cleanly, releases the camera, joins the daemon threads, flushes the video writer.
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16 }}>Live overlay</h3>
                <ul style={{ margin: "0 0 0 16px", padding: 0, fontSize: 12, color: "#555", lineHeight: 1.8 }}>
                  <li>FPS counter — green ≥ 15, red &lt; 15</li>
                  <li>EAR + calibration baseline (e.g. <code>EAR 0.31 / BL 0.34</code>)</li>
                  <li>MAR + threshold</li>
                  <li>PERCLOS percent + severity label (OK / MILD / MOD / HIGH)</li>
                  <li>Yawn count</li>
                  <li><strong>Fatigue score bar (0..1) with band color</strong></li>
                  <li>Gaze direction + signal source <code>[H]/[I]/[?]</code></li>
                  <li>Head pitch / yaw + pose method</li>
                  <li>Compliance status (seatbelt ON/OFF, smoking, phone)</li>
                  <li>Active alerts ranked by severity</li>
                  <li>Critical / severe alerts trigger a red top banner</li>
                </ul>
                <button
                  onClick={() => openDemo("fatigue")}
                  style={{ marginTop: 14, border: "1px solid hsl(var(--border))", background: "#fff", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  ▶ Play fatigue overlay demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 16 — Performance ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">PERFORMANCE · EVALUATION</p>
            <h2>Per-component latency with <code>scripts/evaluate.py</code></h2>
            <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
              <code>Stopwatch</code> samples per component · 30-frame warmup discarded · mean / p50 / p95 / p99 / max in milliseconds.
            </p>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1.1 }}>
                <div style={{ overflow: "hidden", borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "hsl(var(--surface))" }}>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Component</th>
                        <th style={{ textAlign: "right", padding: "8px 12px" }}>mean</th>
                        <th style={{ textAlign: "right", padding: "8px 12px" }}>p95</th>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Thread</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Face mesh (MediaPipe)", "62 ms", "78 ms", "main"],
                        ["Head pose (solvePnP)", "0.8 ms", "1.2 ms", "main"],
                        ["EAR", "0.3 ms", "0.5 ms", "main"],
                        ["MAR", "0.2 ms", "0.3 ms", "main"],
                        ["PERCLOS", "0.4 ms", "0.6 ms", "main"],
                        ["Gaze", "0.9 ms", "1.4 ms", "main"],
                        ["Fatigue scorer", "0.2 ms", "0.3 ms", "main"],
                        ["Seatbelt (pipeline 2)", "48 ms", "62 ms", "async"],
                        ["Smoking (hybrid)", "31 ms", "44 ms", "async"],
                        ["Phone YOLO", "29 ms", "41 ms", "async"],
                      ].map((row, i) => (
                        <tr key={i} style={{ borderTop: "1px solid hsl(var(--border))" }}>
                          <td style={{ padding: "8px 12px", fontFamily: "'Courier New', monospace", fontSize: 11 }}>{row[0]}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", color: "#666" }}>{row[1]}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", color: "#666" }}>{row[2]}</td>
                          <td style={{ padding: "8px 12px", color: row[3] === "async" ? "hsl(var(--primary))" : "#666" }}>{row[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: 11, color: "#999", marginTop: 8, fontStyle: "italic" }}>
                  Measured on i5 10th-gen, 16 GB RAM, no GPU. Total main-thread budget: <strong>~70–110 ms / frame → 10–15 FPS sustained</strong>.
                  Compliance modules run in <code>ComplianceWorker</code> daemon thread and do not block.
                </p>
              </div>
              <div style={{ flex: 0.9, display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#f0fdf4", borderColor: "#86efac" }}>
                  <strong style={{ fontSize: 13, color: "#15803d" }}>What works on the laptop</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#365314" }}>
                    Full pipeline (all 5 detectors + fatigue scorer + audio dispatch) sustains 10–15 FPS. Demo runs end-to-end without manual intervention.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#fff7ed", borderColor: "#ffd6a8" }}>
                  <strong style={{ fontSize: 13, color: "#b45309" }}>Open item — RPi 4 benchmark</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#7c3a05" }}>
                    Hardware loan from Qareeb pending. Plan: run <code>evaluate.py</code> on a captured 5-minute driving video, confirm ≥ 15 FPS at p95.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px" }}>
                  <strong style={{ fontSize: 13 }}>Where the budget goes</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    MediaPipe face mesh dominates the main thread (~60% of budget). YOLO at any branch (30–60 ms) runs async — it would otherwise alone blow the 67 ms target.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 17 — Technical decisions ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">TECHNICAL DECISIONS</p>
            <h2>Why each choice — and what it cost</h2>
            <div style={{ overflow: "auto", borderRadius: 12, border: "1px solid hsl(var(--border))", marginTop: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "hsl(var(--surface))" }}>
                    <th style={{ textAlign: "left", padding: "10px 14px", width: "30%" }}>Decision</th>
                    <th style={{ textAlign: "left", padding: "10px 14px" }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["MediaPipe Tasks API (not legacy)", "Offline .task file; free 4×4 transformation matrix; Apache 2.0."],
                    ["YOLOv8 / YOLOv10 (not YOLOv5)", "AGPL-3.0 is a commercial blocker for Qareeb. v8/v10 ship under Apache 2.0."],
                    ["Smoking: YOLO ⊕ landmark fusion (0.10/0.90)", "YOLO sees the object, landmarks see the gesture. Either alone is fragile in this dataset."],
                    ["Phone: YOLO only", "Hand-near-ear is unreliable from a driver-facing camera angle — the ear is often pillar-occluded."],
                    ["Per-driver EAR calibration (10 s warmup)", "Universal thresholds fail; eye-aperture varies ~30%. Operationally OK to delay."],
                    ["Threading, not multiprocessing", "RPi 4 RAM is constrained; the GIL is irrelevant for I/O-bound inference."],
                    ["Deviation-from-neutral gaze", "Absolute iris ratios bias by anatomy. Δ from a per-driver neutral is robust."],
                    ["ComplianceWorker daemon thread", "YOLO 30–50 ms would blow the 67 ms main-thread budget. Async + lock-guarded merge."],
                    ["FatigueScorer single 0..1", "Independent alerts spam the driver. Humans care about overall state, not which sub-signal fired."],
                    ["WinMM MCI / aplay / afplay for audio", "Pure stdlib — no new pip deps; one less failure mode in deployment."],
                    ["Asymmetric seatbelt hysteresis (24/27)", "Flicker is real, strap loss isn't. Slow to commit OFF, fast to confirm ON."],
                    ["Result_dict shared mutable contract", "Replaces 20 dataclasses with 200 lines of plumbing. Faster on RPi, easier to reason about."],
                  ].map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid hsl(var(--border))" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#222" }}>{row[0]}</td>
                      <td style={{ padding: "10px 14px", color: "#555" }}>{row[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===== 20 — Scope & roadmap ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">SCOPE · OPEN ITEMS</p>
            <h2>What's not in MVP, and why that's deliberate</h2>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, color: "#7c3a05" }}>Deliberate scope cuts</h3>
                {[
                  ["Module 4 — CNN-GRU on the main thread", "Implemented and competitive on F1, but does not currently fit the 15 FPS budget on Raspberry Pi 4. Distillation + frame-skip is the resolution path."],
                  ["BiLSTM seatbelt smoother", "Trained as an alternative to the EMA. Did not improve precision/recall on our clips, and added latency. Dropped — EMA + RANSAC kept."],
                  ["IR camera support", "Ordered, not yet arrived. Visible-light only for the MVP — limits night and sunglasses use cases."],
                  ["Driver-history adaptation", "Per-driver baselines reset each session. Cross-session learning is out of scope; no persistent driver-ID layer."],
                ].map(([t, d]) => (
                  <div key={t} className="pres-card" style={{ padding: "10px 14px", marginBottom: 8, background: "#fff7ed", borderColor: "#ffd6a8" }}>
                    <strong style={{ fontSize: 12, color: "#7c3a05" }}>{t}</strong>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "#7c3a05" }}>{d}</p>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, color: "#15803d" }}>Open items</h3>
                {[
                  "Run evaluate.py on Raspberry Pi 4 to confirm 15 FPS on real driving footage",
                  "Quantitative accuracy on labelled video (seatbelt · phone · smoking)",
                  "Soft |roll| > 25° validity gate (MediaPipe degrades there)",
                  "Camera-mount offset auto-calibration script (30 s forward gaze at session start)",
                  "Distill / frame-skip the CNN-GRU head so it fits the RPi 4 budget",
                  "IR camera support once hardware arrives — night / sunglasses use case",
                ].map((t, i) => (
                  <div key={i} className="pres-card" style={{ padding: "10px 14px", marginBottom: 6, background: "#f0fdf4", borderColor: "#86efac" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#365314" }}>
                      <strong style={{ marginRight: 6, color: "#15803d" }}>{i + 1}.</strong>{t}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 14, background: "hsl(var(--surface))", borderLeft: "3px solid hsl(var(--primary))", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#555" }}>
              <strong>MVP delivery.</strong> May 2026. Every cut above has a clear, bounded reason — none of them are unknowns.
            </div>
          </div>
        </section>

        {/* ===== 19 — Closing ===== */}
        <section className="slide">
          <div className="slide-bg-accent" style={{ top: -100, left: -100 }} />
          <div className="slide-bg-accent" style={{ bottom: -150, right: -150 }} />
          <div className="slide-inner" style={{ textAlign: "center" }}>
            <p className="section-label" style={{ justifyContent: "center" }}>SUMMARY</p>
            <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)", marginBottom: 18 }}>One camera · five detectors<br />one fatigue score · one voice</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, maxWidth: 900, margin: "0 auto" }}>
              {[
                { stat: "15 FPS", label: "Target end-to-end on Raspberry Pi 4" },
                { stat: "5 modules", label: "Fatigue · Gaze · Seatbelt · Phone · Smoking" },
                { stat: "Apache 2.0", label: "License-clean for commercial deployment" },
                { stat: "0 cloud calls", label: "Fully offline by construction" },
                { stat: "10 s", label: "Per-driver EAR calibration at session start" },
                { stat: "1 voice", label: "FatigueScorer + AlertEngine speak as one" },
              ].map((c) => (
                <div key={c.stat} className="pres-card" style={{ padding: "16px 14px" }}>
                  <div style={{ fontSize: 26, fontWeight: 200, color: "hsl(var(--primary))", letterSpacing: "-0.02em" }}>{c.stat}</div>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>{c.label}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 32 }}>
              <p style={{ fontWeight: 500, fontSize: 22, letterSpacing: "-0.01em", margin: 0 }}>Thank you — questions welcome</p>
              <p style={{ fontSize: 13, color: "#999", marginTop: 6 }}>Live demo on the laptop · video clips one click away in the deck</p>
            </div>
            <div className="dark-strip">
              <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, marginBottom: 8 }}>
                  <img src="/ensia_logo.png" alt="ENSIA" style={{ height: 28, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                  <img src="/qareeb_logo.ico" alt="Qareeb" style={{ height: 28, objectFit: "contain" }} />
                </div>
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                  Berbaoui Ashref · Benelhadj Djelloul Imen · Gasmi Yassine · Khentache Hamza &nbsp; — &nbsp; Supervisor: Mounir Ouadi
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {demoModalOpen && (
        <div
          onClick={closeDemo}
          style={{ position: "fixed", inset: 0, background: "rgba(10, 10, 10, 0.72)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(900px, 100%)", background: "#111", borderRadius: 14, border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
              <strong style={{ fontSize: 14 }}>{activeDemo.title} (first 7 seconds)</strong>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={activeDemo.src} target="_blank" rel="noreferrer" style={{ textDecoration: "none", background: "transparent", border: "1px solid rgba(255,255,255,0.35)", color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 14 }}>Open file</a>
                <button onClick={closeDemo} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.35)", color: "#fff", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>Close</button>
              </div>
            </div>
            {demoVideoState === "error" && (
              <div style={{ padding: "12px 16px", background: "#2a1f1f", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                <p style={{ margin: 0, color: "#ffd7d7", fontSize: 13, lineHeight: 1.5 }}>{demoVideoReason}</p>
                <p style={{ margin: "6px 0 0", color: "#ffb3b3", fontSize: 12 }}>Recommended fix: re-export this demo as MP4 H.264 (avc1) or verify the file path in public/.</p>
              </div>
            )}
            <video
              key={activeDemo.src}
              ref={demoVideoRef}
              src={activeDemo.src}
              muted
              playsInline
              autoPlay
              preload="metadata"
              controls
              style={{ width: "100%", display: "block", background: "#000" }}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ===================== Sub-components ===================== */

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      style={{
        background: "#0f172a",
        color: "#e2e8f0",
        borderRadius: 10,
        padding: "14px 16px",
        fontSize: 11.5,
        lineHeight: 1.55,
        margin: 0,
        overflow: "auto",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        border: "1px solid #1e293b",
      }}
    >
      <code>{children}</code>
    </pre>
  );
}

function PerclosBar() {
  const segments = Array.from({ length: 60 }, (_, i) =>
    [4, 5, 12, 13, 23, 24, 25, 38, 39, 50].includes(i) ? "closed" : "open"
  );
  return (
    <div>
      <div style={{ display: "flex", width: "100%", height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid hsl(var(--border))", background: "white" }}>
        {segments.map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: s === "closed" ? "hsl(var(--primary))" : "#e8f5e9",
              borderRight: i < 59 ? "1px solid rgba(0,0,0,0.03)" : "none",
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#999", margin: "6px 0 0" }}>
        60-second window · 10 closed / 60 ≈ <strong>17%</strong> → fires alert (threshold 15%)
      </p>
    </div>
  );
}

function FatigueScoreBar() {
  const bands = [
    { from: 0, to: 0.30, color: "#86efac", label: "calm", action: "silent" },
    { from: 0.30, to: 0.55, color: "#fde68a", label: "mild", action: "visual only" },
    { from: 0.55, to: 0.78, color: "#fdba74", label: "moderate", action: "warn chime" },
    { from: 0.78, to: 1.00, color: "#fca5a5", label: "severe", action: "MP3" },
  ];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", width: "100%", height: 38, borderRadius: 10, overflow: "hidden", border: "1px solid hsl(var(--border))" }}>
        {bands.map((b) => (
          <div
            key={b.label}
            style={{
              flex: b.to - b.from,
              background: b.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "#1a1a1a",
              borderRight: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {b.label}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", marginTop: 4, fontSize: 10, color: "#888", fontFamily: "'Courier New', monospace" }}>
        <span style={{ flex: 0.30, textAlign: "right" }}>0.30</span>
        <span style={{ flex: 0.25, textAlign: "right" }}>0.55</span>
        <span style={{ flex: 0.23, textAlign: "right" }}>0.78</span>
        <span style={{ flex: 0.22, textAlign: "right" }}>1.00</span>
      </div>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {bands.map((b) => (
          <div key={b.label} style={{ background: b.color + "55", borderRadius: 6, padding: "6px 8px", fontSize: 10, color: "#333" }}>
            <strong>{b.label}</strong><br />
            <span style={{ color: "#666" }}>{b.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RpiBoardVisual() {
  return (
    <svg width="100%" viewBox="0 0 320 170" role="img" aria-label="Stylized Raspberry Pi 4 board">
      <rect x="8" y="8" width="304" height="154" rx="14" fill="#2f8f46" stroke="#1f5f2d" strokeWidth="3" />
      <rect x="22" y="28" width="74" height="52" rx="6" fill="#222" />
      <rect x="105" y="22" width="96" height="64" rx="8" fill="#3b3b3b" />
      <rect x="208" y="28" width="86" height="18" rx="4" fill="#d9d9d9" />
      <rect x="208" y="52" width="86" height="18" rx="4" fill="#d9d9d9" />
      <rect x="208" y="76" width="86" height="18" rx="4" fill="#d9d9d9" />
      <rect x="24" y="98" width="270" height="10" rx="5" fill="#c9a227" />
      <circle cx="52" cy="136" r="10" fill="#c9a227" />
      <circle cx="88" cy="136" r="10" fill="#c9a227" />
      <circle cx="124" cy="136" r="10" fill="#c9a227" />
      <text x="160" y="145" textAnchor="middle" fill="#e9ffe9" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.03em" }}>
        Raspberry Pi 4
      </text>
    </svg>
  );
}

function ArchitectureDiagram() {
  const box = (x: number, y: number, w: number, h: number, label: string, sub?: string, fill = "#fff", stroke = "hsl(220, 13%, 86%)") => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 4 : y + h / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="#222">{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontSize="9.5" fill="#888">{sub}</text>}
    </g>
  );

  const arrow = (x1: number, y1: number, x2: number, y2: number, dashed = false) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(220, 13%, 60%)" strokeWidth={1.5} strokeDasharray={dashed ? "4,4" : undefined} markerEnd="url(#arrowhead)" />
  );

  return (
    <div style={{ background: "hsl(var(--surface))", borderRadius: 14, border: "1px solid hsl(var(--border))", padding: 18, marginTop: 8 }}>
      <svg viewBox="0 0 1000 480" style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="hsl(220, 13%, 60%)" />
          </marker>
        </defs>

        {/* Camera */}
        {box(420, 10, 160, 44, "Camera", "640×480 @ 15 FPS RGB", "#fff7ed", "#fdba74")}
        {arrow(500, 54, 500, 80)}

        {/* Module 1: Face Mesh */}
        {box(290, 80, 420, 64, "Module 1 · FaceMeshDetector", "MediaPipe Tasks · 478 landmarks · 4×4 transform · solvePnP · EMA(α=0.4)", "#e8f4fd", "#90caf9")}

        {/* result_dict bus */}
        <rect x={50} y={170} width={900} height={32} rx={6} fill="#1a1a1a" />
        <text x={500} y={191} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="'JetBrains Mono', monospace">
          shared result_dict — read · mutate · return
        </text>
        {arrow(500, 144, 500, 168)}

        {/* Modules row */}
        {box(60, 230, 180, 70, "Module 2 · Fatigue", "EAR · MAR · PERCLOS")}
        {box(265, 230, 180, 70, "Module 3 · Gaze", "head-pose ⊕ iris fusion")}
        {box(470, 230, 180, 70, "Module 5 · Compliance", "Seatbelt · Smoking · Phone", "#fff5f5", "#fca5a5")}
        {box(675, 230, 180, 70, "Module 4 · DL fatigue", "CNN-GRU · off main path", "#f3f4f6", "#d1d5db")}

        {/* arrows from bus to modules */}
        {arrow(150, 202, 150, 228)}
        {arrow(355, 202, 355, 228)}
        {arrow(560, 202, 560, 228)}
        {arrow(765, 202, 765, 228, true)}

        {/* ComplianceWorker daemon thread label */}
        <rect x={460} y={310} width={200} height={22} rx={4} fill="#fee2e2" stroke="#fca5a5" strokeDasharray="4,4" />
        <text x={560} y={325} textAnchor="middle" fontSize="10" fill="#7c3a05">ComplianceWorker daemon thread</text>
        {arrow(560, 300, 560, 332, true)}

        {/* Module 6 fusion */}
        {box(220, 360, 560, 72, "Module 6 · Fusion + Alert Manager", "FatigueScorer (0..1, 4 bands) · AlertEngine (hysteresis · severity · cooldown · single-voice) · AudioDispatcher", "#ecfccb", "#a3e635")}
        {arrow(150, 300, 380, 358)}
        {arrow(355, 300, 460, 358)}
        {arrow(560, 332, 560, 358, true)}

        {/* Output */}
        {box(380, 450, 240, 28, "Overlay + alerts + audio", undefined, "#fff", "hsl(var(--primary))")}
        {arrow(500, 432, 500, 448)}
      </svg>
    </div>
  );
}
