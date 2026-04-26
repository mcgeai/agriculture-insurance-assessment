import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Report from './pages/Report';
import History from './pages/History';
import Overview from './pages/Admin/Overview';
import Questions from './pages/Admin/Questions';
import Employees from './pages/Admin/Employees';
import Accounts from './pages/Admin/Accounts';
import { useAuthStore } from './stores/authStore';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: 'red' }}>
          <h2>页面渲染出错</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/home" replace />;
  return children;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider locale={zhCN}>
        <AntApp>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="home" element={<Home />} />
                <Route path="quiz" element={<Quiz />} />
                <Route path="report/:id" element={<Report />} />
                <Route path="history" element={<History />} />
              </Route>
              <Route path="/admin" element={<AdminRoute><AppLayout /></AdminRoute>}>
                <Route index element={<Navigate to="/admin/overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="questions" element={<Questions />} />
                <Route path="employees" element={<Employees />} />
                <Route path="accounts" element={<Accounts />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
