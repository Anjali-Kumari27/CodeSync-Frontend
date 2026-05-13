import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store';

export default function InvitePage() {
  const { token } = useParams();
  const { user } = useAuthStore();

  const acceptInvite = async () => {
  console.log("BUTTON CLICKED");
  console.log("User =", user);

  try {
    await axios.post(
      `http://localhost:8082/api/projects/invite/${token}/accept`,
      {},
      {
        headers: {
          'X-User-Id': user?.id,
        },
      }
    );

    alert('Invitation accepted successfully');
    window.location.href = '/dashboard';
  } catch (error) {
    console.error(error);
    alert('Failed to accept invitation');
  }
};

  const rejectInvite = async () => {
    try {
      await axios.post(
        `http://localhost:8082/api/projects/invite/${token}/reject`
      );

      alert('Invitation rejected');
      window.location.href = '/';
    } catch (error) {
      console.error(error);
      alert('Failed to reject invitation');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#0b1020',
        color: 'white',
      }}
    >
      <div
        style={{
          padding: '40px',
          borderRadius: '14px',
          background: '#151d35',
          textAlign: 'center',
          width: '420px',
        }}
      >
        <h1>Project Invitation</h1>
        <p>You have been invited to collaborate on CodeSync.</p>

        <div style={{ marginTop: '25px' }}>
          <button
            onClick={acceptInvite}
            style={{
              padding: '10px 20px',
              marginRight: '15px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: '#22c55e',
              color: 'white',
            }}
          >
            Accept
          </button>

          <button
            onClick={rejectInvite}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: '#ef4444',
              color: 'white',
            }}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}