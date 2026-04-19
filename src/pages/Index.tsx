import { useEffect, useRef, useState, useCallback } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "../styles/presentation.css";

const SLIDES = [
  "Title",
  "Why it matters",
  "System overview",
  "Face Mesh",
  "EAR & MAR",
  "PERCLOS",
  "Gaze estimation",
  "DL fatigue (question)",
  "Compliance",
  "Progress",
  "Challenges",
  "Questions",
  // ── Update April 20 ──
  "Update intro",
  "Gaze redesigned",
  "Seatbelt update",
  "Phone update",
  "Smoking update",
  "Video demos",
  "Overall status",
  "Camera mounting (critical)",
  "Resources needed (HPC)",
];

const TOTAL = SLIDES.length;

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
  const [seatbeltDemoOpen, setSeatbeltDemoOpen] = useState(false);
  const [seatbeltVideoState, setSeatbeltVideoState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [seatbeltVideoReason, setSeatbeltVideoReason] = useState("");
  const seatbeltVideoRef = useRef<HTMLVideoElement>(null);

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
      if (seatbeltDemoOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          setSeatbeltDemoOpen(false);
        }
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
  }, [current, scrollTo, seatbeltDemoOpen]);

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
    if (!seatbeltDemoOpen) {
      setSeatbeltVideoState("idle");
      setSeatbeltVideoReason("");
      return;
    }

    const video = seatbeltVideoRef.current;
    if (!video) return;

    setSeatbeltVideoState("loading");
    setSeatbeltVideoReason("");

    video.currentTime = 0;
    video.play().catch(() => {
      setSeatbeltVideoState("error");
      setSeatbeltVideoReason("The browser blocked playback or cannot decode this video format.");
    });

    const onTimeUpdate = () => {
      if (video.currentTime >= 7) {
        video.pause();
      }
    };

    const onLoadedData = () => {
      setSeatbeltVideoState("ready");
      setSeatbeltVideoReason("");
    };

    const onError = () => {
      setSeatbeltVideoState("error");
      setSeatbeltVideoReason("This file appears HEVC (hvc1), which many browsers cannot play inline.");
    };

    const loadingTimeout = window.setTimeout(() => {
      if (video.readyState < 2) {
        setSeatbeltVideoState("error");
        setSeatbeltVideoReason("Video could not load for inline playback. Try opening it directly or re-exporting to H.264 (avc1).");
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
  }, [seatbeltDemoOpen]);

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

        {/* ===== SLIDE 1 — Title ===== */}
        <section className="slide">
          <div className="slide-bg-accent" style={{ top: -100, right: -100 }} />
          <div className="slide-inner" style={{ textAlign: "center" }}>
            <p className="section-label" style={{ justifyContent: "center" }}>ENSIA × QAREEB · 2025–2026</p>
            <h1 style={{ marginBottom: 12 }}>Driver Monitoring<br />System</h1>
            <h2 style={{ color: "hsl(var(--text-secondary))", fontWeight: 300, fontSize: "clamp(16px, 2vw, 22px)" }}>
              Real-time fatigue, gaze & compliance detection
            </h2>
            <p style={{ color: "#aaa", fontSize: 14, marginTop: 8 }}>
              Edge AI deployment on Raspberry Pi 4
            </p>
          </div>
          <div className="scroll-hint">
            <span>Scroll</span>
            <div className="scroll-hint-arrow" />
          </div>
          <div className="dark-strip">
            <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginBottom: 10 }}>
                {["Ashref", "Hamza", "Imen", "Yacine"].map((n) => (
                  <span key={n} style={{ fontSize: 15, fontWeight: 500, letterSpacing: "0.03em" }}>{n}</span>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Supervised by <span style={{ color: "#bbb", fontWeight: 500 }}>Mounir Ouadi</span></p>
            </div>
          </div>
        </section>

        {/* ===== SLIDE 2 — Why it matters ===== */}
        <section className="slide">
          <div className="slide-inner">
            <div className="two-col" style={{ display: "flex", gap: 60, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "clamp(56px, 7vw, 96px)", fontWeight: 200, color: "hsl(var(--primary))", lineHeight: 1, letterSpacing: "-0.03em" }}>1 in 5</div>
                <p style={{ marginTop: 8, fontSize: 16, color: "#888" }}>serious road crashes involve driver fatigue</p>
                <div style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 200, color: "hsl(var(--primary))", lineHeight: 1, marginTop: 40, letterSpacing: "-0.03em" }}>Top 3</div>
                <p style={{ marginTop: 8, fontSize: 16, color: "#888" }}>causes of fleet accidents: fatigue, distraction, non-compliance</p>
              </div>
              <div style={{ flex: 1 }}>
                <p className="section-label">THE PROBLEM</p>
                <h2>Why does this matter?</h2>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    "Driver fatigue causes 20–30% of serious accidents",
                    "Distraction (phone, gaze) is a leading crash factor",
                    "Fleet operators have strict, unmonitored safety rules",
                    "Manual supervision is impossible at scale",
                  ].map((t, i) => (
                    <li key={i} style={{ paddingLeft: 16, borderLeft: "2px solid hsl(var(--primary))", fontSize: 15, lineHeight: 1.6 }}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SLIDE 3 — System overview ===== */}
        <section className="slide">
          <div className="slide-inner">
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <p className="section-label" style={{ justifyContent: "center" }}>SYSTEM OVERVIEW</p>
              <h2>One camera. Five detections. Fully offline.</h2>
            </div>
            <div className="two-col" style={{ display: "flex", gap: 20, alignItems: "stretch", marginBottom: 24 }}>
              <div style={{ flex: 1.3, minWidth: 0 }}>
                <img
                  src="/rpi_dash_banner.jpg"
                  alt="In-car dash camera setup where Raspberry Pi 4 is used as edge compute"
                  style={{
                    width: "100%",
                    maxHeight: 220,
                    objectFit: "cover",
                    borderRadius: 14,
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <p style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "#888" }}>
                  In-car context: camera stream processed on an onboard edge unit
                </p>
              </div>
              <div className="pres-card" style={{ flex: 1, margin: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "16px 18px" }}>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(var(--primary))", margin: "0 0 8px" }}>Edge computer</p>
                <h3 style={{ margin: "0 0 10px" }}>Raspberry Pi 4</h3>
                <RpiBoardVisual />
                <p style={{ fontSize: 12, color: "#777", marginTop: 10, marginBottom: 0 }}>
                  4-core ARM CPU, low-power footprint, offline real-time inference
                </p>
              </div>
            </div>
            <div className="pipeline" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 40, flexWrap: "wrap" }}>
              {["Camera", "Raspberry Pi 4", "Face Mesh"].map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "12px 22px", fontSize: 13, fontWeight: 600, background: "white" }}>{label}</div>
                  <span style={{ color: "hsl(var(--primary))", margin: "0 10px", fontSize: 20, fontWeight: 300 }}>→</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Fatigue", "Gaze", "Seatbelt", "Phone", "Smoking"].map((l) => (
                  <div key={l} style={{ border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "10px 16px", fontSize: 12, fontWeight: 600, background: "white" }}>{l}</div>
                ))}
              </div>
            </div>
            <div className="grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
              {[
                { name: "Fatigue Detection", status: "Live", cls: "tag-green" },
                { name: "Gaze Estimation", status: "Live", cls: "tag-green" },
                { name: "Seatbelt", status: "Nearly done", cls: "tag-blue" },
                { name: "Phone Usage", status: "In progress", cls: "tag-orange" },
                { name: "Smoking", status: "In progress", cls: "tag-orange" },
              ].map((c) => (
                <div key={c.name} className="pres-card" style={{ textAlign: "center" }}>
                  <span className={`tag ${c.cls}`}>{c.status}</span>
                  <p style={{ fontWeight: 600, fontSize: 13, marginTop: 10, color: "hsl(var(--text-primary))" }}>{c.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SLIDE 4 — Face Mesh ===== */}
        <section className="slide">
          <div className="slide-inner">
            <div className="two-col" style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
              <div style={{ flex: 0.95 }}>
                <p className="section-label">TECHNICAL CONCEPTS 1 / 4</p>
                <h2>Face mesh — how we see the driver</h2>
                <p style={{ maxWidth: 480 }}>
                  MediaPipe is an open-source vision framework developed by Google.
                  In our project, we use its Face Mesh (Face Landmarker) module to detect 468 three-dimensional landmark points per frame.
                  These points are the geometric backbone for EAR, MAR, PERCLOS, gaze, and head-pose signals.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
                  {[
                    ["What it is", "Google MediaPipe module specialized for dense facial geometry"],
                    ["468 landmarks", "dense around eyes, eyelids, iris, lips and jawline"],
                    ["3D coordinates", "x, y, z for each point, with relative depth"],
                    ["Edge ready", "real-time on CPU, practical for Raspberry Pi 4"],
                    ["Offline", "model loaded locally from .task file, no cloud dependency"],
                  ].map(([t, d]) => (
                    <div key={t} style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "8px 12px", background: "hsl(var(--surface))", borderRadius: 8 }}>
                      <span style={{ color: "hsl(var(--primary))", fontSize: 8, lineHeight: 1 }}>●</span>
                      <div><strong style={{ fontSize: 14 }}>{t}</strong> <span style={{ color: "#999", fontSize: 13 }}>— {d}</span></div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, fontSize: 13, color: "#999", display: "flex", flexDirection: "column", gap: 4 }}>
                  <p>Head pose: pitch, yaw, roll computed from 6 stable landmarks</p>
                  <p>Validity flag: frame rejected if |yaw| &gt; 60° or |pitch| &gt; 40°</p>
                </div>
              </div>
              <div style={{ flex: 1.05, background: "hsl(var(--surface))", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, padding: 16, border: "1px solid hsl(var(--border))" }}>
                <img
                  src="/face_mesh_overview.png"
                  alt="MediaPipe face mesh overview with 468 landmark points"
                  style={{ width: "100%", maxHeight: 460, borderRadius: 12, objectFit: "contain", background: "#fff" }}
                />
                <p style={{ fontWeight: 600, fontSize: 14, color: "#666", marginTop: 12 }}>Face mesh overview (468 landmark points)</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SLIDE 5 — EAR and MAR ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">TECHNICAL CONCEPTS 2 / 4</p>
            <div className="two-col" style={{ display: "flex", gap: 48 }}>
              <div style={{ flex: 1 }}>
                <h3>Eye Aspect Ratio (EAR)</h3>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{EAR} = \frac{\|P_2 - P_6\| + \|P_3 - P_5\|}{2 \cdot \|P_1 - P_4\|}`}</Latex>
                </div>
                <div className="threshold-row" style={{ borderColor: "#2e7d32" }}><span className="tag tag-green">Baseline</span> 10-second per-driver calibration at session start</div>
                <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">Alert threshold</span> EAR &lt; 0.20 for 4 consecutive frames</div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}><span className="tag tag-red">Closure threshold</span> EAR &lt; 0.15 for eye-closure counting</div>
                <p style={{ fontSize: 12, color: "#999", marginTop: 14 }}>Adaptive rule: alert threshold = baseline × 0.75</p>
                <p style={{ fontSize: 12, color: "#999" }}>PERCLOS closure ratio = baseline × 0.27, trend-drop trigger = 0.06</p>
                <p style={{ fontSize: 12, color: "#999" }}>Smoothing: 10-frame temporal smoothing + EMA (alpha = 0.4)</p>
              </div>
              <div style={{ flex: 1 }}>
                <h3>Mouth Aspect Ratio (MAR)</h3>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{MAR} = \frac{\|M_2 - M_6\| + \|M_3 - M_5\|}{2 \cdot \|M_1 - M_4\|}`}</Latex>
                </div>
                <div className="threshold-row" style={{ borderColor: "#ccc" }}><span className="tag" style={{ background: "#f0f0f0", color: "#666" }}>MAR threshold</span> MAR &gt; 0.60</div>
                <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">Duration rule</span> Above threshold for &ge; 2.0 seconds</div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}><span className="tag tag-red">Frequency rule</span> 3+ yawns in 300-second rolling window</div>
                <p style={{ fontSize: 12, color: "#999", marginTop: 14 }}>Duration filter prevents speech false positives</p>
                <p style={{ fontSize: 12, color: "#999" }}>Alert triggers from sustained + repeated yawning patterns</p>
              </div>
            </div>
            <div style={{ marginTop: 24, background: "hsl(var(--surface))", borderRadius: 10, padding: "12px 20px", fontSize: 13, textAlign: "center", color: "#888", border: "1px solid hsl(var(--border))" }}>
              Both metrics computed directly from face mesh landmarks — zero additional models required
            </div>
          </div>
        </section>

        {/* ===== SLIDE 6 — PERCLOS ===== */}
        <section className="slide">
          <div className="slide-inner">
            <div className="two-col" style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p className="section-label">TECHNICAL CONCEPTS 3 / 4</p>
                <h2>PERCLOS — the drowsiness gold standard</h2>
                <p>Validated by the US Federal Highway Administration (1990s). The most reliable physiological measure of driver drowsiness.</p>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{PERCLOS} = \frac{N_{\text{closed}}}{N_{\text{total}}} \quad \text{(60-second sliding window)}`}</Latex>
                </div>
                <div className="threshold-row" style={{ borderColor: "#ccc" }}><span className="tag" style={{ background: "#f0f0f0", color: "#666" }}>Window</span> 60 seconds rolling window</div>
                <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">Eye-closure criterion</span> EAR &lt; baseline × 0.27 (fallback: 0.15)</div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}><span className="tag tag-red">Alert level</span> PERCLOS &gt; 0.15</div>
                <div style={{ background: "#e8f4fd", borderRadius: 10, padding: "14px 18px", marginTop: 18, fontSize: 13, color: "#1565c0", border: "1px solid #bbdefb" }}>
                  💡 A single blink doesn't affect PERCLOS.<br />
                  10 seconds of closed eyes in 60 seconds = 17% → alert.
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ fontSize: 12, color: "#999", marginBottom: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>60-second rolling window</p>
                <PerclosBar />
                <p style={{ fontSize: 13, color: "#999", marginTop: 10 }}>PERCLOS = red segments / total ≈ 17% → alert</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SLIDE 7 — Gaze estimation ===== */}
        <section className="slide">
          <div className="slide-inner">
            <div className="two-col" style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p className="section-label">TECHNICAL CONCEPTS 4 / 4</p>
                <h2>Gaze estimation</h2>
                <p>MediaPipe provides iris landmarks (5 points per eye). We measure where the iris sits within the eye bounding box.</p>
                <div className="formula-block">
                  <Latex display>{String.raw`h_{\text{ratio}} = \frac{x_{\text{iris}} - x_{\text{left}}}{w_{\text{eye}}} \qquad v_{\text{ratio}} = \frac{y_{\text{iris}} - y_{\text{top}}}{h_{\text{eye}}}`}</Latex>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
                  <div className="threshold-row" style={{ borderColor: "#2e7d32" }}><span className="tag tag-green">FORWARD</span> h ∈ [0.35, 0.65] and v ∈ [0.35, 0.65]</div>
                  <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">LEFT</span> h &lt; 0.35</div>
                  <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">RIGHT</span> h &gt; 0.65</div>
                  <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">DOWN</span> v &gt; 0.65</div>
                </div>
                <p style={{ fontSize: 12, color: "#999", marginTop: 14 }}>Head turn ≠ gaze direction — they are separated</p>
                <p style={{ fontSize: 12, color: "#999" }}>Alert fires after 2 continuous seconds away from forward</p>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <EyeDiagram />
              </div>
            </div>
          </div>
        </section>

        {/* ===== SLIDE 8 — Deep Learning Fatigue (Question) ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">RESEARCH DIRECTION</p>
            <h2>Can deep learning improve fatigue detection?</h2>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <p>
                  Our current fatigue module uses interpretable metrics (EAR, MAR, PERCLOS) and works well in real-time.
                  The next step we want to explore is a deep learning approach that can learn subtle temporal patterns automatically.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                  {[
                    "Goal: detect fatigue earlier than threshold-based rules",
                    "Input options: eye crops, full face clips, or landmarks + image fusion",
                    "Temporal modeling: CNN+LSTM, TCN, or lightweight video transformers",
                    "Target output: alert / mildly drowsy / highly drowsy confidence score",
                  ].map((t) => (
                    <p key={t} style={{ margin: 0, paddingLeft: 14, borderLeft: "2px solid hsl(var(--border))", fontSize: 13 }}>{t}</p>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="pres-card" style={{ padding: "16px 18px" }}>
                  <span className="tag tag-blue">Potential advantages</span>
                  <p style={{ marginTop: 10, fontSize: 13 }}>
                    Better robustness to driver-to-driver variability and non-linear fatigue cues that simple thresholds might miss.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "16px 18px" }}>
                  <span className="tag tag-orange">Main risks</span>
                  <p style={{ marginTop: 10, fontSize: 13 }}>
                    Needs labeled fatigue datasets, may overfit to lighting/camera conditions, and can be heavier for Raspberry Pi deployment.
                  </p>
                </div>
                <div style={{ background: "#fff5f5", border: "1px solid #ffd6d6", borderRadius: 10, padding: "14px 16px" }}>
                  <p style={{ margin: 0, fontSize: 14, color: "#8b1e1e", fontWeight: 600 }}>
                    Open question: will deep learning outperform our current pipeline enough to justify added complexity?
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#7a5555" }}>
                    This remains an active validation topic in our roadmap.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SLIDE 9 — Compliance ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">COMPLIANCE DETECTION</p>
            <p style={{ marginTop: -4, marginBottom: 18, fontSize: 14, color: "#777" }}>
              Compliance is handled as a multi-signal safety layer: object detection + temporal confirmation + context checks to reduce false alarms.
            </p>
            <div className="two-col" style={{ display: "flex", gap: 20, marginBottom: 20 }}>
              <div
                className="pres-card"
                style={{ flex: 1, cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onClick={() => setSeatbeltDemoOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSeatbeltDemoOpen(true);
                  }
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0 }}>Seatbelt detection</h3>
                  <span className="tag tag-blue">Nearly done</span>
                </div>
                {[
                  "Models used: YOLOv5 baseline and YOLOv8 iterations (current)",
                  "Target: diagonal belt strap crossing shoulder/chest region",
                  "Training mix: NCAI dataset + Roboflow in-cabin annotations",
                  "Seatbelt confidence threshold: 0.60",
                  "Inference guard: confidence + box stability over time",
                  "Decision logic: no-seatbelt state must persist for 2 seconds",
                  "Click this card to watch a 7-second classification demo",
                ].map((t) => (
                  <p key={t} style={{ paddingLeft: 14, borderLeft: "2px solid hsl(var(--border))", margin: "8px 0", fontSize: 13 }}>{t}</p>
                ))}
              </div>
              <div className="pres-card" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0 }}>Phone usage detection</h3>
                  <span className="tag tag-orange">In progress</span>
                </div>
                {[
                  "Baseline: COCO pre-trained class 67 (cell phone)",
                  "Fast start without fine-tuning, then in-cabin adaptation",
                  "Phone confidence threshold: 0.60",
                  "Context fusion: phone box + head pose (yaw > 20°) + gaze-away",
                  "Temporal check: continuous evidence for >= 2 seconds",
                  "Goal: avoid false triggers from reflections or passenger devices",
                ].map((t) => (
                  <p key={t} style={{ paddingLeft: 14, borderLeft: "2px solid hsl(var(--border))", margin: "8px 0", fontSize: 13 }}>{t}</p>
                ))}
              </div>
            </div>
            <div className="pres-card" style={{ background: "hsl(var(--surface))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>Smoking detection</h3>
                <span className="tag tag-purple">Landmark-based</span>
              </div>
              <p>
                Cigarettes are too small to detect reliably at vehicle distance on low-power hardware.
                Instead, we use MediaPipe Hand landmarks to track hand-to-mouth behavior patterns.
              </p>
              <div className="formula-block" style={{ justifyContent: "flex-start", fontFamily: "'Courier New', monospace", fontSize: 14 }}>
                hand_to_mouth_distance_px &lt; 40 for &ge; 1.0 second → alert
              </div>
              <p style={{ fontSize: 12, color: "#999" }}>Reuses existing MediaPipe pipeline — no additional model required</p>
              <p style={{ fontSize: 12, color: "#999" }}>Extra rule: repeated hand-to-mouth cycles in short windows increase confidence score.</p>
            </div>
            <div style={{ marginTop: 16, background: "#f8fafc", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "12px 16px" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#4a5568" }}>
                Unified alert policy: detection confidence + temporal persistence + context agreement.
                This "triple-check" design reduces false positives before raising driver alerts.
              </p>
            </div>
          </div>
        </section>

        {/* ===== SLIDE 10 — Progress ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">CURRENT PROGRESS</p>
            <h2>What we have built</h2>
            <div className="two-col" style={{ display: "flex", gap: 40, marginTop: 20 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: "#2e7d32" }}>✅ Working now</h3>
                {[
                  "MediaPipe face mesh pipeline (478 landmarks)",
                  "Head pose — solvePnP + transformation matrix fallback",
                  "Landmark EMA stabilizer (reduces jitter)",
                  "EAR with 10-frame smoothing + per-driver calibration",
                  "MAR with duration filter + yawn frequency counter",
                  "PERCLOS rolling 60-second window",
                  "Gaze zone classification (4 zones)",
                  "Real-time overlay: all metrics displayed on screen",
                ].map((t) => (
                  <p key={t} style={{ fontSize: 13, margin: "8px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#2e7d32", flexShrink: 0 }}>✓</span> {t}
                  </p>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: "#e65100" }}>🔧 In progress</h3>
                {[
                  "Seatbelt — YOLO pipeline set up, nearly done",
                  "Phone — zero-shot baseline confirmed working",
                  "Smoking — hand proximity logic implemented",
                  "Raspberry Pi 4 — deployment and performance validation",
                ].map((t) => (
                  <p key={t} style={{ fontSize: 13, margin: "8px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#e65100", flexShrink: 0 }}>◐</span> {t}
                  </p>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 28, background: "#fff5f5", borderLeft: "3px solid hsl(var(--primary))", borderRadius: 10, padding: "16px 24px", fontSize: 13 }}>
              <strong>🎬 Live demo available</strong> — system runs in real time on laptop. EAR, MAR, PERCLOS, gaze direction and alerts visible per frame.
            </div>
          </div>
        </section>

        {/* ===== SLIDE 11 — Challenges ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">CHALLENGES ENCOUNTERED</p>
            <h2>What we struggled with</h2>
            <div className="grid-2x3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 24 }}>
              {[
                { title: "Threshold calibration", problem: "Fixed EAR = 0.20 does not fit all drivers", solution: "10-second per-session calibration computes personal baseline", tag: "Solved", cls: "tag-green" },
                { title: "PERCLOS stuck at 0.00", problem: "Closure threshold (0.05) was too strict", solution: "Raised to 0.15 after analysis of real EAR distributions", tag: "Solved", cls: "tag-green" },
                { title: "Head pose sensitivity", problem: "System invalidated too many frames", solution: "Relaxed limits + EMA smoothing + matrix fallback", tag: "Solved", cls: "tag-green" },
                { title: "Landmark jitter", problem: "MediaPipe landmarks fluctuate frame-to-frame", solution: "Exponential Moving Average (alpha=0.4) across frames", tag: "Solved", cls: "tag-green" },
                { title: "Lighting conditions", problem: "No IR camera — visible light only", solution: "Known limitation. IR camera ordered, pending delivery.", tag: "Known", cls: "tag-orange" },
                { title: "Seatbelt data", problem: "No large in-vehicle dataset from driver-facing angle", solution: "Supervisor will provide data. Roboflow as interim source.", tag: "Pending", cls: "tag-orange" },
              ].map((c) => (
                <div key={c.title} className="pres-card" style={{ position: "relative" }}>
                  <span className={`tag ${c.cls}`} style={{ position: "absolute", top: 16, right: 16 }}>{c.tag}</span>
                  <h3 style={{ fontSize: 15, marginBottom: 10, paddingRight: 70 }}>{c.title}</h3>
                  <p style={{ fontSize: 12, color: "#999", marginBottom: 4 }}><strong>Problem:</strong> {c.problem}</p>
                  <p style={{ fontSize: 12, color: "#666" }}><strong>Solution:</strong> {c.solution}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SLIDE 12 — Questions ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">OPEN QUESTIONS · NEXT STEPS</p>
            <h2>What we need to resolve</h2>
            <div className="two-col" style={{ display: "flex", gap: 48, marginTop: 20 }}>
              <div style={{ flex: 1 }}>
                <h3>❓ Questions</h3>
                {[
                  "Is per-driver EAR calibration at session start acceptable for MVP, or do we need a universal model?",
                  "YOLOv5 vs YOLOv8 for compliance on Pi 4 — any performance recommendation?",
                  "Will a deep-learning fatigue model beat EAR/MAR/PERCLOS enough to justify extra complexity on Raspberry Pi 4?",
                  "For smoking detection, should we stay landmark-based or train a dedicated model, given the very limited driver-smoking dataset?",
                ].map((q, i) => (
                  <div key={i} style={{ borderLeft: "2px solid hsl(var(--border))", paddingLeft: 14, marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 600, color: "hsl(var(--primary))" }}>{i + 1}.</span> {q}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <h3>🗺️ Roadmap to MVP</h3>
                <div style={{ borderLeft: "2px solid hsl(var(--border))", paddingLeft: 24 }}>
                  {[
                    { date: "Now", text: "Seatbelt + phone fine-tuning", highlight: false },
                    { date: "April 6", text: "Head pose + gaze validated on Pi", highlight: false },
                    { date: "April 27", text: "Full integration running at 15 FPS", highlight: false },
                    { date: "May 10", text: "Evaluation + technical report", highlight: false },
                    { date: "May 15", text: "Academic MVP submission", highlight: true },
                  ].map((item) => (
                    <div key={item.date} style={{ position: "relative", marginBottom: 22 }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: "50%",
                        background: item.highlight ? "hsl(var(--primary))" : "#ddd",
                        border: item.highlight ? "3px solid hsl(var(--primary) / 0.3)" : "none",
                        position: "absolute", left: -31, top: 4,
                      }} />
                      <p style={{ fontWeight: 600, fontSize: 14, color: item.highlight ? "hsl(var(--primary))" : "hsl(var(--text-primary))", margin: 0 }}>{item.date}</p>
                      <p style={{ fontSize: 13, color: "#999", margin: "2px 0 0" }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 36 }}>
              <p style={{ fontWeight: 500, fontSize: 20, letterSpacing: "-0.01em" }}>Thank you — questions welcome</p>
              <p style={{ fontSize: 13, color: "#bbb" }}>Live demo available on request</p>
            </div>
          </div>
        </section>

      </div>

      {seatbeltDemoOpen && (
        <div
          onClick={() => setSeatbeltDemoOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 10, 10, 0.72)",
            zIndex: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(900px, 100%)",
              background: "#111",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.15)",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
              <strong style={{ fontSize: 14 }}>Seatbelt model demo (first 7 seconds)</strong>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href="/seatbelt_video.mp4"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "none",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.35)",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 14,
                  }}
                >
                  Open file
                </a>
                <button
                  onClick={() => setSeatbeltDemoOpen(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.35)",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            {seatbeltVideoState === "error" && (
              <div style={{ padding: "12px 16px", background: "#2a1f1f", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                <p style={{ margin: 0, color: "#ffd7d7", fontSize: 13, lineHeight: 1.5 }}>
                  {seatbeltVideoReason}
                </p>
                <p style={{ margin: "6px 0 0", color: "#ffb3b3", fontSize: 12 }}>
                  Recommended fix: re-export this demo as MP4 H.264 (avc1) and keep the same filename.
                </p>
              </div>
            )}
            <video
              ref={seatbeltVideoRef}
              src="/seatbelt_video.mp4"
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

/* ===== Sub-components ===== */
function PerclosBar() {
  const segments = Array.from({ length: 60 }, (_, i) =>
    [4, 5, 12, 13, 23, 24, 25, 38, 39, 50].includes(i) ? "closed" : "open"
  );
  return (
    <div style={{ display: "flex", width: "100%", height: 44, borderRadius: 10, overflow: "hidden", border: "1px solid hsl(var(--border))", background: "white" }}>
      {segments.map((s, i) => (
        <div key={i} style={{
          flex: 1,
          background: s === "closed" ? "hsl(var(--primary))" : "#e8f5e9",
          transition: "opacity 300ms ease",
          borderRight: i < 59 ? "1px solid rgba(0,0,0,0.03)" : "none",
        }} />
      ))}
    </div>
  );
}

function EyeDiagram() {
  const positions = [
    { label: "Left", cx: 28, ratio: "0.28" },
    { label: "Forward", cx: 50, ratio: "0.50" },
    { label: "Right", cx: 72, ratio: "0.72" },
  ];
  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center" }}>
      {positions.map((p) => (
        <div key={p.label} style={{ textAlign: "center", padding: "20px 16px", background: "hsl(var(--surface))", borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
          <svg width="100" height="50" viewBox="0 0 100 50">
            <ellipse cx="50" cy="25" rx="45" ry="20" fill="none" stroke="#ddd" strokeWidth="2" />
            <circle cx={p.cx} cy="25" r="12" fill="hsl(var(--primary))" opacity="0.15" />
            <circle cx={p.cx} cy="25" r="8" fill="hsl(var(--primary))" opacity="0.6" />
            <circle cx={p.cx} cy="25" r="3.5" fill="#1a1a1a" />
          </svg>
          <p style={{ fontSize: 13, fontWeight: 600, marginTop: 8, color: p.label === "Forward" ? "#2e7d32" : "#e65100" }}>{p.label}</p>
          <p style={{ fontSize: 11, color: "#bbb", fontFamily: "'Courier New', monospace" }}>h = {p.ratio}</p>
        </div>
      ))}
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
