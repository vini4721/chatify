import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LockIcon, MailIcon, MessageCircleIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login, isLoggingIn } = useAuthStore();

  const submit = async (event) => {
    event.preventDefault();
    await login(formData);
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
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
    </div>
  );
}

export default LoginPage;
