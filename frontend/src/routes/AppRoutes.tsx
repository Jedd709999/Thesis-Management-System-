import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import { RoleRoute } from '../components/RoleRoute';
import { AppShell } from '../components/layout';
import Login from '../pages/login/LoginPage';
import { Dashboard } from '../pages/dashboard/DashboardPage';
import GroupManagementPage from '../pages/group-management/GroupManagementPage';
import { GroupDetail as GroupDetailPage } from '../pages/group-detail/GroupDetailPage';
import { ThesisManagement as ThesisCrudPage } from '../pages/thesis-management/ThesisManagementPage';
import { ThesisDetail as ThesisWorkflowPage } from '../pages/thesis-detail/ThesisDetailPage';
import { DocumentManager as DocumentManagerPage } from '../pages/document-manager/DocumentManagerPage';
import { GoogleDocsEmbed as DocumentEditorPage } from '../pages/google-docs/GoogleDocsEmbedPage';
import { ScheduleManagement as SchedulePage } from '../pages/schedule-management/ScheduleManagementPage';
import { NotificationCenter as NotificationCenterPage } from '../pages/notification-center/NotificationCenterPage';
import { Settings as SettingsPage } from '../pages/settings/SettingsPage';
<<<<<<< HEAD
import { ArchivePage } from '../pages/archive/ArchivePage';
=======
import ArchivePage from '../pages/archive/ArchivePage';
>>>>>>> 13a4e22ac92d7824c227a4dff1ae74d9d5e9cb09

// Wrapper component to extract the group ID from URL params and pass it to GroupDetailPage
const GroupDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  return <GroupDetailPage groupId={id || null} onBack={() => navigate('/groups')} />;
};

// Wrapper component to extract the thesis ID from URL params and pass it to ThesisWorkflowPage
const ThesisDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  return <ThesisWorkflowPage thesisId={id || null} onBack={() => navigate('/thesis')} />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  // Convert user role to lowercase for consistent usage throughout the app
  const userRole = user?.role?.toLowerCase() as 'student' | 'adviser' | 'panel' | 'admin' | undefined;
  const navigate = useNavigate();

  console.log('AppRoutes: user object:', user);
  console.log('AppRoutes: converted userRole:', userRole);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes with layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell onNavigate={(page) => navigate(`/${page}`)}>
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
                        userRole={userRole || 'student'}
                        onViewDetail={(groupId) => navigate(`/groups/${groupId}`)} 
                      />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/groups/:id"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <GroupDetailWrapper />
                    </RoleRoute>
                  }
                />
                
                {/* Thesis */}
                <Route
                  path="/thesis"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <ThesisCrudPage userRole={userRole || 'student'} onViewDetail={(thesisId) => navigate(`/thesis/${thesisId}`)} />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/thesis/:id"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <ThesisDetailWrapper />
                    </RoleRoute>
                  }
                />

                {/* Archive */}
                <Route
                  path="/archive"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <ArchivePage />
                    </RoleRoute>
                  }
                />
                
                {/* Documents */}
                <Route
                  path="/documents"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}>
                      <DocumentManagerPage userRole={userRole || 'student'} />
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

                {/* Archive */}
                <Route
                  path="/archive"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'ADVISER']}>
                      <ArchivePage />
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