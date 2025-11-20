import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/auth/LoginPage'
import Dashboard from '../pages/Dashboard'
import GroupListPage from '../pages/groups/GroupListPage'
import GroupDetailPage from '../pages/groups/GroupDetailPage'
import ThesisCrudPage from '../pages/thesis/ThesisCrudPage'
import ThesisWorkflowPage from '../pages/thesis/ThesisWorkflowPage'
import DocumentManagerPage from '../pages/docs/DocumentManagerPage'
import DocumentEditorPage from '../pages/docs/DocumentEditorPage'
import SchedulePage from '../pages/schedule/SchedulePage'
import NotificationCenterPage from '../pages/notifications/NotificationCenterPage'
import SettingsPage from '../pages/settings/SettingsPage'
import ProtectedRoute from '../components/ProtectedRoute'
import RoleBasedRoute from '../components/RoleBasedRoute'
import MainLayout from '../components/MainLayout'

export default function AppRoutes(){
  return (
    <Routes>
      <Route path="/login" element={<LoginPage/>} />
      <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard/></MainLayout></ProtectedRoute>} />
      
      {/* Admin only routes */}
      <Route path="/admin/users" element={<RoleBasedRoute allowedRoles={['ADMIN']}><MainLayout><Dashboard/></MainLayout></RoleBasedRoute>} />
      
      {/* Routes available to multiple roles */}
      <Route path="/groups" element={<RoleBasedRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}><MainLayout><GroupListPage/></MainLayout></RoleBasedRoute>} />
      <Route path="/groups/:id" element={<RoleBasedRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}><MainLayout><GroupDetailPage/></MainLayout></RoleBasedRoute>} />
      <Route path="/groups/:id/edit" element={<RoleBasedRoute allowedRoles={['ADMIN', 'STUDENT']}><MainLayout><GroupDetailPage editMode={true}/></MainLayout></RoleBasedRoute>} />
      
      {/* Thesis management routes */}
      <Route path="/thesis" element={<RoleBasedRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}><MainLayout><ThesisCrudPage/></MainLayout></RoleBasedRoute>} />
      <Route path="/thesis/workflow" element={<RoleBasedRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}><MainLayout><ThesisWorkflowPage/></MainLayout></RoleBasedRoute>} />
      
      {/* Document management routes */}
      <Route path="/documents" element={<RoleBasedRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT']}><MainLayout><DocumentManagerPage/></MainLayout></RoleBasedRoute>} />
      <Route path="/documents/edit/:id" element={<RoleBasedRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT']}><MainLayout><DocumentEditorPage/></MainLayout></RoleBasedRoute>} />
      
      {/* Schedule management routes */}
      <Route path="/schedule" element={<RoleBasedRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT']}><MainLayout><SchedulePage/></MainLayout></RoleBasedRoute>} />
      
      {/* Notification center routes */}
      <Route path="/notifications" element={<RoleBasedRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}><MainLayout><NotificationCenterPage/></MainLayout></RoleBasedRoute>} />
      
      {/* Settings routes */}
      <Route path="/settings" element={<RoleBasedRoute allowedRoles={['ADMIN', 'ADVISER', 'STUDENT', 'PANEL']}><MainLayout><SettingsPage/></MainLayout></RoleBasedRoute>} />
      
      <Route path="*" element={<Navigate to='/' replace />} />
    </Routes>
  )
}
