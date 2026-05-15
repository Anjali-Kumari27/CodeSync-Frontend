import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore, useBranchStore, useEditorStore, useUIStore } from '../store';

const user = {
  id: 1,
  username: 'ada',
  email: 'ada@test.dev',
  fullName: 'Ada Lovelace',
  role: 'USER',
};

describe('zustand stores', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, hydrated: false });
    useBranchStore.setState({ activeBranchId: null, activeBranchName: null });
    useUIStore.setState({ sidebarOpen: true, activePanel: 'files' });
    useEditorStore.setState({ tabs: [], activeTabId: null });
  });

  it('stores auth tokens, user updates, hydration, and logout side effects', () => {
    useAuthStore.getState().setAuth(user, 'access-token', 'refresh-token');

    expect(useAuthStore.getState()).toMatchObject({ user, accessToken: 'access-token', refreshToken: 'refresh-token', isAuthenticated: true });
    expect(sessionStorage.getItem('accessToken')).toBe('access-token');
    expect(sessionStorage.getItem('refreshToken')).toBe('refresh-token');

    const updated = { ...user, fullName: 'Ada Byron' };
    useAuthStore.getState().setUser(updated);
    useAuthStore.getState().setHydrated();

    expect(useAuthStore.getState().user).toEqual(updated);
    expect(useAuthStore.getState().hydrated).toBe(true);

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });

  it('updates branch and UI store state', () => {
    useBranchStore.getState().setActiveBranch(42, 'feature/login');
    expect(useBranchStore.getState()).toMatchObject({ activeBranchId: 42, activeBranchName: 'feature/login' });

    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);

    useUIStore.getState().setActivePanel('comments');
    expect(useUIStore.getState().activePanel).toBe('comments');
  });

  it('opens, reselects, edits, saves, and closes editor tabs', () => {
    const firstTab = {
      fileId: 1,
      fileName: 'App.tsx',
      filePath: 'src/App.tsx',
      content: 'old',
      language: 'typescript',
      dirty: false,
      projectId: 7,
    };
    const secondTab = { ...firstTab, fileId: 2, fileName: 'main.tsx', filePath: 'src/main.tsx' };

    useEditorStore.getState().openTab(firstTab);
    useEditorStore.getState().openTab(secondTab);
    useEditorStore.getState().openTab(firstTab);

    expect(useEditorStore.getState().tabs).toHaveLength(2);
    expect(useEditorStore.getState().activeTabId).toBe(1);

    useEditorStore.getState().setActiveTab(2);
    useEditorStore.getState().updateContent(2, 'new content');
    expect(useEditorStore.getState().tabs.find((tab) => tab.fileId === 2)).toMatchObject({ content: 'new content', dirty: true });

    useEditorStore.getState().markSaved(2);
    expect(useEditorStore.getState().tabs.find((tab) => tab.fileId === 2)?.dirty).toBe(false);

    useEditorStore.getState().closeTab(2);
    expect(useEditorStore.getState().activeTabId).toBe(1);

    useEditorStore.getState().closeTab(1);
    expect(useEditorStore.getState()).toMatchObject({ tabs: [], activeTabId: null });
  });
});
