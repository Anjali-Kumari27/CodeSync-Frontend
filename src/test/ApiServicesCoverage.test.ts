import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../api/client', () => ({ default: api }));

import {
  adminApi,
  authApi,
  collabApi,
  commentApi,
  executionApi,
  fileApi,
  notificationApi,
  paymentApi,
  projectApi,
  versionApi,
} from '../api/services';

describe('api services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({ data: { id: 'order-1', amount: 499, currency: 'INR' } });
  });

  it('calls auth endpoints with expected payloads and defaults', () => {
    authApi.register({ username: 'ada', email: 'ada@test.dev', password: 'secret', fullName: 'Ada Lovelace' });
    authApi.login({ email: 'ada@test.dev', password: 'secret' });
    authApi.logout();
    authApi.logout('refresh-token');
    authApi.me();
    authApi.updateProfile({ fullName: 'Ada' });
    authApi.changePassword({ oldPassword: 'old', newPassword: 'new' });
    authApi.searchUsers('ada');
    authApi.searchUsers('ada', 2, 5);
    authApi.refresh('refresh-token');

    expect(api.post).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ username: 'ada' }));
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', { email: 'ada@test.dev', password: 'secret' });
    expect(api.post).toHaveBeenCalledWith('/api/auth/logout', { refreshToken: undefined });
    expect(api.post).toHaveBeenCalledWith('/api/auth/logout', { refreshToken: 'refresh-token' });
    expect(api.get).toHaveBeenCalledWith('/api/auth/me');
    expect(api.put).toHaveBeenCalledWith('/api/auth/profile', { fullName: 'Ada' });
    expect(api.post).toHaveBeenCalledWith('/api/auth/change-password', { oldPassword: 'old', newPassword: 'new' });
    expect(api.get).toHaveBeenCalledWith('/api/auth/users/search', { params: { query: 'ada', page: 0, size: 20 } });
    expect(api.get).toHaveBeenCalledWith('/api/auth/users/search', { params: { query: 'ada', page: 2, size: 5 } });
    expect(api.post).toHaveBeenCalledWith('/api/auth/refresh', { refreshToken: 'refresh-token' });
  });

  it('calls project endpoints including member, public, and analytics actions', () => {
    projectApi.create({ name: 'sync', language: 'TS', visibility: 'PUBLIC' });
    projectApi.getById(7);
    projectApi.getMyProjects();
    projectApi.getMyProjects(1, 3, 'name', 'asc');
    projectApi.search('sync');
    projectApi.update(7, { name: 'new' });
    projectApi.archive(7);
    projectApi.delete(7);
    projectApi.listMembers(7);
    projectApi.addMember(7, { userId: 2, role: 'EDITOR' });
    projectApi.updateMemberRole(7, 8, 'VIEWER');
    projectApi.removeMember(7, 2);
    projectApi.inviteMember(7, { email: 'a@test.dev' });
    projectApi.fork(7);
    projectApi.star(7);
    projectApi.unstar(7);
    projectApi.getAnalytics(7);
    projectApi.getPublicProjects();
    projectApi.searchPublicProjects('open');

    expect(api.post).toHaveBeenCalledWith('/api/projects', { name: 'sync', language: 'TS', visibility: 'PUBLIC' });
    expect(api.get).toHaveBeenCalledWith('/api/projects/7');
    expect(api.get).toHaveBeenCalledWith('/api/projects/my', { params: { page: 0, size: 10, sortBy: 'createdAt', direction: 'desc' } });
    expect(api.get).toHaveBeenCalledWith('/api/projects/my', { params: { page: 1, size: 3, sortBy: 'name', direction: 'asc' } });
    expect(api.get).toHaveBeenCalledWith('/api/projects/search', { params: { q: 'sync', page: 0, size: 10 } });
    expect(api.patch).toHaveBeenCalledWith('/api/projects/7', { name: 'new' });
    expect(api.patch).toHaveBeenCalledWith('/api/projects/7/archive');
    expect(api.delete).toHaveBeenCalledWith('/api/projects/7');
    expect(api.get).toHaveBeenCalledWith('/api/projects/7/members');
    expect(api.post).toHaveBeenCalledWith('/api/projects/7/members', { userId: 2, role: 'EDITOR' });
    expect(api.patch).toHaveBeenCalledWith('/api/projects/7/members/8', null, { params: { role: 'VIEWER' } });
    expect(api.delete).toHaveBeenCalledWith('/api/projects/7/members/2');
    expect(api.post).toHaveBeenCalledWith('/api/projects/7/invite', { email: 'a@test.dev' });
    expect(api.post).toHaveBeenCalledWith('/api/projects/7/fork');
    expect(api.post).toHaveBeenCalledWith('/api/projects/7/star');
    expect(api.delete).toHaveBeenCalledWith('/api/projects/7/star');
    expect(api.get).toHaveBeenCalledWith('/api/projects/7/analytics');
    expect(api.get).toHaveBeenCalledWith('/api/projects/public');
    expect(api.get).toHaveBeenCalledWith('/api/projects/public/search', { params: { q: 'open' } });
  });

  it('calls file, execution, version, comment, notification, collab, admin, and payment endpoints', async () => {
    fileApi.create({ projectId: 1, filePath: 'src/App.tsx', fileType: 'FILE', content: 'x' });
    fileApi.updateContent(3, 'plain text');
    fileApi.getById(3);
    fileApi.getContent(3);
    fileApi.getTree(1);
    fileApi.getByPath(1, 'README.md');
    fileApi.update(3, { filePath: 'new.ts' });
    fileApi.delete(3);
    fileApi.restore(3);
    fileApi.deleteDirectory(9);
    fileApi.search(1, 'main');

    executionApi.execute({ projectId: 1, code: 'print(1)', language: 'PYTHON' });
    executionApi.getById(4);
    executionApi.getProjectHistory(1);
    executionApi.getStats(1);
    executionApi.cancel(4);

    versionApi.createBranch({ projectId: 1, name: 'main' });
    versionApi.getBranch(5);
    versionApi.listBranches(1);
    versionApi.deleteBranch(5);
    versionApi.createCommit({ branchId: 5, message: 'init', files: [] });
    versionApi.getCommit(6);
    versionApi.getBranchHistory(5);
    versionApi.getProjectHistory(1);
    versionApi.diff(1, 2);
    versionApi.restoreCommit(6);
    versionApi.getBranchFileContent(5, 3);

    commentApi.create({ fileId: 3, projectId: 1, body: 'hi' });
    commentApi.getById(10);
    commentApi.update(10, { body: 'bye' });
    commentApi.delete(10);
    commentApi.getFileComments(3);
    commentApi.resolve(10);
    commentApi.reopen(10);
    commentApi.addReaction(10, 'thumbs-up');
    commentApi.removeReaction(10, 'thumbs-up');

    notificationApi.getInbox();
    notificationApi.getUnread(2, 4);
    notificationApi.getSummary();
    notificationApi.markAsRead(11);
    notificationApi.markAllAsRead();
    notificationApi.delete(11);
    notificationApi.getPreferences();
    notificationApi.updatePreferences({ email: true });

    collabApi.createSession({ fileId: 3, projectId: 1, sessionName: 'pairing', language: 'TS' });
    collabApi.getSession(12);
    collabApi.getActiveSessionForFile(3);
    collabApi.getProjectSessions(1);
    collabApi.leaveSession(12);
    collabApi.closeSession(12);

    adminApi.getUsers();
    adminApi.getStats();
    adminApi.activateUser(2);
    adminApi.deactivateUser(2);
    adminApi.deleteUser(2);

    await expect(paymentApi.createOrder(499, 'PREMIUM')).resolves.toEqual({ id: 'order-1', amount: 499, currency: 'INR' });

    expect(api.put).toHaveBeenCalledWith('/files/3/content', 'plain text', { headers: { 'Content-Type': 'text/plain' } });
    expect(api.get).toHaveBeenCalledWith('/api/files/path', { params: { projectId: 1, filePath: 'README.md' } });
    expect(api.post).toHaveBeenCalledWith('/api/executions', { projectId: 1, code: 'print(1)', language: 'PYTHON' });
    expect(api.get).toHaveBeenCalledWith('/api/versions/diff', { params: { from: 1, to: 2 } });
    expect(api.post).toHaveBeenCalledWith('/api/comments/10/reactions', null, { params: { emoji: 'thumbs-up' } });
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/preferences', { email: true });
    expect(api.delete).toHaveBeenCalledWith('/api/collab/sessions/12/leave');
    expect(api.patch).toHaveBeenCalledWith('/api/auth/admin/users/2/deactivate');
    expect(api.post).toHaveBeenCalledWith('/payments/create-order', { amount: 499, plan: 'PREMIUM' });
  });
});
