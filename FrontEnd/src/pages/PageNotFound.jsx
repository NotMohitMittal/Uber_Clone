import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PageNotFound() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Animate particles on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52,211,153,${p.alpha})`;
        ctx.fill();
      });

      // Draw faint connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(52,211,153,${0.06 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    setTimeout(() => setLoaded(true), 80);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scalePop {
          0%   { opacity: 0; transform: scale(0.75); }
          70%  { transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes floatCar {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes spinWheel {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes beamPulse {
          0%, 100% { opacity: 0.6; width: 48px; }
          50%       { opacity: 1;   width: 60px; }
        }
        @keyframes puffOut {
          0%   { opacity: 0.5; transform: translateX(0) scale(1); }
          100% { opacity: 0;   transform: translateX(-28px) scale(2.2); }
        }
        @keyframes roadScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-80px); }
        }
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 40px rgba(52,211,153,0.15); }
          50%       { text-shadow: 0 0 80px rgba(52,211,153,0.35); }
        }
        @keyframes signBob {
          0%, 100% { transform: rotate(-3deg); }
          50%       { transform: rotate(3deg); }
        }

        .nf-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .nf-btn { cursor: pointer; transition: opacity .18s, transform .15s; }
        .nf-btn:hover { opacity: 0.82; transform: translateY(-2px); }
        .nf-btn:active { transform: scale(0.97); opacity: 0.75; }

        .nf-404 {
          font-size: clamp(96px, 18vw, 148px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -6px;
          color: #34d399;
          animation: glowPulse 3s ease-in-out infinite;
          font-variant-numeric: tabular-nums;
        }

        .nf-car { animation: floatCar 3.4s ease-in-out infinite; }

        .wheel-l { transform-origin: 21px 0px; animation: spinWheel 0.7s linear infinite; }
        .wheel-r { transform-origin: 21px 0px; animation: spinWheel 0.7s linear infinite; }

        .beam  { animation: beamPulse 1.4s ease-in-out infinite; }
        .beam2 { animation: beamPulse 1.4s ease-in-out infinite; animation-delay: 0.2s; }

        .puff1 { animation: puffOut 1.2s ease-out infinite; }
        .puff2 { animation: puffOut 1.2s ease-out infinite; animation-delay: 0.4s; }
        .puff3 { animation: puffOut 1.2s ease-out infinite; animation-delay: 0.8s; }

        .road-dash { animation: roadScroll 0.9s linear infinite; }

        .sign-post { animation: signBob 2.2s ease-in-out infinite; transform-origin: bottom center; }
      `}</style>

      {/* Particle canvas background */}
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Dot grid overlay */}
      <div style={styles.dotGrid} />

      {/* Content */}
      <div
        className="nf-root"
        style={{
          ...styles.content,
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        {/* Road scene */}
        <div style={styles.roadWrap}>
          {/* Road surface */}
          <div style={styles.road}>
            {/* Scrolling dashes */}
            <div className="road-dash" style={styles.dashTrack}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ ...styles.dash, left: i * 80 }} />
              ))}
            </div>

            {/* Wrong way sign */}
            <div className="sign-post" style={styles.signWrap}>
              <div style={styles.signBoard}>
                WRONG<br />WAY
              </div>
              <div style={styles.signPole} />
            </div>

            {/* Animated car */}
            <div className="nf-car" style={styles.carWrap}>
              {/* Exhaust puffs */}
              <div className="puff1" style={{ ...styles.puff, left: -4 }} />
              <div className="puff2" style={{ ...styles.puff, left: -10 }} />
              <div className="puff3" style={{ ...styles.puff, left: -18 }} />

              {/* Headlight beams */}
              <div className="beam" style={styles.beam} />
              <div className="beam2" style={{ ...styles.beam, top: 36, width: 42 }} />

              <svg
                width="104"
                height="60"
                viewBox="0 0 104 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Body */}
                <rect x="4" y="26" width="96" height="26" rx="6" fill="#1e2130" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                {/* Cabin */}
                <path d="M26 26 C28 11 34 8 44 8 L64 8 C74 8 80 12 82 26 Z" fill="#252a3a" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                {/* Windshield */}
                <path d="M31 26 C32 16 36 12 44 12 L63 12 C71 12 76 16 77 26 Z" fill="rgba(99,179,237,0.18)" stroke="rgba(99,179,237,0.28)" strokeWidth="0.8" />
                {/* Headlight */}
                <rect x="91" y="29" width="8" height="10" rx="2.5" fill="#facc15" opacity="0.95" />
                {/* Taillight */}
                <rect x="5" y="29" width="7" height="10" rx="2.5" fill="#f87171" opacity="0.85" />
                {/* Door divider */}
                <line x1="52" y1="26" x2="52" y2="52" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                {/* Handles */}
                <rect x="35" y="36" width="10" height="3.5" rx="1.75" fill="rgba(255,255,255,0.13)" />
                <rect x="59" y="36" width="10" height="3.5" rx="1.75" fill="rgba(255,255,255,0.13)" />

                {/* Left wheel hub */}
                <circle cx="26" cy="52" r="9" fill="#0f1117" stroke="#1e293b" strokeWidth="2.5" />
                <circle cx="26" cy="52" r="4.5" fill="#1e293b" />
                {/* Left wheel spokes */}
                <g className="wheel-l" style={{ transformOrigin: "26px 52px" }}>
                  <line x1="26" y1="43" x2="26" y2="46" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="26" y1="58" x2="26" y2="61" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="17" y1="52" x2="20" y2="52" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="32" y1="52" x2="35" y2="52" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
                </g>

                {/* Right wheel hub */}
                <circle cx="78" cy="52" r="9" fill="#0f1117" stroke="#1e293b" strokeWidth="2.5" />
                <circle cx="78" cy="52" r="4.5" fill="#1e293b" />
                {/* Right wheel spokes */}
                <g className="wheel-r" style={{ transformOrigin: "78px 52px" }}>
                  <line x1="78" y1="43" x2="78" y2="46" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="78" y1="58" x2="78" y2="61" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="69" y1="52" x2="72" y2="52" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="84" y1="52" x2="87" y2="52" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* 404 */}
        <p
          className="nf-404"
          style={{
            animation: loaded
              ? "scalePop 0.55s cubic-bezier(0.22,1,0.36,1) both, glowPulse 3s 0.6s ease-in-out infinite"
              : "none",
            margin: "0 0 8px",
          }}
        >
          404
        </p>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: 700,
            color: "#f1f5f9",
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
            animation: loaded ? "fadeUp 0.5s 0.18s ease both" : "none",
          }}
        >
          You took a wrong turn, Captain.
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 15,
            color: "#64748b",
            lineHeight: 1.7,
            maxWidth: 380,
            margin: "0 auto 36px",
            animation: loaded ? "fadeUp 0.5s 0.28s ease both" : "none",
          }}
        >
          This route doesn't exist on our map. The page you're looking for has been moved, deleted, or never existed.
        </p>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            animation: loaded ? "fadeUp 0.5s 0.38s ease both" : "none",
          }}
        >
          <button
            className="nf-btn"
            onClick={() => navigate(-1)}
            style={styles.btnGhost}
          >
            ← Go Back
          </button>
          <button
            className="nf-btn"
            onClick={() => navigate("/")}
            style={styles.btnPrimary}
          >
            🏠 Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    position: "relative",
    minHeight: "100vh",
    background: "#0f1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  dotGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    pointerEvents: "none",
  },
  content: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    padding: "2rem 1.5rem",
    width: "100%",
    maxWidth: 560,
  },
  roadWrap: {
    marginBottom: 32,
  },
  road: {
    position: "relative",
    height: 100,
    background: "#1a1d27",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dashTrack: {
    position: "absolute",
    top: "50%",
    left: 0,
    transform: "translateY(-50%)",
    display: "flex",
    gap: 0,
    width: "200%",
  },
  dash: {
    position: "relative",
    width: 48,
    height: 4,
    background: "rgba(255,255,255,0.09)",
    borderRadius: 2,
    marginRight: 32,
    flexShrink: 0,
  },
  signWrap: {
    position: "absolute",
    right: 20,
    top: 6,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  signBoard: {
    background: "#facc15",
    color: "#1a1005",
    fontSize: 9,
    fontWeight: 800,
    padding: "3px 8px",
    borderRadius: 4,
    lineHeight: 1.4,
    textAlign: "center",
    letterSpacing: "0.5px",
    fontFamily: "'DM Sans', sans-serif",
  },
  signPole: {
    width: 2,
    height: 32,
    background: "#334155",
    borderRadius: 1,
  },
  carWrap: {
    position: "relative",
    display: "inline-block",
  },
  beam: {
    position: "absolute",
    right: -48,
    top: 29,
    width: 48,
    height: 12,
    background:
      "linear-gradient(90deg, rgba(250,204,21,0.5) 0%, transparent 100%)",
    borderRadius: "0 50% 50% 0",
    pointerEvents: "none",
  },
  puff: {
    position: "absolute",
    bottom: 12,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.07)",
    pointerEvents: "none",
  },
  btnPrimary: {
    padding: "11px 24px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "-0.2px",
  },
  btnGhost: {
    padding: "11px 24px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "-0.2px",
  },
};