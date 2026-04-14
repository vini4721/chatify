import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LockIcon, MailIcon, MessageCircleIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import BorderAnimatedContainer from '../components/BorderAnimatedContainer';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login, isLoggingIn } = useAuthStore();

  const submit = async (event) => {
    event.preventDefault();
    await login(formData);
  };

  return (
    <div className="auth-page">
      <BorderAnimatedContainer className="auth-card split">
        <section className="auth-main">
          <div className="auth-heading">
            <MessageCircleIcon />
            <h2>Welcome Back</h2>
            <p>Sign in to continue chatting</p>
          </div>

          <form onSubmit={submit} className="auth-form">
            <label>
              <MailIcon size={16} />
              <input
                type="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="Email"
                required
              />
            </label>

            <label>
              <LockIcon size={16} />
              <input
                type="password"
                value={formData.password}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="Password"
                required
              />
            </label>

            <button type="submit" className="send-btn" disabled={isLoggingIn}>
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <Link to="/signup" className="auth-link">
            Need an account? Sign up
          </Link>
        </section>

        <aside className="auth-aside">
          <h3>Connect anytime, anywhere</h3>
          <p>Realtime chat, images, online status and modern messaging flow.</p>
          <div className="badge-row">
            <span className="auth-badge">Realtime</span>
            <span className="auth-badge">Secure</span>
            <span className="auth-badge">Simple</span>
          </div>
        </aside>
      </BorderAnimatedContainer>
    </div>
  );
}

export default LoginPage;
