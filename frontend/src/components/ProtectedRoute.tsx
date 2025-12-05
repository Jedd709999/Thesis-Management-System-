import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function ProtectedRoute({ children }:{ children: React.ReactNode }){
  const { user, loading } = useContext(AuthContext)
  
  console.log('ProtectedRoute: checking authentication', { user, loading });
  console.log('ProtectedRoute: localStorage access_token:', localStorage?.getItem('access_token'));
  console.log('ProtectedRoute: isAuthenticated result:', localStorage?.getItem('access_token') !== null);
  console.log('ProtectedRoute: Current location:', window.location.href);
  console.log('ProtectedRoute: Current pathname:', window.location.pathname);
  
  if (loading) {
    console.log('ProtectedRoute: still loading');
    return <div>Loading...</div>
  }
  
  if (!user) {
    console.log('ProtectedRoute: no user, redirecting to login');
    console.log('ProtectedRoute: Current location:', window.location.href);
    console.log('ProtectedRoute: Current pathname:', window.location.pathname);
    return <Navigate to="/login" replace />
  }
  
  console.log('ProtectedRoute: user authenticated, showing children');
  return <>{children}</>
}