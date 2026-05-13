import React, { useEffect, useState } from 'react';
import { User, Lock, Bell, Save, AlertTriangle, CheckCircle, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, notificationApi } from '../api/services';
import { useAuthStore } from '../store';
import AppLayout from '../components/AppLayout';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '', username: user?.username || '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [preferences, setPreferences] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    notificationApi.getPreferences().then(res => setPreferences(res.data || {})).catch(() => {});
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile(profileForm);
      // Backend returns only {id, username, fullName} — merge with existing user to keep email/role
      const updatedUser = { ...user, ...res.data } as any;
      setUser(updatedUser);
      toast.success('Profile updated!');
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 409) {
        toast.error('Username already taken');
      } else if (status === 403 || status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(msg || 'Failed to update profile');
      }
      console.error('Profile update error:', err.response?.data);
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    const errors: Record<string, string> = {};
    if (!pwForm.oldPassword) errors.oldPassword = 'Current password required';
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) errors.newPassword = 'Password must be 8+ chars';
    if (pwForm.newPassword !== pwForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setPwErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      await authApi.changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await notificationApi.updatePreferences(preferences);
      toast.success('Preferences saved!');
    } catch { toast.error('Failed to save preferences'); } finally { setSaving(false); }
  };

  const avatarColor = (name: string) => {
    const colors = ['#6366f1', '#22d3a5', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>Settings</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Settings Nav */}
          <div className="settings-nav">
            {[
              { id: 'profile', icon: <User size={15} />, label: 'Profile' },
              { id: 'password', icon: <Lock size={15} />, label: 'Password' },
              { id: 'notifications', icon: <Bell size={15} />, label: 'Notifications' },
            ].map((item) => (
              <button
                key={item.id}
                className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id as any)}
                id={`settings-${item.id}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card animate-fadeIn">
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Public Profile</h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div className="avatar avatar-xl" style={{ background: avatarColor(user?.username || ''), color: 'white', position: 'relative' }}>
                    {(user?.fullName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{user?.fullName}</div>
                    <div className="text-muted text-sm">@{user?.username}</div>
                    <div className="text-muted text-xs" style={{ marginTop: 4 }}>{user?.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      id="settings-fullname"
                      className="input"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      id="settings-username"
                      className="input"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                    <p className="text-xs text-muted" style={{ marginTop: 4 }}>Email cannot be changed</p>
                  </div>

                  <button className="btn btn-primary" onClick={saveProfile} disabled={saving} id="save-profile-btn" style={{ alignSelf: 'flex-start' }}>
                    {saving ? <><div className="spinner spinner-sm" /> Saving...</> : <><Save size={14} /> Save Changes</>}
                  </button>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="card animate-fadeIn">
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Change Password</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { key: 'oldPassword', label: 'Current Password', id: 'old-password' },
                    { key: 'newPassword', label: 'New Password', id: 'new-password' },
                    { key: 'confirmPassword', label: 'Confirm New Password', id: 'confirm-password' },
                  ].map(({ key, label, id }) => (
                    <div className="form-group" key={key}>
                      <label className="form-label">{label}</label>
                      <input
                        id={id}
                        type="password"
                        className={`input ${pwErrors[key] ? 'input-error' : ''}`}
                        placeholder="••••••••"
                        value={(pwForm as any)[key]}
                        onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                      />
                      {pwErrors[key] && <p className="form-error">{pwErrors[key]}</p>}
                    </div>
                  ))}

                  <div style={{ background: 'var(--yellow-light)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: 'var(--yellow)', display: 'flex', gap: 8 }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    Changing your password will sign you out of all other sessions.
                  </div>

                  <button className="btn btn-primary" onClick={changePassword} disabled={saving} id="change-password-btn" style={{ alignSelf: 'flex-start' }}>
                    {saving ? <><div className="spinner spinner-sm" /> Saving...</> : <><Lock size={14} /> Change Password</>}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="card animate-fadeIn">
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Notification Preferences</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'emailOnComment', label: 'Email on new comments', desc: 'Get emailed when someone comments on your file' },
                    { key: 'emailOnMention', label: 'Email on mentions', desc: 'Get emailed when someone mentions you' },
                    { key: 'emailOnInvite', label: 'Email on project invitations', desc: 'Get emailed when invited to a project' },
                    { key: 'inAppComment', label: 'In-app comment notifications', desc: 'Show notifications for new comments' },
                    { key: 'inAppExecution', label: 'Execution complete notifications', desc: 'Notify when code execution completes' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="pref-row" id={`pref-${key}`}>
                      <div style={{ flex: 1 }}>
                        <div className="font-medium text-sm">{label}</div>
                        <div className="text-muted text-xs">{desc}</div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={preferences[key] || false}
                          onChange={(e) => setPreferences({ ...preferences, [key]: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}

                  <button className="btn btn-primary" onClick={savePreferences} disabled={saving} id="save-prefs-btn" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                    {saving ? <><div className="spinner spinner-sm" /> Saving...</> : <><Save size={14} /> Save Preferences</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .settings-nav { display: flex; flex-direction: column; gap: 2px; }
        .settings-nav-item {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 500;
          color: var(--text-muted);
          background: none; border: none; cursor: pointer;
          font-family: var(--font-sans);
          transition: all var(--transition-fast);
          text-align: left;
        }
        .settings-nav-item:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .settings-nav-item.active { background: var(--accent-light); color: var(--accent); }
        .input-error { border-color: var(--red) !important; }
        .pref-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-subtle); }
        .pref-row:last-of-type { border-bottom: none; }
        .toggle { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
        .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-slider {
          width: 40px; height: 22px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 99px;
          transition: all var(--transition-fast);
          position: relative;
        }
        .toggle-slider::after {
          content: '';
          position: absolute;
          top: 2px; left: 2px;
          width: 16px; height: 16px;
          background: var(--text-muted);
          border-radius: 50%;
          transition: all var(--transition-fast);
        }
        .toggle input:checked + .toggle-slider { background: var(--accent); border-color: var(--accent); }
        .toggle input:checked + .toggle-slider::after { transform: translateX(18px); background: white; }
      `}</style>
    </AppLayout>
  );
}
