import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/api/client';
import { RefreshCw } from 'lucide-react';

export function MicrosoftCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    const isNewUser = params.get('new_user') === '1';

    if (token) {
      // Set the token and fetch user info
      useAuthStore.getState().setAccessToken(token);

      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => {
          const user = data.data;
          login(token, user, user.current_role || 'member');
          navigate(isNewUser ? '/dashboard?welcome=1' : '/dashboard');
        })
        .catch(() => {
          navigate('/login?error=microsoft_auth_failed');
        });
    } else {
      navigate('/login?error=no_token');
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium">Signing in with Microsoft...</p>
        <p className="text-sm text-muted-foreground mt-1">Please wait while we complete authentication</p>
      </div>
    </div>
  );
}
