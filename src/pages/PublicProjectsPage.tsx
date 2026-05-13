import { useEffect, useState } from 'react';
import { projectApi } from '../api/services';

type Project = {
  id: number;
  name: string;
  description: string;
  language: string;
  visibility: string;
  ownerId: number;
  memberCount: number;
};

export default function PublicProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');

  const loadProjects = async () => {
    try {
      const res = search
        ? await projectApi.searchPublicProjects(search)
        : await projectApi.getPublicProjects();

      setProjects(res.data.content);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [search]);

  return (
    <div style={{ padding: '30px' }}>
      <h1>Public Projects</h1>

      <input
        type="text"
        placeholder="Search projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '300px',
          padding: '10px',
          marginTop: '20px',
          marginBottom: '25px',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: '20px',
        }}
      >
        {projects.map((p) => (
          <div
            key={p.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h2>{p.name}</h2>
            <p>{p.description}</p>

            <p>
              <b>Language:</b> {p.language}
            </p>

            <p>
              <b>Owner:</b> {p.ownerId}
            </p>

            <p>
              <b>Members:</b> {p.memberCount}
            </p>

            <p>
              <b>Visibility:</b> {p.visibility}
            </p>

         
            <button
               onClick={() => window.location.href = `/project/${p.id}?readOnly=true`} >
               Open Read Only
            </button>


          </div>
        ))}
      </div>
    </div>
  );
}
