import { useEffect, useState } from 'react';
import { adminApi } from '../api/services';

type User = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  enabled: boolean;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>({});

  const loadData = async () => {
    try {
      const usersRes = await adminApi.getUsers();
      const statsRes = await adminApi.getStats();

      setUsers(usersRes.data.content);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const deactivate = async (id: number) => {
    await adminApi.deactivateUser(id);
    loadData();
  };

  const activate = async (id: number) => {
    await adminApi.activateUser(id);
    loadData();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    await adminApi.deleteUser(id);
    loadData();
  };

  return (
    <div style={{ padding: '30px' }}>
      <h1>Admin Dashboard</h1>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginTop: '20px',
          marginBottom: '30px',
        }}
      >
        <div
          style={{
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '10px',
            minWidth: '180px',
          }}
        >
          <h3>Total Users</h3>
          <h2>{stats.totalUsers || 0}</h2>
        </div>

        <div
          style={{
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '10px',
            minWidth: '180px',
          }}
        >
          <h3>Active Users</h3>
          <h2>{stats.activeUsers || 0}</h2>
        </div>

        <div
          style={{
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '10px',
            minWidth: '180px',
          }}
        >
          <h3>Inactive Users</h3>
          <h2>{stats.inactiveUsers || 0}</h2>
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Username</th>
            <th style={th}>Email</th>
            <th style={th}>Role</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={td}>{u.id}</td>
              <td style={td}>{u.username}</td>
              <td style={td}>{u.email}</td>
              <td style={td}>{u.role}</td>
              <td style={td}>{u.enabled ? 'Active' : 'Inactive'}</td>
              <td style={td}>
                {u.enabled ? (
                  <button onClick={() => deactivate(u.id)}>Deactivate</button>
                ) : (
                  <button onClick={() => activate(u.id)}>Activate</button>
                )}

                <button
                  onClick={() => remove(u.id)}
                  style={{ marginLeft: '10px', color: 'red' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  border: '1px solid #ddd',
  padding: '12px',
  textAlign: 'left' as const,
};

const td = {
  border: '1px solid #ddd',
  padding: '12px',
};