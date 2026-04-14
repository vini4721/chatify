import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import PageLoader from './components/PageLoader';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="app-shell">
      <div className="app-decor decor-a" />
      <div className="app-decor decor-b" />

      <Routes>
        <Route
          path="/"
          element={authUser ? <ChatPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" replace />}
        />
      </Routes>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
