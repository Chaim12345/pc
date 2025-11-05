import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import BoardView from '../pages/BoardView'
import DashboardsPage from '../pages/DashboardsPage'
import DashboardViewPage from '../pages/DashboardViewPage'
import Settings from '../pages/Settings'
import ProfileSettings from '../pages/Settings/ProfileSettings'
import AccountSettings from '../pages/Settings/AccountSettings'
import NotificationSettings from '../pages/Settings/NotificationSettings'
import PreferencesSettings from '../pages/Settings/PreferencesSettings'
import Teams from '../pages/Teams'
import UserManagement from '../pages/UserManagement'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return user ? <>{children}</> : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/:boardId"
        element={
          <PrivateRoute>
            <BoardView />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboards"
        element={
          <PrivateRoute>
            <DashboardsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboards/:dashboardId"
        element={
          <PrivateRoute>
            <DashboardViewPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      >
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="preferences" element={<PreferencesSettings />} />
        <Route index element={<Navigate to="profile" replace />} />
      </Route>
      <Route
        path="/teams"
        element={
          <PrivateRoute>
            <Teams />
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <UserManagement />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes

