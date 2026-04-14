import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LockIcon, MailIcon, MessageCircleIcon, UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

function SignUpPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { signup, isSigningUp } = useAuthStore();

  const submit = async (event) => {
    event.preventDefault();
    await signup(formData);
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-heading">
          <MessageCircleIcon />
          <h2>Create Account</h2>
          <p>Join and start messaging instantly</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label>
            <UserIcon size={16} />
            <input
              type="text"
              value={formData.name}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Full name"
              required
            />
          </label>

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
              minLength={6}
              required
            />
          </label>

          <button type="submit" className="send-btn" disabled={isSigningUp}>
            {isSigningUp ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <Link to="/login" className="auth-link">
          Already have an account? Login
        </Link>
      </section>
    </div>
  );
}

export default SignUpPage;
