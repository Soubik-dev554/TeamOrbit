import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ResetPassword from './pages/ResetPassword';
import Employees from './pages/Employees';
import ActivityLogs from './pages/ActivityLogs';
import EmployeeInvitation from './pages/EmployeeInvitation';

function Protected({ children, allowedRoles }) {
  const { user, checking } = useAuth();

  if (checking) {
    return <div className="center-screen">Loading your workspace…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === 'superadmin' ? '/superadmin' : '/dashboard'}
        replace
      />
    );
  }

  return children;
}

function HomeRedirect() {
  const { user } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const publicView = params.get('view') === 'public';

  if (publicView) {
    return <Home />;
  }

  if (!user) {
    return <Home />;
  }

  if (user.role === 'superadmin') {
    return <Navigate to="/superadmin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { checking } = useAuth();

  if (checking) {
    return <div className="center-screen">Loading your workspace…</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Public route: employees accept their email invitation here. */}
      <Route
        path="/employee-invitation/:token"
        element={<EmployeeInvitation />}
      />

      <Route
        path="/superadmin"
        element={
          <Protected allowedRoles={['superadmin']}>
            <SuperAdminDashboard />
          </Protected>
        }
      />

      <Route
        path="/"
        element={
          <Protected allowedRoles={['admin', 'employee']}>
            <Layout />
          </Protected>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="tasks" element={<Tasks />} />

        <Route
          path="employees"
          element={
            <Protected allowedRoles={['admin']}>
              <Employees />
            </Protected>
          }
        />

        <Route
          path="activity-logs"
          element={
            <Protected allowedRoles={['admin']}>
              <ActivityLogs />
            </Protected>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
