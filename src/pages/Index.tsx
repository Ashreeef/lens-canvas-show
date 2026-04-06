import { useEffect, useRef, useState, useCallback } from "react";

const SLIDES = [
  "Title",
  "Why it matters",
  "System overview",
  "Face Mesh",
  "EAR and MAR",
  "PERCLOS",
  "Gaze estimation",
  "Compliance",
  "Progress",
  "Challenges",
  "Questions",
];

const TOTAL = SLIDES.length;

export default function Index() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

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
  }, [current, scrollTo]);

  // IntersectionObserver for fade-in
  useEffect(() => {
    const els = document.querySelectorAll(".slide-inner");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      }),
      { threshold: 0.2 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="slide-counter">{pad(current + 1)} / {pad(TOTAL)}</div>
      <div className="side-dots">
        {SLIDES.map((t, i) => (
          <button
            key={i}
            className={`side-dot ${i === current ? "active" : ""}`}
            data-title={t}
            onClick={() => scrollTo(i)}
          />
        ))}
      </div>

      <div className="pres-container" ref={containerRef}>
        {/* Slide 1 — Title */}
        <section className="slide">
          <div className="slide-inner" style={{ textAlign: "center" }}>
            <p className="section-label">ENSIA × QAREEB · 2025–2026</p>
            <h1>Driver Monitoring System</h1>
            <h2 style={{ color: "hsl(var(--text-secondary))", fontWeight: 400 }}>
              Real-time fatigue, gaze and compliance detection
            </h2>
            <p style={{ color: "#888", fontSize: 14 }}>
              Edge AI deployment on Raspberry Pi 4
            </p>
          </div>
          <div className="dark-strip">
            <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", marginBottom: 8 }}>
                {["Ashref", "Hamza", "Imen", "Yacine"].map((n) => (
                  <span key={n} style={{ fontSize: 15, fontWeight: 500 }}>{n}</span>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "#999", margin: 0 }}>Supervised by faculty advisor</p>
            </div>
          </div>
        </section>

        {/* Slide 2 — Why it matters */}
        <section className="slide">
          <div className="slide-inner">
            <div className="two-col" style={{ display: "flex", gap: 60, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 300, color: "hsl(var(--primary))", lineHeight: 1 }}>1 in 5</div>
                <p style={{ marginTop: 8 }}>serious road crashes involve driver fatigue</p>
                <div style={{ fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 300, color: "hsl(var(--primary))", lineHeight: 1, marginTop: 32 }}>Top 3</div>
                <p style={{ marginTop: 8 }}>causes of fleet accidents: fatigue, distraction, non-compliance</p>
              </div>
              <div style={{ flex: 1 }}>
                <p className="section-label">THE PROBLEM</p>
                <h2>Why does this matter?</h2>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    "Driver fatigue causes 20–30% of serious accidents",
                    "Distraction (phone, gaze) is a leading crash factor",
                    "Fleet operators have strict, unmonitored safety rules",
                    "Manual supervision is impossible at scale",
                  ].map((t, i) => (
                    <li key={i} style={{ paddingLeft: 16, borderLeft: "2px solid hsl(var(--primary))" }}>{t}</li>
                  ))}
                </ul>
                <p style={{ fontSize: 12, color: "#999", marginTop: 24, textAlign: "right" }}>Industrial partner: Qareeb (oil & gas)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 3 — System overview */}
        <section className="slide">
          <div className="slide-inner">
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <p className="section-label">SYSTEM OVERVIEW</p>
              <h2>One camera. Five detections. Fully offline.</h2>
            </div>
            {/* Pipeline */}
            <div className="pipeline" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 40, flexWrap: "wrap" }}>
              {["Camera", "Raspberry Pi 4", "Face Mesh"].map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 500 }}>{label}</div>
                  <span style={{ color: "hsl(var(--primary))", margin: "0 8px", fontSize: 18 }}>→</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Fatigue", "Gaze", "Seatbelt", "Phone", "Smoking"].map((l) => (
                  <div key={l} style={{ border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 500 }}>{l}</div>
                ))}
              </div>
            </div>
            {/* Cards */}
            <div className="grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
              {[
                { name: "Fatigue Detection", status: "Live", cls: "tag-green" },
                { name: "Gaze Estimation", status: "Live", cls: "tag-green" },
                { name: "Seatbelt", status: "In progress", cls: "tag-orange" },
                { name: "Phone Usage", status: "In progress", cls: "tag-orange" },
                { name: "Smoking", status: "In progress", cls: "tag-orange" },
              ].map((c) => (
                <div key={c.name} className="card" style={{ textAlign: "center" }}>
                  <span className={`tag ${c.cls}`} style={{ marginBottom: 8 }}>{c.status}</span>
                  <p style={{ fontWeight: 500, fontSize: 13, marginTop: 8 }}>{c.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Slide 4 — Face Mesh */}
        <section className="slide">
          <div className="slide-inner">
            <div className="two-col" style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p className="section-label">TECHNICAL CONCEPTS 1 / 4</p>
                <h2>Face mesh — how we see the driver</h2>
                <p style={{ maxWidth: 480 }}>
                  MediaPipe Face Mesh detects 468 three-dimensional landmark points on the driver's face in every frame. These landmarks are the foundation for every metric in the system — without them, nothing else works.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                  {[
                    ["468 landmarks", "including 71 per eye, dense around mouth"],
                    ["3D coordinates", "x, y, z per point, depth included"],
                    ["CPU real-time", "no GPU, runs on Raspberry Pi 4"],
                    ["Offline", "loaded from .task file, no internet required"],
                  ].map(([t, d]) => (
                    <div key={t} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                      <span style={{ color: "hsl(var(--primary))", fontSize: 18 }}>•</span>
                      <div><strong style={{ fontSize: 14 }}>{t}</strong> <span style={{ color: "#888", fontSize: 13 }}>— {d}</span></div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, fontSize: 13, color: "#888" }}>
                  <p>Head pose: pitch, yaw, roll computed from 6 stable landmarks</p>
                  <p>Validity flag: frame rejected if |yaw| &gt; 60° or |pitch| &gt; 40°</p>
                </div>
              </div>
              <div style={{ flex: 1, background: "hsl(var(--surface))", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, padding: 32 }}>
                <p style={{ fontWeight: 500, fontSize: 16, color: "#aaa" }}>Face mesh diagram</p>
                <p style={{ fontSize: 13, color: "#ccc", marginTop: 8, textAlign: "center" }}>468 landmarks on face, dense around eyes and mouth</p>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 5 — EAR and MAR */}
        <section className="slide">
          <div className="slide-inner">
            <div className="two-col" style={{ display: "flex", gap: 48 }}>
              {/* EAR */}
              <div style={{ flex: 1 }}>
                <p className="section-label">TECHNICAL CONCEPTS 2 / 4</p>
                <h3>Eye Aspect Ratio (EAR)</h3>
                <div className="formula-block">EAR = (‖P2−P6‖ + ‖P3−P5‖) / (2 · ‖P1−P4‖)</div>
                <div className="threshold-row" style={{ borderColor: "#2e7d32" }}><span className="tag tag-green">Open</span> EAR ≈ 0.30 – 0.40</div>
                <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">Drowsy</span> EAR ≈ 0.15 – 0.25</div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}><span className="tag tag-red">Closed</span> EAR &lt; 0.10</div>
                <p style={{ fontSize: 12, color: "#999", marginTop: 12 }}>Alert: EAR below threshold for 4+ consecutive frames</p>
                <p style={{ fontSize: 12, color: "#999" }}>Calibrated per driver — 10-second baseline at session start</p>
              </div>
              {/* MAR */}
              <div style={{ flex: 1 }}>
                <h3 style={{ marginTop: 24 }}>Mouth Aspect Ratio (MAR)</h3>
                <div className="formula-block">MAR = (‖M2−M6‖ + ‖M3−M5‖) / (2 · ‖M1−M4‖)</div>
                <div className="threshold-row" style={{ borderColor: "#ccc" }}><span className="tag" style={{ background: "#eee", color: "#666" }}>Closed</span> MAR ≈ 0.03 – 0.13</div>
                <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">Slight</span> MAR ≈ 0.30 – 0.45</div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}><span className="tag tag-red">Yawn</span> MAR &gt; 0.45 sustained 2.5s+</div>
                <p style={{ fontSize: 12, color: "#999", marginTop: 12 }}>Duration filter prevents speech false positives</p>
                <p style={{ fontSize: 12, color: "#999" }}>Yawn counter: 3+ yawns in 5 min → fatigue alert</p>
              </div>
            </div>
            <div style={{ marginTop: 24, background: "hsl(var(--surface))", borderRadius: 6, padding: "10px 16px", fontSize: 13, textAlign: "center", color: "#888" }}>
              Both metrics computed directly from face mesh landmarks — zero additional models required
            </div>
          </div>
        </section>

        {/* Slide 6 — PERCLOS */}
        <section className="slide">
          <div className="slide-inner">
            <div className="two-col" style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p className="section-label">TECHNICAL CONCEPTS 3 / 4</p>
                <h2>PERCLOS — the drowsiness gold standard</h2>
                <p>Validated by the US Federal Highway Administration (1990s). The most reliable physiological measure of driver drowsiness.</p>
                <div className="formula-block">PERCLOS = closed_frames / total_frames (over 60-second window)</div>
                <div className="threshold-row" style={{ borderColor: "#ccc" }}><span className="tag" style={{ background: "#eee", color: "#666" }}>&lt; 8%</span> Alert, normal driving</div>
                <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">8–15%</span> Mild drowsiness, log event</div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}><span className="tag tag-red">&gt; 15%</span> Moderate drowsiness, audio warning</div>
                <div className="threshold-row" style={{ borderColor: "#8b0000" }}><span className="tag" style={{ background: "#5c0000", color: "white" }}>&gt; 25%</span> Severe, immediate alert</div>
                <div style={{ background: "#e3f2fd", borderRadius: 6, padding: "12px 16px", marginTop: 16, fontSize: 13 }}>
                  A single blink doesn't affect PERCLOS.<br />
                  10 seconds of closed eyes in 60 seconds = 17% → alert.
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>60-second rolling window</p>
                <PerclosBar />
                <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>PERCLOS = red segments / total ≈ 17% → alert</p>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 7 — Gaze estimation */}
        <section className="slide">
          <div className="slide-inner">
            <div className="two-col" style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p className="section-label">TECHNICAL CONCEPTS 4 / 4</p>
                <h2>Gaze estimation</h2>
                <p>MediaPipe provides iris landmarks (5 points per eye). We measure where the iris sits within the eye bounding box.</p>
                <div className="formula-block">h_ratio = (iris_x − eye_left) / eye_width</div>
                <div className="formula-block">v_ratio = (iris_y − eye_top) / eye_height</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                  <div className="threshold-row" style={{ borderColor: "#2e7d32" }}><span className="tag tag-green">FORWARD</span> h ∈ [0.35, 0.65] and v ∈ [0.35, 0.65]</div>
                  <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">LEFT</span> h &lt; 0.35</div>
                  <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">RIGHT</span> h &gt; 0.65</div>
                  <div className="threshold-row" style={{ borderColor: "#e65100" }}><span className="tag tag-orange">DOWN</span> v &gt; 0.65</div>
                </div>
                <p style={{ fontSize: 12, color: "#999", marginTop: 12 }}>Head turn ≠ gaze direction — they are separated</p>
                <p style={{ fontSize: 12, color: "#999" }}>Alert fires after 2 continuous seconds away from forward</p>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <EyeDiagram />
              </div>
            </div>
          </div>
        </section>

        {/* Slide 8 — Compliance */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">COMPLIANCE DETECTION</p>
            <div className="two-col" style={{ display: "flex", gap: 20, marginBottom: 20 }}>
              <div className="card" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Seatbelt detection</h3>
                  <span className="tag tag-green">Object detection</span>
                </div>
                {["YOLOv10n (Apache 2.0, NMS-free)", "Detects diagonal strap across chest", "Training: NCAI dataset + Roboflow", "Alert confirmed after 2 seconds"].map((t) => (
                  <p key={t} style={{ paddingLeft: 12, borderLeft: "2px solid hsl(var(--border))", margin: "6px 0", fontSize: 13 }}>{t}</p>
                ))}
              </div>
              <div className="card" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Phone usage detection</h3>
                  <span className="tag tag-green">Object detection</span>
                </div>
                {["COCO pre-trained class 67 (cell phone)", "Zero fine-tuning needed for baseline", "Combined with head pose (yaw > 20°)", "Alert after 2 seconds confirmed"].map((t) => (
                  <p key={t} style={{ paddingLeft: 12, borderLeft: "2px solid hsl(var(--border))", margin: "6px 0", fontSize: 13 }}>{t}</p>
                ))}
              </div>
            </div>
            <div className="card" style={{ background: "hsl(var(--surface))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Smoking detection</h3>
                <span className="tag tag-purple">Landmark-based</span>
              </div>
              <p>Cigarettes are too small to detect reliably at vehicle distances. Instead: MediaPipe Hand landmarks measure proximity of hand to mouth.</p>
              <div className="formula-block">hand_to_mouth_distance &lt; threshold for &gt; 1 second → alert</div>
              <p style={{ fontSize: 12, color: "#999" }}>Reuses existing MediaPipe pipeline — no additional model required</p>
            </div>
          </div>
        </section>

        {/* Slide 9 — Progress */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">CURRENT PROGRESS</p>
            <h2>What we have built</h2>
            <div className="two-col" style={{ display: "flex", gap: 40, marginTop: 20 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: "#2e7d32" }}>Working now</h3>
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
                  <p key={t} style={{ fontSize: 13, margin: "6px 0", display: "flex", gap: 8 }}>
                    <span style={{ color: "#2e7d32" }}>✓</span> {t}
                  </p>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: "#e65100" }}>In progress</h3>
                {[
                  "Seatbelt — YOLO pipeline set up, threshold tuning",
                  "Phone — zero-shot baseline confirmed working",
                  "Smoking — hand proximity logic implemented",
                  "Raspberry Pi 4 — deployment and performance validation",
                ].map((t) => (
                  <p key={t} style={{ fontSize: 13, margin: "6px 0", display: "flex", gap: 8 }}>
                    <span style={{ color: "#e65100" }}>◐</span> {t}
                  </p>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 24, background: "#fff5f5", borderLeft: "3px solid hsl(var(--primary))", borderRadius: 6, padding: "14px 20px", fontSize: 13 }}>
              <strong>Live demo available</strong> — system runs in real time on laptop. EAR, MAR, PERCLOS, gaze direction and alerts visible per frame.
            </div>
          </div>
        </section>

        {/* Slide 10 — Challenges */}
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
                <div key={c.title} className="card" style={{ position: "relative" }}>
                  <span className={`tag ${c.cls}`} style={{ position: "absolute", top: 16, right: 16 }}>{c.tag}</span>
                  <h3 style={{ fontSize: 15, marginBottom: 10, paddingRight: 60 }}>{c.title}</h3>
                  <p style={{ fontSize: 12, color: "#999", marginBottom: 4 }}><strong>Problem:</strong> {c.problem}</p>
                  <p style={{ fontSize: 12, color: "#666" }}><strong>Solution:</strong> {c.solution}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Slide 11 — Questions */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">OPEN QUESTIONS · NEXT STEPS</p>
            <h2>What we need to resolve</h2>
            <div className="two-col" style={{ display: "flex", gap: 48, marginTop: 20 }}>
              <div style={{ flex: 1 }}>
                <h3>Questions</h3>
                {[
                  "MOUTH_MAR landmark indices are unverified — how to confirm empirically without ground-truth labels?",
                  "Is per-driver EAR calibration at session start acceptable for MVP, or do we need a universal model?",
                  "RTMDet vs YOLOv10n for compliance on Pi 4 — any performance recommendation?",
                  "Supervisor dataset format unknown — how to integrate quickly once received?",
                ].map((q, i) => (
                  <div key={i} style={{ borderLeft: "2px solid hsl(var(--border))", paddingLeft: 14, marginBottom: 14, fontSize: 13 }}>
                    <span style={{ fontWeight: 500, color: "hsl(var(--primary))" }}>{i + 1}.</span> {q}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <h3>Roadmap to MVP</h3>
                <div style={{ borderLeft: "2px solid hsl(var(--border))", paddingLeft: 20 }}>
                  {[
                    { date: "Now", text: "Seatbelt + phone fine-tuning", highlight: false },
                    { date: "April 6", text: "Head pose + gaze validated on Pi", highlight: false },
                    { date: "April 27", text: "Full integration running at 15 FPS", highlight: false },
                    { date: "May 10", text: "Evaluation + technical report", highlight: false },
                    { date: "May 15", text: "Academic MVP submission", highlight: true },
                  ].map((item) => (
                    <div key={item.date} style={{ position: "relative", marginBottom: 20 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: item.highlight ? "hsl(var(--primary))" : "hsl(var(--border))",
                        position: "absolute", left: -26, top: 4,
                      }} />
                      <p style={{ fontWeight: 500, fontSize: 13, color: item.highlight ? "hsl(var(--primary))" : "hsl(var(--text-primary))", margin: 0 }}>{item.date}</p>
                      <p style={{ fontSize: 13, color: "#888", margin: 0 }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <p style={{ fontWeight: 500, fontSize: 18 }}>Thank you — questions welcome</p>
              <p style={{ fontSize: 13, color: "#999" }}>Live demo available on request</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/* Sub-components */
function PerclosBar() {
  // 60 segments, some red
  const segments = Array.from({ length: 60 }, (_, i) =>
    [4, 5, 12, 13, 23, 24, 25, 38, 39, 50].includes(i) ? "closed" : "open"
  );
  return (
    <div style={{ display: "flex", width: "100%", height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid hsl(var(--border))" }}>
      {segments.map((s, i) => (
        <div key={i} style={{ flex: 1, background: s === "closed" ? "hsl(var(--primary))" : "#e8f5e9" }} />
      ))}
    </div>
  );
}

function EyeDiagram() {
  const positions = [
    { label: "left", cx: 28 },
    { label: "forward", cx: 50 },
    { label: "right", cx: 72 },
  ];
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
      {positions.map((p) => (
        <div key={p.label} style={{ textAlign: "center" }}>
          <svg width="100" height="50" viewBox="0 0 100 50">
            <ellipse cx="50" cy="25" rx="45" ry="20" fill="none" stroke="#ccc" strokeWidth="2" />
            <circle cx={p.cx} cy="25" r="10" fill="hsl(var(--primary))" opacity="0.8" />
            <circle cx={p.cx} cy="25" r="4" fill="#1a1a1a" />
          </svg>
          <p style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{p.label}</p>
          <p style={{ fontSize: 10, color: "#999" }}>h ≈ {(p.cx / 100).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
