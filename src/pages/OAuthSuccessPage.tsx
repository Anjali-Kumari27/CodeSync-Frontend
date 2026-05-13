import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authApi } from '../api/services';
import { decodeJwt } from '../api/client';
import toast from 'react-hot-toast';

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        toast.error('OAuth login failed');
        navigate('/login');
        return;
      }

      sessionStorage.setItem('accessToken', token);

      const payload = decodeJwt(token);

      let profile;
      try {
        const res = await authApi.me();
        profile = res.data;
      } catch {
        profile = {
          id: Number(payload?.sub) || 0,
          username: payload?.username || '',
          email: payload?.email || '',
          fullName: payload?.fullName || '',
          role: payload?.roles?.replace('ROLE_', '') || 'USER',
        };
      }

      setAuth(profile, token, '');
      toast.success('Google login successful');
      navigate('/dashboard');
    };

    run();
  }, []);

  return <div>Signing in...</div>;
}