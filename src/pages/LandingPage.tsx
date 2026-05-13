import React from 'react';
import { Link } from 'react-router-dom';
import {
  Code2, Zap, Users, GitBranch, Terminal, Shield,
  MessageSquare, Bell, ArrowRight, CheckCircle, Play,
  Globe, Lock, Star, ChevronRight
} from 'lucide-react';

const FEATURES = [
  {
    icon: <Code2 size={22} />, color: '#6366f1',
    title: 'Real-Time Code Editor',
    desc: 'Monaco-powered editor with syntax highlighting for 10+ languages including Java, Python, TypeScript, Go, Rust, and more.'
  },
  {
    icon: <Users size={22} />, color: '#22d3a5',
    title: 'Live Collaboration',
    desc: 'See teammates\' cursors, edits, and presence in real-time via WebSocket. Full session management with roles.'
  },
  {
    icon: <Terminal size={22} />, color: '#38bdf8',
    title: 'Sandboxed Execution',
    desc: 'Run code in Docker-isolated containers. Supports stdin/stdout, timeout control, and full execution history.'
  },
  {
    icon: <GitBranch size={22} />, color: '#a78bfa',
    title: 'Version Control',
    desc: 'Git-inspired branching and commits with SHA-256 hashes, file diffs, tags, and one-click snapshot restore.'
  },
  {
    icon: <MessageSquare size={22} />, color: '#fbbf24',
    title: 'Code Reviews',
    desc: 'Inline comments anchored to specific lines, threaded replies, emoji reactions, and thread resolution.'
  },
  {
    icon: <Bell size={22} />, color: '#fb923c',
    title: 'Smart Notifications',
    desc: 'In-app and email notifications for comments, mentions, invites, and execution events.'
  },
];

const STATS = [
  { value: '10+', label: 'Languages Supported' },
  { value: '8', label: 'Microservices' },
  { value: 'WS', label: 'Real-time Collab' },
  { value: '∞', label: 'Projects' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="brand-logo-lg">
              <Code2 size={22} />
            </div>
            <span className="brand-name">CodeSync</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#stack" className="landing-nav-link">Stack</a>
          </div>
          <div className="landing-nav-cta">
            <Link to="/login" className="btn btn-ghost" id="nav-login">Sign In</Link>
            <Link to="/register" className="btn btn-primary" id="nav-get-started">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>

        <div className="hero-content-wrapper">
          <div className="hero-badge animate-fadeIn">
            <Zap size={13} style={{ color: 'var(--yellow)' }} />
            <span>Built with Spring Boot 3 · React 18 · WebSockets</span>
          </div>

          <h1 className="hero-title animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            The Collaborative<br />
            <span className="gradient-text">Cloud IDE</span> for Teams
          </h1>

          <p className="hero-desc animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Code, collaborate, execute, and version-control — all in one place.
            Real-time multi-user editing with no setup required.
          </p>

          <div className="hero-cta animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <Link to="/register" className="btn btn-primary btn-lg" id="hero-get-started">
              Start Coding Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg" id="hero-sign-in">
              Sign In <ChevronRight size={16} />
            </Link>
          </div>

          <div className="hero-stats animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            {STATS.map((s) => (
              <div key={s.label} className="hero-stat-item">
                <div className="hero-stat-num">{s.value}</div>
                <div className="hero-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fake IDE Preview */}
        <div className="hero-ide animate-fadeIn" style={{ animationDelay: '0.5s' }}>
          <div className="ide-preview-bar">
            <div className="ide-dot" style={{ background: '#f87171' }} />
            <div className="ide-dot" style={{ background: '#fbbf24' }} />
            <div className="ide-dot" style={{ background: '#22d3a5' }} />
            <span className="ide-preview-title">Main.java — CodeSync IDE</span>
          </div>
          <div className="ide-preview-body">
            <div className="ide-line-nums">
              {Array.from({ length: 18 }, (_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <pre className="ide-code">{`import java.util.*;

public class Main {
    public static void main(String[] args) {
        // 🚀 CodeSync – Collaborative IDE
        List<String> team = Arrays.asList(
            "Alice", "Bob", "Charlie"
        );
        
        team.forEach(member -> {
            System.out.printf(
                "Hello, %s! Ready to code?%n",
                member
            );
        });
        
        System.out.println("✅ All done!");
    }
}`}</pre>
          </div>
          <div className="ide-preview-footer">
            <span className="badge badge-green" style={{ fontSize: '0.65rem' }}><CheckCircle size={10} /> Compiled successfully</span>
            <span className="text-xs text-muted">Java 21 · 12ms</span>
            <div className="collab-avatars">
              {['A', 'B', 'C'].map((l, i) => (
                <div key={i} className="collab-avatar" style={{ background: ['#6366f1', '#22d3a5', '#fbbf24'][i], marginLeft: i > 0 ? -8 : 0 }}>
                  {l}
                </div>
              ))}
              <span className="text-xs text-muted" style={{ marginLeft: 6 }}>3 online</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Build Together</h2>
          <p className="section-desc">A complete cloud IDE built as a microservices architecture</p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card card">
              <div className="feature-icon" style={{ background: f.color + '22', color: f.color }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="stack-section" id="stack">
        <div className="section-header">
          <h2 className="section-title">Production-Ready Tech Stack</h2>
          <p className="section-desc">Built with enterprise-grade technologies</p>
        </div>

        <div className="stack-grid">
          {[
            { cat: 'Backend', items: ['Spring Boot 3.2.5', 'Spring Cloud 2023', 'Spring Security', 'Spring WebSocket', 'Spring Data JPA'] },
            { cat: 'Infrastructure', items: ['Eureka Discovery', 'API Gateway', 'RabbitMQ', 'Docker Compose', '8× MySQL Databases'] },
            { cat: 'Frontend', items: ['React 18', 'TypeScript', 'Zustand', 'CodeMirror 6', 'STOMP WebSocket'] },
            { cat: 'Features', items: ['JWT Auth + OAuth2', 'Real-time Collab', 'Docker Sandbox', 'Git Version Control', 'Swagger/OpenAPI'] },
          ].map((stack) => (
            <div key={stack.cat} className="stack-card card">
              <div className="stack-cat">{stack.cat}</div>
              {stack.items.map((item) => (
                <div key={item} className="stack-item">
                  <CheckCircle size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to Start Coding?</h2>
          <p className="cta-desc">Create your free account and start building with your team today.</p>
          <Link to="/register" className="btn btn-primary btn-lg" id="cta-register">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-brand" style={{ marginBottom: 4 }}>
          <div className="brand-logo-sm"><Code2 size={14} /></div>
          <span className="brand-name" style={{ fontSize: '1rem' }}>CodeSync</span>
        </div>
        <p className="text-muted text-xs">Collaborative Cloud IDE · Built for the Sprint Project Evaluation</p>
      </footer>

      <style>{`
        .landing { background: var(--bg-base); min-height: 100vh; overflow-x: hidden; }
        
        /* Nav */
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(10,14,26,0.8);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
        }
        .landing-nav-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: 60px;
        }
        .landing-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .brand-logo-lg {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--accent), var(--purple));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: white; box-shadow: 0 0 16px var(--accent-glow);
        }
        .brand-logo-sm {
          width: 24px; height: 24px;
          background: linear-gradient(135deg, var(--accent), var(--purple));
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          color: white;
        }
        .brand-name { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
        .landing-nav-links { display: flex; gap: 4px; }
        .landing-nav-link {
          padding: 6px 14px; border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 500;
          color: var(--text-muted); text-decoration: none;
          transition: all var(--transition-fast);
        }
        .landing-nav-link:hover { color: var(--text-primary); background: var(--bg-elevated); }
        .landing-nav-cta { display: flex; gap: 8px; align-items: center; }

        /* Hero */
        .hero-section {
          min-height: 100vh; padding: 120px 24px 80px;
          display: flex; flex-direction: column; align-items: center;
          position: relative; overflow: hidden;
          max-width: 1200px; margin: 0 auto;
          gap: 48px;
        }
        .hero-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .hero-orb {
          position: absolute; border-radius: 50%; filter: blur(100px);
          animation: pulse 6s ease-in-out infinite;
        }
        .hero-orb-1 {
          width: 700px; height: 700px; top: -200px; left: -200px;
          background: radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%);
        }
        .hero-orb-2 {
          width: 500px; height: 500px; bottom: -100px; right: -100px;
          background: radial-gradient(circle, rgba(167,139,250,0.2), transparent 70%);
          animation-delay: 2s;
        }
        .hero-orb-3 {
          width: 400px; height: 400px; top: 40%; left: 50%; transform: translate(-50%,-50%);
          background: radial-gradient(circle, rgba(34,211,165,0.08), transparent 70%);
          animation-delay: 4s;
        }
        .hero-content-wrapper {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          text-align: center; max-width: 760px;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: var(--radius-full);
          font-size: 0.8rem; font-weight: 500; color: var(--text-secondary);
          margin-bottom: 24px;
        }
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900; line-height: 1.1;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }
        .gradient-text {
          background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 50%, var(--green) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-desc {
          font-size: 1.125rem; color: var(--text-muted);
          line-height: 1.7; max-width: 560px; margin-bottom: 32px;
        }
        .hero-cta { display: flex; gap: 12px; margin-bottom: 40px; flex-wrap: wrap; justify-content: center; }
        .hero-stats {
          display: flex; gap: 32px; flex-wrap: wrap; justify-content: center;
          padding: 20px 32px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
        }
        .hero-stat-item { text-align: center; }
        .hero-stat-num { font-size: 1.75rem; font-weight: 800; background: linear-gradient(135deg, var(--accent), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-stat-lbl { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

        /* IDE Preview */
        .hero-ide {
          position: relative; z-index: 1;
          width: 100%; max-width: 700px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.15);
        }
        .ide-preview-bar {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 16px;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-subtle);
        }
        .ide-dot { width: 10px; height: 10px; border-radius: 50%; }
        .ide-preview-title { font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); margin-left: 8px; }
        .ide-preview-body { display: flex; overflow: hidden; }
        .ide-line-nums {
          padding: 16px 12px;
          background: rgba(0,0,0,0.2);
          border-right: 1px solid var(--border-subtle);
          font-size: 0.75rem; font-family: var(--font-mono);
          color: var(--text-muted); line-height: 1.7;
          text-align: right; min-width: 36px;
          user-select: none;
        }
        .ide-code {
          padding: 16px 20px; flex: 1;
          font-family: var(--font-mono); font-size: 0.8125rem;
          line-height: 1.7; color: var(--text-primary);
          overflow-x: auto; background: #0d1117;
          white-space: pre;
        }
        .ide-preview-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 16px;
          background: var(--bg-elevated);
          border-top: 1px solid var(--border-subtle);
          font-size: 0.75rem;
        }
        .collab-avatars { display: flex; align-items: center; }
        .collab-avatar {
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 700; color: white;
          border: 2px solid var(--bg-elevated);
        }

        /* Features */
        .features-section {
          padding: 100px 24px;
          max-width: 1200px; margin: 0 auto;
          position: relative; z-index: 1;
        }
        .section-header { text-align: center; margin-bottom: 56px; }
        .section-title { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; margin-bottom: 12px; }
        .section-desc { color: var(--text-muted); font-size: 1.0625rem; }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        .feature-card {
          padding: 28px;
          transition: all 0.25s ease;
        }
        .feature-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.1);
        }
        .feature-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .feature-title { font-size: 1.0625rem; font-weight: 700; margin-bottom: 8px; }
        .feature-desc { color: var(--text-muted); font-size: 0.875rem; line-height: 1.65; }

        /* Stack */
        .stack-section {
          padding: 100px 24px;
          background: var(--bg-surface);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          position: relative; z-index: 1;
        }
        .stack-section .section-header { max-width: 1200px; margin: 0 auto 56px; }
        .stack-grid {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;
        }
        .stack-card { padding: 24px; }
        .stack-cat { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; color: var(--accent); text-transform: uppercase; margin-bottom: 14px; }
        .stack-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 0.875rem; color: var(--text-secondary); }

        /* CTA */
        .cta-section {
          padding: 100px 24px; position: relative; z-index: 1;
          display: flex; justify-content: center;
        }
        .cta-inner {
          text-align: center; max-width: 560px;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .cta-title { font-size: 2.25rem; font-weight: 800; }
        .cta-desc { color: var(--text-muted); font-size: 1.0625rem; }

        /* Footer */
        .landing-footer {
          padding: 32px 24px;
          border-top: 1px solid var(--border-subtle);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          position: relative; z-index: 1;
        }
      `}</style>
    </div>
  );
}
