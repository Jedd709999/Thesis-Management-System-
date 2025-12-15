import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuth } from '../../hooks/useAuth'

interface AppShellProps {
  children: React.ReactNode
  onNavigate?: (page: string) => void
}

export const AppShell: React.FC<AppShellProps> = ({ children, onNavigate }) => {
  // For larger screens, sidebar should be open by default
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024)
  const { user, logout } = useAuth()

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
        <Topbar
          onMenuToggle={toggleSidebar}
          onNavigate={onNavigate}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
