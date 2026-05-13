import React, { useEffect, useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  Eye,
  Pencil,
  Trash2,
  Crown,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectApi, authApi } from '../api/services';
import { useAuthStore } from '../store';

interface Props {
  project: any;
  onClose: () => void;
}

const ROLES = ['GUEST', 'DEVELOPER', 'ADMIN'];

export default function MembersModal({
  project,
  onClose,
}: Props) {
  const { user } = useAuthStore();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] =
    useState<any[]>([]);
  const [selectedUser, setSelectedUser] =
    useState<any>(null);
  const [selectedRole, setSelectedRole] =
    useState('DEVELOPER');

  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  // load project members
  const loadMembers = async () => {
    try {
      setLoading(true);

      const res =
        await projectApi.listMembers(project.id);

      setMembers(res.data || []);
    } catch (err) {
      console.error(err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // search users
  const searchUsers = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await authApi.searchUsers(q);

      setSearchResults(
        res.data?.content || res.data || []
      );
    } catch {
      setSearchResults([]);
    }
  };

  // add member
  const addMember = async () => {
  if (!selectedUser) return;

  try {
    setAdding(true);

    await projectApi.inviteMember(project.id, {
      email: selectedUser.email,
      role: selectedRole,
      userId: selectedUser.id,
    });

    toast.success('Invitation sent successfully');

    setSelectedUser(null);
    setSearch('');
    setSearchResults([]);

    await loadMembers();
  } catch (err: any) {
    console.error(err);
    toast.error(
      err?.response?.data?.detail || 'Failed to send invitation'
    );
  } finally {
    setAdding(false);
  }
};
  // update role
  const updateRole = async (
    memberId: number,
    role: string
  ) => {
    try {
      await projectApi.updateMemberRole(
        project.id,
        memberId,
        role
      );

      toast.success('Role updated');

      await loadMembers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  // remove member
  const removeMember = async (
    userId: number
  ) => {
    if (
      !confirm(
        'Remove this member from project?'
      )
    )
      return;

    try {
      await projectApi.removeMember(
        project.id,
        userId
      );

      toast.success('Member removed');

      await loadMembers();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  // avatar color helper
  const avatarColor = (seed: string) => {
    const colors = [
      '#6366f1',
      '#22d3a5',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
    ];

    return (
      colors[
        (seed.charCodeAt(0) || 0) %
          colors.length
      ]
    );
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) =>
        e.target === e.currentTarget &&
        onClose()
      }
    >
      <div className="modal modal-lg">
        {/* header */}
        <div className="modal-header">
          <h3 className="modal-title">
            <Users size={18} />{' '}
            {project.name} — Members
          </h3>

          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* add member */}
        <div className="members-add-section">
          <div className="members-add-label">
            Invite a Collaborator
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              position: 'relative',
            }}
          >
            <div
              style={{
                flex: 1,
                position: 'relative',
              }}
            >
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  color:
                    'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />

              <input
                className="input"
                style={{
                  paddingLeft: 32,
                }}
                placeholder="Search user..."
                value={
                  selectedUser
                    ? selectedUser.username
                    : search
                }
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedUser(null);
                  searchUsers(
                    e.target.value
                  );
                }}
              />

              {searchResults.length >
                0 &&
                !selectedUser && (
                  <div
                    className="dropdown"
                    style={{
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                    }}
                  >
                    {searchResults.map(
                      (u) => (
                        <button
                          key={u.id}
                          className="dropdown-item"
                          onClick={() => {
                            setSelectedUser(
                              u
                            );
                            setSearch('');
                            setSearchResults(
                              []
                            );
                          }}
                        >
                          {u.username} (
                          {u.email})
                        </button>
                      )
                    )}
                  </div>
                )}
            </div>

            <select
              className="select"
              style={{
                width: 110,
                flex: 'none',
              }}
              value={selectedRole}
              onChange={(e) =>
                setSelectedRole(
                  e.target.value
                )
              }
            >
              {ROLES.map((r) => (
                <option
                  key={r}
                  value={r}
                >
                  {r}
                </option>
              ))}
            </select>

            <button
              className="btn btn-primary"
              onClick={addMember}
              disabled={
                !selectedUser || adding
              }
            >
              <UserPlus size={14} />
              {adding
                ? 'Adding...'
                : 'Add'}
            </button>
          </div>
        </div>

        {/* members list */}
        <div className="members-list">
          {loading ? (
            <div style={{ padding: 16 }}>
              Loading...
            </div>
          ) : members.length === 0 ? (
            <div
              className="empty-state"
              style={{ padding: 32 }}
            >
              <Users
                size={32}
                style={{
                  opacity: 0.2,
                }}
              />
              <p>
                No members yet.
              </p>
            </div>
          ) : (
            members.map((member) => {
              const isOwner =
                member.userId ===
                project.ownerId;

              const isCurrentUser =
                member.userId ===
                user?.id;

              return (
                <div
                  key={member.id}
                  className="member-item"
                >
                  <div
                    className="avatar avatar-md"
                    style={{
                      background:
                        avatarColor(
                          String(
                            member.userId
                          )
                        ),
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    U
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 6,
                      }}
                    >
                      <span className="font-medium">
                        User #
                        {member.userId}
                      </span>

                      {isOwner && (
                        <Crown
                          size={12}
                          style={{
                            color:
                              'var(--yellow)',
                          }}
                        />
                      )}

                      {isCurrentUser && (
                        <span
                          className="badge badge-accent"
                          style={{
                            fontSize:
                              '0.6rem',
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted">
                      Role:{' '}
                      {member.role}
                    </div>
                  </div>

                  {!isOwner && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 6,
                      }}
                    >
                      <select
                        className="select"
                        style={{
                          width: 100,
                          height: 30,
                          fontSize:
                            '0.75rem',
                        }}
                        value={
                          member.role
                        }
                        onChange={(e) =>
                          updateRole(
                            member.id,
                            e.target
                              .value
                          )
                        }
                        disabled={
                          isCurrentUser
                        }
                      >
                        {ROLES.map(
                          (r) => (
                            <option
                              key={r}
                              value={r}
                            >
                              {r}
                            </option>
                          )
                        )}
                      </select>

                      {!isCurrentUser && (
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() =>
                            removeMember(
                              member.userId
                            )
                          }
                        >
                          <Trash2
                            size={14}
                            style={{
                              color:
                                'var(--red)',
                            }}
                          />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .members-add-section {
          margin-bottom: 20px;
        }

        .members-add-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }

        .members-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 340px;
          overflow-y: auto;
        }

        .member-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
      `}</style>
    </div>
  );
}