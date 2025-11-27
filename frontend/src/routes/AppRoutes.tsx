import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Login from '../pages/login/LoginPage'
import { Dashboard } from '../pages/dashboard/DashboardPage'
import { AppShell } from '../components/layout'
import { RoleRoute } from '../components/RoleRoute'
import ProtectedRoute from '../components/ProtectedRoute'
import { Spinner } from '../components/ui'
import GroupManagementPage from '../pages/group-management/GroupManagementPage'
import { GroupDetail as GroupDetailPage } from '../pages/group-detail/GroupDetailPage'
import { ThesisManagement as ThesisCrudPage } from '../pages/thesis-management/ThesisManagementPage'
import { ThesisDetail as ThesisWorkflowPage } from '../pages/thesis-detail/ThesisDetailPage'
import { DocumentManager as DocumentManagerPage } from '../pages/document-manager/DocumentManagerPage'
import { GoogleDocsEmbed as DocumentEditorPage } from '../pages/google-docs/GoogleDocsEmbedPage'
import { ScheduleManagement as SchedulePage } from '../pages/schedule-management/ScheduleManagementPage'
import { NotificationCenter as NotificationCenterPage } from '../pages/notification-center/NotificationCenterPage'
import { Settings as SettingsPage } from '../pages/settings/SettingsPage'

export const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  
  console.log('AppRoutes: Rendering with auth state', { user, loading });
  console.log('AppRoutes: localStorage access_token:', localStorage?.getItem('access_token'));
  console.log('AppRoutes: isAuthenticated result:', localStorage?.getItem('access_token') !== null);

  if (loading) {
    console.log('AppRoutes: Still loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="size-12" />
      </div>
    )
  }

  // Convert user role to lowercase for consistency with component props
  const userRole = user?.role?.toLowerCase() as 'student' | 'adviser' | 'panel' | 'admin' | undefined;

  const handleLogin = (role: 'student' | 'adviser' | 'panel' | 'admin') => {
    console.log('AppRoutes: handleLogin called with role', role);
    console.log('AppRoutes: localStorage access_token after login:', localStorage?.getItem('access_token'));
    console.log('AppRoutes: User after login:', user);
    // In a real app, you would authenticate here
    // For now, we'll just navigate to the dashboard
    console.log('AppRoutes: Navigating to dashboard');
    navigate('/dashboard');
    console.log('AppRoutes: Navigation completed');
    // Add a small delay to ensure navigation completes
    setTimeout(() => {
      console.log('AppRoutes: After navigation timeout');
      console.log('AppRoutes: Current location:', window.location.href);
      console.log('AppRoutes: localStorage access_token after navigation:', localStorage?.getItem('access_token'));
    }, 100);
  }

  console.log('AppRoutes: Current location:', window.location.pathname);
  console.log('AppRoutes: Current user:', user);
  console.log('AppRoutes: Current loading state:', loading);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes with layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                {/* Dashboard - all roles */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard userRole={userRole || 'student'} onNavigate={(page) => navigate(`/${page}`)} />} />
                
                {/* Groups */}
                <Route
                  path="/groups"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <GroupManagementPage 
                        userRole={userRole === 'admin' ? 'admin' : userRole?.toLowerCase() as 'student' | 'adviser' | 'panel'}
                        onViewDetail={(groupId) => navigate(`/groups/${groupId}`)} 
                      />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/groups/:id"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <GroupDetailPage groupId={null} onBack={() => navigate('/groups')} />
                    </RoleRoute>
                  }
                />
                
                {/* Thesis */}
                <Route
                  path="/thesis"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <ThesisCrudPage userRole={userRole === 'admin' ? 'admin' : 'student'} onViewDetail={(thesisId) => navigate(`/thesis/${thesisId}`)} />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/thesis/:id"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <ThesisWorkflowPage thesisId={null} onBack={() => navigate('/thesis')} />
                    </RoleRoute>
                  }
                />

                {/* Documents */}
                <Route
                  path="/documents"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT']}>
                      <DocumentManagerPage userRole={userRole === 'admin' ? 'admin' : 'student'} />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/documents/:id"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT']}>
                      <DocumentEditorPage />
                    </RoleRoute>
                  }
                />
                
                {/* Schedule */}
                <Route
                  path="/schedule"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <SchedulePage userRole={userRole || 'student'} />
                    </RoleRoute>
                  }
                />
                
                {/* Notifications */}
                <Route
                  path="/notifications"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <NotificationCenterPage />
                    </RoleRoute>
                  }
                />
                
                {/* Settings */}
                <Route
                  path="/settings"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <SettingsPage userRole={userRole || 'student'} />
                    </RoleRoute>
                  }
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRoutes