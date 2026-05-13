import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Code2, LayoutDashboard, Bell, Settings, LogOut,
  User, ChevronDown, Folder, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/services';
import { useAuthStore } from '../store';

interface Props {
  children: React.ReactNode;
  hideNav?: boolean;
}

export default function AppLayout({ children, hideNav }: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = async () => {
    try {
      const rt = sessionStorage.getItem('refreshToken');
      await authApi.logout(rt || undefined);
    } catch {}
    logout();
    navigate('/login');
    toast.success('Signed out successfully');
  };

  const avatarColor = React.useMemo(() => {
    const colors = ['#6366f1', '#22d3a5', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
    const idx = (user?.username?.charCodeAt(0) || 0) % colors.length;
    return colors[idx];
  }, [user?.username]);

  if (hideNav) return <div style={{ height: '100vh', overflow: 'hidden' }}>{children}</div>;

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <nav className="topnav">
        <div className="topnav-left">
          <Link to="/dashboard" className="topnav-brand" id="brand-link">
            <div className="brand-logo">
              <Code2 size={20} />
            </div>
            <span className="brand-text">CodeSync</span>
          </Link>

          <div className="topnav-links">
            <Link
              to="/dashboard"
              className={`topnav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              id="nav-dashboard"
            >
              <LayoutDashboard size={15} />
              Dashboard
            </Link>
            <Link
              to="/projects"
              className={`topnav-link ${location.pathname === '/projects' ? 'active' : ''}`}
              id="nav-projects"
            >
              <Folder size={15} />
              Projects
            </Link>
          </div>
        </div>

        <div className="topnav-right">
          <Link to="/notifications" className="topnav-icon-btn" id="nav-notifications" data-tooltip="Notifications">
            <Bell size={18} />
          </Link>

          <div className="user-menu-wrapper" onMouseLeave={() => setShowUserMenu(false)}>
            <button
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
              id="user-menu-btn"
            >
              <div className="avatar avatar-sm" style={{ background: avatarColor, color: 'white' }}>
                {(user?.fullName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </div>
              <span className="user-menu-name">{user?.fullName?.split(' ')[0] || user?.username}</span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </button>

            {showUserMenu && (
              <div className="dropdown" style={{ right: 0, top: 'calc(100% + 8px)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user?.username}</div>
                </div>
                <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)} id="nav-settings">
                  <Settings size={14} /> Settings
                </Link>
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={handleLogout} id="logout-btn">
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {children}
      </main>

      <style>{`
        .app-shell { display: flex; flex-direction: column; min-height: 100vh; }
        .topnav {
          height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky; top: 0; z-index: 100;
          backdrop-filter: blur(12px);
        }
        .topnav-left { display: flex; align-items: center; gap: 24px; }
        .topnav-right { display: flex; align-items: center; gap: 8px; }
        .topnav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .brand-logo {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--accent), var(--purple));
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
          box-shadow: 0 0 12px var(--accent-glow);
        }
        .brand-text { font-size: 1.125rem; font-weight: 800; color: var(--text-primary); }
        .topnav-links { display: flex; align-items: center; gap: 4px; }
        .topnav-link {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 500;
          color: var(--text-muted);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .topnav-link:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .topnav-link.active { background: var(--accent-light); color: var(--accent); }
        .topnav-icon-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .topnav-icon-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .user-menu-wrapper { position: relative; }
        .user-menu-trigger {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 8px 4px 4px;
          border-radius: var(--radius-md);
          cursor: pointer; border: none;
          background: none; font-family: var(--font-sans);
          transition: background var(--transition-fast);
        }
        .user-menu-trigger:hover { background: var(--bg-elevated); }
        .user-menu-name { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
        .app-main { flex: 1; overflow-y: auto; }
      `}</style>
    </div>
  );
}
