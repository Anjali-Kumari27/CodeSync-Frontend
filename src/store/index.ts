import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

interface BranchStore {
  activeBranchId: number | null;
  activeBranchName: string | null;

  setActiveBranch: (
    branchId: number,
    branchName: string
  ) => void;
}

export const useBranchStore = create<BranchStore>((set) => ({
  activeBranchId: null,
  activeBranchName: null,

  setActiveBranch: (branchId, branchName) =>
    set({
      activeBranchId: branchId,
      activeBranchName: branchName
    }),
}));
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'codesync-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          sessionStorage.setItem('accessToken', state.accessToken);
        }
        if (state?.refreshToken) {
          sessionStorage.setItem('refreshToken', state.refreshToken);
        }
        state?.setHydrated();
      },
    }
  )
);


// ── UI Store ──────────────────────────────────────────────
interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  activePanel: 'files' | 'git' | 'comments' | 'notifications' | 'settings';
  setActivePanel: (panel: UIStore['activePanel']) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activePanel: 'files',
  setActivePanel: (panel) => set({ activePanel: panel }),
}));

// ── Editor Store ──────────────────────────────────────────
interface EditorTab {
  fileId: number;
  fileName: string;
  filePath: string;
  content: string;
  language: string;
  dirty: boolean;
  projectId: number;
}

interface EditorStore {
  tabs: EditorTab[];
  activeTabId: number | null;
  openTab: (tab: EditorTab) => void;
  closeTab: (fileId: number) => void;
  setActiveTab: (fileId: number) => void;
  updateContent: (fileId: number, content: string) => void;
  markSaved: (fileId: number) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) =>
    set((s) => {
      const exists = s.tabs.find((t) => t.fileId === tab.fileId);
      if (exists) return { activeTabId: tab.fileId };
      return { tabs: [...s.tabs, tab], activeTabId: tab.fileId };
    }),

  closeTab: (fileId) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t.fileId !== fileId);
      const activeTabId =
        s.activeTabId === fileId
          ? tabs.length > 0
            ? tabs[tabs.length - 1].fileId
            : null
          : s.activeTabId;
      return { tabs, activeTabId };
    }),

  setActiveTab: (fileId) => set({ activeTabId: fileId }),

  updateContent: (fileId, content) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.fileId === fileId ? { ...t, content, dirty: true } : t
      ),
    })),

  markSaved: (fileId) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.fileId === fileId ? { ...t, dirty: false } : t
      ),
    })),
}));
