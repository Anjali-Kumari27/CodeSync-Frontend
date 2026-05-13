import api from './client';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export const authApi = {
  register: (data: { username: string; email: string; password: string; fullName: string }) =>
    api.post<AuthResponse>('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/api/auth/login', data),

  logout: (refreshToken?: string) =>
    api.post('/api/auth/logout', { refreshToken }),

  me: () => api.get<UserProfile>('/api/auth/me'),

  updateProfile: (data: { fullName?: string; username?: string }) =>
    api.put<UserProfile>('/api/auth/profile', data),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post('/api/auth/change-password', data),

  searchUsers: (query: string, page = 0, size = 20) =>
    api.get('/api/auth/users/search', { params: { query, page, size } }),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/api/auth/refresh', { refreshToken }),
};

export const projectApi = {
  create: (data: { name: string; description?: string; language: string; visibility: string }) =>
    api.post('/api/projects', data),

  getById: (id: number) => api.get(`/api/projects/${id}`),

  getMyProjects: (page = 0, size = 10, sortBy = 'createdAt', direction = 'desc') =>
    api.get('/api/projects/my', { params: { page, size, sortBy, direction } }),

  search: (q: string, page = 0, size = 10) =>
    api.get('/api/projects/search', { params: { q, page, size } }),

  update: (id: number, data: any) => api.patch(`/api/projects/${id}`, data),

  archive: (id: number) => api.patch(`/api/projects/${id}/archive`),

  delete: (id: number) => api.delete(`/api/projects/${id}`),

  listMembers: (id: number) => api.get(`/api/projects/${id}/members`),

  addMember: (id: number, data: { userId: number; role: string }) =>
    api.post(`/api/projects/${id}/members`, data),

  updateMemberRole: (id: number, memberId: number, role: string) =>
    api.patch(`/api/projects/${id}/members/${memberId}`, null, { params: { role } }),

  removeMember: (id: number, userId: number) =>
    api.delete(`/api/projects/${id}/members/${userId}`),

  inviteMember: (projectId: number, data: any) =>
    api.post(`/api/projects/${projectId}/invite`, data),

  fork: (id: number) => api.post(`/api/projects/${id}/fork`),

  star: (id: number) => api.post(`/api/projects/${id}/star`),

  unstar: (id: number) => api.delete(`/api/projects/${id}/star`),

  getAnalytics: (id: number) => api.get(`/api/projects/${id}/analytics`),

  getPublicProjects: () => api.get('/api/projects/public'),

  searchPublicProjects: (q: string) => api.get('/api/projects/public/search', { params: { q } }),

};

export const fileApi = {
  create: (data: { projectId: number; filePath: string; fileType: 'FILE' | 'DIRECTORY'; content?: string; parentId?: number; mimeType?: string }) =>
    api.post('/api/files', data),

  updateContent: (id: number, content: string) =>
    api.put(`/files/${id}/content`, content, {
      headers: {
        "Content-Type": "text/plain"
      }
    }),

  getById: (id: number) => api.get(`/api/files/${id}`),

  getContent: (id: number) => api.get(`/api/files/${id}/content`),

  getTree: (projectId: number) => api.get(`/api/files/tree/${projectId}`),

  getByPath: (projectId: number, filePath: string) =>
    api.get('/api/files/path', { params: { projectId, filePath } }),

  update: (id: number, data: any) => api.patch(`/api/files/${id}`, data),

  delete: (id: number) => api.delete(`/api/files/${id}`),

  restore: (id: number) => api.post(`/api/files/${id}/restore`),

  deleteDirectory: (id: number) => api.delete(`/api/files/directory/${id}`),

  search: (projectId: number, q: string) =>
    api.get('/api/files/search', { params: { projectId, q } }),
};

export const executionApi = {
  execute: (data: { projectId: number; fileId?: number; code: string; language: string; stdin?: string }) =>
    api.post('/api/executions', data),

  getById: (id: number) => api.get(`/api/executions/${id}`),

  getProjectHistory: (projectId: number, page = 0, size = 20) =>
    api.get(`/api/executions/project/${projectId}`, { params: { page, size } }),

  getStats: (projectId: number) => api.get(`/api/executions/project/${projectId}/stats`),

  cancel: (id: number) => api.patch(`/api/executions/${id}/cancel`),
};

export const versionApi = {
  createBranch: (data: { projectId: number; name: string; description?: string }) =>
    api.post('/api/versions/branches', data),

  getBranch: (id: number) => api.get(`/api/versions/branches/${id}`),

  listBranches: (projectId: number) => api.get(`/api/versions/branches/project/${projectId}`),

  deleteBranch: (id: number) => api.delete(`/api/versions/branches/${id}`),

  createCommit: (data: {
    branchId: number;
    message: string;
    files: any[];
    tag?: string;
  }) =>
    api.post('/api/versions/commits', data),

  getCommit: (id: number) => api.get(`/api/versions/commits/${id}`),

  getBranchHistory: (branchId: number, page = 0, size = 20) =>
    api.get(`/api/versions/commits/branch/${branchId}`, { params: { page, size } }),

  getProjectHistory: (projectId: number, page = 0, size = 20) =>
    api.get(`/api/versions/commits/project/${projectId}`, { params: { page, size } }),

  diff: (from: number, to: number) => api.get('/api/versions/diff', { params: { from, to } }),

  restoreCommit: (id: number) => api.post(`/api/versions/commits/${id}/restore`),

  getBranchFileContent: (
    branchId: number,
    fileId: number
  ) =>
    api.get(
      `/api/versions/branches/${branchId}/files/${fileId}`
    ),
};

export const commentApi = {
  create: (data: { fileId: number; projectId: number; body: string; lineNumber?: number; parentId?: number }) =>
    api.post('/api/comments', data),

  getById: (id: number) => api.get(`/api/comments/${id}`),

  update: (id: number, data: { body: string }) => api.patch(`/api/comments/${id}`, data),

  delete: (id: number) => api.delete(`/api/comments/${id}`),

  getFileComments: (fileId: number, page = 0, size = 20) =>
    api.get(`/api/comments/file/${fileId}`, { params: { page, size } }),

  resolve: (id: number) => api.patch(`/api/comments/${id}/resolve`),

  reopen: (id: number) => api.patch(`/api/comments/${id}/reopen`),

  addReaction: (id: number, emoji: string) =>
    api.post(`/api/comments/${id}/reactions`, null, { params: { emoji } }),

  removeReaction: (id: number, emoji: string) =>
    api.delete(`/api/comments/${id}/reactions/${emoji}`),
};

export const notificationApi = {
  getInbox: (page = 0, size = 20) =>
    api.get('/api/notifications/inbox', { params: { page, size } }),

  getUnread: (page = 0, size = 20) =>
    api.get('/api/notifications/inbox/unread', { params: { page, size } }),

  getSummary: () => api.get('/api/notifications/inbox/summary'),

  markAsRead: (id: number) => api.patch(`/api/notifications/${id}/read`),

  markAllAsRead: () => api.patch('/api/notifications/read-all'),

  delete: (id: number) => api.delete(`/api/notifications/${id}`),

  getPreferences: () => api.get('/api/notifications/preferences'),

  updatePreferences: (data: any) => api.patch('/api/notifications/preferences', data),
};

export const collabApi = {
  createSession: (data: { fileId: number; projectId: number; sessionName: string; language: string }) =>
    api.post('/api/collab/sessions', data),

  getSession: (id: number) => api.get(`/api/collab/sessions/${id}`),

  getActiveSessionForFile: (fileId: number) =>
    api.get(`/api/collab/sessions/file/${fileId}`),

  getProjectSessions: (projectId: number) =>
    api.get(`/api/collab/sessions/project/${projectId}`),

  leaveSession: (id: number) => api.delete(`/api/collab/sessions/${id}/leave`),

  closeSession: (id: number) => api.patch(`/api/collab/sessions/${id}/close`),
};

export const adminApi = {
  getUsers: (page = 0, size = 20) =>
    api.get('/api/auth/admin/users', { params: { page, size } }),

  getStats: () =>
    api.get('/api/auth/admin/stats'),

  activateUser: (id: number) =>
    api.patch(`/api/auth/admin/users/${id}/activate`),

  deactivateUser: (id: number) =>
    api.patch(`/api/auth/admin/users/${id}/deactivate`),

  deleteUser: (id: number) =>
    api.delete(`/api/auth/admin/users/${id}`),
};

export const paymentApi = {

  createOrder: async (amount: number, plan: string) => {

    const response = await api.post(
      '/payments/create-order',
      {
        amount,
        plan
      }
    );

    return response.data;
  }

};

