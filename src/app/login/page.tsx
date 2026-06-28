"use client";

import { useEffect, useState } from "react";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [erro, setErro] = useState("");
  const [erroAzul, setErroAzul] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totp, setTotp] = useState("");
  const [showTotp, setShowTotp] = useState(false);

  // Animações de fundo (pontinhos que fogem do cursor + ondas).
  useEffect(() => {
    const canvas = document.getElementById("dotsCanvas") as HTMLCanvasElement | null;
    const svg = document.getElementById("waveSvg");
    let raf = 0;

    // ----- Pontinhos -----
    if (canvas) {
      const ctx = canvas.getContext("2d")!;
      const COR = "#c4d2ec", RAIO = 1.6, ALCANCE = 150, FORCA = 6, MOLA = 0.012, ATRITO = 0.88;
      let dots: { hx: number; hy: number; x: number; y: number; vx: number; vy: number; a: number }[] = [];
      let mx = -9999, my = -9999;
      const COLS = 26, ROWS = 15, ESP = 11;

      const grade = (ox: number, oy: number) => {
        const cx = (COLS - 1) / 2, cy = (ROWS - 1) / 2;
        for (let c = 0; c < COLS; c++)
          for (let r = 0; r < ROWS; r++) {
            const x = ox + c * ESP, y = oy + r * ESP;
            const nx = cx ? (c - cx) / cx : 0, ny = cy ? (r - cy) / cy : 0;
            const t = Math.min(1, Math.hypot(nx, ny));
            dots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0, a: 1 - t * 0.72 });
          }
      };
      const gerar = () => {
        dots = [];
        const W = innerWidth, H = innerHeight, gw = COLS * ESP, gh = ROWS * ESP;
        grade(42, 40);
        grade(42, H - gh - 130);
        grade(W - gw - 40, H - gh - 40);
        const wm = document.querySelector(".wordmark");
        if (wm) {
          const r = wm.getBoundingClientRect();
          if (r.width > 0) grade(r.right + 26, r.top + r.height / 2 - gh / 2);
        }
      };
      const dimensoes = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        gerar();
      };
      const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
      const onOut = () => { mx = -9999; my = -9999; };
      addEventListener("resize", dimensoes);
      addEventListener("mousemove", onMove);
      addEventListener("mouseout", onOut);

      const loop = () => {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        ctx.fillStyle = COR;
        for (const d of dots) {
          const dx = d.x - mx, dy = d.y - my, dist = Math.hypot(dx, dy) || 0.01;
          if (dist < ALCANCE) {
            const f = (1 - dist / ALCANCE) * FORCA;
            d.vx += (dx / dist) * f; d.vy += (dy / dist) * f;
          }
          d.vx += (d.hx - d.x) * MOLA; d.vy += (d.hy - d.y) * MOLA;
          d.vx *= ATRITO; d.vy *= ATRITO; d.x += d.vx; d.y += d.vy;
          ctx.globalAlpha = d.a;
          ctx.beginPath(); ctx.arc(d.x, d.y, RAIO, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(loop);
      };
      dimensoes(); loop();

      // ----- Ondas -----
      if (svg) {
        const onda = (dy: number) => {
          const L = [[0, 718], [250, 658], [430, 700], [585, 626], [800, 692], [1000, 664]].map((p) => [p[0], p[1] + dy]);
          let d = `M${L[0][0]} ${L[0][1]}`;
          for (let i = 0; i < L.length - 1; i++) {
            const p0 = L[i - 1] || L[i], p1 = L[i], p2 = L[i + 1], p3 = L[i + 2] || p2;
            const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
            const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
            d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0]} ${p2[1]}`;
          }
          const x0 = 1000, x1 = 1440, yB = 664 + dy, yT = 116 + dy, k = 9;
          const sig = (t: number) => 1 / (1 + Math.exp(-k * (t - 0.5)));
          const s0 = sig(0), s1 = sig(1), N = 48;
          for (let i = 1; i <= N; i++) {
            const t = i / N, x = x0 + (x1 - x0) * t, sn = (sig(t) - s0) / (s1 - s0);
            d += ` L ${x.toFixed(1)} ${(yB + (yT - yB) * sn).toFixed(1)}`;
          }
          return d;
        };
        const cores = ["#b6cbef", "#bfd2f1", "#c8d8f3", "#d1ddf5", "#dae5f7", "#e4ecfa"];
        let html = '<defs><filter id="ondaSombra" x="-5%" y="-12%" width="115%" height="132%">'
          + '<feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#6f8cc7" flood-opacity="0.32"/></filter></defs>';
        html += `<path d="${onda(0)} L1440 900 L0 900 Z" fill="#e6edfa" opacity="0.4"/>`;
        html += '<g filter="url(#ondaSombra)">';
        for (let i = 0; i < cores.length; i++)
          html += `<path d="${onda(i * 15)}" stroke="${cores[i]}" stroke-width="1.8" fill="none"/>`;
        html += "</g>";
        svg.innerHTML = html;
      }

      return () => {
        cancelAnimationFrame(raf);
        removeEventListener("resize", dimensoes);
        removeEventListener("mousemove", onMove);
        removeEventListener("mouseout", onOut);
      };
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setErroAzul(false); setLoading(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), senha, totp: totp.trim() }),
      });
      const j = await r.json();
      if (j.ok) { window.location.href = "/"; return; }
      if (j.needsTotp) {
        setShowTotp(true);
        setErroAzul(true);
        setErro(showTotp ? "Código inválido. Tente de novo." : "Digite o código do seu app autenticador.");
      } else {
        setErro(j.erro || "Não foi possível entrar.");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  }

  function emBreve(e: React.MouseEvent) {
    e.preventDefault();
    setErroAzul(true);
    setErro("A senha é definida pelo administrador (variável AUTH_PASSWORD).");
  }

  return (
    <div className="auth">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="deco deco-blob1" />
      <div className="deco deco-blob2" />
      <div className="deco deco-blob3" />
      <canvas className="deco deco-canvas" id="dotsCanvas" />
      <svg className="deco deco-wave" id="waveSvg" width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" />
      <div className="deco deco-veil" />

      <div className="wrap">
        {/* Esquerda — marca */}
        <div className="esq">
          <div className="marca">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gestalize-bot.png" alt="Gestalize Finance" className="robo" />
            <div className="wordmark"><span className="g">Gestalize</span><span className="b">Finance</span></div>
          </div>

          <h2>Plataforma completa para a <b>gestão financeira</b> da sua empresa</h2>
          <p className="desc">Controle receitas, despesas, cobranças e o lucro de cada cliente — tudo em um só lugar.</p>

          <ul className="features">
            <li>
              <span className="fic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span>
              Receitas e despesas controladas
            </li>
            <li>
              <span className="fic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" /></svg></span>
              Cobranças automáticas (Pix/boleto)
            </li>
            <li>
              <span className="fic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg></span>
              Relatórios, MRR e faturamento
            </li>
            <li>
              <span className="fic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" /></svg></span>
              Lucro por cliente
            </li>
          </ul>

          <div className="seg">
            <span className="sic"><svg width="38" height="38" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14-4-4 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6z" /></svg></span>
            <div><strong>Segurança e confiabilidade</strong><small>Seus dados protegidos com login privado.</small></div>
          </div>
        </div>

        {/* Direita — card */}
        <div className="col-dir">
          <div className="marca-mob">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gestalize-bot.png" alt="Gestalize Finance" />
            <div className="wm"><span className="g">Gestalize</span> <span className="b">Finance</span></div>
          </div>

          <div className="auth-card">
            <div className="escudo"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14-4-4 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6z" /></svg></div>
            <h2>Bem-vindo de volta!</h2>
            <p className="sub">Acesse sua conta para continuar</p>

            <form onSubmit={onSubmit}>
              <label>E-mail</label>
              <div className="campo">
                <span className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg></span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Digite seu e-mail" autoComplete="username" required />
              </div>

              <label>Senha</label>
              <div className="campo">
                <span className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                <input type={showPass ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite sua senha" autoComplete="current-password" required />
                <button type="button" className="olho" onClick={() => setShowPass((s) => !s)} title="Mostrar/ocultar senha">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
              </div>

              {showTotp && (
                <>
                  <label>Código de verificação</label>
                  <div className="campo">
                    <span className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={totp}
                      onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      autoFocus
                    />
                  </div>
                </>
              )}

              <div className="linha">
                <label className="chk"><input type="checkbox" defaultChecked /> Lembrar de mim</label>
                <a onClick={emBreve}>Esqueci minha senha</a>
              </div>

              <button type="submit" className="btn-entrar" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
                {!loading && (
                  <span className="seta"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></span>
                )}
              </button>
              <div className="erro" style={erroAzul ? { color: "#2563eb" } : undefined}>{erro}</div>
            </form>
          </div>

          <div className="rodape">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            © {new Date().getFullYear()} Gestalize Finance. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
