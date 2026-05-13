import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Code2, GitBranch, Star, Users, Folder,
  TrendingUp, Clock, Archive, Zap, Globe, Lock, ArrowRight, MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectApi } from '../api/services';
import { useAuthStore } from '../store';
import AppLayout from '../components/AppLayout';
import CreateProjectModal from '../components/CreateProjectModal';
import { formatDistanceToNow } from 'date-fns';
import { paymentApi } from '../api/services';
import axios from "axios";
import api from "../api/client";

const LANG_COLORS: Record<string, string> = {
  JAVA: '#f89820', PYTHON: '#3572A5', JAVASCRIPT: '#f1e05a',
  TYPESCRIPT: '#3178c6', GO: '#00ADD8', RUST: '#dea584',
  CPP: '#f34b7d', C: '#555555', KOTLIN: '#A97BFF', BASH: '#89e051',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({ total: 0, starred: 0, shared: 0 });

  const fetchProjects = async (q = searchQuery, p = page) => {
    try {
      setLoading(true);
      let res;
      if (q.trim()) {
        res = await projectApi.search(q.trim(), p);
      } else {
        res = await projectApi.getMyProjects(p);
      }
      setProjects(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setStats({
        total: res.data.totalElements || 0,
        starred: (res.data.content || []).filter((p: any) => p.starred).length,
        shared: (res.data.content || []).filter((p: any) => p.memberCount > 1).length,
      });
    } catch {
      // Demo mode: show empty state
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchProjects(searchQuery, 0);
  };

  const handleProjectCreated = (project: any) => {
    setShowCreate(false);
    toast.success(`Project "${project.name}" created!`);
    fetchProjects();
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handlePremiumUpgrade = async () => {

    try {

      const order = await paymentApi.createOrder(
        499,
        "PREMIUM"
      );

      const options = {

        key: "rzp_test_SoPOdo2y5WlMOy",

        amount: order.amount,

        currency: order.currency,

        name: "CodeSync",

        description: "Premium Plan",

        order_id: order.id,

        handler: async function (response: any) {

          sessionStorage.setItem("isPremium", "true");

          try {
            await api.post(
              `/subscriptions/upgrade/${user?.id}`
            );
          } catch (err) {
            console.log(err);
          }

          toast.success("Premium Activated!");

          setTimeout(() => {
            window.location.reload();
          }, 1000);

        },
        prefill: {
          name: user?.fullName,
          email: user?.email
        },

        theme: {
          color: "#7c3aed"
        }
      };

      // @ts-ignore
      const razorpay = new window.Razorpay(options);

      razorpay.open();

    } catch (err) {

      console.error(err);

      toast.error("Payment Failed");

    }
  };

  return (
    <AppLayout>
      <div className="dashboard">
        {/* Hero Banner */}
        <div className="dashboard-hero">
          <div className="hero-content">
            <h1 className="hero-greeting">
              {greeting}, <span className="hero-name">{user?.fullName?.split(' ')[0] || user?.username}</span> 👋
            </h1>
            <p className="hero-sub">What are you building today?</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <Folder size={18} />
              <div>
                <div className="hero-stat-value">{stats.total}</div>
                <div className="hero-stat-label">Projects</div>
              </div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <Users size={18} />
              <div>
                <div className="hero-stat-value">{stats.shared}</div>
                <div className="hero-stat-label">Shared</div>
              </div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <Star size={18} />
              <div>
                <div className="hero-stat-value">{stats.starred}</div>
                <div className="hero-stat-label">Starred</div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="dashboard-toolbar">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                id="search-projects"
                type="text"
                className="search-input"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {sessionStorage.getItem("isPremium") === "true" ? (
            <div className="text-yellow-400 font-semibold flex items-center gap-2">
              ✨ Premium Active
            </div>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={handlePremiumUpgrade}
            >
              <Zap size={16} />
              Upgrade Premium
            </button>
          )}

          <button
            className="btn btn-primary"
            id="create-project-btn"
            onClick={() => {

              if (
                sessionStorage.getItem("isPremium") !== "true" &&
                projects.length >= 2
              ) {
                toast.error(
                  "Free users can only create 2 projects. Upgrade to Premium for unlimited projects."
                );
                return;
              }

              setShowCreate(true);
            }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="projects-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="project-card-skeleton">
                <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: '80%', borderRadius: 4, marginTop: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4, marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Code2 size={64} />
            </div>
            <h3 className="empty-state-title">
              {searchQuery ? 'No projects found' : 'Start your first project'}
            </h3>
            <p>{searchQuery ? 'Try a different search term' : 'Create a project to start coding and collaborating'}</p>
            {!searchQuery && (
              <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)} id="create-first-project-btn">
                <Plus size={18} /> Create Project
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="projects-grid">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/project/${project.id}`)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => { setPage(p => p - 1); fetchProjects(searchQuery, page - 1); }}>
                  Previous
                </button>
                <span className="text-muted text-sm">Page {page + 1} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => { setPage(p => p + 1); fetchProjects(searchQuery, page + 1); }}>
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {showCreate && (
          <CreateProjectModal
            onClose={() => setShowCreate(false)}
            onCreated={handleProjectCreated}
          />
        )}
      </div>

      <style>{`
        .dashboard { padding: 32px; max-width: 1280px; margin: 0 auto; }
        .dashboard-hero {
          display: flex; align-items: center; justify-content: space-between;
          background: linear-gradient(135deg, var(--bg-elevated), var(--bg-surface));
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 32px; margin-bottom: 24px;
          position: relative; overflow: hidden;
        }
        .dashboard-hero::before {
          content: '';
          position: absolute; top: -60px; right: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, var(--accent-glow), transparent 70%);
          pointer-events: none;
        }
        .hero-content { flex: 1; }
        .hero-greeting { font-size: 1.75rem; font-weight: 800; }
        .hero-name { background: linear-gradient(90deg, var(--accent), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-sub { color: var(--text-muted); margin-top: 4px; }
        .hero-stats { display: flex; align-items: center; gap: 24px; }
        .hero-stat { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); }
        .hero-stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
        .hero-stat-label { font-size: 0.75rem; color: var(--text-muted); }
        .hero-stat-divider { width: 1px; height: 36px; background: var(--border-subtle); }
        .dashboard-toolbar {
          display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
        }
        .search-form { flex: 1; max-width: 400px; }
        .search-input-wrapper { position: relative; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .search-input {
          width: 100%; height: 40px;
          padding: 0 12px 0 36px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-sans); font-size: 0.875rem;
          outline: none;
          transition: border-color var(--transition-fast);
        }
        .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
        .search-input::placeholder { color: var(--text-muted); }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .project-card-skeleton {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 24px; }
      `}</style>
    </AppLayout>
  );
}

function ProjectCard({ project, onClick }: { project: any; onClick: () => void }) {
  const langColor = LANG_COLORS[project.language] || '#6366f1';
  return (
    <div className="project-card card card-clickable" onClick={onClick} id={`project-card-${project.id}`}>
      <div className="project-card-header">
        <div className="project-lang-dot" style={{ background: langColor }} />
        <div className="project-card-title">{project.name}</div>
        {project.visibility === 'PRIVATE' ? <Lock size={13} className="text-muted" /> : <Globe size={13} className="text-muted" />}
      </div>
      <p className="project-card-desc">{project.description || 'No description'}</p>
      <div className="project-card-meta">
        <span className="badge badge-muted" style={{ borderLeft: `3px solid ${langColor}`, paddingLeft: 6 }}>
          {project.language}
        </span>
        {project.archived && <span className="badge badge-yellow"><Archive size={10} /> Archived</span>}
      </div>
      <div className="project-card-footer">
        <div className="flex items-center gap-3 text-muted text-xs">
          <span><Users size={12} /> {project.memberCount || 1}</span>
          <span><GitBranch size={12} /> {project.branchCount || 1}</span>
          <span><Star size={12} /> {project.starCount || 0}</span>
        </div>
        <span className="text-muted text-xs">
          <Clock size={11} /> {project.createdAt ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true }) : 'Just now'}
        </span>
      </div>
      <style>{`
        .project-card { padding: 20px; cursor: pointer; transition: all 0.2s; }
        .project-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .project-lang-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .project-card-title { font-weight: 600; font-size: 1rem; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .project-card-desc { font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; }
        .project-card-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
        .project-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border-subtle); }
      `}</style>
    </div>
  );
}
