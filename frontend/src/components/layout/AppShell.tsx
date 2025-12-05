import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'

interface AppShellProps {
  children: React.ReactNode
}

<<<<<<< HEAD
export const AppShell: React.FC<AppShellProps> = ({ children, onNavigate }) => {
=======
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd
  // For larger screens, sidebar should be open by default
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024)
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications(30000) // Poll every 30 seconds

  // Handle window resize to adjust sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      // On large screens, sidebar should be open by default
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    logout()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
<<<<<<< HEAD
        <Topbar
          unreadCount={unreadCount}
          onMenuToggle={toggleSidebar}
          onNavigate={onNavigate}
=======
        <Topbar 
          unreadCount={unreadCount} 
          onMenuToggle={toggleSidebar}
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}