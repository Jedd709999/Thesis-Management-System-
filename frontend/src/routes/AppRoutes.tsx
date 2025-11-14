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
import ProtectedRoute from '../components/ProtectedRoute'

export default function AppRoutes(){
  return (
    <Routes>
      <Route path="/login" element={<LoginPage/>} />
      <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute><GroupListPage/></ProtectedRoute>} />
      <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailPage/></ProtectedRoute>} />
      <Route path="/thesis" element={<ProtectedRoute><ThesisCrudPage/></ProtectedRoute>} />
      <Route path="/thesis/workflow" element={<ProtectedRoute><ThesisWorkflowPage/></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentManagerPage/></ProtectedRoute>} />
      <Route path="/documents/edit/:id" element={<ProtectedRoute><DocumentEditorPage/></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><SchedulePage/></ProtectedRoute>} />
      <Route path="*" element={<Navigate to='/' replace />} />
    </Routes>
  )
}
