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
import TeamSettingsPage from '../pages/TeamSettingsPage'
import UserManagement from '../pages/UserManagement'
import Workdocs from '../pages/Workdocs'
import WorkdocEditor from '../pages/WorkdocEditor'
import FormsPage from '../pages/FormsPage'
import FormEditorPage from '../pages/FormEditorPage'
import FormViewPage from '../pages/FormViewPage'
import FormSubmissionsPage from '../pages/FormSubmissionsPage'
import GuestBoardView from '../pages/GuestBoardView'
import ActivityLogsPage from '../pages/ActivityLogsPage'
import Templates from '../pages/Templates'
import MainLayout from '../components/MainLayout'

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
      <Route path="/forms/view/:token" element={<FormViewPage />} />
      <Route path="/guest/board/:token" element={<GuestBoardView />} />

        {/* Routes with MainLayout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="board/:boardId" element={<BoardView />} />
          <Route path="dashboards" element={<DashboardsPage />} />
          <Route path="dashboards/:dashboardId" element={<DashboardViewPage />} />
          <Route path="settings" element={<Settings />}>
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="notifications" element={<NotificationSettings />} />
            <Route path="preferences" element={<PreferencesSettings />} />
            <Route index element={<Navigate to="profile" replace />} />
          </Route>
          <Route path="teams" element={<Teams />} />
          <Route path="teams/:teamId" element={<TeamSettingsPage />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="workdocs" element={<Workdocs />} />
          <Route path="workdocs/:workdocId" element={<WorkdocEditor />} />
          <Route path="forms/board/:boardId" element={<FormsPage />} />
          <Route path="forms/:formId" element={<FormEditorPage />} />
          <Route path="forms/:formId/submissions" element={<FormSubmissionsPage />} />
          <Route path="activity-logs" element={<ActivityLogsPage />} />
          <Route path="templates" element={<Templates />} />
        </Route>
    </Routes>
  )
}

export default AppRoutes

