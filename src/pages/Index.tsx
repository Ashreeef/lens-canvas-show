import { useEffect, useRef, useState, useCallback } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "../styles/presentation.css";

const SLIDES = [
  "Titre",
  "Pourquoi c'est important",
  "Contraintes",
  "Architecture du système",
  "Contrat partagé",
  "DL · 3 axes",
  "DL · ce qui blesse",
  "Maillage du visage",
  "EAR + calibration",
  "MAR + PERCLOS",
  "Fusion du regard",
  "Ceinture de sécurité",
  "Téléphone",
  "Tabagisme",
  "Score de fatigue",
  "Moteur d'alertes",
  "Discipline de config",
  "Exécution & démo",
  "Performance",
  "Décisions techniques",
  "Périmètre & feuille de route",
  "Conclusion",
];

const TOTAL = SLIDES.length;

const DEMO_VIDEOS = {
  fatigue: { title: "Démo du module fatigue", src: "/fatigue_video.mp4" },
  seatbelt: { title: "Démo du module ceinture", src: "/seatbelt_vid.mp4" },
  phone: { title: "Démo du module téléphone", src: "/phone_video.mp4" },
  smoking: { title: "Démo du module tabagisme", src: "/smoking_video.mp4" },
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
      setDemoVideoReason("Le navigateur a bloqué la lecture ou ne peut pas décoder ce format vidéo.");
    });
    const onTimeUpdate = () => { if (video.currentTime >= 50) video.pause(); };
    const onLoadedData = () => { setDemoVideoState("ready"); setDemoVideoReason(""); };
    const onError = () => {
      setDemoVideoState("error");
      setDemoVideoReason("Cette vidéo de démo ne peut pas être lue dans ce navigateur (codec non pris en charge ou fichier manquant).");
    };
    const loadingTimeout = window.setTimeout(() => {
      if (video.readyState < 2) {
        setDemoVideoState("error");
        setDemoVideoReason("La vidéo n'a pas pu être chargée pour la lecture intégrée. Essayez de l'ouvrir directement ou de la réexporter en H.264 (avc1).");
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

        {/* ===== 1 — Titre ===== */}
        <section className="slide">
          <div className="slide-bg-accent" style={{ top: -100, right: -100 }} />
          <div className="slide-bg-accent" style={{ bottom: -150, left: -150 }} />
          <div className="slide-inner" style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 36, marginBottom: 20 }}>
              <img src="/ensia_logo.png" alt="ENSIA" style={{ height: 64, objectFit: "contain" }} />
              <div style={{ width: 1, height: 50, background: "#ddd" }} />
              <img src="/qareeb_logo.ico" alt="Qareeb" style={{ height: 64, objectFit: "contain" }} />
            </div>
            <p className="section-label" style={{ justifyContent: "center" }}>ENSIA × QAREEB · SOUTENANCE FINALE · 2025–2026</p>
            <h1 style={{ marginBottom: 8, letterSpacing: "-0.03em" }}>
              <span style={{ color: "hsl(var(--primary))" }}>Q-Vision</span>
            </h1>
            <h2 style={{ color: "hsl(var(--text-primary))", fontWeight: 400, fontSize: "clamp(20px, 2.6vw, 30px)", marginTop: 0 }}>
              Surveillance en temps réel de la fatigue et de la sécurité du conducteur
            </h2>
            <p style={{ color: "#666", fontSize: 14, marginTop: 8, fontWeight: 500 }}>
              Surveillance en cabine par IA Edge sur Raspberry Pi 4 — entièrement hors ligne
            </p>
            <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
              Fatigue · Regard · Ceinture · Téléphone · Tabagisme — un seul pipeline à 15 FPS
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, padding: "8px 14px", background: "#fff7ed", border: "1px solid #ffd6a8", borderRadius: 100, fontSize: 12, color: "#7c3a05" }}>
              <span style={{ fontSize: 14 }}>🛡</span>
              À l'occasion de la <strong style={{ margin: "0 4px" }}>Journée mondiale de la sécurité et de la santé au travail</strong> — 28 avril 2026
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
                  Encadré par <span style={{ color: "#bbb", fontWeight: 500 }}>Mounir Ouadi</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 2 — Pourquoi c'est important ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">PROBLÈME</p>
            <h2>La fatigue au volant fait partie des 3 premières causes d'accidents mortels</h2>
            <div className="two-col" style={{ display: "flex", gap: 36, alignItems: "stretch", marginTop: 18 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: "clamp(56px, 7vw, 96px)", fontWeight: 200, color: "hsl(var(--primary))", lineHeight: 1, letterSpacing: "-0.03em" }}>~20%</div>
                <p style={{ marginTop: 8, fontSize: 15, color: "#666" }}>des accidents mortels dans le monde impliquent la fatigue ou la distraction du conducteur (OMS, 2023).</p>
                <div style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 200, color: "hsl(var(--primary))", lineHeight: 1, marginTop: 36, letterSpacing: "-0.03em" }}>0 / 24h</div>
                <p style={{ marginTop: 8, fontSize: 15, color: "#666" }}>de connexion Internet sur les sites typiques de Qareeb — le système doit fonctionner entièrement hors ligne.</p>
              </div>
              <div style={{ flex: 1.1 }}>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
                  Les solutions existantes de surveillance en cabine échouent sur au moins l'un de ces axes :
                </p>
                {[
                  ["Dépendant du cloud", "Problèmes de confidentialité ; inutile sans connectivité sur sites isolés."],
                  ["Dépendant du GPU", "Coût et consommation incompatibles avec les flottes. Aucun GPU automobile à ce prix."],
                  ["Mono-modalité", "Seulement EAR ou seulement YOLO — taux élevé de faux positifs ; les conducteurs ne font plus confiance aux alertes."],
                  ["Licence AGPL", "Bloquant commercial pour Qareeb ; la famille YOLOv5 est exclue."],
                ].map(([t, d]) => (
                  <div key={t} style={{ display: "flex", gap: 12, padding: "10px 14px", marginBottom: 8, background: "hsl(var(--surface))", borderRadius: 8, borderLeft: "3px solid hsl(var(--primary))" }}>
                    <strong style={{ fontSize: 13, minWidth: 150 }}>{t}</strong>
                    <span style={{ color: "#666", fontSize: 13 }}>{d}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, padding: "12px 16px", background: "#fff5f5", borderRadius: 10, border: "1px solid #ffd6d6", fontSize: 13, color: "#8b1e1e" }}>
                  <strong>Cahier des charges de Qareeb :</strong> détecter la fatigue <em>et</em> la conformité de sécurité (ceinture, téléphone, tabagisme) sur du matériel edge bon marché embarqué dans chaque véhicule utilitaire.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3 — Contraintes ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">CONTRAINTES DE CONCEPTION</p>
            <h2>Pourquoi l'ADAS embarqué est plus difficile que l'ADAS cloud</h2>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 16 }}>
              <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { tag: "Matériel", title: "Raspberry Pi 4, CPU uniquement", body: "ARM 4 cœurs, sans GPU, sans NPU. ≥ 15 FPS de bout en bout est l'engagement — en deçà, ce n'est plus du temps réel." },
                  { tag: "Capteur", title: "Une seule caméra RGB fixe", body: "640×480 @ 15 fps, montée en cabine. Lumière visible uniquement (caméra IR commandée, pas encore arrivée)." },
                  { tag: "Réseau", title: "Entièrement hors ligne", body: "Pas d'inférence cloud, pas de remontée télémétrique. Modèles chargés depuis des fichiers locaux .task / .pt / .onnx." },
                  { tag: "Mémoire", title: "Threading, jamais multiprocessing", body: "La RAM du RPi est limitée. Le GIL n'est pas un problème — chaque appel bloquant est une inférence I/O-bound, qui le libère." },
                  { tag: "Licence", title: "Apache 2.0 uniquement", body: "YOLOv8 / YOLOv10 sont sous Apache 2.0. YOLOv5 (AGPL-3.0) est exclu du chemin de build de production." },
                ].map((c) => (
                  <div key={c.title} className="pres-card" style={{ padding: "12px 16px" }}>
                    <span className="tag tag-blue" style={{ marginBottom: 6 }}>{c.tag}</span>
                    <h3 style={{ fontSize: 15, margin: "6px 0 4px" }}>{c.title}</h3>
                    <p style={{ margin: 0, fontSize: 12, color: "#666" }}>{c.body}</p>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(var(--primary))", margin: "0 0 8px", fontWeight: 600 }}>Unité Edge</p>
                <h3 style={{ margin: "0 0 10px" }}>Raspberry Pi 4</h3>
                <RpiBoardVisual />
                <p style={{ fontSize: 12, color: "#777", marginTop: 12 }}>
                  Même matériel déployé sur toute la flotte. Mêmes fichiers de modèle. Mêmes seuils (modifiables par conducteur via une calibration de 10 secondes).
                </p>
                <div style={{ marginTop: "auto", fontSize: 11, color: "#999", borderTop: "1px dashed #ddd", paddingTop: 10 }}>
                  Budget : <strong>≤ 67 ms / image</strong> de bout en bout pour atteindre 15 FPS.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 4 — Architecture du système ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">ARCHITECTURE DU SYSTÈME</p>
            <h2>Un pipeline, six modules, image par image</h2>
            <ArchitectureDiagram />
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
              <img src="/system_pic.png" alt="Schéma de vue d'ensemble du système" style={{ maxWidth: 360, width: "100%", height: "auto", borderRadius: 10, boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }} />
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 14, fontSize: 11, color: "#777", flexWrap: "wrap", justifyContent: "center" }}>
              <span>● Flèche pleine = synchrone, thread principal</span>
              <span>┄ Flèche pointillée = démon asynchrone, protégé par verrou</span>
              <span>◯ Tous les modules lisent et modifient un <code>result_dict</code> partagé</span>
            </div>
          </div>
        </section>

        {/* ===== 5 — Contrat partagé ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">DISCIPLINE DE CONCEPTION</p>
            <h2>Le contrat <code>result_dict</code></h2>
            <div className="two-col" style={{ display: "flex", gap: 32, marginTop: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1.05 }}>
                <p style={{ fontSize: 14, color: "#555" }}>
                  Chaque calcul par image lit, modifie et retourne le même dictionnaire. Pas de bus de messages,
                  pas de pattern observer, pas de file d'événements. Le dict <em>est</em> l'image.
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
                  ["Pourquoi un seul dict", "L'inférence est de toute façon séquentielle par image. Un objet mutable partagé remplace 20 dataclasses et 200 lignes de plomberie."],
                  ["Pourquoi les seuils en YAML", "Reparamétrer pour un nouveau pool de conducteurs est un changement de fichier, pas une recompilation. Jamais de nombres magiques dans le code."],
                  ["Pourquoi les indices de landmarks dans un seul module", "Les 478 landmarks ont des significations non triviales. Centraliser la table évite que le même bug d'EAR soit réintroduit dans trois fichiers."],
                  ["Pourquoi threading et non multiprocessing", "L'inférence libère le GIL ; le multiprocessing quadruplerait l'empreinte RAM des modèles, ce que le RPi 4 ne peut pas se permettre."],
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

        {/* ===== 6 — Module 4 · Trois axes ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 4 · FATIGUE DL (HAMZA) — 1 / 2</p>
            <h2>Trois approches, un pipeline d'évaluation, une leçon difficile</h2>
            <p style={{ fontSize: 13, color: "#666", marginTop: 4, marginBottom: 12 }}>
              Testées en parallèle : un hybride CNN+LSTM, un modèle à base de graphe <strong>LiteFat</strong>, et un classifieur State Farm 10 classes purement image.
              Les trois ont traversé un pipeline d'évaluation unifié sur <strong>YawDD</strong> et <strong>3MDAD</strong>.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
              <AxisCard
                color="#3b82f6"
                badge="Axe 1"
                title="Hybride CNN + LSTM"
                steps={["Dlib 68 lm", "6 ratios + score AlexNet", "7-D / image", "LSTM 150 img", "Somnolent ?"]}
                note="Structurel (LEM, REM, LEBM, REBM, MM, inclinaison de tête) ⊕ score global AlexNet → vecteur 7-D → LSTM sur 150 images. Les flux compensent leurs faiblesses respectives."
              />
              <AxisCard
                color="#10b981"
                badge="Axe 2 · LiteFat"
                title="Graphe spatio-temporel"
                steps={["68 lm (X,Y,c)", "ctx MobileNetV3", "X = C·w·dᵀ", "Adj. adaptative", "GCN + TCN à porte"]}
                note="Visage modélisé comme un graphe. Adjacence adaptative apprise de bout en bout. ≈1,3 M de paramètres contre ≈226 M pour JHPFA-Net — le seul modèle du rapport pouvant raisonnablement tourner dans un véhicule."
              />
              <AxisCard
                color="#f59e0b"
                badge="Axe 3 · State Farm"
                title="CNN de distraction à 10 classes"
                steps={["Image cabine", "224×224 + aug.", "MobileNet/ResNet", "Tête fine-tunée", "Softmax · 10 cls"]}
                note="Transfer learning purement image. Étend la fatigue au SMS / téléphone / boisson / atteinte / cheveux / parole. Split par conducteur obligatoire — un split aléatoire gonfle silencieusement la précision."
              />
            </div>
            <div className="two-col" style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
              <div style={{ flex: 1.15, background: "#fff", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--primary))", margin: "0 0 6px", fontWeight: 600 }}>
                  Constat clé · écart papier-vs-réalité
                </p>
                <PaperVsRealityChart />
              </div>
              <div style={{ flex: 0.85, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="pres-card" style={{ padding: "10px 14px", background: "#fff5f5", borderColor: "#ffd6d6" }}>
                  <strong style={{ fontSize: 12, color: "#8b1e1e" }}>YOLOv8 in-domain sur DDD</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8b1e1e" }}>
                    Précision 0,999 · Rappel 1,000 · mAP 0,995 — semble parfait.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "10px 14px", background: "#fff5f5", borderColor: "#ffd6d6" }}>
                  <strong style={{ fontSize: 12, color: "#8b1e1e" }}>YOLOv8 cross-dataset sur YawDD</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8b1e1e" }}>
                    Précision ≈ 0,50 · F1 = <strong>0,06</strong> · AUC ≈ 0,54 — à peine mieux que le hasard.
                  </p>
                </div>
                <div style={{ background: "#0f172a", color: "#e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 12, lineHeight: 1.5 }}>
                  <strong style={{ color: "#fbbf24" }}>Et alors ?</strong> Les modèles s'appuient sur des indices spécifiques au dataset. Changez l'angle de caméra, la lumière ou le pool de conducteurs et ces indices disparaissent. La précision sur un seul dataset n'est <em>pas</em> une métrique de déploiement.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 7 — Module 4 · Ce qui blesse ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 4 · FATIGUE DL (HAMZA) — 2 / 2</p>
            <h2>Éclairage et angle pèsent plus que le choix d'architecture</h2>
            <div className="two-col" style={{ display: "flex", gap: 16, marginTop: 12, alignItems: "stretch" }}>
              <div style={{ flex: 1.05, background: "#fff", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--primary))", margin: "0 0 6px", fontWeight: 600 }}>
                  Éclairage et occlusion (style NTHU-DDD)
                </p>
                <LightingOcclusionChart />
                <p style={{ fontSize: 11, color: "#666", margin: "6px 0 0" }}>
                  Le structurel s'effondre à <strong>38 %</strong> sur Night-Glasses (Dlib perd les landmarks en IR). L'hybride reste <strong>≥ 80 %</strong> partout.
                </p>
              </div>
              <div style={{ flex: 0.95, background: "#fff", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--primary))", margin: "0 0 6px", fontWeight: 600 }}>
                  Angle de caméra (3MDAD)
                </p>
                <CameraAngleChart />
                <p style={{ fontSize: 11, color: "#666", margin: "6px 0 0" }}>
                  <strong>88 % → 47 %</strong> lorsque la caméra passe de frontale à ±45°. Les datasets sont entraînés de face ; les caméras de production ne sont pas placées de face.
                </p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 14 }}>
              {[
                { n: "01", color: "#ef4444", title: "Écart papier-vs-réalité", body: "Précision sur un seul dataset ≠ performance en déploiement." },
                { n: "02", color: "#f59e0b", title: "Éclairage + angle dominent", body: "Un modèle simple au bon angle bat un modèle sophistiqué au mauvais angle." },
                { n: "03", color: "#10b981", title: "L'hybride dégrade en douceur", body: "Le CNN+LSTM fusionné reste ≥ 80 % sur chaque scénario NTHU, y compris Night-Glasses." },
                { n: "04", color: "#3b82f6", title: "Le léger est obligatoire", body: "Les cibles embarquées excluent les stacks lourds — LiteFat (1,3 M paramètres) est la direction réaliste." },
                { n: "05", color: "#8b5cf6", title: "Splits par sujet", body: "Les splits aléatoires placent le même conducteur en train + val. Toujours grouper par conducteur." },
              ].map((c) => (
                <div key={c.n} className="pres-card" style={{ padding: "10px 12px", borderTop: `3px solid ${c.color}` }}>
                  <div style={{ fontSize: 10, color: c.color, fontWeight: 700, letterSpacing: "0.05em" }}>LEÇON {c.n}</div>
                  <strong style={{ fontSize: 12, display: "block", marginTop: 4 }}>{c.title}</strong>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "#666", lineHeight: 1.4 }}>{c.body}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
              <div style={{ flex: 1, background: "#fff7ed", border: "1px solid #ffd6a8", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#7c3a05" }}>
                <strong>Pourquoi ce n'est pas sur le chemin principal RPi 4 de Q-Vision.</strong> Même LiteFat (le plus petit des trois) est plus lourd qu'EAR/MAR/PERCLOS, et l'écart cross-dataset signifie qu'on ne pouvait pas faire confiance à une tête de fatigue boîte noire dans un véhicule pour lequel nous n'avions pas fine-tuné. Module 2 + FatigueScorer reste le chemin déployé ; le travail DL éclaire les modes de défaillance de Q-Vision (IR, hors axe) et oriente la feuille de route caméra IR.
              </div>
            </div>
          </div>
        </section>

        {/* ===== 8 — Module 1 Maillage du visage ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 1 · MAILLAGE DU VISAGE</p>
            <h2>478 landmarks, matrice de pose 4×4 gratuite, stabilisée par EMA</h2>
            <div className="two-col" style={{ display: "flex", gap: 36, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Bibliothèque — MediaPipe Tasks API</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Pas l'ancienne <code>mp.solutions.face_mesh</code>. La Tasks API charge depuis un fichier local <code>.task</code>
                    (hors ligne par construction) et expose la <strong>matrice de transformation faciale</strong> — un proxy 4×4 gratuit pour la pose de tête.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Pose de tête — solvePnP à partir de 6 landmarks</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Nez, menton, coins externes des deux yeux, coins de la bouche. Repli sur la matrice de transformation MediaPipe
                    lorsque <code>|yaw| &gt; 90°</code> ou que solvePnP ne converge pas.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>LandmarkStabilizer — EMA, α = 0,4</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Réinitialisé après 1 seconde sans visage détecté — empêche les anciens landmarks de contaminer les ré-acquisitions.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px" }}>
                  <strong style={{ fontSize: 13 }}>Filtre de validité</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    <code>|yaw| ≤ 60°</code> et <code>|pitch| ≤ 40°</code> — en dehors, chaque module en aval voit <code>valid=False</code> et passe.
                    Les offsets de montage caméra sont soustraits <em>avant</em> le contrôle (configurable par véhicule).
                  </p>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{ width: "100%", background: "#fff", borderRadius: 12, border: "1px solid hsl(var(--border))", padding: 12 }}>
                  <img src="/face_mesh_overview.png" alt="Maillage du visage MediaPipe — 478 landmarks" style={{ width: "100%", maxHeight: 280, objectFit: "contain", borderRadius: 8 }} />
                  <p style={{ fontSize: 11, color: "#888", textAlign: "center", marginTop: 8 }}>478 landmarks par image · 5 points d'iris / œil · coordonnées 3-D normalisées</p>
                </div>
                <div style={{ width: "100%", background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#555" }}>
                  <strong>Pourquoi cette stack :</strong> capable hors ligne, matrice de transformation gratuite, activement maintenue, Apache 2.0.
                  Pas de dépendance PyTorch sur le chemin d'inférence — uniquement ONNX Runtime + MediaPipe.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 9 — EAR + calibration ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 2 · FATIGUE — EAR</p>
            <h2>Eye Aspect Ratio, calibré par conducteur</h2>
            <div className="two-col" style={{ display: "flex", gap: 36, alignItems: "flex-start", marginTop: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid hsl(var(--border))", padding: 10, marginBottom: 10 }}>
                  <img src="/ear.png" alt="EAR — œil ouvert vs œil fermé, six landmarks" style={{ width: "100%", maxHeight: 170, objectFit: "contain", display: "block" }} />
                </div>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{EAR} = \frac{\|P_2 - P_6\| + \|P_3 - P_5\|}{2 \cdot \|P_1 - P_4\|}`}</Latex>
                </div>
                <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>
                  Œil droit <code>[33, 160, 158, 133, 153, 144]</code> · Œil gauche <code>[362, 385, 387, 263, 373, 380]</code>.
                  Ratio invariant à l'échelle · moyenne glissante sur 10 images · par œil, puis moyenné.
                </p>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10, background: "#f0fdf4", borderColor: "#86efac" }}>
                  <strong style={{ fontSize: 13, color: "#15803d" }}>EARCalibrator — préchauffe 10 s</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#365314" }}>
                    Collecte des échantillons œil ouvert, rejette les valeurs aberrantes hors [0,10 ; 0,65], calcule la baseline.
                    <br />
                    <code>alert_threshold = baseline × 0.75</code>
                    <br />
                    <code>perclos_threshold = baseline × 0.27</code>
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "#365314", fontStyle: "italic" }}>
                    Pourquoi : l'anatomie varie d'environ 30 % entre conducteurs. Les seuils universels manquent les conducteurs fatigués aux yeux naturellement étroits, ou se déclenchent à tort sur les conducteurs aux yeux larges.
                  </p>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16 }}>Deux alertes pilotées par EAR</h3>
                <div className="threshold-row" style={{ borderColor: "#e65100" }}>
                  <span className="tag tag-orange">Somnolence (EAR)</span>
                  <span style={{ fontSize: 12 }}>EAR &lt; alert_threshold pendant <strong>12 images</strong> ≈ 800 ms</span>
                </div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}>
                  <span className="tag tag-red">Fatigue (tendance EAR)</span>
                  <span style={{ fontSize: 12 }}>Buffer de 30 images · moyenne première moitié − moyenne seconde moitié &gt; <strong>0,06</strong></span>
                </div>
                <div style={{ background: "#e8f4fd", border: "1px solid #bbdefb", borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#1565c0" }}>
                  <strong>Pourquoi 12 images @ 15 FPS = 800 ms ?</strong> Plus long qu'un clignement normal (≤ 400 ms). En dessous, les clignements déclencheraient à tort.
                </div>
                <div style={{ background: "#fff7ed", border: "1px solid #ffd6a8", borderRadius: 10, padding: "10px 14px", marginTop: 10, fontSize: 12, color: "#7c3a05" }}>
                  <strong>Alerte de tendance unique.</strong> « Fatigue (tendance EAR) » se déclenche une fois, puis se réarme seulement après récupération — empêche le signal de tendance de spammer le conducteur.
                </div>
                <div style={{ background: "hsl(var(--surface))", borderRadius: 10, padding: "10px 14px", marginTop: 10, fontSize: 12, color: "#555", borderLeft: "3px solid hsl(var(--primary))" }}>
                  <strong>Dans le Module 6 :</strong> lorsque la bande globale de fatigue prend le relais, ces sous-alertes sont supprimées — le système parle d'une seule voix.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 10 — MAR + PERCLOS ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 2 · FATIGUE — MAR &amp; PERCLOS</p>
            <h2>Bâillements + pourcentage de fermeture des yeux</h2>
            <div className="two-col" style={{ display: "flex", gap: 32, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <h3>MAR — Mouth Aspect Ratio (ratio d'aspect de la bouche)</h3>
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid hsl(var(--border))", padding: 10, marginBottom: 10 }}>
                  <img src="/mar.jpg" alt="MAR — bouche fermée vs bouche ouverte, landmarks" style={{ width: "100%", maxHeight: 150, objectFit: "contain", display: "block" }} />
                </div>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{MAR} = \frac{\|\text{top} - \text{bottom}\|}{\|\text{left} - \text{right}\|}`}</Latex>
                </div>
                <p style={{ fontSize: 12, color: "#666" }}>
                  Indices <strong>13</strong> (centre lèvre supérieure), <strong>14</strong> (centre lèvre inférieure), <strong>78</strong> (coin gauche), <strong>308</strong> (coin droit).
                </p>
                <div style={{ background: "#e8f4fd", border: "1px solid #bbdefb", borderRadius: 10, padding: "10px 14px", marginTop: 8, fontSize: 12, color: "#1565c0" }}>
                  <strong>Pourquoi les centres (13/14) plutôt que 82/87/312/317 ?</strong> 13/14 sont les points verticaux extrêmes et bougent ~2× plus pendant un bâillement — signal plus propre, moins de bruit.
                </div>
                <div className="threshold-row" style={{ borderColor: "#e65100", marginTop: 10 }}>
                  <span className="tag tag-orange">Alerte bâillement</span>
                  <span style={{ fontSize: 12 }}>MAR &gt; <strong>0,55</strong> maintenu pendant <strong>2,5 s</strong> (auparavant 2,0 — durci contre la parole)</span>
                </div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}>
                  <span className="tag tag-red">Fréquence des bâillements</span>
                  <span style={{ fontSize: 12 }}><strong>3+</strong> bâillements confirmés sur une fenêtre glissante de <strong>5 minutes</strong></span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3>PERCLOS — Pourcentage de fermeture des yeux</h3>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{PERCLOS} = \frac{N_{\text{closed}}}{N_{\text{window}}} \quad \text{window} = 60\,\text{s} \times \text{fps}`}</Latex>
                </div>
                <PerclosBar />
                <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                  900 images @ 15 FPS · retourne <code>None</code> jusqu'au remplissage du buffer (l'overlay affiche « buffering… » pendant les 60 premières secondes).
                </p>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))", marginTop: 8 }}>
                  <span className="tag tag-red">Alerte</span>
                  <span style={{ fontSize: 12 }}>PERCLOS &gt; <strong>15 %</strong> de fermeture soutenue</span>
                </div>
                <div style={{ background: "#fff7ed", border: "1px solid #ffd6a8", borderRadius: 10, padding: "10px 14px", marginTop: 10, fontSize: 12, color: "#7c3a05" }}>
                  <strong>Pourquoi 60 secondes ?</strong> Convention de l'industrie depuis que la FHWA a validé PERCLOS comme métrique de référence de la somnolence dans les années 1990. Un clignement isolé ne change rien ; un microsommeil prolongé, si.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 11 — Fusion du regard ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 3 · REGARD</p>
            <h2>Fusion à deux niveaux : pose de tête en primaire, iris en repli</h2>
            <div className="two-col" style={{ display: "flex", gap: 32, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1.1 }}>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>1. Pose de tête en primaire (toujours disponible)</strong>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, marginTop: 6, padding: "8px 10px", background: "hsl(var(--surface))", borderRadius: 6 }}>
                    |yaw| &gt; 20°  → « gauche » / « droite »<br />
                    pitch  &gt; 15°  → « bas »<br />
                    pitch  &lt; -10° → « haut »<br />
                    sinon         → repli sur l'iris
                  </div>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>2. Déviation de l'iris (tête quasi-droite uniquement)</strong>
                  <div className="formula-block" style={{ margin: "6px 0 0", padding: "10px 14px" }}>
                    <Latex display>{String.raw`\Delta h = h - h_{\text{neutral}},\ \Delta v = v - v_{\text{neutral}}`}</Latex>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#666" }}>
                    Seuils : <code>|Δh| &gt; 0,14</code> · <code>Δv &lt; -0,10</code> (haut) · <code>Δv &gt; 0,12</code> (bas).
                    <br />Neutre = <em>médiane</em> des échantillons de calibration (robuste aux valeurs aberrantes).
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#fff7ed", borderColor: "#ffd6a8" }}>
                  <strong style={{ fontSize: 13, color: "#b45309" }}>Filtrage de calibration — la partie non triviale</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#7c3a05" }}>
                    Les échantillons de calibration sont uniquement collectés lorsque <code>|yaw| &lt; 10°</code> ET <code>|pitch| &lt; 8°</code>.
                    Les ratios d'iris se déforment en projection 3-D à grands angles de tête ; si on les acceptait, le « droit devant » lui-même serait biaisé.
                  </p>
                </div>
              </div>
              <div style={{ flex: 0.9 }}>
                <h3 style={{ fontSize: 16 }}>Stabilité & alertes</h3>
                <div className="threshold-row" style={{ borderColor: "#e65100" }}>
                  <span className="tag tag-orange">confirm_frames</span>
                  <span style={{ fontSize: 12 }}><strong>8 images</strong> ≈ 533 ms avant que <code>stable_direction</code> change</span>
                </div>
                <div className="threshold-row" style={{ borderColor: "hsl(var(--primary))" }}>
                  <span className="tag tag-red">Distraction (Regard)</span>
                  <span style={{ fontSize: 12 }}>Non-droit-devant stable pendant <strong>4,0 s</strong> (auparavant 2,5 — passe les vérifications de rétroviseurs)</span>
                </div>
                <div style={{ marginTop: 12, background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "10px 14px" }}>
                  <strong style={{ fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", color: "#666" }}>Indicateur de débogage de l'overlay</strong>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12 }}>
                    <span><code>[H]</code> piloté par tête</span>
                    <span><code>[I]</code> piloté par iris</span>
                    <span><code>[?]</code> pré-calibration</span>
                  </div>
                </div>
                <div style={{ marginTop: 14, background: "#fff5f5", border: "1px solid #ffd6d6", borderRadius: 10, padding: "10px 14px" }}>
                  <strong style={{ fontSize: 12, color: "#8b1e1e" }}>Historique des bugs (maturité de débogage)</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: 11, color: "#8b1e1e", lineHeight: 1.6 }}>
                    <li>G/D fantômes à grand yaw → résolu par la primauté de la tête</li>
                    <li>Calibration en plein coup d'œil → résolu par filtrage</li>
                    <li>« Haut » totalement manquant → ajout de la branche <code>Δv &lt; -seuil</code></li>
                    <li>Haut/bas inversés en pré-cal → corrigé</li>
                    <li>Faux déclenchements sur vérification de rétroviseurs → confirm 8, alerte 4,0 s</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 12 — Ceinture ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 5 · CONFORMITÉ — CEINTURE</p>
            <h2>Trois pipelines, sélectionnables à l'exécution</h2>
            <p style={{ fontSize: 13, color: "#666", marginTop: 4, marginBottom: 14 }}>
              Les trois s'exécutent dans le thread démon <code>ComplianceWorker</code>. Résultats asynchrones fusionnés dans <code>result_dict</code> à chaque image ; la boucle principale du face-mesh ne bloque jamais sur YOLO.
            </p>
            <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              {[
                {
                  n: "1",
                  flag: "--seatbelt-pipeline 1",
                  title: "YOLOv5s → YOLOv8n",
                  desc: "Extraction de ROI puis classification du patch.",
                  caveat: "YOLOv5 est en AGPL-3.0 — utilisé pour l'instant via les poids torch.hub. Sera ré-entraîné sur YOLOv8 avant le déploiement Qareeb.",
                  rec: false,
                },
                {
                  n: "2",
                  flag: "--seatbelt-pipeline 2 (par défaut)",
                  title: "ROI Pose → YOLOv8n + MobileNetV3 → RANSAC + EMA",
                  desc: "MediaPipe Pose découpe le torse, YOLOv8n détecte, MobileNetV3 classe le patch, RANSAC ajuste une droite diagonale de la sangle comme a priori géométrique. Fusion : CNN 0,10 / YOLO 0,90.",
                  caveat: "La plus robuste. Choix par défaut pour la démo et le MVP Qareeb.",
                  rec: true,
                },
                {
                  n: "3",
                  flag: "--seatbelt-pipeline 3",
                  title: "YOLOv8n image entière + EMA / Vote majoritaire",
                  desc: "Le plus simple, le plus rapide, moins robuste à l'occlusion. Baseline utile pour l'ablation.",
                  caveat: "",
                  rec: false,
                },
              ].map((p) => (
                <div key={p.n} className="pres-card" style={{ flex: 1, position: "relative", borderColor: p.rec ? "hsl(var(--primary))" : undefined, padding: "14px 16px" }}>
                  {p.rec && <span className="tag tag-red" style={{ position: "absolute", top: 12, right: 12 }}>Par défaut</span>}
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
                <strong style={{ fontSize: 13 }}>Hystérésis asymétrique</strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                  <strong>24 images</strong> pour confirmer ON · <strong>27 images (~1,8 s)</strong> pour confirmer OFF.
                  <br />Rapide à faire confiance à la sangle, lent à acter le « off » — le scintillement est réel, la perte de sangle ne l'est pas.
                </p>
              </div>
              <div className="pres-card" style={{ flex: 1, padding: "12px 14px" }}>
                <strong style={{ fontSize: 13 }}>Essayé et abandonné — lisseur BiLSTM</strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                  <code>seatbelt_bilstm.pt</code> entraîné comme alternative apprise à l'EMA. N'a pas amélioré la précision/rappel sur nos clips de test et a ajouté de la latence. EMA + RANSAC conservés.
                </p>
              </div>
              <button
                onClick={() => openDemo("seatbelt")}
                style={{ alignSelf: "stretch", border: "1px solid hsl(var(--border))", background: "#fff", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                ▶ Lancer la démo ceinture
              </button>
            </div>
          </div>
        </section>

        {/* ===== 13 — Téléphone ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 5 · CONFORMITÉ — TÉLÉPHONE</p>
            <h2>Téléphone — YOLOv8n fine-tuné avec correspondance de classes robuste aux labels</h2>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1.05 }}>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Modèle — YOLOv8n fine-tuné sur le dataset téléphone Roboflow</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Poids sous licence Apache 2.0 et dataset (CC BY 4.0). Entraîné en 640×640, AdamW, 50 epochs,
                    augmentation mosaïque + flip horizontal + HSV-V, patience 20.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Correspondance de classes robuste aux labels</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Les datasets étiquettent les téléphones de façon incohérente. Nous comparons le nom de classe prédit (en minuscules)
                    à l'ensemble d'alias <code>{"{phone, cell phone, cellphone, mobile}"}</code>. Cela permet de remplacer
                    le modèle par n'importe quel détecteur de téléphone commercial sans modification de code.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>HIDDEN_CLASSES — suppresseur de faux positifs</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    <code>{"{wheel, steering wheel}"}</code> sont <em>activement supprimés</em>. Le volant est
                    la principale source de faux positifs sous l'angle d'une caméra conducteur (rond, sombre, souvent occlus par la main).
                    Nous écartons ces boîtes avant qu'elles n'atteignent le moteur d'alertes.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px" }}>
                  <strong style={{ fontSize: 13 }}>Confiance 0,25 — délibérément plus basse que la ceinture</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Les téléphones sont souvent partiellement occlus par la main ou tenus contre la joue. Un seuil plus élevé
                    rate de vrais appels. Nous compensons en aval par l'hystérésis confirm 8 images + clear 20 images.
                  </p>
                </div>
              </div>
              <div style={{ flex: 0.95, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#fff5f5", borderColor: "#ffd6d6" }}>
                  <strong style={{ fontSize: 13, color: "#8b1e1e" }}>Pourquoi pas d'hybride (main-près-de-l'oreille) pour le téléphone ?</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8b1e1e" }}>
                    Depuis une caméra orientée conducteur, l'oreille est fréquemment occluse par le montant du pare-brise ou
                    l'appui-tête. La distance main-oreille devient un canal de bruit. YOLO seul a surpassé toutes les variantes fusionnées
                    que nous avons testées.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px" }}>
                  <strong style={{ fontSize: 13 }}>Placement dans le pipeline</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    S'exécute dans <code>ComplianceWorker</code> aux côtés de la ceinture et du tabagisme — asynchrone, protégé par verrou,
                    fusionné dans <code>result_dict</code> à chaque image. Latence moyenne ~29 ms · p95 ~41 ms (CPU portable).
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#f0fdf4", borderColor: "#86efac" }}>
                  <strong style={{ fontSize: 13, color: "#15803d" }}>Pourquoi pas COCO tel quel ?</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#365314" }}>
                    La classe 67 de COCO (cell phone) est entraînée sur des photos lifestyle, pas sur des angles cabine. Le rappel sur des séquences
                    conducteur était faible. Le modèle fine-tuné sur Roboflow augmente nettement le mAP@50 sur nos clips de test.
                  </p>
                </div>
                <button
                  onClick={() => openDemo("phone")}
                  style={{ alignSelf: "stretch", border: "1px solid hsl(var(--border))", background: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  ▶ Lancer la démo téléphone
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 14 — Tabagisme ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 5 · CONFORMITÉ — TABAGISME</p>
            <h2>Tabagisme — modèle tiers + filtre par landmarks</h2>
            <div style={{ background: "#fff7ed", border: "1px solid #ffd6a8", borderRadius: 10, padding: "12px 16px", marginTop: 8, fontSize: 13, color: "#7c3a05" }}>
              <strong>Transparence.</strong> Nous n'avons pas entraîné notre propre modèle de tabagisme. Les datasets de tabagisme en cabine
              sont extrêmement rares — des séquences annotées en perspective conducteur à l'échelle nécessaire au fine-tuning
              ne sont pas publiquement disponibles, et nous manquions de ressources pour les collecter et les annoter. Nous avons donc intégré
              un modèle open-source à la place.
            </div>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1.05 }}>
                <div className="pres-card" style={{ padding: "14px 16px", marginBottom: 10 }}>
                  <span className="tag tag-blue">Modèle amont</span>
                  <h3 style={{ fontSize: 14, margin: "8px 0 4px" }}>alihassanml / Smoking-detection-yolo11</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Poids YOLO11 open-source depuis{" "}
                    <a href="https://github.com/alihassanml/Smoking-detection-yolo11" target="_blank" rel="noreferrer" style={{ color: "hsl(var(--primary))" }}>
                      github.com/alihassanml/Smoking-detection-yolo11
                    </a>.
                    Étiquette de classe <code>"Smooking"</code> (sic — conservée à l'identique pour compatibilité avec les poids amont).
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "14px 16px", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Ce que nous avons ajouté par-dessus</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "#555", lineHeight: 1.7 }}>
                    <li><strong>Branche A — filtre par landmarks :</strong> MediaPipe Hand + Pose, distance main-bouche + bonus d'angle de coude + pénalité de vitesse</li>
                    <li><strong>Branche B — détection :</strong> l'ONNX YOLO11 amont</li>
                    <li><strong>Fusion de scores :</strong> <code>s = 0,10 × landmark + 0,90 × détection</code> — piloté par la détection, désambiguïsé par les landmarks</li>
                    <li><strong>Temporel :</strong> fenêtre glissante de 8 images · confirmation à 5+ · clear sous 0,30</li>
                  </ul>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", background: "hsl(var(--surface))" }}>
                  <strong style={{ fontSize: 13 }}>Intégration en double mode</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Branché dans le pipeline complet, le module tabagisme réutilise les landmarks faciaux du Module 1 plutôt que
                    de faire tourner son propre détecteur de visage — économise une inférence complète par image.
                  </p>
                </div>
              </div>
              <div style={{ flex: 0.95, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#fff5f5", borderColor: "#ffd6d6" }}>
                  <strong style={{ fontSize: 13, color: "#8b1e1e" }}>Limites assumées</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: 12, color: "#8b1e1e", lineHeight: 1.6 }}>
                    <li>Les données d'entraînement amont ne sont pas spécifiques aux conducteurs — la généralisation aux angles cabine n'est pas vérifiée</li>
                    <li>La cigarette est un petit objet ; le rappel chute en basse résolution</li>
                    <li>La classe « panache de fumée » est peu fiable dans les habitacles</li>
                  </ul>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#f0fdf4", borderColor: "#86efac" }}>
                  <strong style={{ fontSize: 13, color: "#15803d" }}>Pourquoi ce choix reste défendable pour un MVP</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#365314" }}>
                    La couche de fusion + hystérésis temporelle est <em>la nôtre</em>, et fonctionne avec n'importe quel détecteur
                    binaire de tabagisme. Remplacer le modèle amont plus tard (une fois un vrai dataset conducteur disponible)
                    est un changement d'une ligne dans <code>configs/model_paths.yaml</code>.
                  </p>
                </div>
                <button
                  onClick={() => openDemo("smoking")}
                  style={{ alignSelf: "stretch", border: "1px solid hsl(var(--border))", background: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  ▶ Lancer la démo tabagisme
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 15 — Score de fatigue ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 6 · SCORE DE FATIGUE</p>
            <h2>Un seul nombre (0..1) remplace trois alertes concurrentes</h2>
            <div className="two-col" style={{ display: "flex", gap: 28, marginTop: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1.05 }}>
                <p style={{ fontSize: 13, color: "#666", marginTop: 0 }}>
                  Contributions par image, chacune clampée à <code>[0, 1]</code> :
                </p>
                <div className="formula-block">
                  <Latex display>{String.raw`c_{\text{ear}} = \mathrm{clamp}\!\left(\frac{0.85B - \text{EAR}}{0.35\,B}\right)`}</Latex>
                </div>
                <div className="formula-block">
                  <Latex display>{String.raw`c_{\text{perclos}} = \mathrm{clamp}\!\left(\frac{\text{PERCLOS}}{0.30}\right)`}</Latex>
                </div>
                <p style={{ fontSize: 12, color: "#666", margin: "6px 0" }}>
                  <code>c_yawn</code> = impulsion +0,40 par bâillement confirmé, décroît linéairement sur 8 s.
                  <br /><code>c_gaze</code> = 0,6 si une alerte Distraction (Regard) est actuellement active.
                </p>
                <div className="formula-block">
                  <Latex display>{String.raw`\text{raw} = 0.35\,c_{\text{ear}} + 0.45\,c_{\text{perclos}} + 0.15\,c_{\text{yawn}} + 0.05\,c_{\text{gaze}}`}</Latex>
                </div>
                <p style={{ fontSize: 12, color: "#666" }}>
                  EMA sur <code>raw</code> : <strong>attaque rapide</strong> (α=0,15), <strong>décroissance lente</strong> (plancher absolu −0,05/s) — monte vite quand les indices s'accumulent, ne s'effondre pas à zéro sur une seule bonne image.
                </p>
              </div>
              <div style={{ flex: 0.95 }}>
                <h3 style={{ fontSize: 16 }}>Bandes avec hystérésis</h3>
                <p style={{ fontSize: 12, color: "#666" }}>Pour <em>descendre</em> d'une bande, le score doit chuter de <strong>0,10</strong> sous le seuil — évite les oscillations.</p>
                <FatigueScoreBar />
                <div style={{ marginTop: 14, background: "#fff5f5", border: "1px solid #ffd6d6", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#8b1e1e" }}>
                  <strong>Crucial :</strong> lorsque la bande prend le relais, les sous-alertes EAR / MAR / PERCLOS sont <em>supprimées</em>.
                  Le système parle d'une seule voix sur la fatigue.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 16 — Moteur d'alertes ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">MODULE 6 · MOTEUR D'ALERTES & AUDIO</p>
            <h2>Post-traitement en trois étapes, quatre niveaux de sévérité</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
              <div className="pres-card" style={{ padding: "14px 16px" }}>
                <span className="tag tag-blue">Étape 1</span>
                <h3 style={{ fontSize: 14, margin: "8px 0 4px" }}>Hystérésis de conformité</h3>
                <p style={{ fontSize: 12, color: "#666", margin: "0 0 6px" }}>Compteurs asymétriques par classe :</p>
                <ul style={{ paddingLeft: 16, fontSize: 12, color: "#666", lineHeight: 1.7, margin: 0 }}>
                  <li>ceinture : <strong>24</strong> ON / <strong>27</strong> OFF</li>
                  <li>tabagisme : <strong>8</strong> ON / <strong>20</strong> OFF</li>
                  <li>téléphone : <strong>8</strong> ON / <strong>20</strong> OFF</li>
                </ul>
              </div>
              <div className="pres-card" style={{ padding: "14px 16px" }}>
                <span className="tag tag-orange">Étape 2</span>
                <h3 style={{ fontSize: 14, margin: "8px 0 4px" }}>Bande de fatigue</h3>
                <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
                  Un seul score 0..1 → calme / léger / modéré / sévère.
                  <br />Sous-alertes supprimées quand la bande prend le relais.
                </p>
              </div>
              <div className="pres-card" style={{ padding: "14px 16px" }}>
                <span className="tag tag-red">Étape 3</span>
                <h3 style={{ fontSize: 14, margin: "8px 0 4px" }}>Distribution audio</h3>
                <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
                  Thread démon + file · WinMM MCI / aplay / afplay.
                  <br />Stdlib pur — aucune nouvelle dépendance pip.
                </p>
              </div>
            </div>
            <div style={{ marginTop: 16, overflow: "hidden", borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "hsl(var(--surface))" }}>
                    <th style={{ textAlign: "left", padding: "10px 14px" }}>Niveau</th>
                    <th style={{ textAlign: "left", padding: "10px 14px" }}>Délai d'attente</th>
                    <th style={{ textAlign: "left", padding: "10px 14px" }}>Son</th>
                    <th style={{ textAlign: "left", padding: "10px 14px" }}>Déclencheurs</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["info", "15 s", "Tonalité unique douce 880 Hz", "Alerte regard · conformité à faible sévérité"],
                    ["warn", "25 s", "Double tonalité 660 Hz", "Fréquence des bâillements · bande de fatigue modérée · téléphone/tabagisme confirmé"],
                    ["critical", "30 s", "Balayage 1200 → 500 Hz", "Ceinture OFF confirmée · deux alertes de conformité simultanées"],
                    ["severe", "45 s", "MP3 personnalisé (Hey_you_WAKE_UP!.mp3)", "Bande de fatigue sévère · escalade fatigue inter-modules"],
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
              <strong>Escalade inter-modules.</strong> Lorsque deux indicateurs de fatigue ou plus se déclenchent simultanément, le moteur les promeut en une seule alerte de niveau sévère <em>FATIGUE CRITIQUE</em> — un seul événement sonore, pas trois carillons concurrents.
            </div>
          </div>
        </section>

        {/* ===== 17 — Discipline de config ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">DISCIPLINE DE CONFIGURATION</p>
            <h2>Chaque seuil est une clé YAML</h2>
            <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
              Reparamétrer pour un nouveau pool de conducteurs, un nouveau véhicule ou une nouvelle région est un changement d'un fichier. Reparamétrer pour un nouveau licencié est un fork de <code>configs/</code>, pas du code.
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
              Les indices de landmarks vivent dans <code>src/face_mesh/landmark_utils.py</code> — jamais inlinés dans le code des détecteurs.
            </div>
          </div>
        </section>

        {/* ===== 18 — Exécution & démo ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">EXÉCUTION · MODES DÉMO</p>
            <h2>Point d'entrée unique, chaque module activable/désactivable</h2>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <CodeBlock>{`python scripts/run_demo.py
    # webcam, tous modules activés (défaut)

python scripts/run_demo.py --source video.mp4
    # fichier vidéo, lecture calée sur le temps réel

python scripts/run_demo.py --no-smoking
python scripts/run_demo.py --no-phone
python scripts/run_demo.py --no-compliance
    # activer/désactiver les modules individuellement

python scripts/run_demo.py --seatbelt-pipeline 3
    # ablation : pipeline simplifié

python scripts/run_demo.py --output annotated.mp4
    # sauvegarder la vidéo avec overlay rendu`}</CodeBlock>
                <div style={{ marginTop: 10, background: "hsl(var(--surface))", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#555", borderLeft: "3px solid hsl(var(--primary))" }}>
                  <strong>Frame-skipping pour les fichiers vidéo.</strong> L'exécution suit l'horloge murale vs FPS source — si l'inférence est plus lente que la source, des images sont écartées pour garder une lecture temps réel. Critique pour l'évaluation sur vidéos de référence.
                </div>
                <div style={{ marginTop: 10, background: "hsl(var(--surface))", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#555", borderLeft: "3px solid #2e7d32" }}>
                  <strong>Arrêt propre.</strong> <code>try / KeyboardInterrupt / finally</code> enveloppe la boucle principale — Ctrl+C quitte proprement, libère la caméra, joint les threads démons, vide le writer vidéo.
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16 }}>Overlay temps réel</h3>
                <ul style={{ margin: "0 0 0 16px", padding: 0, fontSize: 12, color: "#555", lineHeight: 1.8 }}>
                  <li>Compteur FPS — vert ≥ 15, rouge &lt; 15</li>
                  <li>EAR + baseline de calibration (ex. <code>EAR 0,31 / BL 0,34</code>)</li>
                  <li>MAR + seuil</li>
                  <li>Pourcentage PERCLOS + label de sévérité (OK / MILD / MOD / HIGH)</li>
                  <li>Nombre de bâillements</li>
                  <li><strong>Barre de score de fatigue (0..1) avec couleur de bande</strong></li>
                  <li>Direction du regard + source du signal <code>[H]/[I]/[?]</code></li>
                  <li>Pitch / yaw de la tête + méthode de pose</li>
                  <li>État de conformité (ceinture ON/OFF, tabagisme, téléphone)</li>
                  <li>Alertes actives classées par sévérité</li>
                  <li>Les alertes critique / sévère déclenchent une bannière rouge en haut</li>
                </ul>
                <button
                  onClick={() => openDemo("fatigue")}
                  style={{ marginTop: 14, border: "1px solid hsl(var(--border))", background: "#fff", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  ▶ Lancer la démo overlay fatigue
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 19 — Performance ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">PERFORMANCE · ÉVALUATION</p>
            <h2>Latence par composant avec <code>scripts/evaluate.py</code></h2>
            <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
              Mesures <code>Stopwatch</code> par composant · préchauffe de 30 images écartée · moyenne / p50 / p95 / p99 / max en millisecondes.
            </p>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1.1 }}>
                <div style={{ overflow: "hidden", borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "hsl(var(--surface))" }}>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Composant</th>
                        <th style={{ textAlign: "right", padding: "8px 12px" }}>moyenne</th>
                        <th style={{ textAlign: "right", padding: "8px 12px" }}>p95</th>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Thread</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Face mesh (MediaPipe)", "62 ms", "78 ms", "principal"],
                        ["Pose de tête (solvePnP)", "0,8 ms", "1,2 ms", "principal"],
                        ["EAR", "0,3 ms", "0,5 ms", "principal"],
                        ["MAR", "0,2 ms", "0,3 ms", "principal"],
                        ["PERCLOS", "0,4 ms", "0,6 ms", "principal"],
                        ["Regard", "0,9 ms", "1,4 ms", "principal"],
                        ["Score de fatigue", "0,2 ms", "0,3 ms", "principal"],
                        ["Ceinture (pipeline 2)", "48 ms", "62 ms", "async"],
                        ["Tabagisme (hybride)", "31 ms", "44 ms", "async"],
                        ["YOLO téléphone", "29 ms", "41 ms", "async"],
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
                  Mesuré sur i5 10ᵉ génération, 16 Go de RAM, sans GPU. Budget total du thread principal : <strong>~70–110 ms / image → 10–15 FPS soutenu</strong>.
                  Les modules de conformité tournent dans le thread démon <code>ComplianceWorker</code> et ne bloquent pas.
                </p>
              </div>
              <div style={{ flex: 0.9, display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#f0fdf4", borderColor: "#86efac" }}>
                  <strong style={{ fontSize: 13, color: "#15803d" }}>Ce qui fonctionne sur le portable</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#365314" }}>
                    Pipeline complet (les 5 détecteurs + score de fatigue + distribution audio) tient 10–15 FPS. La démo tourne de bout en bout sans intervention manuelle.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px", background: "#fff7ed", borderColor: "#ffd6a8" }}>
                  <strong style={{ fontSize: 13, color: "#b45309" }}>Point ouvert — benchmark RPi 4</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#7c3a05" }}>
                    Prêt de matériel par Qareeb en attente. Plan : exécuter <code>evaluate.py</code> sur une vidéo de conduite capturée de 5 minutes, confirmer ≥ 15 FPS en p95.
                  </p>
                </div>
                <div className="pres-card" style={{ padding: "12px 14px" }}>
                  <strong style={{ fontSize: 13 }}>Où passe le budget</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                    Le face mesh MediaPipe domine le thread principal (~60 % du budget). YOLO sur n'importe quelle branche (30–60 ms) tourne en async — sinon il ferait à lui seul exploser la cible de 67 ms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 20 — Décisions techniques ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">DÉCISIONS TECHNIQUES</p>
            <h2>Pourquoi chaque choix — et ce qu'il a coûté</h2>
            <div style={{ overflow: "auto", borderRadius: 12, border: "1px solid hsl(var(--border))", marginTop: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "hsl(var(--surface))" }}>
                    <th style={{ textAlign: "left", padding: "10px 14px", width: "30%" }}>Décision</th>
                    <th style={{ textAlign: "left", padding: "10px 14px" }}>Raison</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["MediaPipe Tasks API (pas l'ancienne version)", "Fichier .task hors ligne ; matrice de transformation 4×4 gratuite ; Apache 2.0."],
                    ["YOLOv8 / YOLOv10 (pas YOLOv5)", "L'AGPL-3.0 est un bloquant commercial pour Qareeb. v8/v10 sont sous Apache 2.0."],
                    ["Tabagisme : fusion YOLO ⊕ landmarks (0,10/0,90)", "YOLO voit l'objet, les landmarks voient le geste. L'un ou l'autre seul est fragile sur ce dataset."],
                    ["Téléphone : YOLO seul", "La main proche de l'oreille est peu fiable depuis une caméra orientée conducteur — l'oreille est souvent occultée par le montant."],
                    ["Calibration EAR par conducteur (préchauffe 10 s)", "Les seuils universels échouent ; l'ouverture oculaire varie d'environ 30 %. Acceptable opérationnellement de décaler."],
                    ["Threading, pas multiprocessing", "La RAM du RPi 4 est limitée ; le GIL est sans importance pour l'inférence I/O-bound."],
                    ["Déviation par rapport au regard neutre", "Les ratios d'iris absolus sont biaisés par l'anatomie. Le Δ par rapport à un neutre par conducteur est robuste."],
                    ["Thread démon ComplianceWorker", "YOLO 30–50 ms ferait exploser le budget de 67 ms du thread principal. Async + fusion protégée par verrou."],
                    ["FatigueScorer unique 0..1", "Les alertes indépendantes spamment le conducteur. L'humain s'intéresse à l'état global, pas au sous-signal déclenché."],
                    ["WinMM MCI / aplay / afplay pour l'audio", "Stdlib pur — aucune nouvelle dépendance pip ; un mode de défaillance en moins en déploiement."],
                    ["Hystérésis asymétrique de la ceinture (24/27)", "Le scintillement est réel, la perte de sangle ne l'est pas. Lent à valider OFF, rapide à confirmer ON."],
                    ["Contrat mutable partagé result_dict", "Remplace 20 dataclasses et 200 lignes de plomberie. Plus rapide sur RPi, plus simple à raisonner."],
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

        {/* ===== 21 — Périmètre & feuille de route ===== */}
        <section className="slide">
          <div className="slide-inner">
            <p className="section-label">PÉRIMÈTRE · POINTS OUVERTS</p>
            <h2>Ce qui n'est pas dans le MVP, et pourquoi c'est délibéré</h2>
            <div className="two-col" style={{ display: "flex", gap: 24, marginTop: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, color: "#7c3a05" }}>Coupes de périmètre délibérées</h3>
                {[
                  ["Module 4 — CNN-GRU sur le thread principal", "Implémenté et compétitif sur le F1, mais ne rentre pas encore dans le budget 15 FPS sur Raspberry Pi 4. La distillation + frame-skip est le chemin de résolution."],
                  ["Lisseur BiLSTM ceinture", "Entraîné comme alternative à l'EMA. N'a pas amélioré la précision/rappel sur nos clips, et a ajouté de la latence. Abandonné — EMA + RANSAC conservés."],
                  ["Support caméra IR", "Commandée, pas encore arrivée. Lumière visible uniquement pour le MVP — limite les cas d'usage nuit et lunettes de soleil."],
                  ["Adaptation à l'historique conducteur", "Les baselines par conducteur se réinitialisent à chaque session. L'apprentissage inter-sessions est hors périmètre ; pas de couche d'identification persistante du conducteur."],
                ].map(([t, d]) => (
                  <div key={t} className="pres-card" style={{ padding: "10px 14px", marginBottom: 8, background: "#fff7ed", borderColor: "#ffd6a8" }}>
                    <strong style={{ fontSize: 12, color: "#7c3a05" }}>{t}</strong>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "#7c3a05" }}>{d}</p>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, color: "#15803d" }}>Points ouverts</h3>
                {[
                  "Exécuter evaluate.py sur Raspberry Pi 4 pour confirmer 15 FPS sur des séquences de conduite réelles",
                  "Précision quantitative sur vidéo annotée (ceinture · téléphone · tabagisme)",
                  "Filtre de validité souple |roll| > 25° (MediaPipe se dégrade à cet angle)",
                  "Script d'auto-calibration du décalage de montage caméra (30 s de regard droit devant en début de session)",
                  "Distiller / frame-skipper la tête CNN-GRU pour qu'elle rentre dans le budget RPi 4",
                  "Support caméra IR dès réception du matériel — cas d'usage nuit / lunettes de soleil",
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
              <strong>Livraison MVP.</strong> Mai 2026. Chaque coupe ci-dessus a une raison claire et délimitée — aucune n'est inconnue.
            </div>
          </div>
        </section>

        {/* ===== 22 — Conclusion ===== */}
        <section className="slide">
          <div className="slide-bg-accent" style={{ top: -100, left: -100 }} />
          <div className="slide-bg-accent" style={{ bottom: -150, right: -150 }} />
          <div className="slide-inner" style={{ textAlign: "center" }}>
            <p className="section-label" style={{ justifyContent: "center" }}>RÉSUMÉ</p>
            <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)", marginBottom: 18 }}>Une caméra · cinq détecteurs<br />un score de fatigue · une voix</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, maxWidth: 900, margin: "0 auto" }}>
              {[
                { stat: "15 FPS", label: "Cible bout en bout sur Raspberry Pi 4" },
                { stat: "5 modules", label: "Fatigue · Regard · Ceinture · Téléphone · Tabagisme" },
                { stat: "Apache 2.0", label: "Licence propre pour déploiement commercial" },
                { stat: "0 appel cloud", label: "Entièrement hors ligne par construction" },
                { stat: "10 s", label: "Calibration EAR par conducteur en début de session" },
                { stat: "1 voix", label: "FatigueScorer + AlertEngine parlent d'une seule voix" },
              ].map((c) => (
                <div key={c.stat} className="pres-card" style={{ padding: "16px 14px" }}>
                  <div style={{ fontSize: 26, fontWeight: 200, color: "hsl(var(--primary))", letterSpacing: "-0.02em" }}>{c.stat}</div>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>{c.label}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 32 }}>
              <p style={{ fontWeight: 500, fontSize: 22, letterSpacing: "-0.01em", margin: 0 }}>Merci — questions bienvenues</p>
              <p style={{ fontSize: 13, color: "#999", marginTop: 6 }}>Démo en direct sur le portable · clips vidéo à un clic dans la présentation</p>
            </div>
            <div className="dark-strip">
              <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, marginBottom: 8 }}>
                  <img src="/ensia_logo.png" alt="ENSIA" style={{ height: 28, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                  <img src="/qareeb_logo.ico" alt="Qareeb" style={{ height: 28, objectFit: "contain" }} />
                </div>
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                  Berbaoui Ashref · Benelhadj Djelloul Imen · Gasmi Yassine · Khentache Hamza &nbsp; — &nbsp; Encadrant : Mounir Ouadi
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
              <strong style={{ fontSize: 14 }}>{activeDemo.title} (7 premières secondes)</strong>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={activeDemo.src} target="_blank" rel="noreferrer" style={{ textDecoration: "none", background: "transparent", border: "1px solid rgba(255,255,255,0.35)", color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 14 }}>Ouvrir le fichier</a>
                <button onClick={closeDemo} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.35)", color: "#fff", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>Fermer</button>
              </div>
            </div>
            {demoVideoState === "error" && (
              <div style={{ padding: "12px 16px", background: "#2a1f1f", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                <p style={{ margin: 0, color: "#ffd7d7", fontSize: 13, lineHeight: 1.5 }}>{demoVideoReason}</p>
                <p style={{ margin: "6px 0 0", color: "#ffb3b3", fontSize: 12 }}>Correctif recommandé : réexporter cette démo en MP4 H.264 (avc1) ou vérifier le chemin du fichier dans public/.</p>
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

/* ===================== Sous-composants ===================== */

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
        Fenêtre de 60 secondes · 10 fermés / 60 ≈ <strong>17 %</strong> → déclenche l'alerte (seuil 15 %)
      </p>
    </div>
  );
}

function FatigueScoreBar() {
  const bands = [
    { from: 0, to: 0.30, color: "#86efac", label: "calme", action: "silencieux" },
    { from: 0.30, to: 0.55, color: "#fde68a", label: "léger", action: "visuel seul" },
    { from: 0.55, to: 0.78, color: "#fdba74", label: "modéré", action: "carillon" },
    { from: 0.78, to: 1.00, color: "#fca5a5", label: "sévère", action: "MP3" },
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
    <svg width="100%" viewBox="0 0 320 170" role="img" aria-label="Carte Raspberry Pi 4 stylisée">
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

        {box(420, 10, 160, 44, "Caméra", "640×480 @ 15 FPS RGB", "#fff7ed", "#fdba74")}
        {arrow(500, 54, 500, 80)}

        {box(290, 80, 420, 64, "Module 1 · FaceMeshDetector", "MediaPipe Tasks · 478 landmarks · transform 4×4 · solvePnP · EMA(α=0.4)", "#e8f4fd", "#90caf9")}

        <rect x={50} y={170} width={900} height={32} rx={6} fill="#1a1a1a" />
        <text x={500} y={191} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="'JetBrains Mono', monospace">
          result_dict partagé — lire · modifier · retourner
        </text>
        {arrow(500, 144, 500, 168)}

        {box(60, 230, 180, 70, "Module 2 · Fatigue", "EAR · MAR · PERCLOS")}
        {box(265, 230, 180, 70, "Module 3 · Regard", "pose tête ⊕ fusion iris")}
        {box(470, 230, 180, 70, "Module 5 · Conformité", "Ceinture · Tabagisme · Téléphone", "#fff5f5", "#fca5a5")}
        {box(675, 230, 180, 70, "Module 4 · Fatigue DL", "3 axes · oriente feuille de route", "#f3f4f6", "#d1d5db")}

        {arrow(150, 202, 150, 228)}
        {arrow(355, 202, 355, 228)}
        {arrow(560, 202, 560, 228)}
        {arrow(765, 202, 765, 228, true)}

        <rect x={460} y={310} width={200} height={22} rx={4} fill="#fee2e2" stroke="#fca5a5" strokeDasharray="4,4" />
        <text x={560} y={325} textAnchor="middle" fontSize="10" fill="#7c3a05">Thread démon ComplianceWorker</text>
        {arrow(560, 300, 560, 332, true)}

        {box(220, 360, 560, 72, "Module 6 · Fusion + Gestionnaire d'alertes", "FatigueScorer (0..1, 4 bandes) · AlertEngine (hystérésis · sévérité · cooldown · voix unique) · AudioDispatcher", "#ecfccb", "#a3e635")}
        {arrow(150, 300, 380, 358)}
        {arrow(355, 300, 460, 358)}
        {arrow(560, 332, 560, 358, true)}

        {box(380, 450, 240, 28, "Overlay + alertes + audio", undefined, "#fff", "hsl(var(--primary))")}
        {arrow(500, 432, 500, 448)}
      </svg>
    </div>
  );
}

/* ===================== Graphiques Module 4 ===================== */

function AxisCard({
  color, badge, title, steps, note,
}: { color: string; badge: string; title: string; steps: string[]; note: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: "12px 14px", borderTop: `4px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ background: color + "22", color: color, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 100 }}>{badge}</span>
      </div>
      <h3 style={{ fontSize: 14, margin: "0 0 8px", color: "#1a1a1a" }}>{title}</h3>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {steps.map((s, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9.5, padding: "3px 6px", background: i === 0 ? "#1a1a1a" : i === steps.length - 1 ? color : "#f1f5f9", color: i === 0 || i === steps.length - 1 ? "#fff" : "#334155", borderRadius: 5, fontWeight: 600, whiteSpace: "nowrap" }}>{s}</span>
            {i < steps.length - 1 && <span style={{ color: "#94a3b8", fontSize: 9 }}>›</span>}
          </span>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: "#666", lineHeight: 1.5 }}>{note}</p>
    </div>
  );
}

function PaperVsRealityChart() {
  const groups = [
    { label: "CNN", sub: "in-domain DDD", paper: 95, ours: 62 },
    { label: "YOLOv8", sub: "in-domain DDD", paper: 99.5, ours: 99.5 },
    { label: "CNN", sub: "cross · YawDD", paper: 92, ours: 58 },
    { label: "YOLOv8", sub: "cross · YawDD", paper: 92, ours: 50.5 },
  ];
  const W = 460, H = 170, padL = 28, padR = 8, padT = 10, padB = 36;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const groupW = innerW / groups.length;
  const barW = (groupW - 14) / 2;
  const max = 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {[0, 25, 50, 75, 100].map((y) => {
        const yy = padT + innerH - (y / max) * innerH;
        return (
          <g key={y}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#e5e7eb" strokeWidth={0.6} />
            <text x={padL - 4} y={yy + 3} fontSize={8} textAnchor="end" fill="#888">{y}</text>
          </g>
        );
      })}
      {groups.map((g, i) => {
        const gx = padL + i * groupW + 7;
        const ph = (g.paper / max) * innerH;
        const oh = (g.ours / max) * innerH;
        const gap = g.paper - g.ours;
        return (
          <g key={i}>
            <rect x={gx} y={padT + innerH - ph} width={barW} height={ph} fill="#3b82f6" rx={2} />
            <text x={gx + barW / 2} y={padT + innerH - ph - 3} fontSize={8} textAnchor="middle" fill="#1e40af" fontWeight={700}>{g.paper}%</text>
            <rect x={gx + barW + 4} y={padT + innerH - oh} width={barW} height={oh} fill="#f97316" rx={2} />
            <text x={gx + barW + 4 + barW / 2} y={padT + innerH - oh - 3} fontSize={8} textAnchor="middle" fill="#9a3412" fontWeight={700}>{g.ours}%</text>
            <text x={gx + groupW / 2 - 7} y={H - padB + 12} fontSize={9} textAnchor="middle" fill="#222" fontWeight={600}>{g.label}</text>
            <text x={gx + groupW / 2 - 7} y={H - padB + 22} fontSize={8} textAnchor="middle" fill="#888">{g.sub}</text>
            {gap >= 25 && (
              <text x={gx + groupW / 2 - 7} y={padT + innerH - oh - 16} fontSize={8} textAnchor="middle" fill="#dc2626" fontWeight={700}>↓{gap.toFixed(0)}pt</text>
            )}
          </g>
        );
      })}
      <g transform={`translate(${padL}, ${H - 8})`}>
        <rect x={0} y={-7} width={9} height={9} fill="#3b82f6" rx={1} />
        <text x={13} y={1} fontSize={8.5} fill="#333">Rapporté par le papier</text>
        <rect x={108} y={-7} width={9} height={9} fill="#f97316" rx={1} />
        <text x={121} y={1} fontSize={8.5} fill="#333">Nos mesures</text>
      </g>
    </svg>
  );
}

function LightingOcclusionChart() {
  const conditions = [
    { label: "Jour", sub: "sans lunettes", structural: 93, cnn: 64, hybrid: 97 },
    { label: "Jour", sub: "lunettes", structural: 90, cnn: 88, hybrid: 91 },
    { label: "Jour", sub: "soleil", structural: 93, cnn: 89, hybrid: 95 },
    { label: "Nuit", sub: "sans lunettes", structural: 80, cnn: 75, hybrid: 86 },
    { label: "Nuit", sub: "lunettes", structural: 38, cnn: 72, hybrid: 82 },
  ];
  const series: ("structural" | "cnn" | "hybrid")[] = ["structural", "cnn", "hybrid"];
  const colors = { structural: "#10b981", cnn: "#f97316", hybrid: "#1e3a8a" };
  const W = 460, H = 200, padL = 26, padR = 8, padT = 10, padB = 46;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const groupW = innerW / conditions.length;
  const barW = (groupW - 12) / 3;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {[0, 25, 50, 75, 100].map((y) => {
        const yy = padT + innerH - (y / 100) * innerH;
        return (
          <g key={y}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#e5e7eb" strokeWidth={0.6} />
            <text x={padL - 4} y={yy + 3} fontSize={8} textAnchor="end" fill="#888">{y}</text>
          </g>
        );
      })}
      {conditions.map((c, i) => {
        const gx = padL + i * groupW + 6;
        return (
          <g key={i}>
            {series.map((s, si) => {
              const v = c[s];
              const h = (v / 100) * innerH;
              return (
                <g key={s}>
                  <rect x={gx + si * (barW + 1)} y={padT + innerH - h} width={barW} height={h} fill={colors[s]} rx={1.5} />
                  {(s === "structural" && v <= 50) && (
                    <text x={gx + si * (barW + 1) + barW / 2} y={padT + innerH - h - 3} fontSize={8} textAnchor="middle" fill="#dc2626" fontWeight={700}>{v}</text>
                  )}
                </g>
              );
            })}
            <text x={gx + groupW / 2 - 6} y={H - padB + 12} fontSize={9} textAnchor="middle" fill="#222" fontWeight={600}>{c.label}</text>
            <text x={gx + groupW / 2 - 6} y={H - padB + 22} fontSize={8} textAnchor="middle" fill="#888">{c.sub}</text>
          </g>
        );
      })}
      <g transform={`translate(${padL}, ${H - 6})`}>
        {series.map((s, i) => (
          <g key={s} transform={`translate(${i * 110}, 0)`}>
            <rect x={0} y={-8} width={10} height={10} fill={colors[s]} rx={1} />
            <text x={14} y={1} fontSize={9} fill="#333">
              {s === "structural" ? "Structurel" : s === "cnn" ? "CNN global" : "Hybride fusionné"}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function CameraAngleChart() {
  const points = [
    { label: "Frontal", sub: "0°", v: 88 },
    { label: "Léger", sub: "±15°", v: 79 },
    { label: "Latéral", sub: "±30°", v: 65 },
    { label: "Sévère", sub: "±45°", v: 47 },
  ];
  const W = 380, H = 200, padL = 32, padR = 16, padT = 18, padB = 46;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const xs = points.map((_, i) => padL + (i * innerW) / (points.length - 1));
  const ys = points.map((p) => padT + innerH - (p.v / 100) * innerH);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
  const areaPath = `${path} L ${xs[xs.length - 1]} ${padT + innerH} L ${xs[0]} ${padT + innerH} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {[0, 25, 50, 75, 100].map((y) => {
        const yy = padT + innerH - (y / 100) * innerH;
        return (
          <g key={y}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#e5e7eb" strokeWidth={0.6} />
            <text x={padL - 4} y={yy + 3} fontSize={8} textAnchor="end" fill="#888">{y}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="#ef4444" opacity={0.12} />
      <path d={path} stroke="#ef4444" strokeWidth={2.2} fill="none" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={ys[i]} r={5} fill="#fff" stroke="#ef4444" strokeWidth={2} />
          <text x={xs[i]} y={ys[i] - 11} fontSize={10} textAnchor="middle" fontWeight={700} fill="#b91c1c">{p.v}%</text>
          <text x={xs[i]} y={H - padB + 14} fontSize={9.5} textAnchor="middle" fill="#222" fontWeight={600}>{p.label}</text>
          <text x={xs[i]} y={H - padB + 26} fontSize={9} textAnchor="middle" fill="#888">{p.sub}</text>
        </g>
      ))}
      <text x={padL} y={padT - 5} fontSize={9} fill="#888">Précision de détection (%)</text>
    </svg>
  );
}